import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { streamCoach } from '@/lib/ai/claude'
import { COACH_SYSTEM } from '@/lib/ai/prompts'
import type { Deal, MeetingLog } from '@/types'
import { STAGE_LABELS } from '@/types'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { deal_id } = await req.json()
  if (!deal_id) return new Response('deal_id required', { status: 400 })

  // 딜 전체 맥락 조회
  const { data: deal } = await supabase.from('deals').select('*').eq('id', deal_id).single()
  if (!deal) return new Response('Deal not found', { status: 404 })

  const { data: logs } = await supabase
    .from('meeting_logs')
    .select('*')
    .eq('deal_id', deal_id)
    .order('created_at', { ascending: false })
    .limit(5)

  // 유사 세그먼트 Win 패턴 조회
  let winPatterns: Record<string, unknown>[] = []
  if (deal.emr_vendor || deal.hospital_size) {
    const { data: patterns } = await supabase
      .from('win_patterns')
      .select('*')

    winPatterns = (patterns ?? []).filter((p: Record<string, unknown>) =>
      (deal.emr_vendor && p.emr_vendor === deal.emr_vendor) ||
      (deal.hospital_size && p.hospital_size === deal.hospital_size)
    )
  }

  // 프롬프트 구성
  const d = deal as Deal
  const userContent = `
## 현재 딜 정보
- 병원: ${d.hospital_name} (${d.hospital_size ?? '규모 미상'}, EMR: ${d.emr_vendor ?? '미상'})
- 서비스: ${d.services.join(', ')}
- 단계: ${STAGE_LABELS[d.stage]} (D+${d.days_in_stage}일)
- 확도: ${d.prob_grade ?? '미평가'}
- 다음 액션: ${d.next_action ?? '없음'}

## 고객 맥락
- 페인 포인트: ${d.context_snapshot?.pain_points?.join(', ') || '없음'}
- 숨겨진 니즈: ${d.context_snapshot?.hidden_needs?.join(', ') || '없음'}
- Win 신호: ${d.context_snapshot?.win_signals?.join(', ') || '없음'}
- 반론: ${d.context_snapshot?.objections?.join(', ') || '없음'}
- 결정 스타일: ${d.context_snapshot?.decision_maker_style ?? '미상'}
- 예산 민감도: ${d.context_snapshot?.budget_sensitivity ?? '미상'}

## 최근 미팅 요약
${(logs ?? []).map((l: MeetingLog, i: number) => `${i + 1}. ${l.ai_summary ?? l.raw_text?.slice(0, 200) ?? ''}`).join('\n')}

## 유사 세그먼트 통계
${winPatterns.length > 0
  ? winPatterns.map(p => `- EMR: ${p.emr_vendor ?? '-'}, 규모: ${p.hospital_size ?? '-'}, Win률: ${p.win_rate ?? '-'}%, 평균 ${p.avg_days_to_win ?? '-'}일`).join('\n')
  : '아직 충분한 데이터 없음'}

이 딜을 어떻게 이겨야 하는지 분석해 주세요.
`

  const stream = streamCoach(COACH_SYSTEM, userContent)

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
