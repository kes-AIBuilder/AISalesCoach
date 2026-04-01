'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="p-8 max-w-lg mx-auto mt-16">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-red-700 mb-2">에러 발생</h2>
        <p className="text-sm text-red-600 mb-3">{error.message || '알 수 없는 오류입니다.'}</p>
        {error.digest && (
          <p className="text-xs text-gray-500 font-mono mb-4">Digest: {error.digest}</p>
        )}
        <details className="text-xs text-gray-500 mb-4">
          <summary className="cursor-pointer hover:text-gray-700">스택 트레이스</summary>
          <pre className="mt-2 bg-white rounded p-3 overflow-auto text-xs border">
            {error.stack}
          </pre>
        </details>
        <button
          onClick={reset}
          className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg text-sm"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}
