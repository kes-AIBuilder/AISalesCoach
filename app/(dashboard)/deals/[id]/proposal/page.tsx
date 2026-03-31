'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'

export default function ProposalPage() {
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [proposal, setProposal] = useState('')
  const [error, setError] = useState('')

  async function generateProposal() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/proposal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deal_id: id }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? '제안서 생성 실패')
    } else {
      setProposal(data.proposal)
    }
    setLoading(false)
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(proposal)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">제안서 초안</h1>
          <p className="text-sm text-gray-500 mt-0.5">고객 맥락 기반 AI 자동 생성</p>
        </div>
        <Link href={`/deals/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← 딜로 돌아가기
        </Link>
      </div>

      {!proposal ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-gray-600 text-sm mb-6">
            딜의 고객 맥락과 서비스 정보를 기반으로<br />맞춤형 제안서 초안을 생성합니다
          </p>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <button
            onClick={generateProposal}
            disabled={loading}
            className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-gray-900 font-bold rounded-xl text-sm transition-colors"
          >
            {loading ? '✨ 생성 중...' : '✨ 제안서 초안 생성'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              📋 복사
            </button>
            <button
              onClick={() => setProposal('')}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              🔄 재생성
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="prose prose-sm max-w-none
              [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-4
              [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-800 [&_h2]:mt-6 [&_h2]:mb-3
              [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-gray-700 [&_p]:mb-2
              [&_li]:text-sm [&_li]:text-gray-700 [&_li]:leading-relaxed
              [&_ul]:my-2 [&_ol]:my-2
              [&_strong]:text-gray-900
            ">
              <ReactMarkdown>{proposal}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
