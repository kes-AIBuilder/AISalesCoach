'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Deal, DealStage } from '@/types'
import { STAGE_LABELS, STAGE_ORDER } from '@/types'

const LOSS_REASONS = ['예산 부족', '경쟁사 선택', '도입 보류', '담당자 교체', '필요 없음', '기타']

export default function DealActions({ deal }: { deal: Deal }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [showLossModal, setShowLossModal] = useState(false)
  const [lossReason, setLossReason] = useState('')
  const [nextAction, setNextAction] = useState(deal.next_action ?? '')
  const [dueDate, setDueDate] = useState(deal.due_date ? deal.due_date.split('T')[0] : '')

  const currentIdx = STAGE_ORDER.indexOf(deal.stage)
  const prevStage = currentIdx > 0 ? STAGE_ORDER[currentIdx - 1] : null
  const nextStage = currentIdx < STAGE_ORDER.length - 1 ? STAGE_ORDER[currentIdx + 1] : null

  async function changeStage(stage: DealStage) {
    setLoading(true)
    const now = new Date().toISOString()
    const stageLog = [...(deal.stage_log ?? []), { stage, entered_at: now }]
    await supabase.from('deals').update({ stage, stage_log: stageLog }).eq('id', deal.id)
    router.refresh()
    setLoading(false)
  }

  async function saveAction() {
    setLoading(true)
    await supabase.from('deals').update({
      next_action: nextAction || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    }).eq('id', deal.id)
    router.refresh()
    setLoading(false)
  }

  async function recordWin() {
    setLoading(true)
    await supabase.from('deals').update({ outcome: 'win' }).eq('id', deal.id)
    router.push('/deals')
  }

  async function recordLoss() {
    if (!lossReason) return
    setLoading(true)
    await supabase.from('deals').update({ outcome: 'loss', loss_reason: lossReason }).eq('id', deal.id)
    setShowLossModal(false)
    router.push('/deals')
  }

  async function deleteDeal() {
    if (!confirm('정말 이 딜을 삭제하시겠습니까?')) return
    setLoading(true)
    await supabase.from('deals').delete().eq('id', deal.id)
    router.push('/deals')
  }

  if (deal.outcome && deal.outcome !== 'active') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className={`text-center py-4 rounded-xl ${deal.outcome === 'win' ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className="text-2xl mb-1">{deal.outcome === 'win' ? '🏆' : '😞'}</p>
          <p className={`font-bold ${deal.outcome === 'win' ? 'text-green-700' : 'text-red-600'}`}>
            {deal.outcome === 'win' ? '계약 성사!' : '드랍'}
          </p>
          {deal.loss_reason && <p className="text-xs text-gray-500 mt-1">{deal.loss_reason}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 단계 이동 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-3">🚀 단계 이동</h3>
        <div className="space-y-2">
          {nextStage && (
            <button
              onClick={() => changeStage(nextStage)}
              disabled={loading}
              className="w-full py-2 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-gray-900 font-medium rounded-lg text-sm transition-colors"
            >
              {STAGE_LABELS[nextStage]}으로 이동 →
            </button>
          )}
          {prevStage && (
            <button
              onClick={() => changeStage(prevStage)}
              disabled={loading}
              className="w-full py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-sm transition-colors"
            >
              ← {STAGE_LABELS[prevStage]}으로 되돌리기
            </button>
          )}
        </div>
      </div>

      {/* 다음 액션 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-3">📌 다음 액션</h3>
        <input
          value={nextAction}
          onChange={e => setNextAction(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-2"
          placeholder="다음에 할 일"
        />
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-3"
        />
        <button
          onClick={saveAction}
          disabled={loading}
          className="w-full py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
        >
          저장
        </button>
      </div>

      {/* 결과 기록 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-3">🏁 결과 기록</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={recordWin}
            disabled={loading}
            className="py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
          >
            🏆 Win
          </button>
          <button
            onClick={() => setShowLossModal(true)}
            disabled={loading}
            className="py-2 bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 font-medium rounded-lg text-sm transition-colors"
          >
            😞 Loss
          </button>
        </div>
        <Link
          href={`/deals/${deal.id}/proposal`}
          className="block w-full py-2 text-center border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-sm transition-colors"
        >
          📄 제안서 초안 생성
        </Link>
      </div>

      {/* 편집/삭제 */}
      <div className="flex gap-2">
        <Link
          href={`/deals/${deal.id}/edit`}
          className="flex-1 py-2 text-center border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs transition-colors"
        >
          수정
        </Link>
        <button
          onClick={deleteDeal}
          className="flex-1 py-2 border border-red-100 hover:bg-red-50 text-red-500 rounded-lg text-xs transition-colors"
        >
          삭제
        </button>
      </div>

      {/* Loss 모달 */}
      {showLossModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80">
            <h3 className="font-bold text-gray-900 mb-4">드랍 원인을 선택하세요</h3>
            <div className="space-y-2 mb-5">
              {LOSS_REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setLossReason(r)}
                  className={`w-full py-2 rounded-lg text-sm text-left px-3 transition-colors ${
                    lossReason === r ? 'bg-red-100 text-red-700 font-medium' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLossModal(false)}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
              >
                취소
              </button>
              <button
                onClick={recordLoss}
                disabled={!lossReason || loading}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
