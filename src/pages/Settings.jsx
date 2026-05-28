import { useState, useEffect } from 'react';
import { LogOut, Trash2, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Settings({ session }) {
  const [eatingWindow, setEatingWindow] = useState(8);

  useEffect(() => {
    async function loadProfile() {
      if (session?.user) {
        const { data } = await supabase.from('users_profile').select('eating_window').eq('id', session.user.id).single();
        if (data) setEatingWindow(data.eating_window);
      }
    }
    loadProfile();
  }, [session]);

  const handleEatingWindowChange = async (e) => {
    const newVal = Number(e.target.value);
    setEatingWindow(newVal);
    await supabase.from('users_profile').update({ eating_window: newVal }).eq('id', session.user.id);
  };
  const handleLogout = async () => {
    if (window.confirm("정말 로그아웃 하시겠습니까?")) {
      await supabase.auth.signOut();
      alert("로그아웃 되었습니다.");
    }
  };

  const handleReset = async () => {
    if(window.confirm("정말 모든 기록을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      const { error: mealError } = await supabase.from('meal_logs').delete().eq('user_id', session.user.id);
      const { error: sumError } = await supabase.from('daily_summaries').delete().eq('user_id', session.user.id);
      
      if (!mealError && !sumError) {
        alert("모든 기록이 초기화되었습니다.");
      } else {
        alert("초기화 중 오류가 발생했습니다.");
      }
    }
  };
  return (
    <div className="flex flex-col h-full bg-white md:bg-gray-50 p-4 md:p-6">
      <div className="max-w-2xl w-full mx-auto md:bg-white md:rounded-3xl md:shadow-sm md:p-8 md:min-h-[80vh]">
        <h2 className="text-2xl font-black text-gray-900 mb-8">설정</h2>
        
        {/* Profile / Goal Setting */}
        <div className="mb-10">
          <h3 className="text-sm font-bold text-gray-500 mb-3 px-1">식사 목표 설정</h3>
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-xl shadow-sm">
                  <Clock size={20} className="text-green-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">식사 가능 시간</div>
                  <div className="text-xs text-gray-500">현재 {eatingWindow}시간 (공복 {24 - eatingWindow}시간)</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={eatingWindow} 
                  onChange={handleEatingWindowChange}
                  className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                >                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1}시간</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mb-10">
          <h3 className="text-sm font-bold text-gray-500 mb-3 px-1">데이터 관리</h3>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <button 
              onClick={handleReset}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-200 text-red-600"
            >
              <div className="flex items-center gap-3">
                <Trash2 size={20} />
                <span className="font-bold">모든 기록 초기화</span>
              </div>
              <ChevronRight size={20} className="opacity-50" />
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-gray-700"
            >
              <div className="flex items-center gap-3">
                <LogOut size={20} />
                <span className="font-bold">로그아웃</span>
              </div>
              <ChevronRight size={20} className="opacity-50" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
