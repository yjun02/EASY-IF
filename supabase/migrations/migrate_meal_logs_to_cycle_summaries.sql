-- ============================================================
-- meal_logs → cycle_summaries 1회성 마이그레이션 스크립트
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 기존 잘못 생성된 데이터 먼저 삭제 (재실행 시 중복 방지)
-- ai_feedback이 '데이터 이전으로 인해 결과 누락' 또는 null인 것만 삭제 (실제 AI 피드백 보존)
DELETE FROM cycle_summaries
WHERE ai_feedback = '데이터 이전으로 인해 결과 누락'
   OR ai_feedback IS NULL
   OR ai_feedback = '[GENERATING]';

WITH

-- 1. eating_at은 timestamp without time zone, 이미 KST 값으로 저장되어 있음
meals AS (
  SELECT
    id,
    user_id,
    eating_at AS eating_at_kst
  FROM meal_logs
),

-- 2. 유저별 식사 가능 시간 조회
profiles AS (
  SELECT id AS user_id, COALESCE(eating_window, 8) AS eating_window
  FROM users_profile
),

-- 3. 이전 식사와의 시간 간격 계산
meals_with_gap AS (
  SELECT
    m.*,
    p.eating_window,
    LAG(m.eating_at_kst) OVER (
      PARTITION BY m.user_id ORDER BY m.eating_at_kst
    ) AS prev_eating_at_kst
  FROM meals m
  JOIN profiles p ON p.user_id = m.user_id
),

-- 4. 사이클 경계 감지 (간격이 eating_window 초과 → 새 사이클 시작)
meals_with_cycle_flag AS (
  SELECT *,
    CASE
      WHEN prev_eating_at_kst IS NULL THEN 1
      WHEN EXTRACT(EPOCH FROM (eating_at_kst - prev_eating_at_kst)) / 3600.0 > eating_window THEN 1
      ELSE 0
    END AS is_new_cycle
  FROM meals_with_gap
),

-- 5. 사이클 번호 누적 (새 사이클 플래그를 누적 합산)
meals_with_cycle_num AS (
  SELECT *,
    SUM(is_new_cycle) OVER (
      PARTITION BY user_id ORDER BY eating_at_kst
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS cycle_num
  FROM meals_with_cycle_flag
),

-- 6. 사이클별 첫/마지막 식사 시각 집계
cycle_bounds AS (
  SELECT
    user_id,
    cycle_num,
    eating_window,
    MIN(eating_at_kst) AS cycle_start_kst,
    MAX(eating_at_kst) AS cycle_end_kst
  FROM meals_with_cycle_num
  GROUP BY user_id, cycle_num, eating_window
),

-- 7. 직전 사이클 종료 시각 추가 (공복 시간 계산용)
cycle_pairs AS (
  SELECT
    cb.*,
    LAG(cb.cycle_end_kst) OVER (
      PARTITION BY cb.user_id ORDER BY cb.cycle_num
    ) AS prev_cycle_end_kst
  FROM cycle_bounds cb
),

-- 8. 공복 시간 및 성공 여부 계산 (첫 사이클도 포함하도록 수정)
final AS (
  SELECT
    user_id,
    TO_CHAR(cycle_start_kst, 'YYYY-MM-DD HH24:MI:SS') AS cycle_start,
    TO_CHAR(cycle_end_kst,   'YYYY-MM-DD HH24:MI:SS') AS cycle_end,
    CASE 
      WHEN prev_cycle_end_kst IS NOT NULL THEN
        ROUND(EXTRACT(EPOCH FROM (cycle_start_kst - prev_cycle_end_kst)) / 3600.0, 1)::numeric(4,1)
      ELSE NULL
    END AS fasting_hours,
    CASE 
      WHEN prev_cycle_end_kst IS NOT NULL THEN
        (ROUND(EXTRACT(EPOCH FROM (cycle_start_kst - prev_cycle_end_kst)) / 3600.0, 1) >= (24 - eating_window))
      ELSE true -- 첫 단식은 이전 기록이 없으므로 성공으로 처리
    END AS is_success
  FROM cycle_pairs
)

-- 9. cycle_summaries에 Upsert (기존 ai_feedback은 보존)
INSERT INTO cycle_summaries
  (user_id, cycle_start, cycle_end, fasting_hours, is_success, ai_feedback)
SELECT
  user_id,
  cycle_start,
  cycle_end,
  fasting_hours,
  is_success,
  '데이터 이전으로 인해 결과 누락' AS ai_feedback
FROM final
ON CONFLICT (user_id, cycle_start)
DO UPDATE SET
  cycle_end     = EXCLUDED.cycle_end,
  fasting_hours = EXCLUDED.fasting_hours,
  is_success    = EXCLUDED.is_success,
  ai_feedback   = CASE
    WHEN cycle_summaries.ai_feedback IS NULL
      OR cycle_summaries.ai_feedback = '[GENERATING]'
    THEN EXCLUDED.ai_feedback
    ELSE cycle_summaries.ai_feedback   -- 실제 피드백이 있으면 보존
  END;
