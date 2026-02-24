import { useState, useEffect } from 'react'
import { EmailMatch } from '../lib/emailMatch'
import { extractSinglePage } from '../lib/pdfSplit'
import { sendPdfToSlack, testSlackConnection } from '../lib/slackApi'

interface SlackSummaryProps {
  matches: EmailMatch[]
  pdfData: ArrayBuffer
  onBack: () => void
  onExportList: () => void
}

type SendStatus = 'pending' | 'sending' | 'sent' | 'error'

interface SendState {
  status: SendStatus
  error?: string
}

export function SlackSummary({
  matches,
  pdfData,
  onBack,
  onExportList,
}: SlackSummaryProps) {
  // Só considera válido se tiver employee COM slackId
  const validMatches = matches.filter((m) => m.employee?.slackId)
  // Ignorados: sem employee OU sem slackId
  const skippedMatches = matches.filter((m) => !m.employee?.slackId)

  const [sendStates, setSendStates] = useState<Map<number, SendState>>(
    new Map()
  )
  const [isSendingAll, setIsSendingAll] = useState(false)
  const [slackConnected, setSlackConnected] = useState<boolean | null>(null)
  const [slackTeam, setSlackTeam] = useState<string>('')

  // Test Slack connection on mount
  useEffect(() => {
    testSlackConnection().then((result) => {
      setSlackConnected(result.ok)
      if (result.team) setSlackTeam(result.team)
    }).catch(() => {
      setSlackConnected(false)
    })
  }, [])

  const getState = (pageIndex: number): SendState => {
    return sendStates.get(pageIndex) || { status: 'pending' }
  }

  const updateState = (pageIndex: number, state: SendState) => {
    setSendStates((prev) => new Map(prev).set(pageIndex, state))
  }

  const handleSendSlack = async (match: EmailMatch) => {
    if (!match.employee?.slackId) return

    updateState(match.pageIndex, { status: 'sending' })

    try {
      // 1. Extract the PDF page
      const pageData = await extractSinglePage(pdfData, match.pageIndex)
      const fileName = `${match.pdfName || 'Holerite'}.pdf`

      // 2. Send via Slack using Slack ID
      const result = await sendPdfToSlack(
        match.employee.slackId,
        pageData,
        fileName,
        match.employee.name
      )

      if (result.success) {
        updateState(match.pageIndex, { status: 'sent' })
      } else {
        updateState(match.pageIndex, {
          status: 'error',
          error: result.error || 'Erro desconhecido',
        })
      }
    } catch (err) {
      const error = err as Error
      console.error('Error sending via Slack:', error)
      updateState(match.pageIndex, {
        status: 'error',
        error: error.message || 'Erro ao conectar com servidor',
      })
    }
  }

  const handleSendAll = async () => {
    setIsSendingAll(true)

    for (const match of validMatches) {
      const state = getState(match.pageIndex)
      if (state.status !== 'sent') {
        await handleSendSlack(match)
        // Small delay between sends
        await new Promise((r) => setTimeout(r, 300))
      }
    }

    setIsSendingAll(false)
  }

  const sentCount = Array.from(sendStates.values()).filter(
    (s) => s.status === 'sent'
  ).length
  const errorCount = Array.from(sendStates.values()).filter(
    (s) => s.status === 'error'
  ).length
  const remainingCount = validMatches.length - sentCount

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
          </svg>
          Enviar via Slack
        </h2>
        <p className="text-zinc-400">
          Os holerites serão enviados diretamente via DM no Slack.
        </p>
      </div>

      {/* Slack Connection Status */}
      <div
        className={`mb-6 p-4 rounded-xl border ${
          slackConnected === null
            ? 'bg-zinc-500/10 border-zinc-500/30'
            : slackConnected
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}
      >
        <div className="flex items-center gap-3">
          {slackConnected === null ? (
            <>
              <svg
                className="w-5 h-5 text-zinc-400 animate-spin"
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
              <span className="text-zinc-400">Verificando conexão...</span>
            </>
          ) : slackConnected ? (
            <>
              <svg
                className="w-5 h-5 text-green-400"
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
              <span className="text-green-400">
                Conectado ao Slack{slackTeam && `: ${slackTeam}`}
              </span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span className="text-red-400">
                Slack não conectado. Verifique o servidor e o token.
              </span>
            </>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
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
        <div className="p-4 bg-dark-700 rounded-xl border border-red-500/30">
          <div className="text-3xl font-bold text-red-400">{errorCount}</div>
          <div className="text-sm text-zinc-400">Erros</div>
        </div>
        <div className="p-4 bg-dark-700 rounded-xl border border-amber-500/30">
          <div className="text-3xl font-bold text-amber-400">
            {remainingCount}
          </div>
          <div className="text-sm text-zinc-400">Restantes</div>
        </div>
      </div>

      {/* Send List */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Lista de Envio</h3>
          {remainingCount > 0 && slackConnected && (
            <button
              onClick={handleSendAll}
              disabled={isSendingAll}
              className="px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSendingAll ? (
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
                  Enviando...
                </>
              ) : (
                <>Enviar Todos ({remainingCount})</>
              )}
            </button>
          )}
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {validMatches.map((match) => {
            const state = getState(match.pageIndex)

            return (
              <div
                key={match.pageIndex}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                  state.status === 'sent'
                    ? 'bg-green-500/10 border-green-500/30'
                    : state.status === 'error'
                    ? 'bg-red-500/10 border-red-500/30'
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
                  <div className="text-sm text-zinc-400 truncate">
                    {match.employee?.name}
                  </div>
                  <div className="text-xs text-purple-400 truncate">
                    Slack: {match.employee?.slackId}
                  </div>
                  {state.status === 'error' && state.error && (
                    <div className="text-xs text-red-400 mt-1 truncate">
                      {state.error}
                    </div>
                  )}
                </div>

                {/* Status/Action */}
                <div className="flex-shrink-0">
                  {state.status === 'sent' ? (
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
                  ) : state.status === 'sending' ? (
                    <span className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-400">
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
                      Enviando...
                    </span>
                  ) : state.status === 'error' ? (
                    <button
                      onClick={() => handleSendSlack(match)}
                      disabled={!slackConnected || isSendingAll}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50"
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
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Tentar Novamente
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendSlack(match)}
                      disabled={!slackConnected || isSendingAll}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" />
                      </svg>
                      Enviar
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
            Ignorados (sem Slack ID)
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
                  {match.employee && !match.employee.slackId && (
                    <span className="text-amber-500 text-xs">(funcionário sem Slack ID na planilha)</span>
                  )}
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
