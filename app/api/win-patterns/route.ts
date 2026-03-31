import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // win_patterns 뷰 조회 (RLS로 user_id 필터됨)
  const { data: patterns, error } = await supabase.from('win_patterns').select('*')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // EMR별 집계
  const emrStats: Record<string, { win: number; loss: number; total: number; days: number[] }> = {}
  const sizeStats: Record<string, { win: number; loss: number; total: number }> = {}

  for (const p of patterns ?? []) {
    const emr = p.emr_vendor ?? '미지정'
    if (!emrStats[emr]) emrStats[emr] = { win: 0, loss: 0, total: 0, days: [] }
    emrStats[emr].win += p.win_count ?? 0
    emrStats[emr].loss += p.loss_count ?? 0
    emrStats[emr].total += p.total_count ?? 0
    if (p.avg_days_to_win) emrStats[emr].days.push(p.avg_days_to_win)

    const size = p.hospital_size ?? '미지정'
    if (!sizeStats[size]) sizeStats[size] = { win: 0, loss: 0, total: 0 }
    sizeStats[size].win += p.win_count ?? 0
    sizeStats[size].loss += p.loss_count ?? 0
    sizeStats[size].total += p.total_count ?? 0
  }

  return NextResponse.json({ patterns, emrStats, sizeStats })
}
