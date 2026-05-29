# ⏱️ 간단하게 간단하자: EASY IF

![Easy IF Banner](https://img.shields.io/badge/EASY_IF-간헐적_단식_매니저-10b981?style=for-the-badge&logo=react)

**간단하게 간단하자: EASY IF**는 개발자가 직접 3달만에 10kg을 감량하며 효과를 본 간헐적 단식 경험을 바탕으로, **먹는 시간**에 집중하여 누구나 쉽게 시작할 수 있도록 만든 체중 감량 매니저 사이트입니다. 사용자의 식사 패턴과 식단 기록을 분석하여 매일 **AI(Gemini) 대사 건강 코칭**을 제공합니다.

---

## 🛠️ Tech Stack

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Gemini_API-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white" alt="Gemini API" />
</p>

- **Frontend:** React 18, Vite, Tailwind CSS v4, Lucide Icons, Recharts, date-fns, react-helmet-async
- **Backend (BaaS):** Supabase (PostgreSQL, Authentication, Row Level Security)
- **Serverless / AI:** Supabase Edge Functions (Deno), Google Gemini 3.1 Flash Lite

---

## 💡 기획 의도 및 구현 핵심

1. **'단순함'에 집중한 단식 매니저**
   - 복잡한 칼로리 계산이나 무게 측정 대신, **정해진 시간 동안 공복을 유지**하는 핵심 규칙에 포커스를 맞췄습니다.
   - 직관적인 타이머 뷰를 통해 남은 식사 시간과 목표 공복 시간을 명확하게 보여줍니다.

2. **반응형 UI/UX 레이아웃**
   - **모바일:** 하단 네비게이션 탭을 통해 모바일 환경에 최적화된 화면을 제공합니다.
   - **데스크탑:** 좌측 사이드바와 본문 카드를 분리하여 넓은 화면에 맞는 레이아웃을 구현했습니다.

3. **서버리스 AI 구조**
   - 클라이언트에서 직접 API를 호출하지 않고, **Supabase Edge Function**을 통해 서버 측에서 식단 데이터를 조회하여 보안을 강화했습니다.

4. **로컬 스토리지 기반 게스트 모드**
   - 로그인에 부담을 느끼는 유저를 위해, `localStorage`를 활용하여 주요 기능(기록, 타이머, 차트 등)을 미리 체험해 볼 수 있는 모드를 구축했습니다.

5. **SEO 및 웹 접근성 고려**
   - `react-helmet-async`를 활용해 페이지별 맞춤 메타 데이터를 설정하고, 폼 영역에 웹 접근성(A11y) 마크업을 적용했습니다.

---

## ✨ 주요 기능 (Features)

### 1. 온보딩 및 소셜/게스트 로그인
- 본인에게 맞는 식사 가능 시간(Eating Window)을 슬라이더로 손쉽게 설정할 수 있습니다.
- Google OAuth 로그인과 로컬 스토리지 기반의 게스트 모드를 모두 지원합니다.

### 2. 실시간 상태 대시보드
- 현재 시간에 따라 3가지 상태(공복 중 / 식사 중 / 식사 종료 및 피드백 대기)로 타이머가 자동 전환됩니다.
- '시간', '음식 이름', '비고', '체중' 정보를 바탕으로 식단을 기록하고 수정/삭제할 수 있습니다.

### 3. 일일 AI 대사 건강 코칭 (Gemini)
- 식사 가능 시간이 종료되면, 서버에 배포된 Edge Function이 자동으로 트리거됩니다.
- Gemini 3.1 Flash Lite 모델이 하루의 식단 패턴을 분석하여 공복 달성 여부, 식단 코멘트, 개선점을 브리핑합니다. (※ 로그인 유저 전용)

### 4. 시각화된 기록 탭 (달력 & 체중 추이)
- **월력 뷰:** 한 달 동안의 공복 목표 달성 여부를 달력에 색상 도트로 표시합니다.
- **체중 그래프 뷰:** 식단 기록 시 입력된 체중 데이터를 바탕으로 체중 변화를 꺾은선 차트로 보여줍니다.

---

## 🔒 데이터 모델 구조

앱은 Supabase PostgreSQL을 기반으로 동작하며, **RLS(Row Level Security)** 정책을 통해 데이터 보안을 유지합니다.

- `users_profile`: 사용자별 목표 식사 시간 등 설정 저장
- `meal_logs`: 타임스탬프 기반 식단 및 체중 기록
- `daily_summaries`: 일 단위 공복 성공 여부, 공복 시간, AI 피드백 텍스트 캐싱

---

## 👨‍💻 Developer

**yjun02**  
[GitHub Profile](https://github.com/yjun02)

> "다이어트는 완벽함이 아니라 꾸준함입니다. 오늘 하루 루틴이 깨졌다면, 다음 식사부터 다시 공복 시간을 시작하면 됩니다. EASY IF와 함께 가벼운 내일을 만들어 보세요!"
