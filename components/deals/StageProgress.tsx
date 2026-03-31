import type { DealStage } from '@/types'
import { STAGE_LABELS, STAGE_ORDER } from '@/types'

interface Props {
  currentStage: DealStage
  onStageChange?: (stage: DealStage) => void
  readonly?: boolean
}

export default function StageProgress({ currentStage, onStageChange, readonly }: Props) {
  const currentIdx = STAGE_ORDER.indexOf(currentStage)

  return (
    <div className="flex items-center gap-1">
      {STAGE_ORDER.map((stage, idx) => {
        const isCompleted = idx < currentIdx
        const isCurrent = idx === currentIdx
        const isClickable = !readonly && onStageChange

        return (
          <div key={stage} className="flex items-center">
            <button
              onClick={() => isClickable && onStageChange(stage)}
              disabled={readonly}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isCurrent
                  ? 'bg-yellow-400 text-gray-900'
                  : isCompleted
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-400'
              } ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
            >
              {STAGE_LABELS[stage]}
            </button>
            {idx < STAGE_ORDER.length - 1 && (
              <span className={`mx-0.5 text-xs ${isCompleted ? 'text-green-400' : 'text-gray-300'}`}>›</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
