import DealsClient from './DealsClient'

// Next.js 14.2.x+에서 searchParams가 Promise로 변경됨
export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }> | { stage?: string }
}) {
  const sp = await searchParams
  const stageFilter = sp?.stage ?? null
  return <DealsClient stageFilter={stageFilter} />
}
