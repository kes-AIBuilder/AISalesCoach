import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const result: Record<string, unknown> = {}

  try {
    // Step 1: createServerClient
    result.step = 'creating_client'
    const supabase = createServerClient()
    result.client_created = true

    // Step 2: auth.getUser
    result.step = 'auth_getUser'
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    result.auth = {
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      auth_error: authError?.message ?? null,
    }

    // Step 3: query deals
    result.step = 'querying_deals'
    const { data: deals, error: dbError } = await supabase
      .from('deals')
      .select('*')
      .is('outcome', null)
      .order('updated_at', { ascending: false })

    if (dbError) {
      result.db_error = { message: dbError.message, code: dbError.code, details: dbError.details }
      return NextResponse.json({ ok: false, result }, { status: 200 })
    }

    // Step 4: inspect deal fields
    result.step = 'inspecting_deals'
    result.deal_count = deals?.length ?? 0
    result.deals = deals?.map(deal => ({
      id: deal.id,
      hospital_name: deal.hospital_name,
      services: deal.services,
      services_type: Array.isArray(deal.services) ? 'array' : typeof deal.services,
      stage: deal.stage,
      prob_grade: deal.prob_grade,
      days_in_stage: deal.days_in_stage,
      days_in_stage_type: typeof deal.days_in_stage,
      context_snapshot_type: typeof deal.context_snapshot,
      context_snapshot_keys: deal.context_snapshot ? Object.keys(deal.context_snapshot) : null,
      pain_points: deal.context_snapshot?.pain_points,
      pain_points_type: Array.isArray(deal.context_snapshot?.pain_points) ? 'array' : typeof deal.context_snapshot?.pain_points,
      outcome: deal.outcome,
    }))

    result.step = 'done'
    return NextResponse.json({ ok: true, result }, { status: 200 })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: String(err),
      error_message: err instanceof Error ? err.message : String(err),
      error_stack: err instanceof Error ? err.stack : null,
      step_at_failure: result.step,
      result,
    }, { status: 200 })
  }
}
