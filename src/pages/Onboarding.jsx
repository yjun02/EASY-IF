import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { upsertGuestProfile } from '../lib/guestStorage';
import { AlertCircle, BookOpen, ChevronRight, Info } from 'lucide-react';

export default function Onboarding({ session, onGuestStart }) {
  const [eatingWindow, setEatingWindow] = useState(8);
  const [loading, setLoading] = useState(false);
  const [showGuestWarning, setShowGuestWarning] = useState(false);
  const navigate = useNavigate();

  // If already logged in, go to dashboard
  if (session) {
    return <Navigate to="/" replace />;
  }

  const handleStart = async () => {
    setLoading(true);
    // User will be redirected, but before they are, we can stash the eatingWindow preference
    // actually, best way is to save it after login or during sign up in a trigger.
    // For now we'll just save it to local storage to be read after redirect.
    localStorage.setItem('preferredEatingWindow', eatingWindow.toString());

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });

    if (error) {
      console.error('Error logging in:', error.message);
      alert('로그인에 실패했습니다.');
      setLoading(false);
    }
  };

  const handleGuestConfirm = () => {
    upsertGuestProfile({ eating_window: eatingWindow });
    onGuestStart();
    navigate('/');
  };

  return (
    <div className="h-full flex flex-col justify-center px-4 md:px-6 py-6 md:py-12 max-w-[390px] mx-auto md:max-w-md w-full flex-1">
      <div className="flex-1 flex flex-col justify-center">
        {/* Hide title on mobile since Layout header shows it */}
        <div className="hidden md:block mb-10 text-center">
          <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">간단하게 간단하자</h1>
          <p className="text-gray-500 font-medium">간단한 간헐적 단식 도우미</p>
        </div>

        <div className="bg-gray-50 p-4 md:p-6 rounded-3xl border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">하루에 몇 시간 동안 식사하시겠어요?</h2>
          
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center">
              <div className="text-6xl font-black text-green-500 font-mono drop-shadow-sm">
                {eatingWindow}<span className="text-2xl text-gray-400 ml-1 font-sans font-bold drop-shadow-none">시간</span>
              </div>
              <div className="mt-2 bg-green-100 text-green-800 text-sm font-black px-4 py-1.5 rounded-full shadow-sm">
                {24 - eatingWindow}:{eatingWindow} 간단
              </div>
            </div>
            
            <div className="w-full px-2 relative mt-2">
              <input 
                type="range" 
                min="1" 
                max="12" 
                value={eatingWindow}
                onChange={(e) => setEatingWindow(parseInt(e.target.value))}
                className="w-full h-4 rounded-full appearance-none cursor-pointer outline-none transition-all slider-thumb-premium"
                style={{
                  background: `linear-gradient(to right, #22c55e 0%, #22c55e ${(eatingWindow - 1) / 11 * 100}%, #e5e7eb ${(eatingWindow - 1) / 11 * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1 font-bold tracking-wider">
                <span>1시간</span>
                <span>6시간</span>
                <span>12시간</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-500 text-center bg-white px-5 py-3.5 rounded-2xl border border-gray-100 shadow-sm w-full flex justify-between items-center">
              <span className="font-medium">목표 공복 시간</span>
              <span className="font-black text-gray-900 text-base bg-gray-50 px-3 py-1 rounded-lg">{24 - eatingWindow}시간</span>
            </div>
          </div>
        </div>

        <button 
          onClick={handleStart}
          disabled={loading}
          className="w-full bg-gray-900 text-white font-bold text-lg py-4 rounded-2xl mt-8 hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 disabled:opacity-50"
        >
          {loading ? '연결 중...' : '구글 계정으로 시작하기'}
        </button>

        <button 
          onClick={() => setShowGuestWarning(true)}
          className="w-full bg-white text-gray-600 font-bold text-base py-3.5 rounded-2xl mt-3 hover:bg-gray-50 transition-colors border border-gray-200"
        >
          게스트로 시작하기
        </button>

        <Link 
          to="/about" 
          className="mt-8 bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-green-100/60 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-sm text-green-600 shrink-0">
              <Info size={20} />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-gray-800">이 서비스가 궁금하신가요?</div>
              <div className="text-xs text-gray-500 mt-0.5 font-medium">사용 가이드와 서비스 소개 확인하기</div>
            </div>
          </div>
          <ChevronRight size={18} className="text-green-600/70 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </Link>

        <p className="text-xs text-center text-gray-400 mt-4">가입 시 서비스 이용약관에 동의하게 됩니다.</p>
      </div>

      {/* Guest Warning Modal */}
      {showGuestWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-100 p-2 rounded-xl">
                <AlertCircle size={24} className="text-amber-600" />
              </div>
              <h3 className="font-black text-gray-900 text-lg">게스트 모드 안내</h3>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-sm text-amber-900 leading-relaxed font-medium">
                  게스트 모드에서는 모든 데이터가 <strong>현재 브라우저의 로컬 저장소</strong>에만 저장됩니다.
                </p>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 px-1">
                <li className="flex gap-2">
                  <span className="text-red-400 font-bold shrink-0">✕</span>
                  <span>다른 기기에서 데이터 연동 불가</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-400 font-bold shrink-0">✕</span>
                  <span>AI 간단 전문가 피드백 이용 불가</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-400 font-bold shrink-0">✕</span>
                  <span>브라우저 데이터 삭제 시 기록 영구 소실</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={handleGuestConfirm}
                className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors"
              >
                이해했어요, 게스트로 시작
              </button>
              <button 
                onClick={() => setShowGuestWarning(false)}
                className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
