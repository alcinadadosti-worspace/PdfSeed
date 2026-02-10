import { ResultItem, PageResult } from './ResultItem'

interface ResultsListProps {
  results: PageResult[]
  onNameChange: (pageIndex: number, name: string) => void
  onDownload: (pageIndex: number, name: string) => void
  onDownloadAll: () => void
  downloadingIndex?: number | null
  isDownloadingAll?: boolean
  downloadAllProgress?: { current: number; total: number } | null
}

export function ResultsList({
  results,
  onNameChange,
  onDownload,
  onDownloadAll,
  downloadingIndex,
  isDownloadingAll,
  downloadAllProgress,
}: ResultsListProps) {
  const needsReviewCount = results.filter((r) => !r.name).length
  const okCount = results.length - needsReviewCount

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {results.length} holerites encontrados
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {okCount} identificados automaticamente
            {needsReviewCount > 0 && (
              <span className="text-amber-400">
                {' '}
                | {needsReviewCount} para revisar
              </span>
            )}
          </p>
        </div>

        <button
          onClick={onDownloadAll}
          disabled={isDownloadingAll}
          className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {isDownloadingAll ? (
            <>
              <svg
                className="w-5 h-5 animate-spin"
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
              <span>
                {downloadAllProgress
                  ? `${downloadAllProgress.current}/${downloadAllProgress.total}`
                  : 'Preparando...'}
              </span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span>Baixar tudo (.zip)</span>
            </>
          )}
        </button>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {results.map((result) => (
          <ResultItem
            key={result.pageIndex}
            result={result}
            onNameChange={onNameChange}
            onDownload={onDownload}
            isDownloading={downloadingIndex === result.pageIndex}
          />
        ))}
      </div>
    </div>
  )
}
