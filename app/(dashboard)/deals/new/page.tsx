import DealForm from '@/components/deals/DealForm'

export default function NewDealPage() {
  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">새 딜 만들기</h1>
        <p className="text-sm text-gray-500 mt-0.5">어느 단계에서든 시작할 수 있습니다</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <DealForm />
      </div>
    </div>
  )
}
