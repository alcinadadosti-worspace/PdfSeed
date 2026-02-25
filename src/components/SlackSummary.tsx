import { useState, useEffect } from 'react'
import { EmailMatch } from '../lib/emailMatch'
import { extractSinglePage } from '../lib/pdfSplit'
import { sendPdfToSlack, testSlackConnection } from '../lib/slackApi'
import { getSimilarNames, getAllNames } from '../lib/slackMapping'

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
  // Estados devem ser declarados primeiro
  const [sendStates, setSendStates] = useState<Map<number, SendState>>(
    new Map()
  )
  const [isSendingAll, setIsSendingAll] = useState(false)
  const [slackConnected, setSlackConnected] = useState<boolean | null>(null)
  const [slackTeam, setSlackTeam] = useState<string>('')
  const [manualMatches, setManualMatches] = useState<Map<number, { name: string; slackId: string }>>(new Map())
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Considera válido se tiver employee COM slackId OU se tiver correção manual
  const validMatches = matches.filter((m) => m.employee?.slackId || manualMatches.has(m.pageIndex))
  // Ignorados: sem employee OU sem slackId E sem correção manual
  const skippedMatches = matches.filter((m) => !m.employee?.slackId && !manualMatches.has(m.pageIndex))

  // Função para obter os dados do employee (original ou corrigido manualmente)
  const getEmployeeData = (match: EmailMatch) => {
    const manual = manualMatches.get(match.pageIndex)
    if (manual) {
      return { name: manual.name, email: '', slackId: manual.slackId }
    }
    return match.employee
  }

  // Função para aplicar correção manual
  const handleManualMatch = (pageIndex: number, name: string, slackId: string) => {
    setManualMatches((prev) => new Map(prev).set(pageIndex, { name, slackId }))
    setExpandedSuggestion(null)
    setSearchQuery('')
  }

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
    const employee = getEmployeeData(match)
    if (!employee?.slackId) return

    updateState(match.pageIndex, { status: 'sending' })

    try {
      // 1. Extract the PDF page
      const pageData = await extractSinglePage(pdfData, match.pageIndex)
      const fileName = `${match.pdfName || 'Holerite'}.pdf`

      // 2. Send via Slack using Slack ID
      const result = await sendPdfToSlack(
        employee.slackId,
        pageData,
        fileName,
        employee.name
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
      <div className="mb-6 p-5 bg-white/60 backdrop-blur-sm rounded-2xl border border-sage-200">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 text-sage-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A154B] to-[#611f69] flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
            </svg>
          </div>
          Enviar via Slack
        </h2>
        <p className="text-sage-500 ml-[52px]">
          Os holerites serao enviados diretamente via DM no Slack.
        </p>
      </div>

      {/* Slack Connection Status */}
      <div
        className={`mb-6 p-4 rounded-2xl border backdrop-blur-sm ${
          slackConnected === null
            ? 'bg-sage-100/60 border-sage-300'
            : slackConnected
            ? 'bg-leaf/10 border-leaf/30'
            : 'bg-red-50 border-red-200'
        }`}
      >
        <div className="flex items-center gap-3">
          {slackConnected === null ? (
            <>
              <svg
                className="w-5 h-5 text-sage-500 animate-spin"
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
              <span className="text-sage-600">Verificando conexao...</span>
            </>
          ) : slackConnected ? (
            <>
              <div className="w-8 h-8 rounded-full bg-leaf/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-leaf-dark"
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
              </div>
              <span className="text-leaf-dark font-medium">
                Conectado ao Slack{slackTeam && `: ${slackTeam}`}
              </span>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-500"
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
              </div>
              <span className="text-red-600 font-medium">
                Slack nao conectado. Verifique o servidor e o token.
              </span>
            </>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-sage-200 shadow-sm">
          <div className="text-3xl font-bold text-sage-800">
            {validMatches.length}
          </div>
          <div className="text-sm text-sage-500">Total</div>
        </div>
        <div className="p-4 bg-leaf/10 backdrop-blur-sm rounded-2xl border border-leaf/30 shadow-sm">
          <div className="text-3xl font-bold text-leaf-dark">{sentCount}</div>
          <div className="text-sm text-sage-500">Enviados</div>
        </div>
        <div className="p-4 bg-red-50 backdrop-blur-sm rounded-2xl border border-red-200 shadow-sm">
          <div className="text-3xl font-bold text-red-500">{errorCount}</div>
          <div className="text-sm text-sage-500">Erros</div>
        </div>
        <div className="p-4 bg-amber-50 backdrop-blur-sm rounded-2xl border border-amber-200 shadow-sm">
          <div className="text-3xl font-bold text-amber-600">
            {remainingCount}
          </div>
          <div className="text-sm text-sage-500">Restantes</div>
        </div>
      </div>

      {/* Send List */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-lg font-semibold text-sage-800">Lista de Envio</h3>
          {remainingCount > 0 && slackConnected && (
            <button
              onClick={handleSendAll}
              disabled={isSendingAll}
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#4A154B] to-[#611f69] hover:from-[#611f69] hover:to-[#7c2d7e] text-white rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
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
            const employee = getEmployeeData(match)
            const isManuallyMatched = manualMatches.has(match.pageIndex)

            return (
              <div
                key={match.pageIndex}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all backdrop-blur-sm ${
                  state.status === 'sent'
                    ? 'bg-leaf/10 border-leaf/30'
                    : state.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : isManuallyMatched
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white/70 border-sage-200'
                }`}
              >
                {/* Page Number */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center">
                  <span className="text-sm font-mono text-sage-600 font-medium">
                    {match.pageNumber}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sage-800 font-medium truncate">
                    {match.pdfName || 'SEM NOME'}
                  </div>
                  <div className="text-sm text-sage-500 truncate flex items-center gap-2">
                    {employee?.name}
                    {isManuallyMatched && (
                      <span className="text-xs text-blue-500 font-medium">(corrigido)</span>
                    )}
                  </div>
                  <div className="text-xs text-[#611f69] truncate">
                    Slack: {employee?.slackId}
                  </div>
                  {state.status === 'error' && state.error && (
                    <div className="text-xs text-red-500 mt-1 truncate">
                      {state.error}
                    </div>
                  )}
                </div>

                {/* Status/Action */}
                <div className="flex-shrink-0">
                  {state.status === 'sent' ? (
                    <span className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-leaf-dark">
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
                    <span className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#611f69]">
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
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50"
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
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#4A154B] to-[#611f69] hover:from-[#611f69] hover:to-[#7c2d7e] text-white rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50"
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

      {/* Skipped List with Suggestions */}
      {skippedMatches.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-amber-600 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Nomes nao encontrados ({skippedMatches.length})
          </h3>
          <p className="text-sm text-sage-500 mb-4">
            Clique em um nome para ver sugestoes de nomes similares no sistema.
          </p>
          <div className="space-y-2">
            {skippedMatches.map((match) => {
              const isExpanded = expandedSuggestion === match.pageIndex
              const suggestions = match.pdfName ? getSimilarNames(match.pdfName) : []
              const allNames = getAllNames()
              const filteredNames = searchQuery
                ? allNames.filter((n) =>
                    n.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                : []

              return (
                <div
                  key={match.pageIndex}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl border border-sage-200 overflow-hidden"
                >
                  {/* Header - clickable */}
                  <button
                    onClick={() => {
                      setExpandedSuggestion(isExpanded ? null : match.pageIndex)
                      setSearchQuery('')
                    }}
                    className="w-full p-4 flex items-center gap-4 hover:bg-sage-50 transition-colors text-left"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <span className="text-sm font-mono text-amber-600 font-medium">
                        {match.pageNumber}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sage-800 font-medium truncate">
                        {match.pdfName || 'SEM NOME'}
                      </div>
                      <div className="text-xs text-amber-600">
                        {suggestions.length > 0
                          ? `${suggestions.length} sugestoes encontradas`
                          : 'Clique para buscar manualmente'}
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-sage-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-sage-200 p-4 bg-cream-50">
                      {/* Search box */}
                      <div className="mb-3">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Buscar por nome..."
                          className="w-full px-4 py-2.5 bg-white border border-sage-300 rounded-xl text-sage-800 placeholder-sage-400 text-sm focus:outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                        />
                      </div>

                      {/* Suggestions */}
                      {suggestions.length > 0 && !searchQuery && (
                        <div className="mb-3">
                          <div className="text-xs text-sage-500 mb-2 font-medium">
                            Sugestoes (nomes similares):
                          </div>
                          <div className="space-y-1">
                            {suggestions.map((suggestion) => (
                              <button
                                key={suggestion.slackId}
                                onClick={() =>
                                  handleManualMatch(
                                    match.pageIndex,
                                    suggestion.name,
                                    suggestion.slackId
                                  )
                                }
                                className="w-full px-4 py-2.5 bg-white hover:bg-leaf/10 border border-sage-200 hover:border-leaf rounded-xl text-left transition-all flex items-center justify-between"
                              >
                                <span className="text-sm text-sage-800 truncate">
                                  {suggestion.name}
                                </span>
                                <span className="text-xs text-leaf-dark font-medium flex-shrink-0 ml-2 bg-leaf/10 px-2 py-0.5 rounded-full">
                                  {suggestion.similarity}% similar
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Search results */}
                      {searchQuery && (
                        <div>
                          <div className="text-xs text-sage-500 mb-2 font-medium">
                            Resultados da busca ({filteredNames.length}):
                          </div>
                          {filteredNames.length > 0 ? (
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {filteredNames.slice(0, 10).map((item) => (
                                <button
                                  key={item.slackId}
                                  onClick={() =>
                                    handleManualMatch(
                                      match.pageIndex,
                                      item.name,
                                      item.slackId
                                    )
                                  }
                                  className="w-full px-4 py-2.5 bg-white hover:bg-leaf/10 border border-sage-200 hover:border-leaf rounded-xl text-left transition-all"
                                >
                                  <span className="text-sm text-sage-800">
                                    {item.name}
                                  </span>
                                </button>
                              ))}
                              {filteredNames.length > 10 && (
                                <div className="text-xs text-sage-500 text-center py-2">
                                  +{filteredNames.length - 10} resultados...
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-sage-500 text-center py-4">
                              Nenhum resultado encontrado
                            </div>
                          )}
                        </div>
                      )}

                      {/* No suggestions and no search */}
                      {suggestions.length === 0 && !searchQuery && (
                        <div className="text-sm text-sage-500 text-center py-2">
                          Nenhuma sugestao automatica. Use a busca acima.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between p-5 bg-white/60 backdrop-blur-sm rounded-2xl border border-sage-200">
        <button
          onClick={onBack}
          className="px-5 py-2.5 text-sm font-medium bg-sage-100 hover:bg-sage-200 text-sage-700 rounded-xl transition-colors border border-sage-200"
        >
          Voltar
        </button>
        <button
          onClick={onExportList}
          className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-leaf to-leaf-dark hover:from-leaf-dark hover:to-sage-800 text-white rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
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
