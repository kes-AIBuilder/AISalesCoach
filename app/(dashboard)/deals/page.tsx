import DealsClient from './DealsClient'

export default function DealsPage({
  searchParams,
}: {
  searchParams: { stage?: string }
}) {
  const stageFilter = searchParams?.stage ?? null
  return <DealsClient stageFilter={stageFilter} />
}
