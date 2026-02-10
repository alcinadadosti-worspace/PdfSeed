interface ProgressBarProps {
  current: number
  total: number
  label?: string
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100)

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-zinc-400">{label}</span>
          <span className="text-sm font-mono text-zinc-500">
            {current}/{total}
          </span>
        </div>
      )}
      <div className="w-full h-2 bg-dark-600 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
