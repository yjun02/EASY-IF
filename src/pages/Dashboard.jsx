import { useState, useEffect, useRef } from 'react';
import { Clock, Plus, Trash2, Sparkles, Loader2, AlertCircle, RefreshCw, Pencil, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateDailyFeedback } from '../lib/gemini';
import { format, startOfDay, addHours, differenceInSeconds, parse } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function Dashboard({ session }) {
  const [eatingWindow, setEatingWindow] = useState(8); 
  const [currentActiveCycle, setCurrentActiveCycle] = useState([]);
  const [completedCycle, setCompletedCycle] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [appState, setAppState] = useState('A'); 
  const [timerDisplay, setTimerDisplay] = useState('00:00:00');
  const [prevFastingResult, setPrevFastingResult] = useState(null);
  const [prevFastingForAI, setPrevFastingForAI] = useState(null);
  
  // Form state
  const [timeInput, setTimeInput] = useState(format(new Date(), 'HH:mm'));
  const [foodInput, setFoodInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [weightInput, setWeightInput] = useState('');

  // Edit state
  const [editingLogId, setEditingLogId] = useState(null);
  const [editForm, setEditForm] = useState({ food_name: '', amount: '', weight: '', time: '' });

  // AI Feedback state
  // 'idle' | 'loading' | 'success' | 'error'
  const [feedbackStatus, setFeedbackStatus] = useState('idle');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const feedbackTriggeredRef = useRef(false);
  const [previousFeedback, setPreviousFeedback] = useState(null);

  const targetFasting = 24 - eatingWindow;

  // Initialize and load data
  useEffect(() => {
    async function loadData() {
      let { data: profile } = await supabase.from('users_profile').select('*').eq('id', session.user.id).single();
      
      if (!profile) {
        const preferred = localStorage.getItem('preferredEatingWindow');
        const ew = preferred ? parseInt(preferred) : 8;
        await supabase.from('users_profile').insert({
          id: session.user.id,
          email: session.user.email,
          eating_window: ew
        });
        setEatingWindow(ew);
      } else {
        setEatingWindow(profile.eating_window);
      }

      await fetchMealLogs();
      setIsInitializing(false);
    }
    
    if (session?.user) {
      loadData();
    }
  }, [session]);

  const fetchMealLogs = async () => {
    const since = new Date();
    since.setHours(since.getHours() - 72);
    const { data } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('logged_at', since.toISOString())
      .order('logged_at', { ascending: true });
      
    if (data && data.length > 0) {
      let cycles = [];
      let currentCycle = null;
      let ew = eatingWindow; // fallback, but we should use state or passed value. Actually eatingWindow is in outer scope

      data.forEach(meal => {
        const mealTime = new Date(meal.logged_at);
        if (!currentCycle) {
          currentCycle = [meal];
          cycles.push(currentCycle);
        } else {
          const firstMealTime = new Date(currentCycle[0].logged_at);
          if (mealTime <= addHours(firstMealTime, ew)) {
            currentCycle.push(meal);
          } else {
            currentCycle = [meal];
            cycles.push(currentCycle);
          }
        }
      });

      const lastCycle = cycles[cycles.length - 1];
      const lastCycleFirstMealTime = new Date(lastCycle[0].logged_at);
      const isLastCycleFinished = new Date() >= addHours(lastCycleFirstMealTime, ew);

      let active = [];
      let completed = null;
      let prevToCompleted = null;

      if (isLastCycleFinished) {
        completed = lastCycle;
        active = [];
        prevToCompleted = cycles.length > 1 ? cycles[cycles.length - 2] : null;
      } else {
        active = lastCycle;
        completed = cycles.length > 1 ? cycles[cycles.length - 2] : null;
        prevToCompleted = cycles.length > 2 ? cycles[cycles.length - 3] : null;
      }

      let newPrevResult = null;
      if (active.length > 0 && completed) {
        const prevLastMeal = new Date(completed[completed.length - 1].logged_at);
        const currentFirstMeal = new Date(active[0].logged_at);
        const fastingHours = (currentFirstMeal - prevLastMeal) / (1000 * 60 * 60);
        
        newPrevResult = {
          hours: Math.round(fastingHours * 10) / 10,
          success: fastingHours >= targetFasting
        };
        
        const prevCycleDate = format(new Date(completed[0].logged_at), 'yyyy-MM-dd');
        supabase.from('daily_summaries').upsert({
          user_id: session.user.id,
          date: prevCycleDate,
          actual_fasting_hours: Math.round(fastingHours * 10) / 10,
          is_success: fastingHours >= targetFasting,
        }, { onConflict: 'user_id,date' }).then();
      }

      let aiPrevResult = null;
      if (completed && prevToCompleted) {
        const pastLastMeal = new Date(prevToCompleted[prevToCompleted.length - 1].logged_at);
        const completedFirstMeal = new Date(completed[0].logged_at);
        const fHours = (completedFirstMeal - pastLastMeal) / (1000 * 60 * 60);
        aiPrevResult = {
           hours: Math.round(fHours * 10) / 10,
           success: fHours >= targetFasting
        };
      }

      // 3. Load Feedback Status for completedCycle
      let hasTriggered = false;
      if (completed) {
        const cycleDate = format(new Date(completed[0].logged_at), 'yyyy-MM-dd');
        const { data: summaryData } = await supabase
          .from('daily_summaries')
          .select('ai_feedback')
          .eq('user_id', session.user.id)
          .eq('date', cycleDate)
          .maybeSingle();

        if (summaryData && summaryData.ai_feedback) {
          if (summaryData.ai_feedback !== '[GENERATING]') {
            setFeedbackText(summaryData.ai_feedback);
            setFeedbackStatus('success');
          } else {
            setFeedbackStatus('loading');
          }
          hasTriggered = true;
        } else {
          setFeedbackText('');
          setFeedbackStatus('idle');
        }

        // 4. Load Previous Feedback for Display in State A/B
        const { data: pastData } = await supabase
          .from('daily_summaries')
          .select('*')
          .eq('user_id', session.user.id)
          .lt('date', cycleDate)
          .not('ai_feedback', 'is', null)
          .not('ai_feedback', 'eq', '[GENERATING]')
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (pastData) {
          setPreviousFeedback({
            date: pastData.date,
            text: pastData.ai_feedback
          });
        } else {
          setPreviousFeedback(null);
        }
      } else {
        setFeedbackText('');
        setFeedbackStatus('idle');
        setPreviousFeedback(null);
      }

      // 5. 모든 비동기 작업이 끝난 후 상태를 일괄 업데이트 (Race Condition 방지)
      setPrevFastingResult(newPrevResult);
      setPrevFastingForAI(aiPrevResult);
      setCompletedCycle(completed);
      setCurrentActiveCycle(active);
      feedbackTriggeredRef.current = hasTriggered;

    } else {
      setPrevFastingResult(null);
      setFeedbackText('');
      setFeedbackStatus('idle');
      feedbackTriggeredRef.current = false;
      setPreviousFeedback(null);
      setMealLogs([]);
    }
  };

  // State Engine & Timer Loop
  useEffect(() => {
    const calculateStateAndTimer = () => {
      const now = new Date();
      if (currentActiveCycle.length > 0) {
        setAppState('B');
        const firstMealTime = new Date(currentActiveCycle[0].logged_at);
        const windowEndTime = addHours(firstMealTime, eatingWindow);
        const diffSecs = differenceInSeconds(windowEndTime, now);
        const h = Math.floor(diffSecs / 3600).toString().padStart(2, '0');
        const m = Math.floor((diffSecs % 3600) / 60).toString().padStart(2, '0');
        const s = (diffSecs % 60).toString().padStart(2, '0');
        setTimerDisplay(`${h}:${m}:${s}`);
      } else if (completedCycle) {
        setAppState('C');
        const lastMealTime = new Date(completedCycle[completedCycle.length - 1].logged_at);
        const fastingEndTime = addHours(lastMealTime, targetFasting);
        
        if (now < fastingEndTime) {
          const diffSecs = differenceInSeconds(fastingEndTime, now);
          const h = Math.floor(diffSecs / 3600).toString().padStart(2, '0');
          const m = Math.floor((diffSecs % 3600) / 60).toString().padStart(2, '0');
          const s = (diffSecs % 60).toString().padStart(2, '0');
          setTimerDisplay(`${h}:${m}:${s}`);
        } else {
          const diffSecs = differenceInSeconds(now, fastingEndTime);
          const h = Math.floor(diffSecs / 3600).toString().padStart(2, '0');
          const m = Math.floor((diffSecs % 3600) / 60).toString().padStart(2, '0');
          const s = (diffSecs % 60).toString().padStart(2, '0');
          setTimerDisplay(`+${h}:${m}:${s}`);
        }
      } else {
        setAppState('A');
        setTimerDisplay(`${targetFasting}:00:00`);
      }
    };

    calculateStateAndTimer();
    const interval = setInterval(calculateStateAndTimer, 1000);
    return () => clearInterval(interval);
  }, [currentActiveCycle, completedCycle, eatingWindow, targetFasting]);

  // AI 피드백 자동 트리거: State C 진입 시 1회만
  useEffect(() => {
    if (!isInitializing && appState === 'C' && completedCycle && !feedbackTriggeredRef.current) {
      feedbackTriggeredRef.current = true;
      triggerAiFeedback();
    }
  }, [appState, completedCycle, isInitializing]);

  const triggerAiFeedback = async () => {
    setFeedbackStatus('loading');
    setFeedbackError('');

    try {
      if (!completedCycle) return;
      const cycleStartIso = completedCycle[0].logged_at;
      const cycleEndIso = completedCycle[completedCycle.length - 1].logged_at;
      const result = await generateDailyFeedback(session?.access_token, cycleStartIso, cycleEndIso, prevFastingForAI);

      if (!result || result.trim().length < 20) {
        throw new Error('AI 응답이 너무 짧거나 비어 있습니다.');
      }

      setFeedbackText(result.trim());
      setFeedbackStatus('success');

    } catch (err) {
      console.error('[AI Feedback Error]', err);
      setFeedbackError(err.message);
      setFeedbackStatus('error');
    }
  };

  const handleRetryFeedback = () => {
    feedbackTriggeredRef.current = false;
    triggerAiFeedback();
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (!foodInput) return;

    const parsedTime = parse(timeInput, 'HH:mm', new Date());
    
    const newLog = {
      user_id: session.user.id,
      logged_at: parsedTime.toISOString(),
      food_name: foodInput,
      amount: amountInput.trim() || '',
      weight: weightInput ? parseFloat(weightInput.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]) : null
    };

    const { error } = await supabase.from('meal_logs').insert(newLog);
    
    if (!error) {
      setFoodInput('');
      setAmountInput('');
      setWeightInput('');
      fetchMealLogs();
    } else {
      alert("추가 실패: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("정말 이 식단 기록을 삭제하시겠습니까?")) {
      const { error } = await supabase.from('meal_logs').delete().eq('id', id);
      if (!error) {
        fetchMealLogs();
      }
    }
  };

  const startEditing = (log) => {
    const t = new Date(log.logged_at);
    setEditingLogId(log.id);
    setEditForm({
      food_name: log.food_name || '',
      amount: log.amount || '',
      weight: log.weight || '',
      time: `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`,
    });
  };

  const handleEditSave = async () => {
    const parsedTime = parse(editForm.time, 'HH:mm', new Date());
    const logged_at = parsedTime.toISOString();

    const updateData = {
      food_name: editForm.food_name,
      amount: editForm.amount || null,
      weight: editForm.weight ? parseFloat(editForm.weight.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]) : null,
      logged_at,
    };

    const { error } = await supabase.from('meal_logs').update(updateData).eq('id', editingLogId);
    if (!error) {
      setEditingLogId(null);
      fetchMealLogs();
    } else {
      alert('수정 실패: ' + error.message);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-full min-h-[80vh] w-full">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex-1 flex flex-col gap-6 p-4 md:p-6 max-w-2xl mx-auto w-full">
        {/* Top Section: Status & Input */}
        <div className="flex flex-col gap-6">
          {/* Status Timer Card */}
          <div className={`rounded-3xl p-6 shadow-sm border transition-colors duration-500 ${
            appState === 'B' ? 'bg-green-50 border-green-100 text-green-900' : 
            appState === 'C' ? 'bg-red-50 border-red-100 text-red-900' : 
            'bg-emerald-500 border-emerald-600 text-white'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold opacity-80">
                {appState === 'A' ? '목표 공복 시간까지' : 
                 appState === 'B' ? (
                   prevFastingResult 
                     ? (prevFastingResult.success 
                         ? `지난 공복 ${prevFastingResult.hours}시간 달성 👏 현재 식사 가능` 
                         : `지난 공복 ${prevFastingResult.hours}시간 😢 (목표 미달)`)
                     : `식사 가능 시간`
                 ) : 
                 timerDisplay.startsWith('+') ? '공복 목표 초과 달성! 👏' : '공복 목표 달성까지'}
              </span>
              <Clock size={24} className="opacity-80" />
            </div>
            
            <div className="text-4xl md:text-6xl font-black tracking-tight font-mono mb-2">
              {timerDisplay}
            </div>
            <p className="text-sm font-medium opacity-80">
              {appState === 'A' ? '오늘 첫 식사를 등록하세요' : 
               appState === 'B' ? (prevFastingResult && !prevFastingResult.success ? '다음엔 더 길게 도전해보세요! (남은 식사 가능 시간)' : '남은 식사 가능 시간') : 
               timerDisplay.startsWith('+') ? '대단해요! 목표 시간을 넘겼습니다' : '다음 공복 목표를 위해 물을 충분히 드세요'}
            </p>
          </div>

          {/* AI Feedback Card — State C에서 표시 */}
          {appState === 'C' && feedbackStatus !== 'idle' && (
            <div className={`rounded-3xl p-6 shadow-sm border transition-all duration-500 ${
              feedbackStatus === 'loading' ? 'bg-violet-50 border-violet-100' :
              feedbackStatus === 'error' ? 'bg-red-50 border-red-100' :
              'bg-indigo-50 border-indigo-100'
            }`}>
              {/* Loading State */}
              {feedbackStatus === 'loading' && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="relative">
                    <Sparkles size={28} className="text-violet-500 animate-pulse" />
                    <Loader2 size={16} className="text-violet-400 animate-spin absolute -bottom-1 -right-1" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-violet-900">AI 간단 전문가가 오늘의 식단을 진단하는 중...</p>
                    <p className="text-sm text-violet-600 mt-1">식사 패턴과 영양 균형을 분석하고 있습니다</p>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}

              {/* Success State */}
              {feedbackStatus === 'success' && (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={18} className="text-indigo-600" />
                    <h3 className="font-bold text-indigo-900">오늘의 AI 간단 전문가 피드백</h3>
                  </div>
                  <p className="text-sm text-indigo-950 leading-relaxed whitespace-pre-wrap">
                    {feedbackText}
                  </p>
                </>
              )}

              {/* Error State */}
              {feedbackStatus === 'error' && (
                <div className="flex flex-col items-center gap-3 py-2">
                  <AlertCircle size={24} className="text-red-500" />
                  <div className="text-center">
                    <p className="font-bold text-red-900">AI 진단에 실패했습니다</p>
                    <p className="text-sm text-red-600 mt-1 break-all">{feedbackError}</p>
                  </div>
                  <button 
                    onClick={handleRetryFeedback}
                    className="flex items-center gap-2 bg-red-100 text-red-700 font-bold text-sm px-4 py-2 rounded-xl hover:bg-red-200 transition-colors mt-1"
                  >
                    <RefreshCw size={14} />
                    다시 시도
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Previous AI Feedback Card — State A/B에서 표시 */}
          {appState !== 'C' && previousFeedback && (
            <div className="rounded-3xl p-6 shadow-sm border bg-indigo-50 border-indigo-100 transition-all duration-500">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-indigo-600" />
                <h3 className="font-bold text-indigo-900">
                  이전 AI 간단 전문가 피드백 <span className="text-xs font-normal text-indigo-600 ml-1">({format(new Date(previousFeedback.date), 'M월 d일', { locale: ko })})</span>
                </h3>
              </div>
              <p className="text-sm text-indigo-950 leading-relaxed whitespace-pre-wrap">
                {previousFeedback.text}
              </p>
            </div>
          )}

          {/* Meal Input */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-green-500" />
              식단 기록하기
            </h3>
            <form onSubmit={handleAddMeal} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">식사 시간</label>
                <input 
                  type="time" 
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 w-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">음식 이름 <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  placeholder="예: 바나나 1개, 그릭요거트 200g" 
                  value={foodInput}
                  onChange={(e) => setFoodInput(e.target.value)}
                  maxLength={30}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 w-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none placeholder:text-gray-400"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">비고 <span className="text-gray-300 font-medium">(선택)</span></label>
                <input 
                  type="text" 
                  placeholder="예: 무가당 섭취 / 운동 후 섭취" 
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  maxLength={30}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 w-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">체중 <span className="text-gray-300 font-medium">(선택, kg)</span></label>
                <input 
                  type="number" 
                  step="0.01"
                  inputMode="decimal"
                  placeholder="예: 65.52 (소숫점 2자리까지 반영)" 
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 w-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none placeholder:text-gray-400"
                />
              </div>
              <button 
                type="submit" 
                className="bg-green-600 text-white rounded-xl py-4 text-base md:text-lg font-bold mt-1 hover:bg-green-700 transition-colors"
              >
                기록 추가
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Section: Timeline & Logs */}
        <div className="flex flex-col h-full mt-4">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl font-black text-gray-900">현재 식사 사이클 기록</h2>
              <p className="text-sm text-gray-500 mt-1">최근 식사 시작 기준</p>
            </div>
          </div>

          {/* Timeline View */}
          <div className="flex-1">
            <div className="relative pl-4 border-l-2 border-gray-200 flex flex-col gap-8 pb-8">
              {currentActiveCycle.length === 0 && (
                <div className="text-sm text-gray-400 font-medium py-10 text-center">
                  아직 기록된 식단이 없습니다. (현재 공복 중)
                </div>
              )}
              
              {currentActiveCycle.map((log, index) => {
                const isFirst = index === 0;
                const isLast = index === currentActiveCycle.length - 1 && currentActiveCycle.length > 1;
                const isEditing = editingLogId === log.id;
                
                return (
                  <div key={log.id} className="relative">
                    <div className={`absolute -left-[21px] w-3 h-3 bg-white border-2 rounded-full mt-1.5 ${isFirst ? 'border-green-500' : 'border-gray-300'}`}></div>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${isFirst ? 'text-green-600 bg-green-50' : 'text-gray-500'}`}>
                        {format(new Date(log.logged_at), 'HH:mm a')} 
                        {isFirst && ' (첫 식사)'}
                        {isLast && ' (마지막 식사)'}
                      </span>
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <button onClick={handleEditSave} className="text-green-500 hover:text-green-700 transition-colors p-0.5">
                              <Check size={16} />
                            </button>
                            <button onClick={() => setEditingLogId(null)} className="text-gray-300 hover:text-gray-500 transition-colors p-0.5">
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditing(log)} className="text-gray-300 hover:text-blue-500 transition-colors p-0.5">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDelete(log.id)} className="text-gray-300 hover:text-red-500 transition-colors p-0.5">
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="bg-blue-50 rounded-2xl p-4 mt-2 flex flex-col gap-2 border border-blue-200 animate-fade-in">
                        <input
                          type="time"
                          value={editForm.time}
                          onChange={(e) => setEditForm({...editForm, time: e.target.value})}
                          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-400 outline-none"
                        />
                        <input
                          type="text"
                          value={editForm.food_name}
                          onChange={(e) => setEditForm({...editForm, food_name: e.target.value})}
                          placeholder="음식 이름"
                          maxLength={30}
                          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                        />
                        <input
                          type="text"
                          value={editForm.amount}
                          onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                          placeholder="비고 (선택)"
                          maxLength={30}
                          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                        />
                        <input
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          value={editForm.weight}
                          onChange={(e) => setEditForm({...editForm, weight: e.target.value})}
                          placeholder="체중(kg) (선택)"
                          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                        />
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-2xl p-4 mt-2">
                        <div className="font-bold text-gray-900 text-base">{log.food_name}</div>
                        {(log.amount || log.weight) && (
                          <div className="text-sm text-gray-500 mt-1">
                            {log.amount}{log.amount && log.weight ? ' • ' : ''}{log.weight ? `체중 ${log.weight}kg` : ''}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
