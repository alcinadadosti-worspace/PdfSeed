import { useState, useMemo, FormEvent } from 'react'
import { AddEmployeeResult } from '../lib/employeesApi'

interface Employee {
  name: string
  slackId: string
}

interface EmployeeManagerProps {
  employees: Employee[]
  configured: boolean
  onAdd: (
    name: string,
    slackId: string,
    adminPassword?: string
  ) => Promise<AddEmployeeResult>
  onUpdate: (
    oldName: string,
    name: string,
    slackId: string,
    adminPassword?: string
  ) => Promise<AddEmployeeResult>
  onRemove: (name: string, adminPassword?: string) => Promise<AddEmployeeResult>
  onClose: () => void
}

type Feedback = { type: 'success' | 'error' | 'warning'; message: string } | null

const spinner = (
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
)

export function EmployeeManager({
  employees,
  configured,
  onAdd,
  onUpdate,
  onRemove,
  onClose,
}: EmployeeManagerProps) {
  const [name, setName] = useState('')
  const [slackId, setSlackId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [search, setSearch] = useState('')
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlackId, setEditSlackId] = useState('')

  const filtered = useMemo(() => {
    const list = [...employees].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR')
    )
    if (!search.trim()) return list
    const q = search.trim().toLowerCase()
    return list.filter(
      (e) => e.name.toLowerCase().includes(q) || e.slackId.toLowerCase().includes(q)
    )
  }, [employees, search])

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slackId.trim()) {
      setFeedback({ type: 'error', message: 'Preencha o nome e o Slack ID.' })
      return
    }
    setIsSaving(true)
    setFeedback(null)
    const result = await onAdd(name, slackId)
    setIsSaving(false)
    if (result.success) {
      const extra = result.verifiedName ? ` (Slack: ${result.verifiedName})` : ''
      setFeedback({
        type: result.warning ? 'warning' : 'success',
        message: result.warning
          ? `Cadastrado, mas: ${result.warning}`
          : `"${name.trim().toUpperCase()}" cadastrado!${extra}`,
      })
      setName('')
      setSlackId('')
    } else {
      setFeedback({ type: 'error', message: result.error || 'Erro ao cadastrar.' })
    }
  }

  const startEdit = (emp: Employee) => {
    setEditingKey(emp.name)
    setEditName(emp.name)
    setEditSlackId(emp.slackId)
    setFeedback(null)
  }

  const cancelEdit = () => {
    setEditingKey(null)
    setEditName('')
    setEditSlackId('')
  }

  const saveEdit = async (oldName: string) => {
    if (!editName.trim() || !editSlackId.trim()) {
      setFeedback({ type: 'error', message: 'Nome e Slack ID não podem ficar vazios.' })
      return
    }
    setBusyKey(oldName)
    const result = await onUpdate(oldName, editName, editSlackId)
    setBusyKey(null)
    if (result.success) {
      const extra = result.verifiedName ? ` (Slack: ${result.verifiedName})` : ''
      setFeedback({
        type: result.warning ? 'warning' : 'success',
        message: result.warning
          ? `Salvo, mas: ${result.warning}`
          : `"${editName.trim().toUpperCase()}" atualizado!${extra}`,
      })
      cancelEdit()
    } else {
      setFeedback({ type: 'error', message: result.error || 'Erro ao salvar.' })
    }
  }

  const handleRemove = async (emp: Employee) => {
    if (!window.confirm(`Remover "${emp.name}" da lista?`)) return
    setBusyKey(emp.name)
    const result = await onRemove(emp.name)
    setBusyKey(null)
    if (result.success) {
      setFeedback({ type: 'success', message: `"${emp.name}" removido.` })
    } else {
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
                {employees.length} no total — adicione, edite ou remova
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {!configured && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
              Para adicionar, editar ou remover, configure o{' '}
              <strong>GITHUB_TOKEN</strong> no servidor. Por enquanto você está
              vendo a lista atual (somente leitura).
            </div>
          )}

          {/* Add form */}
          <form
            onSubmit={handleAdd}
            className="p-4 bg-white/70 rounded-2xl border border-sage-200 mb-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-sage-600 mb-1">
                  Nome completo
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!configured}
                  placeholder="Ex.: MARIA DA SILVA"
                  className="w-full px-4 py-2.5 bg-white border border-sage-300 rounded-xl text-sage-800 placeholder-sage-400 text-sm focus:outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-sage-600 mb-1">
                  Slack ID
                </label>
                <input
                  value={slackId}
                  onChange={(e) => setSlackId(e.target.value)}
                  disabled={!configured}
                  placeholder="Ex.: U07KXEJU338"
                  className="w-full px-4 py-2.5 bg-white border border-sage-300 rounded-xl text-sage-800 placeholder-sage-400 text-sm font-mono focus:outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={isSaving || !configured}
                className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-leaf to-leaf-dark hover:from-leaf-dark hover:to-sage-800 text-white rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>{spinner}Salvando...</>
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
          </form>

          {feedback && (
            <div
              className={`mb-4 p-3 rounded-xl text-sm ${
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

          {/* Search */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou ID..."
            className="w-full px-4 py-2.5 mb-2 bg-white border border-sage-300 rounded-xl text-sage-800 placeholder-sage-400 text-sm focus:outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
          />
          <div className="text-xs text-sage-500 mb-3">
            {filtered.length} de {employees.length} exibidos
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-sage-400 text-sm">
              Nenhum resultado.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((emp) => {
                const isEditing = editingKey === emp.name
                const isBusy = busyKey === emp.name
                return (
                  <div
                    key={emp.name}
                    className={`p-3 rounded-xl border ${
                      isEditing
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white/70 border-sage-200'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-sage-300 rounded-lg text-sage-800 text-sm focus:outline-none focus:border-leaf"
                          placeholder="Nome"
                        />
                        <input
                          value={editSlackId}
                          onChange={(e) => setEditSlackId(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-sage-300 rounded-lg text-sage-800 text-sm font-mono focus:outline-none focus:border-leaf"
                          placeholder="Slack ID"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={cancelEdit}
                            disabled={isBusy}
                            className="px-3 py-1.5 text-sm text-sage-600 hover:bg-sage-100 rounded-lg border border-sage-200 disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => saveEdit(emp.name)}
                            disabled={isBusy}
                            className="px-3 py-1.5 text-sm bg-leaf hover:bg-leaf-dark text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                          >
                            {isBusy ? spinner : null}
                            Salvar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sage-800 text-sm font-medium truncate">
                            {emp.name}
                          </div>
                          <div className="text-xs text-[#611f69] font-mono truncate">
                            {emp.slackId}
                          </div>
                        </div>
                        {configured && (
                          <div className="flex-shrink-0 flex items-center gap-1">
                            <button
                              onClick={() => startEdit(emp)}
                              disabled={isBusy}
                              className="w-8 h-8 rounded-lg hover:bg-sage-100 text-sage-400 hover:text-sage-700 flex items-center justify-center transition-colors disabled:opacity-50"
                              title="Editar"
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
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleRemove(emp)}
                              disabled={isBusy}
                              className="w-8 h-8 rounded-lg hover:bg-red-50 text-sage-400 hover:text-red-500 flex items-center justify-center transition-colors disabled:opacity-50"
                              title="Remover"
                            >
                              {isBusy ? (
                                spinner
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
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
