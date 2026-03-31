export type DealStage = 'discovery' | 'proposal' | 'negotiation' | 'confirmed' | 'contract'
export type ProbGrade = 'S' | 'A' | 'B' | 'C'
export type Outcome = 'win' | 'loss' | 'active'

export interface DecisionMaker {
  name: string
  role: string
  style?: string
  contact_pref?: string
}

export interface ContextSnapshot {
  hidden_needs: string[]
  pain_points: string[]
  objections: string[]
  win_signals: string[]
  decision_maker_style?: string
  contact_preference?: string
  budget_sensitivity?: string
  decision_log: Array<{ date: string; note: string }>
}

export interface StageLogEntry {
  stage: DealStage
  entered_at: string
  exited_at?: string
  days?: number
}

export interface ProbHistoryEntry {
  date: string
  from: ProbGrade
  to: ProbGrade
  trigger: string
}

export interface Deal {
  id: string
  user_id: string
  hospital_name: string
  services: string[]
  stage: DealStage
  prob_grade?: ProbGrade
  entry_point: DealStage
  hospital_size?: string
  emr_vendor?: string
  decision_makers: DecisionMaker[]
  context_snapshot: ContextSnapshot
  stage_log: StageLogEntry[]
  prob_history: ProbHistoryEntry[]
  outcome?: Outcome
  win_factors?: string[]
  loss_reason?: string
  days_in_stage: number
  next_action?: string
  due_date?: string
  created_at: string
  updated_at: string
}

export interface MeetingLog {
  id: string
  deal_id: string
  user_id: string
  input_type: 'text' | 'audio'
  raw_text?: string
  audio_path?: string
  audio_duration?: number
  ai_summary?: string
  extracted: {
    hidden_needs: string[]
    pain_points: string[]
    objections: string[]
    win_signals: string[]
    next_actions: string[]
  }
  created_at: string
}

export interface ContactLog {
  id: string
  deal_id: string
  user_id: string
  method: string
  initiated_by: 'sales' | 'customer'
  response_speed_hours?: number
  sentiment?: 'positive' | 'neutral' | 'negative' | 'no_response'
  note?: string
  contacted_at: string
}

export interface WinPattern {
  emr_vendor?: string
  hospital_size?: string
  services: string[]
  win_count: number
  loss_count: number
  total_count: number
  win_rate?: number
  avg_days_to_win?: number
}

export interface MemoAnalysis {
  summary: string
  extracted: {
    hidden_needs: string[]
    pain_points: string[]
    objections: string[]
    win_signals: string[]
    next_actions: string[]
  }
  context_patch: {
    contact_preference?: string
    decision_maker_style?: string
    budget_sensitivity?: string
  }
}

// STAGE 표시명
export const STAGE_LABELS: Record<DealStage, string> = {
  discovery: '발굴',
  proposal: '제안',
  negotiation: '협상',
  confirmed: '확정',
  contract: '계약',
}

export const STAGE_ORDER: DealStage[] = ['discovery', 'proposal', 'negotiation', 'confirmed', 'contract']

export const PROB_GRADE_COLORS: Record<ProbGrade, string> = {
  S: 'bg-green-100 text-green-800',
  A: 'bg-blue-100 text-blue-800',
  B: 'bg-yellow-100 text-yellow-800',
  C: 'bg-gray-100 text-gray-600',
}

export const SERVICES_OPTIONS = [
  '레몬케어',
  '레몬톡톡',
  '레몬차트',
  '레몬예약',
  '레몬리뷰',
  '기타',
]

export const EMR_VENDORS = ['유비케어', '비트', '이지케어텍', '포인트닉스', '기타']

export const HOSPITAL_SIZES = ['의원', '병원', '종합병원', '상급종합']
