import Link from 'next/link'
import type { Deal } from '@/types'
import { STAGE_LABELS, PROB_GRADE_COLORS } from '@/types'

interface Props {
  deal: Deal
}

export default function DealCard({ deal }: Props) {
  const isOverdue = deal.due_date && new Date(deal.due_date) < new Date()
  const isStale = (deal.days_in_stage ?? 0) >= 7
  const services = deal.services ?? []

  return (
    <Link href={`/deals/${deal.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-yellow-300 transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{deal.hospital_name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{services.join(', ') || '서비스 미지정'}</p>
          </div>
          {deal.prob_grade && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PROB_GRADE_COLORS[deal.prob_grade]}`}>
              {deal.prob_grade}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            {STAGE_LABELS[deal.stage]}
          </span>
          {deal.emr_vendor && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {deal.emr_vendor}
            </span>
          )}
          {deal.hospital_size && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {deal.hospital_size}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className={`text-xs ${isStale ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            D+{deal.days_in_stage}일
            {isStale && ' ⚠️'}
          </span>
          {deal.next_action && (
            <span className={`text-xs truncate max-w-[140px] ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
              → {deal.next_action}
            </span>
          )}
        </div>

        {deal.context_snapshot?.pain_points?.length > 0 && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-1">
            💡 {deal.context_snapshot.pain_points[0]}
          </p>
        )}
      </div>
    </Link>
  )
}
