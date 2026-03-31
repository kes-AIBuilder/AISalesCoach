'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type UploadStatus = 'idle' | 'uploading' | 'transcribing' | 'analyzing' | 'done' | 'error'

const STATUS_LABELS: Record<UploadStatus, string> = {
  idle: '',
  uploading: '업로드 중...',
  transcribing: '음성 변환 중...',
  analyzing: 'AI 분석 중...',
  done: '완료!',
  error: '오류 발생',
}

interface Props {
  dealId: string
  onSuccess?: () => void
}

export default function AudioUpload({ dealId, onSuccess }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [dragging, setDragging] = useState(false)
  const [result, setResult] = useState<{ summary: string; transcribed_text: string } | null>(null)
  const [error, setError] = useState('')

  async function processFile(file: File) {
    setStatus('uploading')
    setError('')
    setResult(null)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('deal_id', dealId)

    setStatus('transcribing')
    const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
    setStatus('analyzing')
    const data = await res.json()

    if (!res.ok) {
      setStatus('error')
      setError(data.error ?? '처리 실패')
    } else {
      setStatus('done')
      setResult({
        summary: data.analysis.summary,
        transcribed_text: data.transcribed_text,
      })
      router.refresh()
      if (onSuccess) onSuccess()
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return
    processFile(files[0])
  }

  const isLoading = ['uploading', 'transcribing', 'analyzing'].includes(status)

  return (
    <div className="space-y-3">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => !isLoading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragging ? 'border-yellow-400 bg-yellow-50' :
          isLoading ? 'border-gray-200 bg-gray-50 cursor-not-allowed' :
          'border-gray-300 hover:border-yellow-400 hover:bg-yellow-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.mp4,.m4a,.wav,.webm,.ogg"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="space-y-2">
            <div className="animate-spin text-2xl">⚙️</div>
            <p className="text-sm font-medium text-gray-700">{STATUS_LABELS[status]}</p>
            <div className="flex justify-center gap-1">
              {(['uploading', 'transcribing', 'analyzing'] as UploadStatus[]).map(s => (
                <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${
                  status === s ? 'bg-yellow-400' :
                  ['transcribing', 'analyzing'].includes(status) && s === 'uploading' ? 'bg-green-400' :
                  status === 'analyzing' && s === 'transcribing' ? 'bg-green-400' :
                  'bg-gray-200'
                }`} />
              ))}
            </div>
          </div>
        ) : (
          <>
            <p className="text-2xl mb-2">🎙️</p>
            <p className="text-sm text-gray-600">음성 파일을 드래그하거나 클릭해서 업로드</p>
            <p className="text-xs text-gray-400 mt-1">.mp3 .m4a .wav .webm · 최대 25MB</p>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {status === 'done' && result && (
        <div className="bg-blue-50 rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium text-blue-900">✅ 분석 완료</p>
          <p className="text-sm text-gray-700">{result.summary}</p>
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">변환된 텍스트 보기</summary>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">{result.transcribed_text}</p>
          </details>
        </div>
      )}
    </div>
  )
}
