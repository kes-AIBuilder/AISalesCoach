import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import DealForm from '@/components/deals/DealForm'
import type { Deal } from '@/types'

export default async function EditDealPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data } = await supabase.from('deals').select('*').eq('id', params.id).single()
  if (!data) notFound()

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">딜 수정</h1>
        <p className="text-sm text-gray-500 mt-0.5">{data.hospital_name}</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <DealForm deal={data as Deal} />
      </div>
    </div>
  )
}
