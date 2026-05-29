import React from 'react';
import { Sparkles, Loader2, AlertCircle, RefreshCw, LogIn } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function AiFeedbackCard({ 
  isGuest, 
  appState, 
  feedbackStatus, 
  feedbackText, 
  feedbackError, 
  previousFeedback, 
  onLogin, 
  onRetry 
}) {
  // State C에서 주로 표시
  if (appState === 'C') {
    if (isGuest) {
      return (
        <div className="rounded-3xl p-6 shadow-sm border bg-gray-50 border-gray-200 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-gray-400" />
            <h3 className="font-bold text-gray-700">AI 간단 전문가 피드백</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            현재 게스트 모드에서는 AI 피드백을 제공하지 않습니다. 구글 로그인을 완료하시면 매일 드신 식단을 건강 코치처럼 정밀 분석하여 맞춤 가이드를 무료로 제공해 드립니다!
          </p>
          <button 
            onClick={onLogin}
            className="bg-gray-900 text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-1.5 self-start shadow-sm"
          >
            <LogIn size={14} />
            로그인하고 AI 피드백 받기
          </button>
        </div>
      );
    }

    if (feedbackStatus !== 'idle') {
      return (
        <div className={`rounded-3xl p-6 shadow-sm border transition-all duration-500 animate-fade-in ${
          feedbackStatus === 'loading' ? 'bg-violet-50 border-violet-100' :
          feedbackStatus === 'error' ? 'bg-red-50 border-red-100' :
          'bg-indigo-50 border-indigo-100'
        }`}>
          {/* Loading State */}
          {feedbackStatus === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="relative">
                <Sparkles size={28} className="text-violet-500 animate-pulse" />
                <Loader2 size={16} className="text-violet-400 animate-spin absolute -bottom-1 -right-1" />
              </div>
              <div className="text-center">
                <p className="font-bold text-violet-900">AI 간단 전문가가 오늘의 식단을 진단하는 중...</p>
                <p className="text-sm text-violet-600 mt-1">식사 패턴과 영양 균형을 분석하고 있습니다</p>
              </div>
              <div className="flex gap-1 mt-2">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}

          {/* Success State */}
          {feedbackStatus === 'success' && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-indigo-600" />
                <h3 className="font-bold text-indigo-900">오늘의 AI 간단 전문가 피드백</h3>
              </div>
              <p className="text-sm text-indigo-950 leading-relaxed whitespace-pre-wrap">
                {feedbackText}
              </p>
            </>
          )}

          {/* Error State */}
          {feedbackStatus === 'error' && (
            <div className="flex flex-col items-center gap-3 py-2">
              <AlertCircle size={24} className="text-red-500" />
              <div className="text-center">
                <p className="font-bold text-red-900">AI 진단에 실패했습니다</p>
                <p className="text-sm text-red-600 mt-1 break-all">{feedbackError}</p>
              </div>
              <button 
                onClick={onRetry}
                className="flex items-center gap-2 bg-red-100 text-red-700 font-bold text-sm px-4 py-2 rounded-xl hover:bg-red-200 transition-colors mt-1"
              >
                <RefreshCw size={14} />
                다시 시도
              </button>
            </div>
          )}
        </div>
      );
    }
  }

  // State A/B에서 표시 (이전 피드백 보기 - 게스트 제외)
  if (!isGuest && appState !== 'C' && previousFeedback) {
    return (
      <div className="rounded-3xl p-6 shadow-sm border bg-indigo-50 border-indigo-100 transition-all duration-500 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-indigo-600" />
          <h3 className="font-bold text-indigo-900">
            이전 AI 간단 전문가 피드백 <span className="text-xs font-normal text-indigo-600 ml-1">({format(new Date(previousFeedback.date), 'M월 d일', { locale: ko })})</span>
          </h3>
        </div>
        <p className="text-sm text-indigo-950 leading-relaxed whitespace-pre-wrap">
          {previousFeedback.text}
        </p>
      </div>
    );
  }

  return null;
}
