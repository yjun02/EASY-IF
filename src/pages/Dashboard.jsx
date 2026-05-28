import { useState, useEffect, useRef } from 'react';
import { Clock, Plus, Trash2, Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateDailyFeedback } from '../lib/gemini';
import { format, startOfDay, addHours, differenceInSeconds, parse } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function Dashboard({ session }) {
  const [eatingWindow, setEatingWindow] = useState(8); 
  const [mealLogs, setMealLogs] = useState([]);
  const [appState, setAppState] = useState('A'); 
  const [timerDisplay, setTimerDisplay] = useState('00:00:00');
  
  // Form state
  const [timeInput, setTimeInput] = useState(format(new Date(), 'HH:mm'));
  const [foodInput, setFoodInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [weightInput, setWeightInput] = useState('');

  // AI Feedback state
  // 'idle' | 'loading' | 'success' | 'error'
  const [feedbackStatus, setFeedbackStatus] = useState('idle');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const feedbackTriggeredRef = useRef(false);

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

      fetchMealLogs();
      loadExistingFeedback();
    }
    
    if (session?.user) {
      loadData();
    }
  }, [session]);

  const fetchMealLogs = async () => {
    const today = startOfDay(new Date()).toISOString();
    const { data } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('logged_at', today)
      .order('logged_at', { ascending: true });
      
    if (data) {
      setMealLogs(data);
    }
  };

  // 기존에 오늘 생성된 AI 피드백이 있는지 확인
  const loadExistingFeedback = async () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const { data } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('date', todayStr)
      .maybeSingle();
    
    if (data && data.ai_feedback) {
      setFeedbackText(data.ai_feedback);
      setFeedbackStatus('success');
      feedbackTriggeredRef.current = true; // 이미 생성된 피드백이 있으므로 재트리거 방지
    }
  };

  // State Engine & Timer Loop
  useEffect(() => {
    const calculateStateAndTimer = () => {
      const now = new Date();
      if (mealLogs.length === 0) {
        setAppState('A');
        setTimerDisplay(`${targetFasting}:00:00`);
        return;
      }

      const firstMealTime = new Date(mealLogs[0].logged_at);
      const windowEndTime = addHours(firstMealTime, eatingWindow);

      if (now < windowEndTime) {
        setAppState('B');
        const diffSecs = differenceInSeconds(windowEndTime, now);
        const h = Math.floor(diffSecs / 3600).toString().padStart(2, '0');
        const m = Math.floor((diffSecs % 3600) / 60).toString().padStart(2, '0');
        const s = (diffSecs % 60).toString().padStart(2, '0');
        setTimerDisplay(`${h}:${m}:${s}`);
      } else {
        setAppState('C');
        setTimerDisplay('00:00:00');
      }
    };

    calculateStateAndTimer();
    const interval = setInterval(calculateStateAndTimer, 1000);
    return () => clearInterval(interval);
  }, [mealLogs, eatingWindow, targetFasting]);

  // AI 피드백 자동 트리거: State C 진입 시 1회만
  useEffect(() => {
    if (appState === 'C' && mealLogs.length > 0 && !feedbackTriggeredRef.current) {
      feedbackTriggeredRef.current = true;
      triggerAiFeedback();
    }
  }, [appState, mealLogs]);

  const triggerAiFeedback = async () => {
    setFeedbackStatus('loading');
    setFeedbackError('');

    try {
      const result = await generateDailyFeedback();

      // 응답 검증: 최소 길이 및 한국어 포함 여부
      if (!result || result.trim().length < 20) {
        throw new Error('AI 응답이 너무 짧거나 비어 있습니다.');
      }

      // DB에 저장
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const firstMealTime = new Date(mealLogs[0].logged_at);
      const lastMealTime = new Date(mealLogs[mealLogs.length - 1].logged_at);
      const actualEatingHours = (lastMealTime - firstMealTime) / (1000 * 60 * 60);
      const actualFastingHours = Math.round((24 - actualEatingHours) * 10) / 10;

      await supabase.from('daily_summaries').upsert({
        user_id: session.user.id,
        date: todayStr,
        ai_feedback: result.trim(),
        fasting_hours: actualFastingHours,
        is_success: actualFastingHours >= targetFasting,
      }, { onConflict: 'user_id,date' });

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
      weight: weightInput ? parseFloat(weightInput) : null
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

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex-1 flex flex-col gap-6 p-4 md:p-6 max-w-2xl mx-auto w-full">
        
        {/* Top Section: Status & Input */}
        <div className="flex flex-col gap-6">
          {/* Status Timer Card */}
          <div className={`rounded-3xl p-6 shadow-sm border transition-colors duration-500 ${
            appState === 'B' ? 'bg-green-50 border-green-100 text-green-900' : 
            appState === 'C' ? 'bg-gray-50 border-gray-100 text-gray-900' : 
            'bg-emerald-500 border-emerald-600 text-white'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold opacity-80">
                {appState === 'A' ? '목표 공복 시간까지' : 
                 appState === 'B' ? `${targetFasting}시간 공복 성공! 식사 가능` : 
                 '식사 시간 종료'}
              </span>
              <Clock size={20} className="opacity-80" />
            </div>
            
            <div className="text-4xl md:text-5xl font-black tracking-tight font-mono mb-2">
              {timerDisplay}
            </div>
            <p className="text-sm font-medium opacity-80">
              {appState === 'A' ? '오늘 첫 식사를 등록하세요' : 
               appState === 'B' ? '식사 가능 남은 시간' : 
               '다음 공복 목표를 위해 물을 충분히 드세요'}
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
                    <p className="font-bold text-violet-900">AI가 오늘의 식단을 진단하는 중...</p>
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
                    <h3 className="font-bold text-indigo-900">오늘의 AI 코칭</h3>
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

          {/* Meal Input */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-green-500" />
              식단 기록하기
            </h3>
            <form onSubmit={handleAddMeal} className="flex flex-col gap-3">
              <input 
                type="time" 
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                className="bg-gray-50 border-none rounded-xl px-4 py-3 md:p-4 text-sm md:text-base font-medium text-gray-700 w-full focus:ring-2 focus:ring-green-500 outline-none"
              />
              <input 
                type="text" 
                placeholder="음식 이름 및 양 (최대 30자, 예: 바나나 1개, 그릭요거트 200g)" 
                value={foodInput}
                onChange={(e) => setFoodInput(e.target.value)}
                maxLength={30}
                className="bg-gray-50 border-none rounded-xl px-4 py-3 md:p-4 text-sm md:text-base text-gray-800 w-full focus:ring-2 focus:ring-green-500 outline-none"
                required
              />
              <input 
                type="text" 
                placeholder="비고 (최대 30자, 예: 요거트는 무가당으로 섭취 / 운동 후 섭취 등), 선택사항" 
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                maxLength={30}
                className="bg-gray-50 border-none rounded-xl px-4 py-3 md:p-4 text-sm md:text-base text-gray-800 w-full focus:ring-2 focus:ring-green-500 outline-none"
              />
              <input 
                type="number" 
                step="0.01"
                inputMode="decimal"
                placeholder="체중(kg), 선택사항" 
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="bg-gray-50 border-none rounded-xl px-4 py-3 md:p-4 text-sm md:text-base text-gray-800 w-full focus:ring-2 focus:ring-green-500 outline-none"
              />
              <button 
                type="submit" 
                className="bg-gray-900 text-white rounded-xl py-4 text-sm md:text-base font-bold mt-2 hover:bg-gray-800 transition-colors"
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
              <h2 className="text-xl font-black text-gray-900">오늘의 식단</h2>
              <p className="text-sm text-gray-500 mt-1">{format(new Date(), 'M월 d일 eeee', { locale: ko })}</p>
            </div>
          </div>

          {/* Timeline View */}
          <div className="flex-1">
            <div className="relative pl-4 border-l-2 border-gray-200 flex flex-col gap-8 pb-8">
              {mealLogs.length === 0 && (
                <div className="text-sm text-gray-400 font-medium py-10 text-center">
                  아직 기록된 식단이 없습니다.
                </div>
              )}
              
              {mealLogs.map((log, index) => {
                const isFirst = index === 0;
                const isLast = index === mealLogs.length - 1 && mealLogs.length > 1;
                
                return (
                  <div key={log.id} className="relative">
                    <div className={`absolute -left-[21px] w-3 h-3 bg-white border-2 rounded-full mt-1.5 ${isFirst ? 'border-green-500' : 'border-gray-300'}`}></div>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${isFirst ? 'text-green-600 bg-green-50' : 'text-gray-500'}`}>
                        {format(new Date(log.logged_at), 'HH:mm a')} 
                        {isFirst && ' (첫 식사)'}
                        {isLast && ' (마지막 식사)'}
                      </span>
                      <button onClick={() => handleDelete(log.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4 mt-2">
                      <div className="font-bold text-gray-900 text-base">{log.food_name}</div>
                      {(log.amount || log.weight) && (
                        <div className="text-sm text-gray-500 mt-1">
                          {log.amount}{log.amount && log.weight ? ' • ' : ''}{log.weight ? `체중 ${log.weight}kg` : ''}
                        </div>
                      )}
                    </div>
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
