import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import DealCard from '@/components/deals/DealCard'
import type { Deal, DealStage } from '@/types'
import { STAGE_LABELS, STAGE_ORDER } from '@/types'

export default async function DealsPage({ searchParams }: { searchParams: any }) {
  const supabase = createServerClient()
  // Next.js 14.2+ 에서 searchParams가 Promise일 수 있으므로 await 처리
  const sp = await Promise.resolve(searchParams)
  const stageFilter = sp?.stage as DealStage | undefined

  let query = supabase
    .from('deals')
    .select('*')
    .is('outcome', null)
    .order('updated_at', { ascending: false })

  if (stageFilter) {
    query = query.eq('stage', stageFilter)
  }

  const { data: deals, error: dbError } = await query

  if (dbError) {
    console.error('[deals/page] Supabase error:', dbError)
    throw new Error(`DB 오류: ${dbError.message} (code: ${dbError.code})`)
  }

  const dealList = (deals ?? []) as Deal[]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">딜 목록</h1>
          <p className="text-sm text-gray-500 mt-0.5">진행 중인 딜 {dealList.length}개</p>
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

      {dealList.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">💼</p>
          <p className="text-gray-500 text-sm">
            {stageFilter ? `${STAGE_LABELS[stageFilter]} 단계의 딜이 없습니다` : '아직 딜이 없습니다'}
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
          {dealList.map(deal => <DealCard key={deal.id} deal={deal} />)}
        </div>
      )}
    </div>
  )
}
