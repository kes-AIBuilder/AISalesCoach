import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import type { Deal, MeetingLog } from '@/types'
import { STAGE_LABELS, STAGE_ORDER } from '@/types'
import StageProgress from '@/components/deals/StageProgress'
import ContextSnapshotCard from '@/components/ai/ContextSnapshot'
import DealActions from '@/components/deals/DealActions'
import MemoSection from '@/components/memo/MemoSection'
import CoachPanel from '@/components/ai/CoachPanel'

export default async function DealDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const { data: dealData } = await supabase
    .from('deals')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!dealData) notFound()

  const { data: meetingLogs } = await supabase
    .from('meeting_logs')
    .select('*')
    .eq('deal_id', params.id)
    .order('created_at', { ascending: false })

  const deal = dealData as Deal
  const logs = (meetingLogs ?? []) as MeetingLog[]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{deal.hospital_name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {(deal.services ?? []).join(', ')}
              {deal.emr_vendor && ` · ${deal.emr_vendor}`}
              {deal.hospital_size && ` · ${deal.hospital_size}`}
            </p>
          </div>
          {deal.prob_grade && (
            <span className="text-lg font-bold text-gray-700">
              확도 {deal.prob_grade}
            </span>
          )}
        </div>
        <div className="mt-3">
          <StageProgress currentStage={deal.stage} readonly />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 좌측 컬럼 */}
        <div className="lg:col-span-2 space-y-5">
          {/* 섹션 A: 고객 프로파일 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-4">📋 고객 프로파일</h2>
            <ContextSnapshotCard
              snapshot={deal.context_snapshot}
              decisionMakers={deal.decision_makers}
            />
          </div>

          {/* 섹션 B: 미팅 메모 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-4">📝 미팅 메모</h2>
            <MemoSection dealId={deal.id} logs={logs} />
          </div>

          {/* 섹션 C: AI 코치 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-4">🤖 AI 코치</h2>
            <CoachPanel dealId={deal.id} />
          </div>
        </div>

        {/* 우측 컬럼 */}
        <div className="space-y-5">
          {/* 섹션 D: 액션 및 문서 */}
          <DealActions deal={deal} />
        </div>
      </div>
    </div>
  )
}
