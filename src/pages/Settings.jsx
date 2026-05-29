import { useState, useEffect } from 'react';
import { LogOut, Trash2, Clock, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';
import { differenceInHours, addHours, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { 
  getGuestProfile, 
  upsertGuestProfile, 
  resetGuestData 
} from '../lib/guestStorage';

export default function Settings({ session, isGuest, onGuestEnd }) {
  const [eatingWindow, setEatingWindow] = useState(8);
  const [canUpdate, setCanUpdate] = useState(true);
  const [nextUpdateTime, setNextUpdateTime] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      setIsInitializing(true);
      if (isGuest) {
        const profile = getGuestProfile() || { eating_window: 8 };
        setEatingWindow(profile.eating_window);
        if (profile.last_window_update) {
          const lastTime = new Date(profile.last_window_update);
          const hoursSince = differenceInHours(new Date(), lastTime);
          if (hoursSince < 24) {
            setCanUpdate(false);
            setNextUpdateTime(addHours(lastTime, 24));
          }
        }
      } else if (session?.user) {
        const { data } = await supabase.from('users_profile').select('*').eq('id', session.user.id).single();
        if (data) {
          setEatingWindow(data.eating_window);
          if (data.last_window_update) {
            const lastTime = new Date(data.last_window_update);
            const hoursSince = differenceInHours(new Date(), lastTime);
            if (hoursSince < 24) {
              setCanUpdate(false);
              setNextUpdateTime(addHours(lastTime, 24));
            }
          }
        }
      }
      setIsInitializing(false);
    }
    loadProfile();
  }, [session, isGuest]);

  const handleEatingWindowChange = async (e) => {
    if (!window.confirm("식사 가능 시간을 변경하시겠습니까? 한 번 변경하면 24시간 동안 다시 변경할 수 없습니다.\n(단식이 리듬을 잃지 않도록 잦은 변경을 제한하고 있습니다.)")) {
      return;
    }
    
    const newVal = Number(e.target.value);
    const now = new Date().toISOString();
    
    if (isGuest) {
      upsertGuestProfile({ 
        eating_window: newVal,
        last_window_update: now
      });
      setEatingWindow(newVal);
      setCanUpdate(false);
      setNextUpdateTime(addHours(new Date(now), 24));
    } else {
      // DB 업데이트
      const { error } = await supabase.from('users_profile').update({ 
        eating_window: newVal,
        last_window_update: now
      }).eq('id', session.user.id);

      if (!error) {
        setEatingWindow(newVal);
        setCanUpdate(false);
        setNextUpdateTime(addHours(new Date(now), 24));
      } else {
        alert("업데이트 중 오류가 발생했습니다. (last_window_update 컬럼 추가가 필요할 수 있습니다)");
      }
    }
  };

  const handleLogout = async () => {
    if (isGuest) {
      if (window.confirm("게스트 모드를 종료하시겠습니까? 종료하시면 현재 브라우저에 임시 저장된 모든 기록이 삭제되며 복구할 수 없습니다.")) {
        onGuestEnd();
        alert("게스트 세션이 종료되었습니다.");
      }
    } else {
      if (window.confirm("정말 로그아웃 하시겠습니까?")) {
        await supabase.auth.signOut();
        alert("로그아웃 되었습니다.");
      }
    }
  };

  const handleReset = async () => {
    if(window.confirm("정말 모든 기록을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      if (isGuest) {
        resetGuestData();
        alert("모든 로컬 기록이 초기화되었습니다.");
      } else {
        const { error: mealError } = await supabase.from('meal_logs').delete().eq('user_id', session.user.id);
        const { error: sumError } = await supabase.from('daily_summaries').delete().eq('user_id', session.user.id);
        
        if (!mealError && !sumError) {
          alert("모든 기록이 초기화되었습니다.");
        } else {
          alert("초기화 중 오류가 발생했습니다.");
        }
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
      title="설정" 
      description="간헐적 단식 목표 시간을 설정하고 내 데이터를 관리하세요." 
      url="/settings" 
    />
    <div className="flex flex-col h-full bg-white w-full">
      <div className="p-4 md:p-8 flex-1">
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
                <label htmlFor="eatingWindowSelect" className="block">
                  <div className="font-bold text-gray-900">식사 가능 시간</div>
                  <div className="text-xs text-gray-500">현재 {eatingWindow}시간 (공복 {24 - eatingWindow}시간)</div>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  id="eatingWindowSelect"
                  name="eatingWindowSelect"
                  value={eatingWindow} 
                  onChange={handleEatingWindowChange}
                  disabled={!canUpdate}
                  className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >                  
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1}시간</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* 경고/안내 메시지 */}
            <div className={`text-xs px-3 py-2 rounded-lg flex items-start gap-2 ${!canUpdate ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <p>
                {!canUpdate && nextUpdateTime ? (
                  <>
                    <span className="font-bold">변경 제한 중:</span> 잦은 식사 시간 변경은 신체 대사 리듬과 AI 분석 결과에 혼란을 줄 수 있어 하루 1회로 제한됩니다.<br />
                    (다음 변경 가능 시간: <span className="font-bold">{format(nextUpdateTime, 'M월 d일 HH:mm', { locale: ko })}</span>)
                  </>
                ) : (
                  <>
                    <span className="font-bold">주의:</span> 잦은 식사 시간 변경은 신체 대사 리듬과 AI 분석에 영향을 줄 수 있어 <span className="font-bold text-gray-700">하루 1회만 변경</span>할 수 있습니다.
                  </>
                )}
              </p>
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
                <LogOut size={20} className="text-gray-500" />
                <span className="font-bold">{isGuest ? '게스트 세션 종료 및 기록 삭제' : '로그아웃'}</span>
              </div>
              <ChevronRight size={20} className="opacity-50" />
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
