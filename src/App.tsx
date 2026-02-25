import { useState, useCallback } from 'react'
import { TopBar } from './components/TopBar'
import { Dropzone } from './components/Dropzone'
import { ProgressBar } from './components/ProgressBar'
import { ResultsList } from './components/ResultsList'
import { PageResult } from './components/ResultItem'
import { SlackSummary } from './components/SlackSummary'
import { extractTextFromPDF } from './lib/pdfText'
import { extractSinglePage, downloadPDF } from './lib/pdfSplit'
import { extractEmployeeName } from './lib/nameExtract'
import { createZipWithPDFs, downloadZip } from './lib/zip'
import { deduplicateFilenames } from './lib/dedupe'
import { getSlackIdByName } from './lib/slackMapping'
import { EmailMatch } from './lib/emailMatch'

type AppState =
  | 'idle'
  | 'processing'
  | 'ready'
  | 'slack_summary'
  | 'error'

interface Progress {
  current: number
  total: number
  label: string
}

export default function App() {
  const [state, setState] = useState<AppState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [results, setResults] = useState<PageResult[]>([])
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null)
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null)
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [downloadAllProgress, setDownloadAllProgress] = useState<{
    current: number
    total: number
  } | null>(null)

  // Slack matches
  const [slackMatches, setSlackMatches] = useState<EmailMatch[]>([])

  const handleFileSelect = useCallback(async (file: File) => {
    setState('processing')
    setError(null)
    setResults([])
    setProgress({ current: 0, total: 1, label: 'Carregando PDF...' })

    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()

      // Make a copy for pdf-lib (pdfjs may detach the original)
      const pdfDataCopy = arrayBuffer.slice(0)
      setPdfData(pdfDataCopy)

      // Extract text from all pages (use original, pdfjs will handle it)
      setProgress({ current: 0, total: 1, label: 'Extraindo texto...' })

      const pageTexts = await extractTextFromPDF(
        arrayBuffer.slice(0), // Pass a copy to pdfjs too
        (current, total) => {
          setProgress({
            current,
            total,
            label: `Extraindo texto das páginas (${current}/${total})...`,
          })
        }
      )

      // Extract names from each page
      setProgress({
        current: 0,
        total: pageTexts.length,
        label: 'Identificando funcionários...',
      })

      const pageResults: PageResult[] = []

      for (let i = 0; i < pageTexts.length; i++) {
        const { pageNumber, text } = pageTexts[i]
        const name = extractEmployeeName(text)

        pageResults.push({
          pageIndex: i,
          pageNumber,
          name,
        })

        setProgress({
          current: i + 1,
          total: pageTexts.length,
          label: `Identificando funcionários (${i + 1}/${pageTexts.length})...`,
        })

        // Yield to UI
        await new Promise((r) => setTimeout(r, 0))
      }

      setResults(pageResults)
      setState('ready')
      setProgress(null)
    } catch (err) {
      console.error('Error processing PDF:', err)
      setError(
        err instanceof Error ? err.message : 'Erro ao processar o PDF. Tente novamente.'
      )
      setState('error')
      setProgress(null)
    }
  }, [])

  const handleClear = useCallback(() => {
    setState('idle')
    setError(null)
    setProgress(null)
    setResults([])
    setPdfData(null)
    setDownloadingIndex(null)
    setIsDownloadingAll(false)
    setDownloadAllProgress(null)
    setSlackMatches([])
  }, [])

  const handleNameChange = useCallback((pageIndex: number, name: string) => {
    setResults((prev) =>
      prev.map((r) => (r.pageIndex === pageIndex ? { ...r, name } : r))
    )
  }, [])

  const handleDownload = useCallback(
    async (pageIndex: number, name: string) => {
      if (!pdfData) return

      setDownloadingIndex(pageIndex)

      try {
        const pageData = await extractSinglePage(pdfData, pageIndex)
        downloadPDF(pageData, `${name}.pdf`)
      } catch (err) {
        console.error('Error downloading PDF:', err)
        setError('Erro ao gerar o PDF. Tente novamente.')
      } finally {
        setDownloadingIndex(null)
      }
    },
    [pdfData]
  )

  const handleDownloadAll = useCallback(async () => {
    if (!pdfData || results.length === 0) return

    setIsDownloadingAll(true)
    setDownloadAllProgress({ current: 0, total: results.length })

    try {
      // Prepare entries with deduplicated names
      const names = results.map(
        (r) => r.name || `SEM NOME - PAGINA ${r.pageNumber}`
      )
      const uniqueNames = deduplicateFilenames(names)

      const entries = results.map((r, i) => ({
        name: uniqueNames[i],
        pageIndex: r.pageIndex,
      }))

      const zipBlob = await createZipWithPDFs(
        pdfData,
        entries,
        (current, total) => {
          setDownloadAllProgress({ current, total })
        }
      )

      downloadZip(zipBlob, 'holerites_separados.zip')
    } catch (err) {
      console.error('Error creating ZIP:', err)
      setError('Erro ao criar o arquivo ZIP. Tente novamente.')
    } finally {
      setIsDownloadingAll(false)
      setDownloadAllProgress(null)
    }
  }, [pdfData, results])

  // Preparar envio via Slack
  const handlePrepareSlack = useCallback(() => {
    // Criar matches usando o mapeamento de Slack IDs
    const matches: EmailMatch[] = results.map((result) => {
      const slackId = result.name ? getSlackIdByName(result.name) : undefined

      if (slackId) {
        return {
          pageIndex: result.pageIndex,
          pageNumber: result.pageNumber,
          pdfName: result.name,
          employee: {
            name: result.name || '',
            email: '',
            slackId,
          },
          matchScore: 100,
          status: 'matched' as const,
        }
      }

      return {
        pageIndex: result.pageIndex,
        pageNumber: result.pageNumber,
        pdfName: result.name,
        employee: null,
        matchScore: 0,
        status: result.name ? 'not_found' as const : 'no_name' as const,
      }
    })

    setSlackMatches(matches)
    setState('slack_summary')
  }, [results])

  const handleSlackBack = useCallback(() => {
    setState('ready')
    setSlackMatches([])
  }, [])

  const handleExportList = useCallback(() => {
    const validMatches = slackMatches.filter((m) => m.employee !== null)

    // Create CSV content
    const csvHeader = 'Pagina,Nome,SlackId\n'
    const csvRows = validMatches
      .map(
        (m) =>
          `${m.pageNumber},"${m.pdfName || ''}","${m.employee?.slackId || ''}"`
      )
      .join('\n')

    const csvContent = csvHeader + csvRows

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lista_envio_holerites.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [slackMatches])

  return (
    <div className="min-h-screen text-sage-800">
      <TopBar hasFile={state !== 'idle'} onClear={handleClear} />

      <main className="container mx-auto px-4 py-8 pb-20">
        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Idle State - Dropzone */}
        {state === 'idle' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Dropzone onFileSelect={handleFileSelect} />
          </div>
        )}

        {/* Processing State */}
        {state === 'processing' && progress && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-md p-8 bg-white/60 backdrop-blur-sm rounded-3xl border border-sage-200 shadow-lg">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-leaf-muted/30 to-leaf/20 flex items-center justify-center">
                  {/* Animated leaf/seedling */}
                  <svg
                    className="w-10 h-10 text-leaf animate-pulse"
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
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2 text-sage-800">Processando...</h2>
                <p className="text-sage-500">{progress.label}</p>
              </div>
              <ProgressBar
                current={progress.current}
                total={progress.total}
              />
            </div>
          </div>
        )}

        {/* Ready State - Results */}
        {state === 'ready' && results.length > 0 && (
          <ResultsList
            results={results}
            onNameChange={handleNameChange}
            onDownload={handleDownload}
            onDownloadAll={handleDownloadAll}
            onPrepareSlack={handlePrepareSlack}
            downloadingIndex={downloadingIndex}
            isDownloadingAll={isDownloadingAll}
            downloadAllProgress={downloadAllProgress}
          />
        )}

        {/* Slack Summary State */}
        {state === 'slack_summary' && pdfData && (
          <SlackSummary
            matches={slackMatches}
            pdfData={pdfData}
            onBack={handleSlackBack}
            onExportList={handleExportList}
          />
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center p-8 bg-white/60 backdrop-blur-sm rounded-3xl border border-sage-200 shadow-lg">
              <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-red-50 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-sage-800">Ocorreu um erro</h2>
              <p className="text-sage-500 mb-6">
                Nao foi possivel processar o arquivo.
              </p>
              <button
                onClick={handleClear}
                className="px-6 py-3 bg-sage-100 hover:bg-sage-200 text-sage-700 rounded-xl transition-colors border border-sage-200"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 text-center text-xs text-sage-500 bg-cream-50/90 backdrop-blur-sm border-t border-sage-200">
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 text-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Seus arquivos nunca saem do navegador. Processamento 100% local.
        </div>
      </footer>
    </div>
  )
}
