import { Suspense } from 'react'
import DealsClient from './DealsClient'

export default function DealsPage() {
  return (
    <Suspense fallback={
      <div className="p-6 max-w-5xl mx-auto">
        <div className="h-8 bg-gray-100 rounded-lg w-32 animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <DealsClient />
    </Suspense>
  )
}
