import { Link } from 'react-router-dom';
import { Clock, Utensils, BarChart3, Sparkles, ArrowRight, BookOpen, Timer, Target } from 'lucide-react';

export default function About() {
  return (
    <div className="flex flex-col h-full bg-white md:bg-gray-50 p-4 md:p-6 max-w-3xl mx-auto">
      <div className="md:bg-white md:rounded-3xl md:shadow-sm md:p-8 flex-1">

        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-bold px-4 py-2 rounded-full mb-4">
            <Timer size={16} />
            간헐적 단식 도우미
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
            간단하게 간단하자
          </h1>
          <p className="text-gray-500 text-base md:text-lg leading-relaxed max-w-lg mx-auto">
            복잡한 칼로리 계산은 그만. <br className="md:hidden" />
            <strong className="text-gray-700">먹은 것을 기록하고, 정해진 시간만 지키세요.</strong><br />
            나머지는 우리가 도와드립니다.
          </p>
        </div>

        {/* What is this? */}
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-black text-gray-900 mb-3">이 서비스는 무엇인가요?</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            <strong className="text-gray-800">'간단하게 간단하자'</strong>는 간헐적 단식(Intermittent Fasting)을 쉽고 꾸준하게 실천할 수 있도록 도와주는 웹 서비스입니다. 
            하루 중 식사 가능한 시간을 설정하고, 먹은 음식을 간단히 기록하면 실시간 타이머와 AI 피드백이 여러분의 건강한 루틴을 함께 관리해 드립니다.
          </p>
        </div>

        {/* Features */}
        <div className="mb-8">
          <h2 className="text-lg font-black text-gray-900 mb-4">주요 기능</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="bg-green-50 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                <Clock size={20} className="text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">실시간 타이머</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                현재 공복 시간과 식사 가능 시간을 실시간으로 표시합니다. 한눈에 지금 무엇을 해야 하는지 알 수 있어요.
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                <Utensils size={20} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">간편 식단 기록</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                복잡한 칼로리 계산 없이, 먹은 음식 이름만 간단히 적으면 됩니다. 체중도 선택적으로 기록할 수 있어요.
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="bg-purple-50 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                <Sparkles size={20} className="text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">AI 간단 전문가</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                하루 식사 사이클이 끝나면 AI가 식단을 분석하고 맞춤형 피드백을 제공합니다.
                <span className="text-xs text-purple-500 font-bold ml-1">(구글 로그인 전용)</span>
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="bg-orange-50 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                <BarChart3 size={20} className="text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">기록 & 체중 추이</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                캘린더로 공복 달성 여부를 한눈에 파악하고, 체중 변화 그래프로 성과를 추적합니다.
              </p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            <Target size={20} className="text-green-600" />
            간헐적 단식이 뭔가요?
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            간헐적 단식은 하루 중 <strong>정해진 시간에만 음식을 섭취</strong>하고, 나머지 시간은 공복을 유지하는 식사법입니다. 
            예를 들어 16:8 패턴이라면 16시간 공복 후 8시간 동안 식사하는 방식이에요.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            공복 상태가 일정 시간 지속되면 인슐린 수치가 낮아지고, 몸은 저장된 체지방을 에너지로 사용하기 시작합니다. 
            복잡한 칼로리 계산 없이 <strong>'시간'만 지키면 되는</strong> 단순함이 가장 큰 장점입니다.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 mb-6">
          <Link 
            to="/onboarding" 
            className="w-full bg-gray-900 text-white font-bold text-lg py-4 rounded-2xl text-center hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
          >
            지금 시작하기
            <ArrowRight size={20} />
          </Link>
          <Link 
            to="/guide" 
            className="w-full bg-white text-gray-600 font-bold text-base py-3.5 rounded-2xl text-center hover:bg-gray-50 transition-colors border border-gray-200 flex items-center justify-center gap-2"
          >
            <BookOpen size={18} />
            가이드 읽어보기
          </Link>
        </div>

      </div>
    </div>
  );
}
