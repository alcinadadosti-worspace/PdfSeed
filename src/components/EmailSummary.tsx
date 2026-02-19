import { EmailMatch } from '../lib/emailMatch'

interface EmailSummaryProps {
  matches: EmailMatch[]
  onBack: () => void
  onExportList: () => void
}

export function EmailSummary({ matches, onBack, onExportList }: EmailSummaryProps) {
  const validMatches = matches.filter((m) => m.employee !== null)
  const skippedMatches = matches.filter((m) => m.employee === null)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Resumo para Envio</h2>
        <p className="text-zinc-400">
          Confira a lista final de emails que serao enviados.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-dark-700 rounded-xl border border-green-500/30">
          <div className="text-3xl font-bold text-green-400">
            {validMatches.length}
          </div>
          <div className="text-sm text-zinc-400">Holerites para enviar</div>
        </div>
        <div className="p-4 bg-dark-700 rounded-xl border border-zinc-500/30">
          <div className="text-3xl font-bold text-zinc-400">
            {skippedMatches.length}
          </div>
          <div className="text-sm text-zinc-400">Sem email (ignorados)</div>
        </div>
      </div>

      {/* Email List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Lista de Envio</h3>
        <div className="bg-dark-700 rounded-xl border border-dark-600 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Pag.
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Nome no PDF
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Nome na Planilha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600">
              {validMatches.map((match) => (
                <tr key={match.pageIndex} className="hover:bg-dark-600/50">
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {match.pageNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">
                    {match.pdfName || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-accent">
                    {match.employee?.email}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-300">
                    {match.employee?.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  <span className="text-zinc-600">Pag. {match.pageNumber}:</span>
                  <span>{match.pdfName || 'SEM NOME'}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

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
            <p className="font-medium mb-1">Proximo passo</p>
            <p className="text-blue-300/80">
              Exporte a lista para usar em seu sistema de envio de emails ou integre
              com um servico de email (Gmail, Outlook, SendGrid, etc).
            </p>
          </div>
        </div>
      </div>

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
          className="px-5 py-2.5 text-sm font-medium bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors flex items-center gap-2"
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
          Exportar Lista (CSV)
        </button>
      </div>
    </div>
  )
}
