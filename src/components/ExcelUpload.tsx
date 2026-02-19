import { useCallback, useState } from 'react'

interface ExcelUploadProps {
  onFileSelect: (file: File) => void
  onSkip: () => void
  isLoading?: boolean
}

export function ExcelUpload({ onFileSelect, onSkip, isLoading }: ExcelUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
        onFileSelect(file)
      }
    },
    [onFileSelect]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onFileSelect(file)
      }
    },
    [onFileSelect]
  )

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/20 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Carregar Planilha de Emails</h2>
        <p className="text-zinc-400 text-sm">
          Selecione a planilha com os nomes e emails dos funcionarios para fazer o
          match automatico.
        </p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${
          isDragging
            ? 'border-green-400 bg-green-400/5'
            : 'border-dark-500 hover:border-dark-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="text-center">
            <svg
              className="w-10 h-10 text-green-400 animate-spin mx-auto mb-3"
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
            <p className="text-zinc-400">Carregando planilha...</p>
          </div>
        ) : (
          <div className="text-center">
            <svg
              className="w-10 h-10 text-green-400 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-white font-medium mb-1">
              Arraste a planilha aqui ou clique para selecionar
            </p>
            <p className="text-zinc-500 text-sm">Arquivos .xlsx ou .xls</p>
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-dark-700 rounded-xl border border-dark-600">
        <h4 className="text-sm font-medium text-zinc-300 mb-2">
          Formato esperado da planilha:
        </h4>
        <ul className="text-xs text-zinc-400 space-y-1">
          <li>
            - Coluna de nome: <code className="text-zinc-300">Nome</code>,{' '}
            <code className="text-zinc-300">Funcionario</code> ou{' '}
            <code className="text-zinc-300">Colaborador</code>
          </li>
          <li>
            - Coluna de email: <code className="text-zinc-300">Email</code> ou{' '}
            <code className="text-zinc-300">E-mail</code>
          </li>
        </ul>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={onSkip}
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Pular e apenas baixar os holerites
        </button>
      </div>
    </div>
  )
}
