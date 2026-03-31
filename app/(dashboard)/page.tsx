import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Deal } from '@/types'
import { STAGE_LABELS, STAGE_ORDER } from '@/types'
import TodayActions from '@/components/dashboard/TodayActions'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .is('outcome', null)
    .order('updated_at', { ascending: false })

  const dealList = (deals ?? []) as Deal[]

  // 파이프라인 요약 (단계별 카운트)
  const pipelineCount = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = dealList.filter(d => d.stage === stage).length
    return acc
  }, {} as Record<string, number>)

  // 위험 신호: 7일 이상 체류
  const staleDeals = dealList.filter(d => d.days_in_stage >= 7)

  // 기한 초과
  const overdueDeals = dealList.filter(d => d.due_date && new Date(d.due_date) < new Date())

  const { count: winCount } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .eq('outcome', 'win')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">안녕하세요 👋</h1>
        <p className="text-sm text-gray-500 mt-0.5">오늘의 영업 현황입니다</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 좌측: 오늘 할 일 + 위험 신호 */}
        <div className="lg:col-span-2 space-y-5">
          {/* 오늘 할 일 (AI) */}
          <TodayActions />

          {/* 위험 신호 딜 */}
          {(staleDeals.length > 0 || overdueDeals.length > 0) && (
            <div className="bg-white rounded-2xl border border-red-100 p-5">
              <h2 className="text-sm font-bold text-red-700 mb-3">⚠️ 위험 신호</h2>
              <div className="space-y-2">
                {overdueDeals.map(d => (
                  <Link key={d.id} href={`/deals/${d.id}`} className="flex items-center justify-between p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{d.hospital_name}</span>
                      <span className="text-xs text-red-600 ml-2">기한 초과</span>
                    </div>
                    <span className="text-xs text-red-500">{d.next_action ?? STAGE_LABELS[d.stage]}</span>
                  </Link>
                ))}
                {staleDeals
                  .filter(d => !overdueDeals.find(o => o.id === d.id))
                  .map(d => (
                    <Link key={d.id} href={`/deals/${d.id}`} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{d.hospital_name}</span>
                        <span className="text-xs text-orange-600 ml-2">D+{d.days_in_stage}일 정체</span>
                      </div>
                      <span className="text-xs text-gray-500">{STAGE_LABELS[d.stage]}</span>
                    </Link>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* 우측: 요약 통계 */}
        <div className="space-y-4">
          {/* 파이프라인 요약 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-3">📊 파이프라인</h2>
            <div className="space-y-2">
              {STAGE_ORDER.map(stage => (
                <div key={stage} className="flex items-center justify-between">
                  <Link
                    href={`/deals?stage=${stage}`}
                    className="text-sm text-gray-600 hover:text-yellow-600"
                  >
                    {STAGE_LABELS[stage]}
                  </Link>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 bg-gray-100 rounded-full w-16">
                      <div
                        className="h-1.5 bg-yellow-400 rounded-full"
                        style={{
                          width: dealList.length > 0
                            ? `${(pipelineCount[stage] / dealList.length) * 100}%`
                            : '0%'
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-4 text-right">
                      {pipelineCount[stage]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs">
              <span className="text-gray-500">전체 활성</span>
              <span className="font-bold text-gray-900">{dealList.length}건</span>
            </div>
          </div>

          {/* Win 통계 */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-100 p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-3">🏆 Win 현황</h2>
            <p className="text-3xl font-bold text-gray-900">{winCount ?? 0}</p>
            <p className="text-sm text-gray-500">계약 성사</p>
            <Link
              href="/win-formula"
              className="mt-3 block text-xs text-yellow-700 hover:text-yellow-800 font-medium"
            >
              Win 공식 보기 →
            </Link>
          </div>

          {/* 빠른 액션 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-3">⚡ 빠른 액션</h2>
            <Link
              href="/deals/new"
              className="block w-full py-2.5 text-center bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg text-sm transition-colors"
            >
              + 새 딜 만들기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
