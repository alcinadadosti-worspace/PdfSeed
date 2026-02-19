import { useState } from 'react'
import { EmailMatch, getMatchStats } from '../lib/emailMatch'
import { Employee } from '../lib/excel'

interface EmailVerificationProps {
  matches: EmailMatch[]
  employees: Employee[]
  onMatchUpdate: (pageIndex: number, employee: Employee | null) => void
  onConfirm: () => void
  onCancel: () => void
}

export function EmailVerification({
  matches,
  employees,
  onMatchUpdate,
  onConfirm,
  onCancel,
}: EmailVerificationProps) {
  const stats = getMatchStats(matches)
  const [filter, setFilter] = useState<'all' | 'matched' | 'problems'>('all')
  const [searchEmployee, setSearchEmployee] = useState<number | null>(null)
  const [employeeSearch, setEmployeeSearch] = useState('')

  const filteredMatches = matches.filter((m) => {
    if (filter === 'all') return true
    if (filter === 'matched') return m.status === 'matched'
    return m.status === 'no_name' || m.status === 'not_found'
  })

  const filteredEmployees = employees.filter((e) =>
    e.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    e.email.toLowerCase().includes(employeeSearch.toLowerCase())
  )

  const canConfirm = matches.every(
    (m) => m.employee !== null || m.status === 'no_name'
  )

  const handleSelectEmployee = (pageIndex: number, employee: Employee) => {
    onMatchUpdate(pageIndex, employee)
    setSearchEmployee(null)
    setEmployeeSearch('')
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Verificar Emails</h2>
        <p className="text-zinc-400">
          Verifique se os emails estao corretos antes de enviar os holerites.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-dark-700 rounded-xl border border-dark-600">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-zinc-400">Total</div>
        </div>
        <div className="p-4 bg-dark-700 rounded-xl border border-green-500/30">
          <div className="text-2xl font-bold text-green-400">{stats.matched}</div>
          <div className="text-sm text-zinc-400">Encontrados</div>
        </div>
        <div className="p-4 bg-dark-700 rounded-xl border border-amber-500/30">
          <div className="text-2xl font-bold text-amber-400">{stats.notFound}</div>
          <div className="text-sm text-zinc-400">Nao encontrados</div>
        </div>
        <div className="p-4 bg-dark-700 rounded-xl border border-red-500/30">
          <div className="text-2xl font-bold text-red-400">{stats.noName}</div>
          <div className="text-sm text-zinc-400">Sem nome</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-accent text-white'
              : 'bg-dark-700 text-zinc-400 hover:text-white'
          }`}
        >
          Todos ({stats.total})
        </button>
        <button
          onClick={() => setFilter('matched')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'matched'
              ? 'bg-green-500 text-white'
              : 'bg-dark-700 text-zinc-400 hover:text-white'
          }`}
        >
          Encontrados ({stats.matched})
        </button>
        <button
          onClick={() => setFilter('problems')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'problems'
              ? 'bg-amber-500 text-white'
              : 'bg-dark-700 text-zinc-400 hover:text-white'
          }`}
        >
          Problemas ({stats.notFound + stats.noName})
        </button>
      </div>

      {/* Match List */}
      <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2">
        {filteredMatches.map((match) => (
          <div
            key={match.pageIndex}
            className={`p-4 bg-dark-700 rounded-xl border transition-colors ${
              match.status === 'matched'
                ? 'border-green-500/30'
                : match.status === 'no_name'
                ? 'border-red-500/30'
                : 'border-amber-500/30'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Page Number */}
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-dark-600 flex items-center justify-center">
                <span className="text-sm font-mono text-zinc-400">
                  {match.pageNumber}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium">
                    {match.pdfName || 'SEM NOME NO PDF'}
                  </span>
                  {match.matchScore > 0 && (
                    <span className="text-xs text-zinc-500">
                      ({match.matchScore}% match)
                    </span>
                  )}
                </div>

                {match.employee ? (
                  <div className="flex items-center gap-2 text-sm">
                    <svg
                      className="w-4 h-4 text-green-400"
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
                    <span className="text-zinc-300">{match.employee.email}</span>
                    <span className="text-zinc-500">({match.employee.name})</span>
                  </div>
                ) : match.status === 'no_name' ? (
                  <p className="text-sm text-red-400">
                    Nenhum nome encontrado no PDF
                  </p>
                ) : (
                  <p className="text-sm text-amber-400">
                    Nenhum email encontrado na planilha
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex-shrink-0">
                {searchEmployee === match.pageIndex ? (
                  <button
                    onClick={() => {
                      setSearchEmployee(null)
                      setEmployeeSearch('')
                    }}
                    className="px-3 py-1.5 text-sm bg-dark-600 hover:bg-dark-500 text-zinc-300 rounded-lg"
                  >
                    Cancelar
                  </button>
                ) : (
                  <button
                    onClick={() => setSearchEmployee(match.pageIndex)}
                    className="px-3 py-1.5 text-sm bg-dark-600 hover:bg-dark-500 text-zinc-300 rounded-lg"
                  >
                    {match.employee ? 'Alterar' : 'Selecionar'}
                  </button>
                )}
              </div>
            </div>

            {/* Employee Search */}
            {searchEmployee === match.pageIndex && (
              <div className="mt-4 p-3 bg-dark-800 rounded-lg">
                <input
                  type="text"
                  placeholder="Buscar funcionario..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-500 rounded-lg text-white text-sm focus:outline-none focus:border-accent mb-2"
                />
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {filteredEmployees.slice(0, 10).map((emp) => (
                    <button
                      key={emp.email}
                      onClick={() => handleSelectEmployee(match.pageIndex, emp)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-dark-600 transition-colors"
                    >
                      <div className="text-white text-sm">{emp.name}</div>
                      <div className="text-zinc-400 text-xs">{emp.email}</div>
                    </button>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <p className="text-zinc-500 text-sm text-center py-2">
                      Nenhum funcionario encontrado
                    </p>
                  )}
                  {filteredEmployees.length > 10 && (
                    <p className="text-zinc-500 text-xs text-center py-1">
                      Mostrando 10 de {filteredEmployees.length} resultados
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-4 bg-dark-800 rounded-xl border border-dark-600">
        <div className="text-sm text-zinc-400">
          {canConfirm ? (
            <span className="text-green-400">
              Todos os holerites estao prontos para envio
            </span>
          ) : (
            <span className="text-amber-400">
              {stats.notFound} holerite(s) sem email atribuido
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium bg-dark-600 hover:bg-dark-500 text-white rounded-lg transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className="px-5 py-2.5 text-sm font-medium bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar e Preparar Envio
          </button>
        </div>
      </div>
    </div>
  )
}
