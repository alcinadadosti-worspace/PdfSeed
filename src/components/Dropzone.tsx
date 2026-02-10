import { useCallback, useState, useRef } from 'react'

interface DropzoneProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
}

export function Dropzone({ onFileSelect, disabled }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const files = e.dataTransfer.files
      if (files.length > 0) {
        const file = files[0]
        if (file.type === 'application/pdf') {
          onFileSelect(file)
        }
      }
    },
    [onFileSelect, disabled]
  )

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelect(files[0])
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center
        w-full max-w-2xl mx-auto p-12
        border-2 border-dashed rounded-2xl
        transition-all duration-200 cursor-pointer
        ${
          isDragging
            ? 'border-accent bg-accent/10 scale-[1.02]'
            : 'border-dark-500 hover:border-dark-400 hover:bg-dark-700/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      <div
        className={`
        w-16 h-16 rounded-2xl mb-4 flex items-center justify-center
        ${isDragging ? 'bg-accent' : 'bg-dark-600'}
        transition-colors
      `}
      >
        <svg
          className={`w-8 h-8 ${isDragging ? 'text-white' : 'text-zinc-400'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </div>

      <h3 className="text-lg font-medium text-white mb-2">
        {isDragging ? 'Solte o arquivo aqui' : 'Arraste seu PDF de holerites'}
      </h3>
      <p className="text-sm text-zinc-500">
        ou clique para selecionar um arquivo
      </p>
      <p className="text-xs text-zinc-600 mt-4">
        Processamento 100% local - seus dados nunca saem do navegador
      </p>
    </div>
  )
}
