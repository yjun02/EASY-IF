import { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, TrendingDown, BarChart3, Loader2, CheckCircle2, XCircle, Sparkles, Scale, UtensilsCrossed, X } from 'lucide-react';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subDays, subMonths, subYears } from 'date-fns';
import { ko } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { 
  getAllGuestMealLogs, 
  getGuestSummariesForMonth, 
  getGuestWeightData, 
  getGuestMealLogsForDate, 
  getGuestSummaryForDate 
} from '../lib/guestStorage';

export default function History({ session, isGuest }) {
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'weight'
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
          const sorted = allLogs.sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at));
          setFirstLogDate(format(new Date(sorted[0].logged_at), 'yyyy-MM-dd'));
        }
      } else if (session?.user) {
        const { data: firstMealData } = await supabase
          .from('meal_logs')
          .select('logged_at')
          .eq('user_id', session.user.id)
          .order('logged_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (firstMealData) {
          setFirstLogDate(format(new Date(firstMealData.logged_at), 'yyyy-MM-dd'));
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
      const data = getGuestSummariesForMonth(year, month);
      setSummaries(data);
      if (autoSelect) {
        const today = new Date();
        setTimeout(() => handleDayClick(today), 0);
      }
    } else if (session?.user) {
      const { data } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('date', start)
        .lte('date', end);
        
      if (data) {
        setSummaries(data);
        // Auto-select today
        if (autoSelect) {
          const today = new Date();
          setTimeout(() => handleDayClick(today), 0);
        }
      }
    }
  };

  const loadWeightData = async () => {
    const { startDate } = getDateRange();
    let data = [];
    
    if (isGuest) {
      const allWeights = getGuestWeightData();
      if (startDate) {
        const limitDate = new Date(startDate);
        data = allWeights.filter(w => new Date(w.logged_at) >= limitDate);
      } else {
        data = allWeights;
      }
    } else if (session?.user) {
      // meal_logs에서 체중이 기록된 행만 가져오기
      let query = supabase
        .from('meal_logs')
        .select('logged_at, weight')
        .eq('user_id', session.user.id)
        .not('weight', 'is', null)
        .order('logged_at', { ascending: true });

      if (startDate) {
        query = query.gte('logged_at', startDate);
      }

      const { data: dbData } = await query;
      data = dbData || [];
    }
    
    if (data && data.length > 0) {
      // 날짜별 최저 체중만 추출
      const dailyMin = {};
      data.forEach(log => {
        const dateKey = format(new Date(log.logged_at), 'yyyy-MM-dd');
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
      const summary = getGuestSummaryForDate(dateStr);
      setDayDetail({ meals: meals || [], summary });
      setDayDetailLoading(false);
    } else if (session?.user) {
      // Fetch meals for that day
      const { data: meals } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('logged_at', `${dateStr}T00:00:00+09:00`)
        .lt('logged_at', `${dateStr}T23:59:59+09:00`)
        .order('logged_at', { ascending: true });

      // Fetch summary for that day
      const { data: summary } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('date', dateStr)
        .maybeSingle();

      setDayDetail({ meals: meals || [], summary });
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
                const summary = summaries.find(s => isSameDay(new Date(s.date), day));
                const isSelected = selectedDate && isSameDay(selectedDate, day);
                const isTodayDate = isSameDay(new Date(), day);
                const isFirstDay = firstLogDate && dayStr === firstLogDate;
                
                return (
                  <div 
                    key={day.toString()} 
                    onClick={() => handleDayClick(day)}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl border cursor-pointer transition-all duration-150 ${
                      isSelected ? 'border-green-500 bg-green-50 scale-105 z-10 ring-2 ring-green-300' :
                      summary ? (summary.is_success ? 'border-green-200 bg-green-50 hover:border-green-300' : 'border-red-200 bg-red-50 hover:border-red-300') : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
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
                    <span className={`text-sm font-bold ${isSelected ? 'text-green-700' : isTodayDate ? 'text-purple-700' : 'text-gray-700'}`}>{format(day, 'd')}</span>
                    {summary && (
                      <div className={`w-2 h-2 rounded-full mt-1 ${summary.is_success ? 'bg-green-500' : 'bg-red-500'}`}></div>
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
                    {/* Fasting Status */}
                    {dayDetail.summary ? (
                      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                        dayDetail.summary.is_success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {dayDetail.summary.is_success 
                          ? <CheckCircle2 size={20} /> 
                          : <XCircle size={20} />
                        }
                        <span className="font-bold text-sm">
                          {dayDetail.summary.is_success ? '공복 목표 달성! 🎉' : '공복 목표 미달성'}
                          {dayDetail.summary.actual_fasting_hours != null && 
                            ` (실제 공복: ${dayDetail.summary.actual_fasting_hours}시간)`
                          }
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-100 text-gray-500">
                        <CalendarIcon size={20} />
                        <span className="font-bold text-sm">이 날에는 기록된 요약이 없습니다.</span>
                      </div>
                    )}

                    {/* Weight */}
                    {dayDetail.meals.some(m => m.weight) ? (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-blue-800">
                        <Scale size={20} />
                        <span className="font-bold text-sm">
                          체중: {Math.min(...dayDetail.meals.filter(m => m.weight).map(m => parseFloat(m.weight)))}kg
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-100 text-gray-500">
                        <Scale size={20} />
                        <span className="font-bold text-sm">이 날은 체중이 기록되지 않았습니다.</span>
                      </div>
                    )}

                    {/* Meals */}
                    {dayDetail.meals.length > 0 ? (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <UtensilsCrossed size={16} className="text-gray-500" />
                          <span className="text-sm font-bold text-gray-700">식단 기록 ({dayDetail.meals.length}건)</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {dayDetail.meals.map((meal, i) => {
                            const t = new Date(meal.logged_at);
                            return (
                              <div key={i} className="bg-white rounded-xl px-4 py-3 flex items-start gap-3 border border-gray-100">
                                <div className="pt-0.5 shrink-0">
                                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg font-mono">
                                    {t.getHours().toString().padStart(2,'0')}:{t.getMinutes().toString().padStart(2,'0')}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm font-bold text-gray-800 leading-tight">{meal.food_name}</span>
                                  {meal.amount && (
                                    <span className="text-xs text-gray-500 font-medium">{meal.amount}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-4 font-medium">이 날에는 식단 기록이 없습니다.</p>
                    )}

                    {/* AI Feedback (게스트 모드에서는 AI 피드백 미노출) */}
                    {!isGuest && dayDetail.summary?.ai_feedback && (
                      <div className="bg-indigo-50 rounded-xl px-4 py-4 border border-indigo-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={16} className="text-indigo-500" />
                          <span className="text-sm font-bold text-indigo-800">AI 간단 전문가의 피드백</span>
                        </div>
                        <p className="text-sm text-indigo-900 leading-relaxed whitespace-pre-wrap">{dayDetail.summary.ai_feedback}</p>
                      </div>
                    )}
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
                    <div className="text-lg font-black text-red-500">
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
