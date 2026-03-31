import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateTodayActions } from '@/lib/ai/claude'
import { TODAY_ACTIONS_SYSTEM } from '@/lib/ai/prompts'
import type { Deal } from '@/types'
import { STAGE_LABELS } from '@/types'

export async function GET() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .is('outcome', null)
    .order('updated_at', { ascending: false })
    .limit(20)

  if (!deals?.length) {
    return NextResponse.json({ actions: [] })
  }

  const dealSummaries = (deals as Deal[]).map(d => ({
    name: d.hospital_name,
    stage: STAGE_LABELS[d.stage],
    prob: d.prob_grade ?? '-',
    days_in_stage: d.days_in_stage,
    next_action: d.next_action ?? '미지정',
    due_date: d.due_date ?? '없음',
    overdue: d.due_date ? new Date(d.due_date) < new Date() : false,
  }))

  const userContent = `현재 진행 중인 딜 목록:\n${JSON.stringify(dealSummaries, null, 2)}\n\n오늘 가장 중요한 액션 3가지를 추천해주세요.`

  const raw = await generateTodayActions(TODAY_ACTIONS_SYSTEM, userContent)
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed = JSON.parse(cleaned)

  return NextResponse.json(parsed)
}
