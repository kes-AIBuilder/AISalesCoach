import type { ContextSnapshot, DecisionMaker } from '@/types'

interface Props {
  snapshot: ContextSnapshot
  decisionMakers?: DecisionMaker[]
}

function TagList({ items, color }: { items: string[]; color: string }) {
  if (!items?.length) return <span className="text-xs text-gray-400">-</span>
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{item}</span>
      ))}
    </div>
  )
}

export default function ContextSnapshotCard({ snapshot, decisionMakers }: Props) {
  const hasData = snapshot && (
    snapshot.hidden_needs?.length > 0 ||
    snapshot.pain_points?.length > 0 ||
    snapshot.objections?.length > 0 ||
    snapshot.win_signals?.length > 0
  )

  if (!hasData) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        <p>아직 고객 맥락이 없습니다.</p>
        <p>미팅 메모를 입력하면 AI가 자동으로 분석합니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {snapshot.pain_points?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1.5">🔥 페인 포인트</p>
          <TagList items={snapshot.pain_points} color="bg-red-50 text-red-700" />
        </div>
      )}
      {snapshot.hidden_needs?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1.5">💡 숨겨진 니즈</p>
          <TagList items={snapshot.hidden_needs} color="bg-blue-50 text-blue-700" />
        </div>
      )}
      {snapshot.win_signals?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1.5">✅ Win 신호</p>
          <TagList items={snapshot.win_signals} color="bg-green-50 text-green-700" />
        </div>
      )}
      {snapshot.objections?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1.5">⚠️ 반론/우려</p>
          <TagList items={snapshot.objections} color="bg-orange-50 text-orange-700" />
        </div>
      )}

      {(snapshot.decision_maker_style || snapshot.contact_preference || snapshot.budget_sensitivity) && (
        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-2">🧠 의사결정 프로파일</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {snapshot.decision_maker_style && (
              <div className="bg-purple-50 rounded-lg p-2 text-center">
                <p className="text-gray-400 mb-0.5">결정 스타일</p>
                <p className="font-medium text-purple-700">{snapshot.decision_maker_style}</p>
              </div>
            )}
            {snapshot.contact_preference && (
              <div className="bg-purple-50 rounded-lg p-2 text-center">
                <p className="text-gray-400 mb-0.5">연락 선호</p>
                <p className="font-medium text-purple-700">{snapshot.contact_preference}</p>
              </div>
            )}
            {snapshot.budget_sensitivity && (
              <div className="bg-purple-50 rounded-lg p-2 text-center">
                <p className="text-gray-400 mb-0.5">예산 민감도</p>
                <p className="font-medium text-purple-700">{snapshot.budget_sensitivity}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {decisionMakers && decisionMakers.length > 0 && (
        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-2">👥 의사결정자</p>
          <div className="space-y-1.5">
            {decisionMakers.map((dm, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="font-medium text-gray-900">{dm.name}</span>
                <span className="text-gray-400">{dm.role}</span>
                {dm.style && <span className="text-purple-600">({dm.style})</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
