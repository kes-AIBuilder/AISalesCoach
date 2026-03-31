'use client'

import { useState } from 'react'
import type { MeetingLog } from '@/types'
import MemoInput from './MemoInput'
import AudioUpload from './AudioUpload'

interface Props {
  dealId: string
  logs: MeetingLog[]
}

export default function MemoSection({ dealId, logs }: Props) {
  const [tab, setTab] = useState<'text' | 'audio'>('text')

  return (
    <div className="space-y-4">
      {/* 탭 */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['text', 'audio'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'text' ? '✏️ 텍스트' : '🎙️ 음성'}
          </button>
        ))}
      </div>

      {tab === 'text' ? <MemoInput dealId={dealId} /> : <AudioUpload dealId={dealId} />}

      {/* 미팅 로그 타임라인 */}
      {logs.length > 0 && (
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <p className="text-xs font-semibold text-gray-500">미팅 이력 ({logs.length}건)</p>
          {logs.map(log => (
            <div key={log.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0" />
                <div className="w-px bg-gray-200 flex-1 mt-1" />
              </div>
              <div className="pb-3 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400">
                    {new Date(log.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-xs text-gray-400">
                    {log.input_type === 'audio' ? '🎙️ 음성' : '✏️ 텍스트'}
                  </span>
                </div>
                {log.ai_summary && (
                  <p className="text-sm text-gray-700">{log.ai_summary}</p>
                )}
                {log.extracted?.next_actions?.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {log.extracted.next_actions.map((a, i) => (
                      <span key={i} className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
                        → {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
