# ⏱️ 간단하게 간단하자 (Easy IF : Easy Intermittent Fasting)

![Easy IF Banner](https://img.shields.io/badge/Easy_IF-간헐적_단식_매니저-10b981?style=for-the-badge&logo=react)

**간단하게 간단하자(Easy IF, Easy Intermittent Fasting)**는 개발자가 직접 3달만에 10kg을 감량하며 효과를 본 간헐적 단식 경험을 바탕으로, **먹는 시간**에 집중하여 누구나 쉽게 시작할 수 있도록 만든 체중 감량 매니저 사이트입니다. 사용자의 식사 패턴과 식단 기록을 분석하여 매일 **AI(Gemini) 대사 건강 코칭**을 제공합니다.

---

## 🛠️ Tech Stack

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Gemini_API-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white" alt="Gemini API" />
</p>

- **Frontend:** React 18, Vite, Tailwind CSS v4, Lucide Icons, Recharts, date-fns
- **Backend (BaaS):** Supabase (PostgreSQL, Authentication, Row Level Security)
- **Serverless / AI:** Supabase Edge Functions (Deno), Google Gemini 3.1 Flash Lite

---

## 💡 기획 의도 및 구현 핵심

1. **복잡한 칼로리 계산은 그만, '단순함'에 집중**
   - 닭가슴살만 먹거나 그램 수를 재는 것에 지친 사용자들을 위해, **정해진 시간 동안 공복을 유지**하는 것에 포커스를 맞췄습니다.
   - 직관적인 타이머 뷰를 통해 남은 식사 시간과 목표 공복 시간을 명확하게 보여줍니다.

2. **모바일 퍼스트, 그러나 PC에서도 완벽한 반응형 UI**
   - 모바일 환경에서는 화면을 100% 활용하며 하단 네비게이션 탭을 제공합니다.
   - PC(데스크탑) 환경에서는 좌측 사이드바와 여유로운 입력 폼 등 큰 화면을 낭비하지 않는 반응형 하이브리드 레이아웃을 구현했습니다.

3. **완벽하게 안전한 서버리스 AI 구조**
   - 클라이언트(브라우저)에서 직접 API를 호출하지 않습니다.
   - **Supabase Edge Function**을 통해 서버 측에서 사용자의 인증(Auth) 상태를 확인하고, DB에서 식단 데이터를 직접 조회하여 조작된 데이터 입력을 원천 차단합니다.
   - API Key 유출 위험이 없는 엔터프라이즈급 보안을 적용했습니다.

---

## ✨ 주요 기능 (Features)

### 1. 직관적인 온보딩 및 구글 소셜 로그인
- **16:8 간단** 등 본인에게 맞는 식사 가능 시간(Eating Window)을 커스텀 슬라이더로 손쉽게 설정할 수 있습니다.
- Supabase Auth를 통한 원클릭 Google OAuth 로그인을 지원합니다.

### 2. 실시간 상태 대시보드
- 현재 시간에 따라 앱의 상태가 3가지로 자동 전환됩니다.
  - **공복 중:** 다음 식사 가능 시간까지 카운트다운
  - **식사 시간:** 식사 가능 남은 시간 타이머 표시
  - **식사 종료:** AI 피드백 생성 모드
- 식단 기록은 '시간', '음식 이름', '비고', '체중' 네 가지로 구분하여 빠르고 컴팩트하게 입력할 수 있습니다.

### 3. 일일 AI 대사 건강 코칭 (Gemini)
- 식사 가능 시간이 종료되면, 서버에 배포된 Edge Function이 자동으로 트리거됩니다.
- Gemini 3.1 Flash Lite 모델이 하루의 식단 패턴을 분석하여 **공복 달성 여부, 음식 선택 코멘트, 내일을 위한 개선점**을 3~5문장으로 브리핑합니다.
- 키 로테이션 및 재시도(Retry) 로직이 서버에 구현되어 있어 안정적인 응답을 보장합니다.

### 4. 시각화된 기록 탭 (달력 & 체중 추이)
- **월력 뷰:** 한 달 동안의 공복 목표 달성 여부(성공/실패)를 달력에 직관적인 색상 도트로 표시합니다.
- **체중 그래프 뷰:** 식단 기록 시 입력된 체중 데이터를 바탕으로 기간별(1주, 1개월, 전체 등) 체중 변화를 꺾은선 차트(`Recharts`)로 보여줍니다. (하루에 여러 번 기록 시 해당 일의 **최저 체중**만 지능적으로 필터링)

---

## 🔒 보안 및 데이터 모델 구조

앱은 Supabase PostgreSQL을 기반으로 동작하며, 완벽한 **RLS(Row Level Security)** 정책을 적용하여 유저는 오직 자신의 데이터만 읽고 쓸 수 있습니다.

- `users_profile`: 사용자별 목표 식사 시간 등 메타데이터 저장
- `meal_logs`: 타임스탬프와 함께 일별 상세 식단 및 체중 기록 저장
- `daily_summaries`: 일 단위 공복 성공 여부, 실 공복 시간 계산, AI 피드백 저장

---

## 👨‍💻 Developer

**yjun02**  
[GitHub Profile](https://github.com/yjun02)

> "다이어트는 완벽함이 아니라 꾸준함입니다. 오늘 하루 루틴이 깨졌다면, 다음 식사부터 다시 공복 시간을 시작하면 됩니다. Easy IF와 함께 가벼운 내일을 만들어 보세요!"
