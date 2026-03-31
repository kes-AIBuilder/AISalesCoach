import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateProposal } from '@/lib/ai/claude'
import { PROPOSAL_SYSTEM } from '@/lib/ai/prompts'
import type { Deal } from '@/types'
import { STAGE_LABELS } from '@/types'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { deal_id } = await req.json()
  if (!deal_id) return NextResponse.json({ error: 'deal_id required' }, { status: 400 })

  const { data: deal } = await supabase.from('deals').select('*').eq('id', deal_id).single()
  if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })

  const d = deal as Deal

  const userContent = `
병원명: ${d.hospital_name}
병원 규모: ${d.hospital_size ?? '미상'}
EMR사: ${d.emr_vendor ?? '미상'}
제안 서비스: ${d.services.join(', ')}
현재 단계: ${STAGE_LABELS[d.stage]}

페인 포인트: ${d.context_snapshot?.pain_points?.join(', ') || '없음'}
숨겨진 니즈: ${d.context_snapshot?.hidden_needs?.join(', ') || '없음'}
예산 민감도: ${d.context_snapshot?.budget_sensitivity ?? '미상'}
결정자 스타일: ${d.context_snapshot?.decision_maker_style ?? '미상'}

위 정보를 바탕으로 맞춤형 제안서 초안을 작성하세요.
`

  const proposal = await generateProposal(PROPOSAL_SYSTEM, userContent)

  return NextResponse.json({ success: true, proposal })
}
