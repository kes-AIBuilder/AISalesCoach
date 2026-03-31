'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Deal, DealStage } from '@/types'
import { STAGE_LABELS, STAGE_ORDER, SERVICES_OPTIONS, EMR_VENDORS, HOSPITAL_SIZES } from '@/types'

interface Props {
  deal?: Deal
  onSuccess?: () => void
}

export default function DealForm({ deal, onSuccess }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!deal

  const [hospitalName, setHospitalName] = useState(deal?.hospital_name ?? '')
  const [services, setServices] = useState<string[]>(deal?.services ?? [])
  const [stage, setStage] = useState<DealStage>(deal?.stage ?? 'discovery')
  const [hospitalSize, setHospitalSize] = useState(deal?.hospital_size ?? '')
  const [emrVendor, setEmrVendor] = useState(deal?.emr_vendor ?? '')
  const [probGrade, setProbGrade] = useState(deal?.prob_grade ?? '')
  const [nextAction, setNextAction] = useState(deal?.next_action ?? '')
  const [dueDate, setDueDate] = useState(deal?.due_date ? deal.due_date.split('T')[0] : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleService(s: string) {
    setServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hospitalName.trim()) { setError('병원명을 입력하세요'); return }
    if (services.length === 0) { setError('서비스를 하나 이상 선택하세요'); return }

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('로그인이 필요합니다'); setLoading(false); return }

    const payload = {
      hospital_name: hospitalName.trim(),
      services,
      stage,
      prob_grade: probGrade || null,
      hospital_size: hospitalSize || null,
      emr_vendor: emrVendor || null,
      next_action: nextAction || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    }

    let err
    if (isEdit) {
      const { error: e } = await supabase.from('deals').update(payload).eq('id', deal.id)
      err = e
    } else {
      const { error: e } = await supabase.from('deals').insert({
        ...payload,
        user_id: user.id,
        entry_point: stage,
      })
      err = e
    }

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      if (onSuccess) onSuccess()
      else router.push('/deals')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">병원명 *</label>
        <input
          value={hospitalName}
          onChange={e => setHospitalName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="한국중앙병원"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">서비스 *</label>
        <div className="flex flex-wrap gap-2">
          {SERVICES_OPTIONS.map(s => (
            <button
              key={s} type="button"
              onClick={() => toggleService(s)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                services.includes(s)
                  ? 'bg-yellow-400 border-yellow-400 text-gray-900 font-medium'
                  : 'border-gray-300 text-gray-600 hover:border-yellow-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">현재 단계 *</label>
          <select
            value={stage}
            onChange={e => setStage(e.target.value as DealStage)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            {STAGE_ORDER.map(s => (
              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">확도</label>
          <select
            value={probGrade}
            onChange={e => setProbGrade(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="">미지정</option>
            {['S', 'A', 'B', 'C'].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">병원 규모</label>
          <select
            value={hospitalSize}
            onChange={e => setHospitalSize(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="">미지정</option>
            {HOSPITAL_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">EMR사</label>
          <select
            value={emrVendor}
            onChange={e => setEmrVendor(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="">미지정</option>
            {EMR_VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">다음 액션</label>
        <input
          value={nextAction}
          onChange={e => setNextAction(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="실장 미팅 일정 잡기"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">팔로업 기한</label>
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-gray-900 font-semibold rounded-lg text-sm transition-colors"
        >
          {loading ? '저장 중...' : isEdit ? '수정하기' : '딜 생성'}
        </button>
      </div>
    </form>
  )
}
