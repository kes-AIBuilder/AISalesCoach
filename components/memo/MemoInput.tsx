'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  dealId: string
  onSuccess?: () => void
}

export default function MemoInput({ dealId, onSuccess }: Props) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    summary: string
    extracted: { hidden_needs: string[]; pain_points: string[]; win_signals: string[]; next_actions: string[] }
  } | null>(null)
  const [error, setError] = useState('')

  async function handleAnalyze() {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    const res = await fetch('/api/analyze-memo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deal_id: dealId, text, input_type: 'text' }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? '분석 실패')
    } else {
      setResult(data.analysis)
      setText('')
      router.refresh()
      if (onSuccess) onSuccess()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={5}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
        placeholder="미팅 내용을 자유롭게 입력하세요.&#10;예: 원장이 요즘 환자 이탈 때문에 고민 많다고 함. 옆 병원이 앱 쓰기 시작했다고 의식하는 것 같음..."
      />

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {result && (
        <div className="bg-blue-50 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-blue-900">✅ 분석 완료</p>
          <p className="text-sm text-gray-700">{result.summary}</p>
          {result.extracted.next_actions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">다음 액션</p>
              <ul className="space-y-0.5">
                {result.extracted.next_actions.map((a, i) => (
                  <li key={i} className="text-xs text-gray-700 flex gap-1.5"><span>•</span>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={!text.trim() || loading}
        className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-gray-900 font-semibold rounded-lg text-sm transition-colors"
      >
        {loading ? '🤖 AI 분석 중...' : '🤖 AI 분석하기'}
      </button>
    </div>
  )
}
