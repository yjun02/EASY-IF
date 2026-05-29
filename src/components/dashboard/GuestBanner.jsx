import React from 'react';
import { AlertCircle, LogIn } from 'lucide-react';

export default function GuestBanner({ onLogin }) {
  return (
    <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h4 className="font-bold text-amber-900 flex items-center gap-2 text-sm md:text-base">
          <AlertCircle size={18} className="shrink-0" />
          현재 게스트 모드로 이용 중입니다
        </h4>
        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
          데이터가 기기에만 저장됩니다. 구글 로그인을 하시면 기기간 연동과 AI 간단 전문가 가이드(피드백)를 무료로 이용할 수 있습니다.
        </p>
      </div>
      <button 
        onClick={onLogin}
        className="bg-gray-900 text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 self-start md:self-auto shrink-0 shadow-sm"
      >
        <LogIn size={16} />
        구글 로그인
      </button>
    </div>
  );
}
