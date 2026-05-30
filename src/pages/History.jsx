import { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, TrendingDown, BarChart3, Loader2, CheckCircle2, XCircle, Sparkles, Scale, UtensilsCrossed, X } from 'lucide-react';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subDays, subMonths, subYears } from 'date-fns';
import { ko } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { 
  getAllGuestMealLogs, 
  getGuestCycleSummariesForMonth, 
  getGuestWeightData, 
  getGuestMealLogsForDate, 
  getGuestCycleSummariesForDate 
} from '../lib/guestStorage';

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
  const partMap = {};
  parts.forEach(p => partMap[p.type] = p.value);
  return `${partMap.year}-${partMap.month}-${partMap.day} ${partMap.hour}:${partMap.minute}:${partMap.second}`;
};

const formatKstDateOnly = (date) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const parts = formatter.formatToParts(date);
  const partMap = {};
  parts.forEach(p => partMap[p.type] = p.value);
  return `${partMap.year}-${partMap.month}-${partMap.day}`;
};

export default function History({ session, isGuest }) {
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'weight'
  const [activeCycleDate, setActiveCycleDate] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [summaries, setSummaries] = useState([]);

  // Day detail state
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayDetail, setDayDetail] = useState(null);
  const [dayDetailLoading, setDayDetailLoading] = useState(false);

  // Weight graph state
  const [weightData, setWeightData] = useState([]);
  const [weightPeriod, setWeightPeriod] = useState('1m');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [isInitializing, setIsInitializing] = useState(true);
  const isFirstLoad = useRef(true);
  const [firstLogDate, setFirstLogDate] = useState(null);

  useEffect(() => {
    async function fetchFirstLog() {
      if (isGuest) {
        const allLogs = getAllGuestMealLogs();
        if (allLogs.length > 0) {
          const sorted = allLogs.sort((a, b) => parseKstToDate(a.eating_at) - parseKstToDate(b.eating_at));
          setFirstLogDate(formatKstDateOnly(parseKstToDate(sorted[0].eating_at)));
        }
      } else if (session?.user) {
        const { data: firstMealData } = await supabase
          .from('meal_logs')
          .select('eating_at')
          .eq('user_id', session.user.id)
          .order('eating_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (firstMealData) {
          setFirstLogDate(formatKstDateOnly(parseKstToDate(firstMealData.eating_at)));
        }
      }
    }
    fetchFirstLog();
  }, [session, isGuest]);

  useEffect(() => {
    async function load() {
      setIsInitializing(true);
      if (viewMode === 'calendar') {
        const shouldAutoSelect = isFirstLoad.current;
        await loadCalendarData(shouldAutoSelect);
        if (shouldAutoSelect) isFirstLoad.current = false;
      } else {
        await loadWeightData();
      }
      setIsInitializing(false);
    }
    load();
  }, [currentDate, weightPeriod, customStart, customEnd, session, viewMode, isGuest]);

  const loadCalendarData = async (autoSelect = false) => {
    const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');
    
    if (isGuest) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const data = getGuestCycleSummariesForMonth(year, month);
      setSummaries(data);
      if (autoSelect) {
        const today = new Date();
        setTimeout(() => handleDayClick(today), 0);
      }
    } else if (session?.user) {
      const { data: summariesData } = await supabase
        .from('cycle_summaries')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('cycle_start', start)
        .lte('cycle_start', end + ' 23:59:59Z');
        
      // Fetch all meals for the month to calculate active cycle
      const { data: mealsData } = await supabase
        .from('meal_logs')
        .select('eating_at')
        .eq('user_id', session.user.id)
        .gte('eating_at', start)
        .lte('eating_at', end + ' 23:59:59Z')
        .order('eating_at', { ascending: true });
        
      if (summariesData) {
        setSummaries(summariesData);
      }
      
      if (mealsData && mealsData.length > 0) {
        let currentCycle = [];
        const EATING_WINDOW_HOURS = 8;
        const allCycles = [];
        
        mealsData.forEach(meal => {
          if (currentCycle.length === 0) {
            currentCycle.push(meal);
          } else {
            const prev = parseKstToDate(currentCycle[0].eating_at).getTime();
            const curr = parseKstToDate(meal.eating_at).getTime();
            if ((curr - prev) / (1000 * 60 * 60) > EATING_WINDOW_HOURS) {
              allCycles.push(currentCycle);
              currentCycle = [meal];
            } else {
              currentCycle.push(meal);
            }
          }
        });
        if (currentCycle.length > 0) {
          allCycles.push(currentCycle);
        }
        
        const lastCycle = allCycles[allCycles.length - 1];
        const lastMealTime = parseKstToDate(lastCycle[lastCycle.length - 1].eating_at).getTime();
        const nowKst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })).getTime();
        
        // If the last meal was within the eating window, it's an active cycle
        if ((nowKst - lastMealTime) / (1000 * 60 * 60) <= EATING_WINDOW_HOURS) {
          const activeStartStr = formatKstDateOnly(parseKstToDate(lastCycle[0].eating_at));
          setActiveCycleDate(activeStartStr);
        } else {
          setActiveCycleDate(null);
        }
      } else {
        setActiveCycleDate(null);
      }

      if (summariesData && autoSelect) {
        const today = new Date();
        setTimeout(() => handleDayClick(today), 0);
      }
    }
  };

  const loadWeightData = async () => {
    const { startDate } = getDateRange();
    let data = [];
    
    if (isGuest) {
      const allWeights = getGuestWeightData();
      if (startDate) {
        const limitDate = parseKstToDate(startDate);
        data = allWeights.filter(w => parseKstToDate(w.eating_at) >= limitDate);
      } else {
        data = allWeights;
      }
    } else if (session?.user) {
      // meal_logs에서 체중이 기록된 행만 가져오기
      let query = supabase
        .from('meal_logs')
        .select('eating_at, weight')
        .eq('user_id', session.user.id)
        .not('weight', 'is', null)
        .order('eating_at', { ascending: true });

      if (startDate) {
        query = query.gte('eating_at', startDate);
      }

      const { data: dbData } = await query;
      data = dbData || [];
    }
    
    if (data && data.length > 0) {
      // 날짜별 최저 체중만 추출
      const dailyMin = {};
      data.forEach(log => {
        const dateKey = formatKstDateOnly(parseKstToDate(log.eating_at));
        if (!dailyMin[dateKey] || log.weight < dailyMin[dateKey]) {
          dailyMin[dateKey] = log.weight;
        }
      });

      const chartData = Object.entries(dailyMin)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, weight]) => ({
          date,
          label: format(new Date(date), 'M/d'),
          weight: parseFloat(weight),
        }));

      setWeightData(chartData);
    } else {
      setWeightData([]);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    
    if (weightPeriod === 'custom') {
      return {
        startDate: customStart ? new Date(customStart).toISOString() : null,
      };
    }

    const periodMap = {
      '1w': subDays(now, 7),
      '1m': subMonths(now, 1),
      '3m': subMonths(now, 3),
      '1y': subYears(now, 1),
      'all': null,
    };

    const start = periodMap[weightPeriod];
    return { startDate: start ? start.toISOString() : null };
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const nextMonth = () => { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); setSelectedDate(null); setDayDetail(null); };
  const prevMonth = () => { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); setSelectedDate(null); setDayDetail(null); };

  const handleDayClick = async (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    
    // Toggle off if same date clicked
    if (selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr) {
      setSelectedDate(null);
      setDayDetail(null);
      return;
    }

    setSelectedDate(day);
    setDayDetailLoading(true);

    if (isGuest) {
      const meals = getGuestMealLogsForDate(dateStr);
      const summariesData = getGuestCycleSummariesForDate(dateStr);
      setDayDetail({ meals: meals || [], summaries: summariesData || [] });
      setDayDetailLoading(false);
    } else if (session?.user) {
      // Fetch meals for that day
      const { data: meals } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('eating_at', `${dateStr} 00:00:00`)
        .lte('eating_at', `${dateStr} 23:59:59`)
        .order('eating_at', { ascending: true });

      // Filter summaries loaded for the month locally to avoid timezone mismatch
      const summariesData = summaries.filter(s => {
        try {
          return formatKstDateOnly(parseKstToDate(s.cycle_start)) === dateStr;
        } catch (e) {
          return s.cycle_start.startsWith(dateStr);
        }
      }).sort((a, b) => a.cycle_start.localeCompare(b.cycle_start));

      setDayDetail({ meals: meals || [], summaries: summariesData || [] });
      setDayDetailLoading(false);
    }
  };

  const avgWeight = weightData.length > 0 
    ? (weightData.reduce((sum, d) => sum + d.weight, 0) / weightData.length).toFixed(1) 
    : null;

  const periods = [
    { key: '1w', label: '1주' },
    { key: '1m', label: '1개월' },
    { key: '3m', label: '3개월' },
    { key: '1y', label: '1년' },
    { key: 'all', label: '전체' },
    { key: 'custom', label: '직접 선택' },
  ];

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
      title="기록" 
      description="나의 간헐적 단식 기록과 체중 변화 추이를 캘린더와 차트로 한눈에 확인하세요." 
      url="/history" 
    />
    <div className="flex flex-col h-full bg-white w-full">
      <div className="p-4 md:p-8 flex-1">
        
        {/* Header with toggle */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-gray-900">기록</h2>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                viewMode === 'calendar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
              }`}
            >
              <CalendarIcon size={16} />
              월력
            </button>
            <button
              onClick={() => setViewMode('weight')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                viewMode === 'weight' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
              }`}
            >
              <TrendingDown size={16} />
              체중
            </button>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <>
            <div className="flex items-center justify-between mb-8 bg-gray-50 p-4 rounded-2xl">
              <button onClick={prevMonth} className="p-2 hover:bg-white rounded-xl transition-colors"><ChevronLeft /></button>
              <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CalendarIcon size={20} className="text-green-600" />
                {format(currentDate, 'yyyy년 M월', { locale: ko })}
              </div>
              <button onClick={nextMonth} className="p-2 hover:bg-white rounded-xl transition-colors"><ChevronRight /></button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4 text-center text-sm font-bold text-gray-400">
              <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square"></div>
                ))}
                
                {daysInMonth.map(day => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const daySummaries = summaries.filter(s => {
                    try {
                      return formatKstDateOnly(parseKstToDate(s.cycle_start)) === dayStr;
                    } catch (e) {
                      return s.cycle_start.startsWith(dayStr);
                    }
                  });
                  const isSelected = selectedDate && isSameDay(selectedDate, day);
                  const isTodayDate = isSameDay(new Date(), day);
                  const isFirstDay = firstLogDate && dayStr === firstLogDate;
                  
                  const isActiveCycleDay = activeCycleDate === dayStr;
                  const hasSummaries = daySummaries.length > 0;
                  const hasFailure = daySummaries.some(s => !s.is_success);
                  
                  // 1. 스타일 변수 초기화
                  let cellClass = 'border-2 border-gray-200 bg-white hover:border-gray-300';
                  
                  // 2. 조건별 스타일 할당 (선택 상태 및 실패 여부 반영)
                  if (isSelected) {
                    if (hasFailure) {
                      // 실패 항목이 있으면서 선택된 경우: 주황색 강조 스타일
                      cellClass = 'border-2 border-orange-500 scale-105 z-10 ring-2 ring-orange-200 bg-orange-50';
                    } else {
                      // 성공 혹은 일반 항목이면서 선택된 경우: 기존 초록색 강조 스타일
                      cellClass = 'border-2 border-green-500 scale-105 z-10 ring-2 ring-green-300 bg-green-50';
                    }
                  } else if (hasSummaries || isActiveCycleDay) {
                    if (hasFailure) {
                      cellClass = 'border-2 border-orange-200 bg-orange-50 hover:border-orange-400';
                    } else if (!hasSummaries && isActiveCycleDay) {
                      cellClass = 'border-2 border-gray-200 bg-gray-50 hover:border-gray-400';
                    } else {
                      cellClass = 'border-2 border-green-200 bg-green-50 hover:border-green-400';
                    }
                  }

                  return (
                    <div 
                      key={day.toString()} 
                      onClick={() => handleDayClick(day)}
                      className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl border cursor-pointer transition-all duration-150 ${cellClass}`}
                    >
                      {(isFirstDay || isTodayDate) && (
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 z-20 pointer-events-none">
                          {isTodayDate && (
                            <div className="bg-purple-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm tracking-tighter whitespace-nowrap">
                              TODAY
                            </div>
                          )}
                          {isFirstDay && (
                            <div className="bg-yellow-400 text-yellow-900 text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm tracking-tighter whitespace-nowrap">
                              START 🏁
                            </div>
                          )}
                        </div>
                      )}
                      {/* 3. 선택되었을 때 실패 여부에 따라 텍스트 색상 분기 */}
                      <span className={`text-sm font-bold ${
                        isSelected 
                          ? (hasFailure ? 'text-orange-700' : 'text-green-700') 
                          : isTodayDate ? 'text-purple-700' : 'text-gray-700'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      
                      {(hasSummaries || isActiveCycleDay) && (
                        <div className="flex gap-1 mt-1 justify-center">
                          {daySummaries.slice(0, 2).map((s, idx) => (
                            <div key={idx} className={`w-1.5 h-1.5 rounded-full ${s.is_success ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                          ))}
                          {isActiveCycleDay && (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse"></div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            {/* Day Detail Panel */}
            {selectedDate && (
              <div className="mt-6 bg-gray-50 rounded-2xl border border-gray-200 p-5 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-black text-gray-900">
                    📅 {format(selectedDate, 'M월 d일 (EEEE)', { locale: ko })}
                  </h3>
                  <button onClick={() => { setSelectedDate(null); setDayDetail(null); }} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                    <X size={18} className="text-gray-400" />
                  </button>
                </div>

                {dayDetailLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
                  </div>
                ) : dayDetail ? (
                  <div className="flex flex-col gap-4">
                    {(() => {
                      if (!dayDetail.meals || dayDetail.meals.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <UtensilsCrossed size={40} className="text-gray-300 mb-3" />
                            <p className="text-gray-400 font-bold text-sm">이 날에는 기록된 사이클이나 식단이 없습니다.</p>
                          </div>
                        );
                      }

                      // 1. 식사 시간 간격(8시간)을 기준으로 다이나믹하게 사이클 분리
                      const dynamicCycles = [];
                      let currentCycleMeals = [];
                      const EATING_WINDOW_HOURS = 8; // 기본값
                      
                      dayDetail.meals.forEach((meal) => {
                        if (currentCycleMeals.length === 0) {
                          currentCycleMeals.push(meal);
                        } else {
                          const firstMeal = currentCycleMeals[0];
                          const prevTime = parseKstToDate(firstMeal.eating_at).getTime();
                          const currTime = parseKstToDate(meal.eating_at).getTime();
                          const gapHours = (currTime - prevTime) / (1000 * 60 * 60);
                          
                          if (gapHours > EATING_WINDOW_HOURS) {
                            dynamicCycles.push([...currentCycleMeals]);
                            currentCycleMeals = [meal];
                          } else {
                            currentCycleMeals.push(meal);
                          }
                        }
                      });
                      if (currentCycleMeals.length > 0) {
                        dynamicCycles.push(currentCycleMeals);
                      }

                      // 2. 분리된 사이클과 DB 요약 정보 매칭
                      const cycleBlocks = dynamicCycles.map((meals, index) => {
                        const startIso = formatKst(parseKstToDate(meals[0].eating_at));
                        const matchingSummary = dayDetail.summaries?.find(s => s.cycle_start === startIso);
                        
                        const minWeight = meals.some(m => m.weight) 
                          ? Math.min(...meals.filter(m => m.weight).map(m => parseFloat(m.weight))) 
                          : null;

                        // DB 요약이 있거나 마지막 사이클이 아닌 경우 완료된 것으로 간주
                        const isCompleted = matchingSummary ? true : (index < dynamicCycles.length - 1);

                        return {
                          type: isCompleted ? 'completed' : 'active',
                          summary: matchingSummary || null,
                          meals: meals,
                          weight: minWeight,
                          fallbackStart: startIso
                        };
                      });
                      if (cycleBlocks.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <UtensilsCrossed size={40} className="text-gray-300 mb-3" />
                            <p className="text-gray-400 font-bold text-sm">이 날에는 기록된 사이클이나 식단이 없습니다.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col gap-5">
                          <div className="text-sm font-bold text-gray-500 flex items-center gap-1.5 px-1">
                            <CalendarIcon size={16} />
                            <span>단식 사이클 결과 ({cycleBlocks.length}건)</span>
                          </div>
                          
                          {cycleBlocks.map((block, index) => {
                            const isCompleted = block.type === 'completed';
                            const sum = block.summary;
                            
                            return (
                              <div key={index} className="flex flex-col rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
                                {/* Header */}
                                <div className={`flex items-center justify-between px-4 py-3 border-b ${isCompleted ? (sum ? (sum.is_success ? 'bg-green-50/50 border-green-100' : 'bg-orange-50/50 border-orange-100') : 'bg-gray-50 border-gray-100') : 'bg-gray-50 border-gray-100'}`}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-gray-500 bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
                                      {isCompleted ? `${(sum?.cycle_start || block.fallbackStart).slice(11, 16)} 시작` : '진행 중인 사이클'}
                                    </span>
                                  </div>
                                  
                                  {isCompleted ? (
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-full ${sum ? (sum.is_success ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800') : 'bg-gray-100 text-gray-600'}`}>
                                      {sum ? (sum.is_success ? '공복 성공 🎉' : '공복 미달') : '요약 데이터 없음'}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-black px-2 py-1 rounded-full bg-gray-200 text-gray-600">
                                      진행중
                                    </span>
                                  )}
                                </div>
                                
                                <div className="p-4 flex flex-col gap-4">
                                  {/* Fasting Hours */}
                                  {isCompleted && sum?.fasting_hours !== null && sum?.fasting_hours !== undefined && (
                                    <div className="flex items-center gap-2">
                                      {sum.is_success ? (
                                        <CheckCircle2 size={18} className="text-green-600" />
                                      ) : (
                                        <XCircle size={18} className="text-orange-600" />
                                      )}
                                      <span className="text-sm font-bold text-gray-800">
                                        직전 공복 달성: <span className="underline font-black">{sum.fasting_hours}시간</span>
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Weight */}
                                  {block.weight !== null && (
                                    <div className="flex items-center gap-2 text-blue-800 bg-blue-50 px-3 py-2 rounded-xl">
                                      <Scale size={16} />
                                      <span className="font-bold text-sm">체중: {block.weight}kg</span>
                                    </div>
                                  )}
                                  
                                  {/* Meals */}
                                  {block.meals.length > 0 && (
                                    <div>
                                      <div className="flex items-center gap-1.5 mb-2 text-gray-500">
                                        <UtensilsCrossed size={14} />
                                        <span className="text-xs font-bold text-gray-600">식단 기록 ({block.meals.length}건)</span>
                                      </div>
                                      <div className="flex flex-col gap-2">
                                        {block.meals.map((meal, i) => {
                                          const t = parseKstToDate(meal.eating_at);
                                          return (
                                            <div key={i} className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-start gap-3">
                                              <div className="pt-0.5 shrink-0">
                                                <span className="text-xs font-bold text-gray-500 bg-white shadow-sm px-1.5 py-0.5 rounded-md font-mono">
                                                  {t.getHours().toString().padStart(2,'0')}:{t.getMinutes().toString().padStart(2,'0')}
                                                </span>
                                              </div>
                                              <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-800 leading-tight">{meal.food_name}</span>
                                                {meal.amount && (
                                                  <span className="text-[11px] text-gray-500 font-medium mt-0.5">{meal.amount}</span>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* AI Feedback */}
                                  {isCompleted && !isGuest && (
                                    <div className="mt-1 bg-indigo-50/50 rounded-xl p-3 border border-indigo-50">
                                      <div className="flex items-center gap-1.5 mb-1.5 text-indigo-800 font-bold text-xs">
                                        <Sparkles size={14} className="text-indigo-500" />
                                        <span>AI 코치 피드백</span>
                                      </div>
                                      <p className="text-xs text-indigo-900 leading-relaxed whitespace-pre-wrap">
                                        {sum?.ai_feedback ? (sum.ai_feedback === '[GENERATING]' ? '피드백 생성 중입니다...' : sum.ai_feedback) : '피드백 데이터가 없습니다.'}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                ) : null}
              </div>
            )}
          </>
        )}

        {/* Weight Trend View */}
        {viewMode === 'weight' && (
          <>
            {/* Period Selector */}
            <div className="flex flex-wrap gap-2 mb-4">
              {periods.map(p => (
                <button
                  key={p.key}
                  onClick={() => setWeightPeriod(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                    weightPeriod === p.key 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Range */}
            {weightPeriod === 'custom' && (
              <div className="flex gap-2 items-center mb-4 bg-gray-50 p-3 rounded-xl">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 flex-1"
                />
                <span className="text-gray-400 text-sm font-bold">~</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 flex-1"
                />
              </div>
            )}

            {/* Chart */}
            {weightData.length > 0 ? (
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                {/* Summary Stats */}
                <div className="flex gap-4 mb-4">
                  <div className="bg-white rounded-xl px-4 py-3 flex-1 text-center shadow-sm">
                    <div className="text-xs text-gray-400 font-bold">최저</div>
                    <div className="text-lg font-black text-green-600">
                      {Math.min(...weightData.map(d => d.weight)).toFixed(1)}kg
                    </div>
                  </div>
                  <div className="bg-white rounded-xl px-4 py-3 flex-1 text-center shadow-sm">
                    <div className="text-xs text-gray-400 font-bold">평균</div>
                    <div className="text-lg font-black text-gray-900">{avgWeight}kg</div>
                  </div>
                  <div className="bg-white rounded-xl px-4 py-3 flex-1 text-center shadow-sm">
                    <div className="text-xs text-gray-400 font-bold">최고</div>
                    <div className="text-lg font-black text-orange-500">
                      {Math.max(...weightData.map(d => d.weight)).toFixed(1)}kg
                    </div>
                  </div>
                </div>

                {/* Line Chart */}
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={weightData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 11, fill: '#999' }} 
                      tickLine={false}
                      axisLine={{ stroke: '#e5e5e5' }}
                    />
                    <YAxis 
                      domain={['dataMin - 1', 'dataMax + 1']}
                      tick={{ fontSize: 11, fill: '#999' }}
                      tickLine={false}
                      axisLine={false}
                      unit="kg"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        fontSize: '13px',
                        fontWeight: 'bold',
                      }}
                      formatter={(value) => [`${value}kg`, '체중']}
                      labelFormatter={(label) => `📅 ${label}`}
                    />
                    {avgWeight && (
                      <ReferenceLine 
                        y={parseFloat(avgWeight)} 
                        stroke="#9ca3af" 
                        strokeDasharray="4 4" 
                        label={{ value: `평균 ${avgWeight}kg`, position: 'right', fontSize: 10, fill: '#9ca3af' }}
                      />
                    )}
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#10b981" 
                      strokeWidth={2.5}
                      dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Explanation */}
                <p className="text-xs text-gray-400 mt-3 text-center leading-relaxed">
                  ※ 하루에 체중이 여러 번 기록된 경우, 해당일의 <strong>최저 체중</strong>만 그래프에 반영됩니다.
                  <br />체중은 식단 기록 시 선택적으로 입력한 값을 기준으로 합니다.
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-10 border border-gray-100 text-center">
                <BarChart3 size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 font-bold">체중 기록이 없습니다</p>
                <p className="text-sm text-gray-400 mt-1">식단 기록 시 체중을 함께 입력하면 추이를 볼 수 있습니다.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}
