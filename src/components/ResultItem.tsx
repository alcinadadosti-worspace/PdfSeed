import { useState } from 'react'

export interface PageResult {
  pageIndex: number
  pageNumber: number
  name: string | null
  isEditing?: boolean
}

interface ResultItemProps {
  result: PageResult
  onNameChange: (pageIndex: number, name: string) => void
  onDownload: (pageIndex: number, name: string) => void
  isDownloading?: boolean
}

export function ResultItem({
  result,
  onNameChange,
  onDownload,
  isDownloading,
}: ResultItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(
    result.name || `SEM NOME - PAGINA ${result.pageNumber}`
  )

  const displayName = result.name || `SEM NOME - PAGINA ${result.pageNumber}`
  const needsReview = !result.name

  const handleEdit = () => {
    setEditValue(displayName)
    setIsEditing(true)
  }

  const handleSave = () => {
    const newName = editValue.trim() || `SEM NOME - PAGINA ${result.pageNumber}`
    onNameChange(result.pageIndex, newName)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(displayName)
      setIsEditing(false)
    }
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-dark-700 rounded-xl border border-dark-600 hover:border-dark-500 transition-colors">
      {/* Page Number */}
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-dark-600 flex items-center justify-center">
        <span className="text-sm font-mono text-zinc-400">
          {result.pageNumber}
        </span>
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value.toUpperCase())}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full px-3 py-1.5 bg-dark-800 border border-dark-500 rounded-lg text-white text-sm focus:outline-none focus:border-accent"
          />
        ) : (
          <div className="flex items-center gap-2">
            <span
              className="text-white font-medium truncate cursor-pointer hover:text-accent"
              onClick={handleEdit}
              title="Clique para editar"
            >
              {displayName}
            </span>
            <button
              onClick={handleEdit}
              className="flex-shrink-0 p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Editar nome"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          </div>
        )}
        <p className="text-xs text-zinc-500 mt-0.5">{displayName}.pdf</p>
      </div>

      {/* Status Badge */}
      <div className="flex-shrink-0">
        {needsReview ? (
          <span className="px-2.5 py-1 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full">
            Revisar
          </span>
        ) : (
          <span className="px-2.5 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
            OK
          </span>
        )}
      </div>

      {/* Download Button */}
      <button
        onClick={() => onDownload(result.pageIndex, displayName)}
        disabled={isDownloading}
        className="flex-shrink-0 px-4 py-2 text-sm font-medium bg-dark-600 hover:bg-dark-500 text-white rounded-lg transition-colors disabled:opacity-50"
      >
        {isDownloading ? (
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          'Baixar'
        )}
      </button>
    </div>
  )
}
