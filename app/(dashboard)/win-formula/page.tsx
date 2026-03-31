import { createServerClient } from '@/lib/supabase/server'
import WinFormulaClient from './WinFormulaClient'

export default async function WinFormulaPage() {
  const supabase = createServerClient()

  // 전체 딜 수 (outcome 있는 것만)
  const { count: closedCount } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .not('outcome', 'is', null)

  const { count: totalCount } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Win 공식</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          전체 {totalCount ?? 0}개 딜 · 완료 {closedCount ?? 0}개
        </p>
      </div>
      <WinFormulaClient closedCount={closedCount ?? 0} />
    </div>
  )
}
