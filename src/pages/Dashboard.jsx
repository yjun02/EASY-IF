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
  upsertGuestSummary 
} from '../lib/guestStorage';

// Subcomponents
import GuestBanner from '../components/dashboard/GuestBanner';
import StatusCard from '../components/dashboard/StatusCard';
import AiFeedbackCard from '../components/dashboard/AiFeedbackCard';
import MealForm from '../components/dashboard/MealForm';
import ActiveCycleTimeline from '../components/dashboard/ActiveCycleTimeline';

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
        .gte('logged_at', since.toISOString())
        .order('logged_at', { ascending: true });
      data = dbData || [];
    }
      
    if (data && data.length > 0) {
      let cycles = [];
      let currentCycle = null;
      let ew = eatingWindow; 

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
        
        if (isGuest) {
          upsertGuestSummary(prevCycleDate, {
            actual_fasting_hours: Math.round(fastingHours * 10) / 10,
            is_success: fastingHours >= targetFasting,
          });
        } else {
          supabase.from('daily_summaries').upsert({
            user_id: session.user.id,
            date: prevCycleDate,
            actual_fasting_hours: Math.round(fastingHours * 10) / 10,
            is_success: fastingHours >= targetFasting,
          }, { onConflict: 'user_id,date' }).then();
        }
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

      // Load Feedback Status for completedCycle
      let hasTriggered = false;
      if (completed) {
        const cycleDate = format(new Date(completed[0].logged_at), 'yyyy-MM-dd');
        
        if (isGuest) {
          setFeedbackText('');
          setFeedbackStatus('idle');
        } else {
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

          // Load Previous Feedback for Display in State A/B
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

  // AI 피드백 자동 트리거
  useEffect(() => {
    if (!isGuest && !isInitializing && appState === 'C' && completedCycle && !feedbackTriggeredRef.current) {
      feedbackTriggeredRef.current = true;
      triggerAiFeedback();
    }
  }, [appState, completedCycle, isInitializing, isGuest]);

  const triggerAiFeedback = async () => {
    if (isGuest) return;
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
    
    if (isGuest) {
      const newLog = {
        logged_at: parsedTime.toISOString(),
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

        {/* Timeline Section */}
        <ActiveCycleTimeline 
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
  );
}
