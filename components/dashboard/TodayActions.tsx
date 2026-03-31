'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Action {
  deal_name: string
  action: string
  reason: string
  priority: 'urgent' | 'high' | 'normal'
}

const PRIORITY_STYLES = {
  urgent: 'bg-red-50 border-red-200 text-red-700',
  high: 'bg-orange-50 border-orange-200 text-orange-700',
  normal: 'bg-blue-50 border-blue-200 text-blue-700',
}

const PRIORITY_LABELS = { urgent: '🔴 긴급', high: '🟠 중요', normal: '🔵 일반' }

export default function TodayActions() {
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/today-actions')
      .then(r => r.json())
      .then(data => {
        setActions(data.actions ?? [])
        setLoading(false)
      })
      .catch(() => {
        setError('오늘 할 일 로드 실패')
        setLoading(false)
      })
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="text-sm font-bold text-gray-700 mb-3">🎯 오늘 할 일</h2>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-gray-400">{error}</p>
      ) : actions.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm text-gray-500">진행 중인 딜이 없습니다</p>
          <Link href="/deals/new" className="mt-2 inline-block text-sm text-yellow-600 hover:text-yellow-700 font-medium">
            첫 번째 딜 만들기 →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {actions.map((action, i) => (
            <div key={i} className={`p-3 rounded-xl border ${PRIORITY_STYLES[action.priority]}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">{action.deal_name}</span>
                <span className="text-xs">{PRIORITY_LABELS[action.priority]}</span>
              </div>
              <p className="text-sm font-medium text-gray-900">{action.action}</p>
              <p className="text-xs text-gray-500 mt-0.5">{action.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
