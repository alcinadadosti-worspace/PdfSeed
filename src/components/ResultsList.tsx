import { ResultItem, PageResult } from './ResultItem'

interface ResultsListProps {
  results: PageResult[]
  onNameChange: (pageIndex: number, name: string) => void
  onDownload: (pageIndex: number, name: string) => void
  onDownloadAll: () => void
  onPrepareSlack?: () => void
  downloadingIndex?: number | null
  isDownloadingAll?: boolean
  downloadAllProgress?: { current: number; total: number } | null
}

export function ResultsList({
  results,
  onNameChange,
  onDownload,
  onDownloadAll,
  onPrepareSlack,
  downloadingIndex,
  isDownloadingAll,
  downloadAllProgress,
}: ResultsListProps) {
  const needsReviewCount = results.filter((r) => !r.name).length
  const okCount = results.length - needsReviewCount

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 p-5 bg-white/60 backdrop-blur-sm rounded-2xl border border-sage-200">
        <div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-sage-800">
              {results.length} holerites encontrados
            </h2>
          </div>
          <p className="text-sm text-sage-500 mt-1 ml-7">
            <span className="text-leaf font-medium">{okCount}</span> identificados automaticamente
            {needsReviewCount > 0 && (
              <span className="text-amber-600 font-medium">
                {' '}| {needsReviewCount} para revisar
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-3">
          {onPrepareSlack && (
            <button
              onClick={onPrepareSlack}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4A154B] to-[#611f69] hover:from-[#611f69] hover:to-[#7c2d7e] text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" />
              </svg>
              <span>Enviar via Slack</span>
            </button>
          )}

          <button
            onClick={onDownloadAll}
            disabled={isDownloadingAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-leaf to-leaf-dark hover:from-leaf-dark hover:to-sage-800 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
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
