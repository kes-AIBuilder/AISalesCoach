import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { analyzeMemo } from '@/lib/ai/claude'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { deal_id, text, input_type = 'text' } = body

  if (!deal_id || !text?.trim()) {
    return NextResponse.json({ error: 'deal_id와 text가 필요합니다' }, { status: 400 })
  }

  // 1. Claude 분석
  const analysis = await analyzeMemo(text)

  // 2. meeting_log 저장
  await supabase.from('meeting_logs').insert({
    deal_id,
    user_id: user.id,
    input_type,
    raw_text: text,
    ai_summary: analysis.summary,
    extracted: analysis.extracted,
  })

  // 3. deals.context_snapshot 업데이트 (기존 스냅샷에 병합)
  const { data: deal } = await supabase.from('deals').select('context_snapshot').eq('id', deal_id).single()
  const existing = deal?.context_snapshot ?? {}

  const merged = {
    hidden_needs: [...new Set([...(existing.hidden_needs ?? []), ...analysis.extracted.hidden_needs])],
    pain_points: [...new Set([...(existing.pain_points ?? []), ...analysis.extracted.pain_points])],
    objections: [...new Set([...(existing.objections ?? []), ...analysis.extracted.objections])],
    win_signals: [...new Set([...(existing.win_signals ?? []), ...analysis.extracted.win_signals])],
    decision_maker_style: analysis.context_patch.decision_maker_style ?? existing.decision_maker_style,
    contact_preference: analysis.context_patch.contact_preference ?? existing.contact_preference,
    budget_sensitivity: analysis.context_patch.budget_sensitivity ?? existing.budget_sensitivity,
    decision_log: existing.decision_log ?? [],
  }

  await supabase.from('deals').update({ context_snapshot: merged }).eq('id', deal_id)

  return NextResponse.json({ success: true, analysis })
}
