import { useState, useMemo, FormEvent } from 'react'
import { AddEmployeeResult } from '../lib/employeesApi'

interface EmployeeManagerProps {
  employees: Record<string, string>
  onAdd: (
    name: string,
    slackId: string,
    adminPassword?: string
  ) => Promise<AddEmployeeResult>
  onRemove: (name: string, adminPassword?: string) => Promise<AddEmployeeResult>
  onClose: () => void
}

type Feedback = { type: 'success' | 'error' | 'warning'; message: string } | null

export function EmployeeManager({
  employees,
  onAdd,
  onRemove,
  onClose,
}: EmployeeManagerProps) {
  const [name, setName] = useState('')
  const [slackId, setSlackId] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [search, setSearch] = useState('')
  const [removingKey, setRemovingKey] = useState<string | null>(null)

  const entries = useMemo(() => {
    const list = Object.entries(employees).map(([n, id]) => ({ name: n, slackId: id }))
    list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    if (!search.trim()) return list
    const q = search.trim().toLowerCase()
    return list.filter(
      (e) => e.name.toLowerCase().includes(q) || e.slackId.toLowerCase().includes(q)
    )
  }, [employees, search])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slackId.trim()) {
      setFeedback({ type: 'error', message: 'Preencha o nome e o Slack ID.' })
      return
    }
    setIsSaving(true)
    setFeedback(null)
    const result = await onAdd(name, slackId, adminPassword || undefined)
    setIsSaving(false)

    if (result.success) {
      const extra = result.verifiedName ? ` (Slack: ${result.verifiedName})` : ''
      setFeedback({
        type: result.warning ? 'warning' : 'success',
        message: result.warning
          ? `Cadastrado, mas: ${result.warning}`
          : `"${name.trim().toUpperCase()}" cadastrado com sucesso!${extra}`,
      })
      setName('')
      setSlackId('')
    } else {
      setFeedback({ type: 'error', message: result.error || 'Erro ao cadastrar.' })
    }
  }

  const handleRemove = async (empName: string) => {
    setRemovingKey(empName)
    const result = await onRemove(empName, adminPassword || undefined)
    setRemovingKey(null)
    if (!result.success) {
      setFeedback({ type: 'error', message: result.error || 'Erro ao remover.' })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sage-900/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-cream-50 rounded-3xl border border-sage-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-sage-200 bg-white/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-leaf to-leaf-dark flex items-center justify-center shadow-md">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-sage-800">Funcionários</h2>
              <p className="text-sm text-sage-500">
                Cadastre nome + Slack ID sem mexer no código
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-sage-100 flex items-center justify-center text-sage-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body (scroll) */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="p-4 bg-white/70 rounded-2xl border border-sage-200 mb-5"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-sage-600 mb-1">
                  Nome completo
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: MARIA DA SILVA"
                  className="w-full px-4 py-2.5 bg-white border border-sage-300 rounded-xl text-sage-800 placeholder-sage-400 text-sm focus:outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-sage-600 mb-1">
                  Slack ID
                </label>
                <input
                  value={slackId}
                  onChange={(e) => setSlackId(e.target.value)}
                  placeholder="Ex.: U07KXEJU338"
                  className="w-full px-4 py-2.5 bg-white border border-sage-300 rounded-xl text-sage-800 placeholder-sage-400 text-sm font-mono focus:outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-sage-600 mb-1">
                  Senha (se necessário)
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Deixe em branco se não usar"
                  className="w-full px-4 py-2.5 bg-white border border-sage-300 rounded-xl text-sage-800 placeholder-sage-400 text-sm focus:outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                />
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-leaf to-leaf-dark hover:from-leaf-dark hover:to-sage-800 text-white rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Salvando...
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Cadastrar
                  </>
                )}
              </button>
            </div>

            {feedback && (
              <div
                className={`mt-3 p-3 rounded-xl text-sm ${
                  feedback.type === 'success'
                    ? 'bg-leaf/10 border border-leaf/30 text-leaf-dark'
                    : feedback.type === 'warning'
                    ? 'bg-amber-50 border border-amber-200 text-amber-700'
                    : 'bg-red-50 border border-red-200 text-red-600'
                }`}
              >
                {feedback.message}
              </div>
            )}
          </form>

          {/* List */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-sage-700">
              Cadastrados pela app ({Object.keys(employees).length})
            </h3>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou ID..."
            className="w-full px-4 py-2.5 mb-3 bg-white border border-sage-300 rounded-xl text-sage-800 placeholder-sage-400 text-sm focus:outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
          />

          {entries.length === 0 ? (
            <div className="text-center py-10 text-sage-400 text-sm">
              {Object.keys(employees).length === 0
                ? 'Nenhum funcionário cadastrado pela app ainda.'
                : 'Nenhum resultado para a busca.'}
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((emp) => (
                <div
                  key={emp.name}
                  className="flex items-center gap-3 p-3 bg-white/70 rounded-xl border border-sage-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sage-800 text-sm font-medium truncate">
                      {emp.name}
                    </div>
                    <div className="text-xs text-[#611f69] font-mono truncate">
                      {emp.slackId}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(emp.name)}
                    disabled={removingKey === emp.name}
                    className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-red-50 text-sage-400 hover:text-red-500 flex items-center justify-center transition-colors disabled:opacity-50"
                    title="Remover"
                  >
                    {removingKey === emp.name ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 text-xs text-sage-400 leading-relaxed">
            Os nomes que já vêm embutidos no sistema continuam funcionando e não
            aparecem nesta lista — aqui ficam só os que você cadastrar pela app. Cada
            cadastro é salvo automaticamente no GitHub.
          </p>
        </div>
      </div>
    </div>
  )
}
