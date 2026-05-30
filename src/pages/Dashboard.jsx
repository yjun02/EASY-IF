import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateDailyFeedback } from '../lib/gemini';
import { format, addHours, differenceInSeconds, parse } from 'date-fns';
import { 
  getGuestProfile, 
  upsertGuestProfile, 
  getGuestMealLogs, 
  addGuestMealLog, 
  deleteGuestMealLog, 
  updateGuestMealLog, 
  upsertGuestCycleSummary 
} from '../lib/guestStorage';

// Subcomponents
import GuestBanner from '../components/dashboard/GuestBanner';
import StatusCard from '../components/dashboard/StatusCard';
import AiFeedbackCard from '../components/dashboard/AiFeedbackCard';
import MealForm from '../components/dashboard/MealForm';
import ActiveCycleTimeline from '../components/dashboard/ActiveCycleTimeline';
import SEO from '../components/SEO';

// ─── KST Helpers ───
const parseKstToDate = (eatingAtStr) => {
  if (!eatingAtStr) return new Date();
  if (eatingAtStr.includes('Z') || eatingAtStr.includes('+')) {
    return new Date(eatingAtStr);
  }
  const isoStr = eatingAtStr.replace(' ', 'T').slice(0, 19) + '+09:00';
  return new Date(isoStr);
};

const formatKst = (date) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23'
  });
  const parts = formatter.formatToParts(date);
  const p = {};
  parts.forEach(x => p[x.type] = x.value);
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
};

export default function Dashboard({ session, isGuest }) {
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
  const [feedbackStatus, setFeedbackStatus] = useState('idle');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const feedbackTriggeredRef = useRef(false);
  const [previousFeedback, setPreviousFeedback] = useState(null);

  const targetFasting = 24 - eatingWindow;

  // Initialize and load data
  useEffect(() => {
    async function loadData() {
      if (isGuest) {
        const profile = getGuestProfile();
        if (!profile) {
          const preferred = localStorage.getItem('preferredEatingWindow');
          const ew = preferred ? parseInt(preferred) : 8;
          upsertGuestProfile({ eating_window: ew });
          setEatingWindow(ew);
        } else {
          setEatingWindow(profile.eating_window);
        }
        await fetchMealLogs();
        setIsInitializing(false);
      } else {
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
    }
    
    loadData();
  }, [session, isGuest]);

  const fetchMealLogs = async () => {
    let data = [];
    if (isGuest) {
      data = getGuestMealLogs(72);
    } else if (session?.user) {
      const since = new Date();
      since.setHours(since.getHours() - 72);
      const { data: dbData } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('eating_at', formatKst(since))
        .order('eating_at', { ascending: true });
      data = dbData || [];
    }
      
    if (data && data.length > 0) {
      // ─── Build cycles ───
      let cycles = [];
      let currentCycle = null;
      let ew = eatingWindow; 

      data.forEach(meal => {
        const mealTime = parseKstToDate(meal.eating_at);
        if (!currentCycle) {
          currentCycle = [meal];
          cycles.push(currentCycle);
        } else {
          const firstMealTime = parseKstToDate(currentCycle[0].eating_at);
          if (mealTime <= addHours(firstMealTime, ew)) {
            currentCycle.push(meal);
          } else {
            currentCycle = [meal];
            cycles.push(currentCycle);
          }
        }
      });

      // ─── Determine active / completed cycles ───
      const lastCycle = cycles[cycles.length - 1];
      const lastCycleFirstMealTime = parseKstToDate(lastCycle[0].eating_at);
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

      // ─── 1. Dashboard display: fasting result for current active cycle ───
      let newPrevResult = null;
      if (active.length > 0 && completed) {
        const prevLastMeal = parseKstToDate(completed[completed.length - 1].eating_at);
        const currentFirstMeal = parseKstToDate(active[0].eating_at);
        const fastingHours = (currentFirstMeal - prevLastMeal) / (1000 * 60 * 60);
        newPrevResult = {
          hours: Math.round(fastingHours * 10) / 10,
          success: fastingHours >= targetFasting
        };
      }

      // ─── 2. Guest 모드 로컬 상태 유지 (Supabase DB 자동 저장 없음) ───
      // cycle_summaries는 AI 피드백 생성 시 Edge Function에서만 생성됩니다.
      // 게스트 모드는 UI 표시 계산을 위해 localStorage에만 저장합니다.
      if (isGuest && cycles.length > 1) {
        for (let i = 1; i < cycles.length; i++) {
          const prevCycle = cycles[i - 1];
          const currCycle = cycles[i];
          const prevLastMeal = parseKstToDate(prevCycle[prevCycle.length - 1].eating_at);
          const currentFirstMeal = parseKstToDate(currCycle[0].eating_at);
          const fastingHours = (currentFirstMeal - prevLastMeal) / (1000 * 60 * 60);
          const isSuccess = fastingHours >= targetFasting;
          const cycleStart = formatKst(parseKstToDate(currCycle[0].eating_at));
          const cycleEnd = formatKst(parseKstToDate(currCycle[currCycle.length - 1].eating_at));

          upsertGuestCycleSummary(cycleStart, {
            cycle_end: cycleEnd,
            fasting_hours: Math.round(fastingHours * 10) / 10,
            is_success: isSuccess,
          });
        }
      }

      // ─── 3. AI context: fasting result for the completed cycle ───
      let aiPrevResult = null;
      if (completed && prevToCompleted) {
        const pastLastMeal = parseKstToDate(prevToCompleted[prevToCompleted.length - 1].eating_at);
        const completedFirstMeal = parseKstToDate(completed[0].eating_at);
        const fHours = (completedFirstMeal - pastLastMeal) / (1000 * 60 * 60);
        aiPrevResult = {
           hours: Math.round(fHours * 10) / 10,
           success: fHours >= targetFasting
        };
      }

      // ─── 4. Load Feedback from cycle_summaries ───
      let hasTriggered = false;
      if (completed) {
        const cycleStart = formatKst(parseKstToDate(completed[0].eating_at));
        
        if (isGuest) {
          setFeedbackText('');
          setFeedbackStatus('idle');
        } else {
          const { data: summaryData } = await supabase
            .from('cycle_summaries')
            .select('ai_feedback')
            .eq('user_id', session.user.id)
            .eq('cycle_start', cycleStart)
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
            // If the completed cycle has no feedback in DB, trigger generation automatically
            if (!feedbackTriggeredRef.current && !isGuest) {
              feedbackTriggeredRef.current = true;
              triggerAiFeedback(completed, aiPrevResult);
              hasTriggered = true;
            }
          }

          // Load Previous Feedback for display
          const { data: pastData } = await supabase
            .from('cycle_summaries')
            .select('*')
            .eq('user_id', session.user.id)
            .lt('cycle_start', cycleStart)
            .not('ai_feedback', 'is', null)
            .not('ai_feedback', 'eq', '[GENERATING]')
            .order('cycle_start', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (pastData) {
            setPreviousFeedback({
              date: pastData.cycle_start,
              text: pastData.ai_feedback
            });
          } else {
            setPreviousFeedback(null);
          }
        }
      } else {
        setFeedbackText('');
        setFeedbackStatus('idle');
        setPreviousFeedback(null);
      }

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
      setCurrentActiveCycle([]);
      setCompletedCycle(null);
    }
  };

  // State Engine & Timer Loop
  useEffect(() => {
    const calculateStateAndTimer = () => {
      const now = new Date();
      if (currentActiveCycle.length > 0) {
        setAppState('B');
        const firstMealTime = parseKstToDate(currentActiveCycle[0].eating_at);
        const windowEndTime = addHours(firstMealTime, eatingWindow);
        const diffSecs = differenceInSeconds(windowEndTime, now);
        const h = Math.floor(diffSecs / 3600).toString().padStart(2, '0');
        const m = Math.floor((diffSecs % 3600) / 60).toString().padStart(2, '0');
        const s = (diffSecs % 60).toString().padStart(2, '0');
        setTimerDisplay(`${h}:${m}:${s}`);
      } else if (completedCycle) {
        setAppState('C');
        const lastMealTime = parseKstToDate(completedCycle[completedCycle.length - 1].eating_at);
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

  // AI 피드백 자동 트리거
  useEffect(() => {
    if (!isGuest && !isInitializing && appState === 'C' && completedCycle && !feedbackTriggeredRef.current) {
      feedbackTriggeredRef.current = true;
      triggerAiFeedback();
    }
  }, [appState, completedCycle, isInitializing, isGuest]);

  const triggerAiFeedback = async (targetCycle = completedCycle, prevFasting = prevFastingForAI) => {
    if (isGuest) return;
    setFeedbackStatus('loading');
    setFeedbackError('');

    try {
      if (!targetCycle) return;
      const cycleStartIso = formatKst(parseKstToDate(targetCycle[0].eating_at));
      const cycleEndIso = formatKst(parseKstToDate(targetCycle[targetCycle.length - 1].eating_at));
      const result = await generateDailyFeedback(session?.access_token, cycleStartIso, cycleEndIso, prevFasting);

      if (!result || result.trim().length < 20) {
        throw new Error('AI 응답이 너무 짧거나 비어 있습니다.');
      }

      setFeedbackText(result.trim());
      setFeedbackStatus('success');

    } catch (err) {
      console.error('[AI Feedback Error]', err);
      if (err.message.includes('생성 중이거나 완료')) {
        // 에러를 표시하지 않고, loading 상태를 유지하며 폴링을 통해 완료를 기다림
        // (useEffect에서 loading 상태일 때 자동 폴링함)
        console.log("중복 요청 감지됨. 기존 생성 프로세스 완료를 대기합니다.");
      } else {
        setFeedbackError(err.message);
        setFeedbackStatus('error');
      }
    }
  };

  // 피드백 생성 중일 때 폴링
  useEffect(() => {
    let pollInterval;
    if (feedbackStatus === 'loading' && completedCycle && !isGuest) {
      pollInterval = setInterval(async () => {
        const cycleStartIso = formatKst(parseKstToDate(completedCycle[0].eating_at));
        const { data } = await supabase
          .from('cycle_summaries')
          .select('ai_feedback')
          .eq('user_id', session.user.id)
          .eq('cycle_start', cycleStartIso)
          .maybeSingle();

        if (data && data.ai_feedback && data.ai_feedback !== '[GENERATING]') {
          setFeedbackText(data.ai_feedback);
          setFeedbackStatus('success');
          clearInterval(pollInterval);
        }
      }, 3000); // 3초마다 체크
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [feedbackStatus, completedCycle, isGuest, session]);

  const handleRetryFeedback = () => {
    feedbackTriggeredRef.current = false;
    triggerAiFeedback();
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });

    if (error) {
      alert('로그인에 실패했습니다: ' + error.message);
    }
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (!foodInput) return;

    const parsedTime = parse(timeInput, 'HH:mm', new Date());
      const eatingAtStr = parsedTime.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul', hour12: false });
    
    if (isGuest) {
      const newLog = {
        eating_at: eatingAtStr,
        food_name: foodInput,
        amount: amountInput.trim() || '',
        weight: weightInput ? parseFloat(weightInput.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]) : null
      };
      addGuestMealLog(newLog);
      setFoodInput('');
      setAmountInput('');
      setWeightInput('');
      fetchMealLogs();
    } else {
      const newLog = {
        user_id: session.user.id,
        eating_at: eatingAtStr,
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
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("정말 이 식단 기록을 삭제하시겠습니까?")) {
      if (isGuest) {
        deleteGuestMealLog(id);
        fetchMealLogs();
      } else {
        const { error } = await supabase.from('meal_logs').delete().eq('id', id);
        if (!error) {
          fetchMealLogs();
        }
      }
    }
  };

  const startEditing = (log) => {
    const t = parseKstToDate(log.eating_at);
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
    const eating_at = parsedTime.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul', hour12: false });

    const updateData = {
      food_name: editForm.food_name,
      amount: editForm.amount || null,
      weight: editForm.weight ? parseFloat(editForm.weight.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]) : null,
      eating_at,
    };

    if (isGuest) {
      updateGuestMealLog(editingLogId, updateData);
      setEditingLogId(null);
      fetchMealLogs();
    } else {
      const { error } = await supabase.from('meal_logs').update(updateData).eq('id', editingLogId);
      if (!error) {
        setEditingLogId(null);
        fetchMealLogs();
      } else {
        alert('수정 실패: ' + error.message);
      }
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
    <>
    <SEO 
      title="대시보드" 
      description="나의 간헐적 단식 상태와 식단 기록을 한눈에 확인하세요. 실시간 타이머와 AI 전문가 피드백이 당신의 다이어트를 돕습니다." 
      url="/" 
    />
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex-1 flex flex-col gap-6 p-4 md:p-6 max-w-2xl mx-auto w-full">
        
        {/* Guest Login Banner */}
        {isGuest && <GuestBanner onLogin={handleGoogleLogin} />}

        {/* Top Section: Status & Feedback */}
        <div className="flex flex-col gap-6">
          <StatusCard 
            appState={appState}
            timerDisplay={timerDisplay}
            prevFastingResult={prevFastingResult}
            targetFasting={targetFasting}
          />

          <AiFeedbackCard 
            isGuest={isGuest}
            appState={appState}
            feedbackStatus={feedbackStatus}
            feedbackText={feedbackText}
            feedbackError={feedbackError}
            previousFeedback={previousFeedback}
            onLogin={handleGoogleLogin}
            onRetry={handleRetryFeedback}
          />

          {/* Meal Input Form */}
          <MealForm 
            timeInput={timeInput}
            setTimeInput={setTimeInput}
            foodInput={foodInput}
            setFoodInput={setFoodInput}
            amountInput={amountInput}
            setAmountInput={setAmountInput}
            weightInput={weightInput}
            setWeightInput={setWeightInput}
            onSubmit={handleAddMeal}
          />
        </div>

        {/* Timeline Section: Previous + Current Cycle */}
        <ActiveCycleTimeline 
          completedCycle={completedCycle}
          prevFastingResult={prevFastingResult}
          currentActiveCycle={currentActiveCycle}
          editingLogId={editingLogId}
          editForm={editForm}
          setEditForm={setEditForm}
          onStartEditing={startEditing}
          onCancelEditing={() => setEditingLogId(null)}
          onSaveEditing={handleEditSave}
          onDelete={handleDelete}
        />

      </div>
    </div>
    </>
  );
}
