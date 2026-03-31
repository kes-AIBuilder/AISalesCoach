import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lemon Sales Coach',
  description: '레몬헬스케어 AI 영업 코치',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
