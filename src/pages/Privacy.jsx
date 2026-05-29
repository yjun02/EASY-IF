import React from 'react';
import SEO from '../components/SEO';

export default function Privacy() {
  return (
    <>
    <SEO title="개인정보처리방침" url="/privacy" />
    <div className="flex flex-col h-full bg-white w-full">
      <div className="p-4 md:p-8 flex-1 pb-12">
        <h2 className="text-2xl font-black text-gray-900 mb-6">개인정보처리방침</h2>
        <div className="prose prose-sm md:prose-base text-gray-700 max-w-none space-y-4">
          <p><strong>"간단하게 간단하자: EASY IF"</strong>(이하 "서비스")는 이용자의 개인정보를 중요시하며, 개인정보보호법 및 관련 법령을 준수하고 있습니다.</p>
          
          <h3 className="text-lg font-bold mt-6 mb-2 text-gray-900">1. 수집하는 개인정보 항목</h3>
          <p>서비스는 회원가입 및 원활한 서비스 제공을 위해 아래의 정보를 수집합니다.<br />
          - <strong>구글 소셜 로그인 회원:</strong> 이메일 주소, 이름, 프로필 사진 (Google OAuth 제공 정보)<br />
          - <strong>이용 정보:</strong> 식사 가능 시간 설정값, 식단 기록 내용(음식 이름, 시간, 메모), 체중<br />
          - <strong>게스트 모드 사용자:</strong> 모든 데이터가 기기(브라우저) 내부에만 저장되며 서버로 전송 또는 수집되지 않습니다.</p>
          
          <h3 className="text-lg font-bold mt-6 mb-2 text-gray-900">2. 개인정보의 수집 및 이용 목적</h3>
          <p>- <strong>사용자 식별 및 계정 관리:</strong> 구글 로그인을 통한 본인 확인<br />
          - <strong>서비스 제공:</strong> 개인화된 타이머, 식단 기록 달력, 체중 그래프 제공<br />
          - <strong>AI 피드백 분석:</strong> 식단 기록 정보를 기반으로 Gemini AI 모델을 통한 개인화된 건강 코칭 생성 (이름, 이메일 등의 식별 정보는 AI에 전송되지 않으며, 익명화된 식단 데이터만 분석에 활용됩니다)</p>

          <h3 className="text-lg font-bold mt-6 mb-2 text-gray-900">3. 개인정보의 보유 및 이용 기간</h3>
          <p>이용자가 회원 탈퇴를 요청하거나, 서비스 종료 시까지 보관 및 이용됩니다. 회원이 설정 탭에서 '모든 기록 초기화'를 진행하거나 회원 탈퇴를 할 경우, 모든 데이터는 데이터베이스에서 영구적으로 삭제되어 복구할 수 없습니다.</p>

          <h3 className="text-lg font-bold mt-6 mb-2 text-gray-900">4. 개인정보의 제3자 제공</h3>
          <p>서비스는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 단, AI 분석을 위해 이용자의 <strong>'식단 텍스트 및 시간 정보'</strong>에 한정하여 Google Gemini API에 전송될 수 있으나, 여기에는 이름이나 이메일 등의 개인 식별 정보가 일절 포함되지 않습니다.</p>
        </div>
      </div>
    </div>
    </>
  );
}
