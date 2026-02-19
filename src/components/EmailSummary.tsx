import { useState } from 'react'
import { EmailMatch } from '../lib/emailMatch'
import { extractSinglePage, downloadPDF } from '../lib/pdfSplit'

interface EmailSummaryProps {
  matches: EmailMatch[]
  pdfData: ArrayBuffer
  onBack: () => void
  onExportList: () => void
}

export function EmailSummary({
  matches,
  pdfData,
  onBack,
  onExportList,
}: EmailSummaryProps) {
  const validMatches = matches.filter((m) => m.employee !== null)
  const skippedMatches = matches.filter((m) => m.employee === null)

  const [sentEmails, setSentEmails] = useState<Set<number>>(new Set())
  const [sendingIndex, setSendingIndex] = useState<number | null>(null)

  const handleSendEmail = async (match: EmailMatch) => {
    if (!match.employee) return

    setSendingIndex(match.pageIndex)

    try {
      // 1. Extract and download the PDF
      const pageData = await extractSinglePage(pdfData, match.pageIndex)
      const fileName = `${match.pdfName || 'Holerite'}.pdf`
      downloadPDF(pageData, fileName)

      // 2. Wait a bit for download to start
      await new Promise((r) => setTimeout(r, 500))

      // 3. Open mailto with pre-filled data
      const subject = encodeURIComponent('Seu Holerite')
      const body = encodeURIComponent(
        `Olá ${match.employee.name},\n\nSegue em anexo o seu holerite.\n\nAtenciosamente.`
      )
      const mailtoUrl = `mailto:${match.employee.email}?subject=${subject}&body=${body}`

      window.open(mailtoUrl, '_blank')

      // 4. Mark as sent
      setSentEmails((prev) => new Set([...prev, match.pageIndex]))
    } catch (err) {
      console.error('Error sending email:', err)
    } finally {
      setSendingIndex(null)
    }
  }

  const handleSendAll = async () => {
    for (const match of validMatches) {
      if (!sentEmails.has(match.pageIndex)) {
        await handleSendEmail(match)
        // Wait between each to avoid overwhelming the browser
        await new Promise((r) => setTimeout(r, 1000))
      }
    }
  }

  const sentCount = sentEmails.size
  const remainingCount = validMatches.length - sentCount

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Enviar Holerites</h2>
        <p className="text-zinc-400">
          Clique em "Enviar" para baixar o PDF e abrir o email. Anexe o PDF e
          clique enviar.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-dark-700 rounded-xl border border-dark-600">
          <div className="text-3xl font-bold text-white">
            {validMatches.length}
          </div>
          <div className="text-sm text-zinc-400">Total</div>
        </div>
        <div className="p-4 bg-dark-700 rounded-xl border border-green-500/30">
          <div className="text-3xl font-bold text-green-400">{sentCount}</div>
          <div className="text-sm text-zinc-400">Enviados</div>
        </div>
        <div className="p-4 bg-dark-700 rounded-xl border border-amber-500/30">
          <div className="text-3xl font-bold text-amber-400">
            {remainingCount}
          </div>
          <div className="text-sm text-zinc-400">Restantes</div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">Como funciona</p>
            <p className="text-blue-300/80">
              1. Clique em "Enviar" - o PDF sera baixado automaticamente
              <br />
              2. O Outlook/Gmail abrira com o email preenchido
              <br />
              3. Anexe o PDF que foi baixado e clique enviar
            </p>
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Lista de Envio</h3>
          {remainingCount > 0 && (
            <button
              onClick={handleSendAll}
              disabled={sendingIndex !== null}
              className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Enviar Todos ({remainingCount})
            </button>
          )}
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {validMatches.map((match) => {
            const isSent = sentEmails.has(match.pageIndex)
            const isSending = sendingIndex === match.pageIndex

            return (
              <div
                key={match.pageIndex}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                  isSent
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-dark-700 border-dark-600'
                }`}
              >
                {/* Page Number */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-dark-600 flex items-center justify-center">
                  <span className="text-sm font-mono text-zinc-400">
                    {match.pageNumber}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">
                    {match.pdfName || 'SEM NOME'}
                  </div>
                  <div className="text-sm text-accent truncate">
                    {match.employee?.email}
                  </div>
                </div>

                {/* Status/Action */}
                <div className="flex-shrink-0">
                  {isSent ? (
                    <span className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-400">
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Enviado
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSendEmail(match)}
                      disabled={isSending}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSending ? (
                        <>
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
                          Abrindo...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          Enviar
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Skipped List */}
      {skippedMatches.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-zinc-400">
            Ignorados (sem email)
          </h3>
          <div className="bg-dark-700 rounded-xl border border-dark-600 p-4">
            <ul className="space-y-2">
              {skippedMatches.map((match) => (
                <li
                  key={match.pageIndex}
                  className="text-sm text-zinc-500 flex items-center gap-2"
                >
                  <span className="text-zinc-600">
                    Pag. {match.pageNumber}:
                  </span>
                  <span>{match.pdfName || 'SEM NOME'}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between p-4 bg-dark-800 rounded-xl border border-dark-600">
        <button
          onClick={onBack}
          className="px-5 py-2.5 text-sm font-medium bg-dark-600 hover:bg-dark-500 text-white rounded-lg transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={onExportList}
          className="px-5 py-2.5 text-sm font-medium bg-dark-600 hover:bg-dark-500 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
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
          Exportar CSV
        </button>
      </div>
    </div>
  )
}
