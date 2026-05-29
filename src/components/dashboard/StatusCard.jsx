import React from 'react';
import { Clock } from 'lucide-react';

export default function StatusCard({ appState, timerDisplay, prevFastingResult, targetFasting }) {
  return (
    <div className={`rounded-3xl p-6 shadow-sm border transition-colors duration-500 ${
      appState === 'B' ? 'bg-green-50 border-green-100 text-green-900' : 
      appState === 'C' ? 'bg-red-50 border-red-100 text-red-900' : 
      'bg-emerald-500 border-emerald-600 text-white'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-bold opacity-80">
          {appState === 'A' ? '목표 공복 시간까지' : 
           appState === 'B' ? (
             prevFastingResult 
               ? (prevFastingResult.success 
                   ? `지난 공복 ${prevFastingResult.hours}시간 달성 👏 현재 식사 가능` 
                   : `지난 공복 ${prevFastingResult.hours}시간 😢 (목표 미달)`)
               : `식사 가능 시간`
           ) : 
           timerDisplay.startsWith('+') ? '공복 목표 초과 달성! 👏' : '공복 목표 달성까지'}
        </span>
        <Clock size={24} className="opacity-80" />
      </div>
      
      <div className="text-4xl md:text-6xl font-black tracking-tight font-mono mb-2">
        {timerDisplay}
      </div>
      <p className="text-sm font-medium opacity-80">
        {appState === 'A' ? '오늘 첫 식사를 등록하세요' : 
         appState === 'B' ? (prevFastingResult && !prevFastingResult.success ? '다음엔 더 길게 도전해보세요! (남은 식사 가능 시간)' : '남은 식사 가능 시간') : 
         timerDisplay.startsWith('+') ? '대단해요! 목표 시간을 넘겼습니다' : '다음 공복 목표를 위해 물을 충분히 드세요'}
      </p>
    </div>
  );
}
