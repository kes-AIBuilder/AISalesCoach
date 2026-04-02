'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import DealCard from '@/components/deals/DealCard'
import type { Deal, DealStage } from '@/types'
import { STAGE_LABELS, STAGE_ORDER } from '@/types'

interface Props {
  stageFilter: string | null
}

export default function DealsClient({ stageFilter }: Props) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('deals')
      .select('*')
      .is('outcome', null)
      .order('updated_at', { ascending: false })

    if (stageFilter) {
      query = (query as any).eq('stage', stageFilter)
    }

    query.then(({ data }) => {
      if (!cancelled) {
        setDeals((data ?? []) as Deal[])
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [stageFilter])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">딜 목록</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? '불러오는 중...' : `진행 중인 딜 ${deals.length}개`}
          </p>
        </div>
        <Link
          href="/deals/new"
          className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg text-sm transition-colors"
        >
          + 새 딜
        </Link>
      </div>

      {/* 단계별 필터 탭 */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <Link
          href="/deals"
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
            !stageFilter ? 'bg-yellow-400 text-gray-900 font-medium' : 'bg-white border border-gray-200 text-gray-600 hover:border-yellow-300'
          }`}
        >
          전체
        </Link>
        {STAGE_ORDER.map(s => (
          <Link
            key={s}
            href={`/deals?stage=${s}`}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              stageFilter === s ? 'bg-yellow-400 text-gray-900 font-medium' : 'bg-white border border-gray-200 text-gray-600 hover:border-yellow-300'
            }`}
          >
            {STAGE_LABELS[s]}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">💼</p>
          <p className="text-gray-500 text-sm">
            {stageFilter ? `${STAGE_LABELS[stageFilter as DealStage]} 단계의 딜이 없습니다` : '아직 딜이 없습니다'}
          </p>
          <Link
            href="/deals/new"
            className="mt-4 inline-block px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg text-sm transition-colors"
          >
            첫 번째 딜 만들기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map(deal => <DealCard key={deal.id} deal={deal} />)}
        </div>
      )}
    </div>
  )
}
