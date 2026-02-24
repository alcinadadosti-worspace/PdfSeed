import { useState, useCallback } from 'react'
import { TopBar } from './components/TopBar'
import { Dropzone } from './components/Dropzone'
import { ProgressBar } from './components/ProgressBar'
import { ResultsList } from './components/ResultsList'
import { PageResult } from './components/ResultItem'
import { EmailVerification } from './components/EmailVerification'
import { EmailSummary } from './components/EmailSummary'
import { SlackSummary } from './components/SlackSummary'
import { extractTextFromPDF } from './lib/pdfText'
import { extractSinglePage, downloadPDF } from './lib/pdfSplit'
import { extractEmployeeName } from './lib/nameExtract'
import { createZipWithPDFs, downloadZip } from './lib/zip'
import { deduplicateFilenames } from './lib/dedupe'
import { loadEmployeeListFromPath, Employee } from './lib/excel'
import { matchEmployees, EmailMatch } from './lib/emailMatch'

type AppState =
  | 'idle'
  | 'processing'
  | 'ready'
  | 'email_verification'
  | 'email_summary'
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

  // Email matching state
  const [employees, setEmployees] = useState<Employee[]>([])
  const [emailMatches, setEmailMatches] = useState<EmailMatch[]>([])
  const [isLoadingExcel, setIsLoadingExcel] = useState(false)

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
    setEmployees([])
    setEmailMatches([])
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

  // Email flow handlers
  const handlePrepareEmails = useCallback(async () => {
    setIsLoadingExcel(true)
    setError(null)

    try {
      const employeeList = await loadEmployeeListFromPath()
      setEmployees(employeeList)

      // Match employees with PDF results
      const matches = matchEmployees(results, employeeList)
      setEmailMatches(matches)

      setState('email_verification')
    } catch (err) {
      console.error('Error loading employee list:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao carregar a planilha de emails.'
      )
    } finally {
      setIsLoadingExcel(false)
    }
  }, [results])


  const handleMatchUpdate = useCallback(
    (pageIndex: number, employee: Employee | null) => {
      setEmailMatches((prev) =>
        prev.map((m) =>
          m.pageIndex === pageIndex
            ? {
                ...m,
                employee,
                matchScore: employee ? 100 : 0,
                status: employee ? 'manual' : m.status,
              }
            : m
        )
      )
    },
    []
  )

  const handleSlackConfirm = useCallback(() => {
    setState('slack_summary')
  }, [])

  const handleEmailBack = useCallback(() => {
    setState('email_verification')
  }, [])

  const handleSlackBack = useCallback(() => {
    setState('email_verification')
  }, [])

  const handleBackToResults = useCallback(() => {
    setState('ready')
    setEmailMatches([])
  }, [])

  const handleExportList = useCallback(() => {
    const validMatches = emailMatches.filter((m) => m.employee !== null)

    // Create CSV content
    const csvHeader = 'Pagina,Nome no PDF,Email,Nome na Planilha\n'
    const csvRows = validMatches
      .map(
        (m) =>
          `${m.pageNumber},"${m.pdfName || ''}","${m.employee?.email || ''}","${
            m.employee?.name || ''
          }"`
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
  }, [emailMatches])

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <TopBar hasFile={state !== 'idle'} onClear={handleClear} />

      <main className="container mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
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
            <div className="w-full max-w-md">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/20 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-accent animate-spin"
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
                </div>
                <h2 className="text-xl font-semibold mb-2">Processando...</h2>
                <p className="text-zinc-400">{progress.label}</p>
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
            onPrepareEmails={handlePrepareEmails}
            downloadingIndex={downloadingIndex}
            isDownloadingAll={isDownloadingAll}
            isLoadingEmails={isLoadingExcel}
            downloadAllProgress={downloadAllProgress}
          />
        )}

        {/* Email Verification State */}
        {state === 'email_verification' && (
          <EmailVerification
            matches={emailMatches}
            employees={employees}
            onMatchUpdate={handleMatchUpdate}
            onSlackConfirm={handleSlackConfirm}
            onCancel={handleBackToResults}
          />
        )}

        {/* Email Summary State */}
        {state === 'email_summary' && pdfData && (
          <EmailSummary
            matches={emailMatches}
            pdfData={pdfData}
            onBack={handleEmailBack}
            onExportList={handleExportList}
          />
        )}

        {/* Slack Summary State */}
        {state === 'slack_summary' && pdfData && (
          <SlackSummary
            matches={emailMatches}
            pdfData={pdfData}
            onBack={handleSlackBack}
            onExportList={handleExportList}
          />
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Ocorreu um erro</h2>
              <p className="text-zinc-400 mb-6">
                Não foi possível processar o arquivo.
              </p>
              <button
                onClick={handleClear}
                className="px-6 py-3 bg-dark-700 hover:bg-dark-600 rounded-xl transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 text-center text-xs text-zinc-600 bg-dark-900/80 backdrop-blur">
        Seus arquivos nunca saem do navegador. Processamento 100% local.
      </footer>
    </div>
  )
}
