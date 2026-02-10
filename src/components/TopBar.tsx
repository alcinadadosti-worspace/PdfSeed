interface TopBarProps {
  hasFile: boolean
  onClear: () => void
}

export function TopBar({ hasFile, onClear }: TopBarProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-dark-600">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white">PDFSeed</h1>
          <p className="text-sm text-zinc-400">Separador de Holerites</p>
        </div>
      </div>

      {hasFile && (
        <button
          onClick={onClear}
          className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-dark-600 rounded-lg transition-colors"
        >
          Limpar
        </button>
      )}
    </header>
  )
}
