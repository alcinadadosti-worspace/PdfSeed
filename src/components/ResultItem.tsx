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
    <div className="flex items-center gap-4 p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-sage-200 hover:border-leaf-muted hover:shadow-md transition-all duration-200">
      {/* Page Number */}
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-sage-100 flex items-center justify-center">
        <span className="text-sm font-mono text-sage-600 font-medium">
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
            className="w-full px-3 py-1.5 bg-cream-100 border border-sage-300 rounded-xl text-sage-800 text-sm focus:outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
          />
        ) : (
          <div className="flex items-center gap-2">
            <span
              className="text-sage-800 font-medium truncate cursor-pointer hover:text-leaf"
              onClick={handleEdit}
              title="Clique para editar"
            >
              {displayName}
            </span>
            <button
              onClick={handleEdit}
              className="flex-shrink-0 p-1 text-sage-400 hover:text-leaf transition-colors"
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
        <p className="text-xs text-sage-500 mt-0.5">{displayName}.pdf</p>
      </div>

      {/* Status Badge */}
      <div className="flex-shrink-0">
        {needsReview ? (
          <span className="px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full border border-amber-200">
            Revisar
          </span>
        ) : (
          <span className="px-3 py-1.5 text-xs font-medium bg-leaf/10 text-leaf-dark rounded-full border border-leaf/20 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            OK
          </span>
        )}
      </div>

      {/* Download Button */}
      <button
        onClick={() => onDownload(result.pageIndex, displayName)}
        disabled={isDownloading}
        className="flex-shrink-0 px-4 py-2 text-sm font-medium bg-sage-100 hover:bg-sage-200 text-sage-700 rounded-xl transition-colors disabled:opacity-50 border border-sage-200"
      >
        {isDownloading ? (
          <svg
            className="w-4 h-4 animate-spin text-leaf"
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
