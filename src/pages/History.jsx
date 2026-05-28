import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, TrendingDown, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subDays, subMonths, subYears } from 'date-fns';
import { ko } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function History({ session }) {
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'weight'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [summaries, setSummaries] = useState([]);

  // Weight graph state
  const [weightData, setWeightData] = useState([]);
  const [weightPeriod, setWeightPeriod] = useState('1m');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Calendar data loading
  useEffect(() => {
    if (viewMode === 'calendar') {
      loadCalendarData();
    }
  }, [currentDate, session, viewMode]);

  // Weight data loading
  useEffect(() => {
    if (viewMode === 'weight') {
      loadWeightData();
    }
  }, [weightPeriod, customStart, customEnd, session, viewMode]);

  const loadCalendarData = async () => {
    const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');
    
    const { data } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('date', start)
      .lte('date', end);
      
    if (data) setSummaries(data);
  };

  const loadWeightData = async () => {
    const { startDate } = getDateRange();
    
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

    const { data } = await query;
    
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

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

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

  return (
    <div className="flex flex-col h-full bg-white md:bg-gray-50 p-4 md:p-6 max-w-3xl mx-auto">
      <div className="md:bg-white md:rounded-3xl md:shadow-sm md:p-8 flex-1">
        
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
                const summary = summaries.find(s => isSameDay(new Date(s.date), day));
                return (
                  <div 
                    key={day.toString()} 
                    className={`aspect-square flex flex-col items-center justify-center rounded-2xl border ${
                      summary ? (summary.is_success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50') : 'border-gray-100 bg-white'
                    }`}
                  >
                    <span className="text-sm font-bold text-gray-700">{format(day, 'd')}</span>
                    {summary && (
                      <div className={`w-2 h-2 rounded-full mt-1 ${summary.is_success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    )}
                  </div>
                );
              })}
            </div>
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
  );
}
