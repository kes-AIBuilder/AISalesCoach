import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { validateAudioFile, transcribeAudio } from '@/lib/ai/whisper'
import { analyzeMemo } from '@/lib/ai/claude'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const dealId = formData.get('deal_id') as string | null

  if (!file || !dealId) {
    return NextResponse.json({ error: 'file과 deal_id가 필요합니다' }, { status: 400 })
  }

  // 파일 검증
  const validation = validateAudioFile(file)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  // 1. Supabase Storage 업로드
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp3'
  const storagePath = `${user.id}/${dealId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('audio-recordings')
    .upload(storagePath, file, { contentType: file.type })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    // 업로드 실패해도 STT는 진행 (파일 직접 전달)
  }

  // 2. Whisper STT
  const transcribedText = await transcribeAudio(file)

  // 3. Claude 분석
  const analysis = await analyzeMemo(transcribedText)

  // 4. meeting_log 저장
  await supabase.from('meeting_logs').insert({
    deal_id: dealId,
    user_id: user.id,
    input_type: 'audio',
    raw_text: transcribedText,
    audio_path: uploadError ? null : storagePath,
    ai_summary: analysis.summary,
    extracted: analysis.extracted,
  })

  // 5. deals.context_snapshot 업데이트
  const { data: deal } = await supabase.from('deals').select('context_snapshot').eq('id', dealId).single()
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

  await supabase.from('deals').update({ context_snapshot: merged }).eq('id', dealId)

  return NextResponse.json({
    success: true,
    transcribed_text: transcribedText,
    analysis,
  })
}
