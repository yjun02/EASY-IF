-- cycle_summaries: 사이클 기반 공복 결과 저장 (daily_summaries 대체)
CREATE TABLE cycle_summaries (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  cycle_start varchar(19) not null,
  cycle_end varchar(19) not null,
  fasting_hours numeric(4,1),
  is_success boolean default false,
  ai_feedback text,
  created_at timestamptz default now(),
  unique(user_id, cycle_start)
);

ALTER TABLE cycle_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cycle summaries"
  ON cycle_summaries FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cycle summaries"
  ON cycle_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cycle summaries"
  ON cycle_summaries FOR UPDATE USING (auth.uid() = user_id);
