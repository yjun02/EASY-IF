import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Onboarding({ session }) {
  const [eatingWindow, setEatingWindow] = useState(8);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-6 py-12 max-w-[390px] mx-auto md:max-w-md">
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">간단하게 간단하자</h1>
          <p className="text-gray-500 font-medium">간단한 간헐적 단식 도우미</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
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
        <p className="text-xs text-center text-gray-400 mt-4">가입 시 서비스 이용약관에 동의하게 됩니다.</p>
      </div>
    </div>
  );
}
