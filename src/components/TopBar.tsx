interface TopBarProps {
  hasFile: boolean
  onClear: () => void
}

export function TopBar({ hasFile, onClear }: TopBarProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-sage-200 bg-cream-50/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-leaf to-leaf-dark flex items-center justify-center shadow-md shadow-leaf/20">
          {/* Leaf/Seedling Icon */}
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 21c0-6 4-10 9-11-1 5-5 9-9 11zm0 0c0-6-4-10-9-11 1 5 5 9 9 11zm0 0V11m0 0c0-3 2-6 5-7-1 3-2 5-5 7zm0 0c0-3-2-6-5-7 1 3 2 5 5 7z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-sage-800 tracking-tight">PDFSeed</h1>
          <p className="text-sm text-sage-500">Separador de Holerites</p>
        </div>
      </div>

      {hasFile && (
        <button
          onClick={onClear}
          className="px-4 py-2 text-sm font-medium text-sage-600 hover:text-sage-800 hover:bg-sage-100 rounded-xl transition-colors border border-sage-200"
        >
          Limpar
        </button>
      )}
    </header>
  )
}
