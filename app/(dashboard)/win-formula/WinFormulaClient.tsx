'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

interface EmrStat {
  emr: string
  winRate: number
  total: number
}

interface SizeStat {
  size: string
  winRate: number
  total: number
  avgDays: number
}

interface Props {
  closedCount: number
}

const MIN_DEALS = 3

export default function WinFormulaClient({ closedCount }: Props) {
  const [emrData, setEmrData] = useState<EmrStat[]>([])
  const [sizeData, setSizeData] = useState<SizeStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/win-patterns')
      .then(r => r.json())
      .then(data => {
        const emrStats = data.emrStats as Record<string, { win: number; loss: number; total: number }>
        const sizeStats = data.sizeStats as Record<string, { win: number; loss: number; total: number }>
        const patterns = data.patterns ?? []

        setEmrData(
          Object.entries(emrStats).map(([emr, s]) => ({
            emr,
            winRate: s.total > 0 ? Math.round(s.win * 100 / s.total) : 0,
            total: s.total,
          })).sort((a, b) => b.winRate - a.winRate)
        )

        setSizeData(
          Object.entries(sizeStats).map(([size, s]) => {
            const matchPatterns = patterns.filter((p: { hospital_size?: string; avg_days_to_win?: number }) => p.hospital_size === size && p.avg_days_to_win)
            const avgDays = matchPatterns.length > 0
              ? Math.round(matchPatterns.reduce((sum: number, p: { avg_days_to_win?: number }) => sum + (p.avg_days_to_win ?? 0), 0) / matchPatterns.length)
              : 0
            return {
              size,
              winRate: s.total > 0 ? Math.round(s.win * 100 / s.total) : 0,
              total: s.total,
              avgDays,
            }
          })
        )
        setLoading(false)
      })
  }, [])

  if (closedCount < MIN_DEALS) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <p className="text-4xl mb-3">📊</p>
        <h2 className="text-lg font-bold text-gray-900 mb-2">데이터 누적 중</h2>
        <p className="text-sm text-gray-500 mb-1">
          Win/Loss 결과가 최소 {MIN_DEALS}건 이상이어야 패턴이 나타납니다
        </p>
        <p className="text-sm text-gray-400">현재: {closedCount}건 완료</p>
        <div className="mt-6 h-2 bg-gray-100 rounded-full max-w-xs mx-auto">
          <div
            className="h-2 bg-yellow-400 rounded-full transition-all"
            style={{ width: `${Math.min(100, (closedCount / MIN_DEALS) * 100)}%` }}
          />
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">데이터 로딩 중...</div>
  }

  return (
    <div className="space-y-6">
      {/* EMR별 Win률 차트 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-700 mb-4">📈 EMR사별 Win률</h2>
        {emrData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={emrData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="emr" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
              <Tooltip formatter={(v) => [`${v}%`, 'Win률']} />
              <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                {emrData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.total < MIN_DEALS ? '#d1d5db' : entry.winRate >= 60 ? '#22c55e' : entry.winRate >= 40 ? '#eab308' : '#f87171'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">EMR 데이터 없음</p>
        )}
        <p className="text-xs text-gray-400 mt-2">* 회색: 데이터 {MIN_DEALS}건 미만</p>
      </div>

      {/* 병원 규모별 패턴 테이블 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-700 mb-4">🏥 병원 규모별 패턴</h2>
        {sizeData.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-xs text-gray-500 font-medium">규모</th>
                <th className="text-right py-2 text-xs text-gray-500 font-medium">Win률</th>
                <th className="text-right py-2 text-xs text-gray-500 font-medium">평균 계약일</th>
                <th className="text-right py-2 text-xs text-gray-500 font-medium">총 딜 수</th>
              </tr>
            </thead>
            <tbody>
              {sizeData.map((row, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2.5 text-gray-900">{row.size}</td>
                  <td className={`py-2.5 text-right font-semibold ${
                    row.winRate >= 60 ? 'text-green-600' : row.winRate >= 40 ? 'text-yellow-600' : 'text-gray-400'
                  }`}>
                    {row.total < MIN_DEALS ? '-' : `${row.winRate}%`}
                  </td>
                  <td className="py-2.5 text-right text-gray-600">
                    {row.avgDays > 0 ? `${row.avgDays}일` : '-'}
                  </td>
                  <td className="py-2.5 text-right text-gray-400">{row.total}건</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">규모 데이터 없음</p>
        )}
      </div>
    </div>
  )
}
