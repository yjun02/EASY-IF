import React from 'react';
import SEO from '../components/SEO';

export default function Terms() {
  return (
    <>
    <SEO title="서비스 이용약관" url="/terms" />
    <div className="flex flex-col h-full bg-white w-full">
      <div className="p-4 md:p-8 flex-1 pb-12">
        <h2 className="text-2xl font-black text-gray-900 mb-6">서비스 이용약관</h2>
        <div className="prose prose-sm md:prose-base text-gray-700 max-w-none space-y-5">
          <p><strong>제1조 (목적)</strong><br />본 약관은 "간단하게 간단하자: EASY IF"(이하 "서비스")가 제공하는 서비스의 이용조건 및 절차, 이용자와 서비스 제공자의 권리, 의무, 책임사항 등을 규정함을 목적으로 합니다.</p>
          <p><strong>제2조 (약관의 효력과 변경)</strong><br />1. 본 약관은 서비스 내에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.<br />2. 서비스는 필요에 따라 본 약관을 개정할 수 있으며, 개정 시에는 공지합니다.</p>
          <p><strong>제3조 (서비스 제공 및 변경)</strong><br />1. 서비스는 사용자의 식단 기록, 간헐적 단식 타이머, AI 대사 건강 코칭 등의 기능을 제공합니다.<br />2. 무료로 제공되는 서비스의 특성상 사전 고지 없이 서비스의 일부 또는 전체가 변경, 중단될 수 있습니다.</p>
          <p><strong>제4조 (이용자의 의무)</strong><br />1. 이용자는 본 서비스에 거짓 데이터를 입력하거나 타인의 정보를 도용해서는 안 됩니다.<br />2. 본 서비스는 의료 기기나 의학적 진단/처방을 대신하지 않습니다. 이용자의 건강 상태에 따른 무리한 단식으로 발생한 문제에 대해 서비스 제공자는 책임을 지지 않습니다.</p>
          <p><strong>제5조 (게스트 모드 이용 시 주의사항)</strong><br />게스트 모드는 브라우저의 로컬 스토리지에 데이터를 저장하므로 브라우저 초기화, 캐시 삭제, 기기 변경 시 데이터가 영구적으로 삭제될 수 있으며 이에 대해 서비스 제공자는 책임지지 않습니다.</p>
          <p><strong>제6조 (면책 조항)</strong><br />1. AI(Gemini) 코칭은 참고용으로만 제공되며, 생성형 AI의 특성상 부정확하거나 부적절한 답변이 포함될 수 있습니다.<br />2. 천재지변, 서버 오류 등 불가항력적인 사유로 서비스가 중단된 경우 책임이 면제됩니다.</p>
        </div>
      </div>
    </div>
    </>
  );
}
