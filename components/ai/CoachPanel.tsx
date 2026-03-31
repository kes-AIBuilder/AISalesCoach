'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface Props {
  dealId: string
}

export default function CoachPanel({ dealId }: Props) {
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [started, setStarted] = useState(false)

  async function askCoach() {
    setLoading(true)
    setContent('')
    setStarted(true)

    const res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deal_id: dealId }),
    })

    if (!res.ok || !res.body) {
      setContent('코치 응답을 가져오지 못했습니다. 다시 시도해주세요.')
      setLoading(false)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const json = JSON.parse(data)
            if (json.text) setContent(prev => prev + json.text)
          } catch {}
        }
      }
    }

    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <button
        onClick={askCoach}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50 text-gray-900 font-bold rounded-xl text-sm transition-all shadow-sm"
      >
        {loading ? '🤖 분석 중...' : '🤖 이 딜, 어떻게 이기나요?'}
      </button>

      {started && (
        <div className="bg-gray-50 rounded-xl p-4">
          {loading && !content && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</span>
              <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</span>
            </div>
          )}
          {content && (
            <div className="prose prose-sm max-w-none text-gray-800
              [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-4 [&_h2]:mb-2 [&_h2:first-child]:mt-0
              [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-2
              [&_li]:text-sm [&_li]:leading-relaxed
              [&_ul]:my-1 [&_ol]:my-1
              [&_strong]:text-gray-900
            ">
              <ReactMarkdown>{content}</ReactMarkdown>
              {loading && <span className="animate-pulse">▌</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
