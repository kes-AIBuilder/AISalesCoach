-- =============================================
-- Lemon Sales Coach — Initial Schema
-- =============================================

-- deals 테이블
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  hospital_name text NOT NULL,
  services text[] NOT NULL DEFAULT '{}',
  stage text NOT NULL DEFAULT 'discovery',
  prob_grade text,
  entry_point text NOT NULL DEFAULT 'discovery',
  hospital_size text,
  emr_vendor text,
  decision_makers jsonb DEFAULT '[]',
  context_snapshot jsonb DEFAULT '{}',
  stage_log jsonb DEFAULT '[]',
  prob_history jsonb DEFAULT '[]',
  outcome text,
  win_factors text[],
  loss_reason text,
  days_in_stage integer DEFAULT 0,
  next_action text,
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- meeting_logs 테이블
CREATE TABLE IF NOT EXISTS meeting_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  input_type text NOT NULL,
  raw_text text,
  audio_path text,
  audio_duration integer,
  ai_summary text,
  extracted jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- contact_logs 테이블
CREATE TABLE IF NOT EXISTS contact_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  method text NOT NULL,
  initiated_by text NOT NULL,
  response_speed_hours numeric,
  sentiment text,
  note text,
  contacted_at timestamptz NOT NULL
);

-- win_patterns 뷰 (RLS 필터 포함)
CREATE OR REPLACE VIEW win_patterns AS
SELECT
  emr_vendor,
  hospital_size,
  services,
  COUNT(*) FILTER (WHERE outcome = 'win') AS win_count,
  COUNT(*) FILTER (WHERE outcome = 'loss') AS loss_count,
  COUNT(*) AS total_count,
  ROUND(
    COUNT(*) FILTER (WHERE outcome = 'win') * 100.0 / NULLIF(COUNT(*), 0), 1
  ) AS win_rate,
  ROUND(AVG(
    CASE WHEN outcome = 'win'
    THEN EXTRACT(DAY FROM (updated_at - created_at)) END
  ), 1) AS avg_days_to_win
FROM deals
WHERE outcome IS NOT NULL
GROUP BY emr_vendor, hospital_size, services;

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- RLS 정책
-- =============================================

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deals_own" ON deals
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE meeting_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meeting_logs_own" ON meeting_logs
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE contact_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_logs_own" ON contact_logs
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
