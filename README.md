# ⏱️ 간단하게 간단하자: EASY IF

![Easy IF Banner](https://img.shields.io/badge/EASY_IF-간헐적_단식_매니저-10b981?style=for-the-badge&logo=react)

**간단하게 간단하자: EASY IF**는 개발자가 직접 3달만에 10kg을 감량하며 효과를 본 간헐적 단식 경험을 바탕으로, **먹는 시간**에 집중하여 누구나 쉽게 시작할 수 있도록 만든 체중 감량 매니저 사이트입니다. 사용자의 식사 패턴과 식단 기록을 분석하여 매일 **AI(Gemini) 대사 건강 코칭**을 제공합니다. Google 로그인 없이도 게스트 모드로 바로 체험할 수 있습니다.

---

## 🛠️ Tech Stack

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Gemini_API-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white" alt="Gemini API" />
</p>

- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide Icons, Recharts, date-fns, react-helmet-async
- **Backend (BaaS):** Supabase (PostgreSQL, Authentication, Row Level Security)
- **Serverless / AI:** Supabase Edge Functions, Google Gemini (`gemini-3.1-flash-lite`)

---

## 💡 기획 의도 및 구현 핵심

1. **'단순함'에 집중한 단식 매니저**
   - 복잡한 칼로리 계산이나 무게 중심 관리 대신, **정해진 식사 가능 시간과 공복 시간**에 집중합니다.
   - 직관적인 대시보드와 타이머로 현재 상태와 남은 시간을 확인할 수 있습니다.

2. **반응형 UI/UX 레이아웃**
   - **모바일:** 하단 네비게이션 탭으로 주요 화면을 이동할 수 있습니다.
   - **데스크탑:** 좌측 사이드바와 본문 영역을 분리해 넓은 화면에 맞는 구성을 제공합니다.

3. **서버리스 AI 구조**
   - 클라이언트에서 직접 AI API를 호출하지 않고, **Supabase Edge Function**을 통해 단식 사이클 데이터를 바탕으로 피드백을 생성합니다.
   - 실제 사용된 모델은 `gemini-3.1-flash-lite`입니다.

4. **로컬 스토리지 기반 게스트 모드**
   - 로그인 없이도 기록, 설정, 기본 흐름을 미리 써볼 수 있도록 `localStorage` 기반 게스트 모드를 제공합니다.

5. **SEO 및 웹 접근성 고려**
   - `react-helmet-async`를 사용해 페이지별 메타 정보를 관리하고, 폼과 버튼 구조를 기본적으로 분리해 구성했습니다.

---

## ✨ 주요 기능 (Features)

### 1. 온보딩 및 소셜/게스트 로그인
- 본인에게 맞는 식사 가능 시간(Eating Window)을 먼저 설정할 수 있습니다.
- Google OAuth 로그인과 로컬 스토리지 기반의 게스트 모드를 모두 지원합니다.

### 2. 실시간 상태 대시보드
- 현재 시간에 따라 단식 진행, 식사 중, 식사 종료 후 상태로 자동 전환됩니다.
- 식사 시간, 음식 이름, 양, 체중을 기록하고 수정/삭제할 수 있습니다.

### 3. AI 일일 코칭 (Gemini)
- 단식 사이클이 종료되면 Supabase Edge Function을 통해 `gemini-3.1-flash-lite` 기반 피드백을 생성합니다.
- 이전 사이클의 결과를 함께 반영해 현재 사이클을 더 구체적으로 해석합니다.

### 4. 시각화된 기록 탭 (달력 & 체중 추이)
- **달력 뷰:** 한 달 동안의 단식 성공 여부를 달력에 색상 점으로 표시합니다.
- **체중 그래프 뷰:** 식단 기록 시 입력된 체중 데이터를 바탕으로 체중 변화를 선 그래프로 보여줍니다.

---

## 🔒 데이터 모델 구조

앱은 Supabase PostgreSQL을 기반으로 동작하며, **RLS(Row Level Security)** 정책을 통해 사용자별 데이터를 분리합니다.

- `users_profile`: 사용자별 식사 가능 시간 등 설정 저장
- `meal_logs`: 시간 기반 식사 기록과 체중 기록
- `cycle_summaries`: 단식 사이클 요약, 성공 여부, AI 피드백 텍스트 저장

게스트 모드에서는 같은 구조를 `localStorage`로 흉내 내서 동작합니다.

---

## 👨‍💻 Developer

**yjun02**  
[GitHub Profile](https://github.com/yjun02)

> "다이어트는 완벽함이 아니라 꾸준함입니다. 오늘 하루 루틴이 깨졌다면, 다음 식사부터 다시 시작하면 됩니다. EASY IF와 함께 가벼운 내일을 만들어 보세요!"
