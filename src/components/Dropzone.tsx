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
        border-2 border-dashed rounded-3xl
        transition-all duration-300 cursor-pointer
        bg-white/60 backdrop-blur-sm
        ${
          isDragging
            ? 'border-leaf bg-leaf/10 scale-[1.02] shadow-lg shadow-leaf/20'
            : 'border-sage-300 hover:border-leaf-muted hover:bg-cream-100/80 hover:shadow-md'
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
        w-20 h-20 rounded-3xl mb-5 flex items-center justify-center
        transition-all duration-300
        ${isDragging
          ? 'bg-gradient-to-br from-leaf to-leaf-dark shadow-lg shadow-leaf/30'
          : 'bg-gradient-to-br from-sage-100 to-sage-200'}
      `}
      >
        {/* Seedling/Sprout Icon */}
        <svg
          className={`w-10 h-10 transition-colors ${isDragging ? 'text-white' : 'text-leaf'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 21V11m0 0c0-3.5 3-6 6-6.5-1 4-3 5.5-6 6.5zm0 0c0-3.5-3-6-6-6.5 1 4 3 5.5 6 6.5z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 21c-2 0-4-.5-4-2s2-2 4-2 4 .5 4 2-2 2-4 2z"
          />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-sage-800 mb-2">
        {isDragging ? 'Solte o arquivo aqui' : 'Arraste seu PDF de holerites'}
      </h3>
      <p className="text-sm text-sage-500">
        ou clique para selecionar um arquivo
      </p>
      <div className="flex items-center gap-2 mt-5 px-4 py-2 bg-sage-50 rounded-full">
        <svg className="w-4 h-4 text-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p className="text-xs text-sage-600">
          Processamento 100% local - seus dados nunca saem do navegador
        </p>
      </div>
    </div>
  )
}
