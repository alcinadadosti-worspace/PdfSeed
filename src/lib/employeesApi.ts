// Em produção usa caminho relativo (mesmo servidor), em dev usa localhost:3001
const API_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001')

export type EmployeeMap = Record<string, string>

export interface AddEmployeeResult {
  success: boolean
  employees?: EmployeeMap
  verifiedName?: string
  warning?: string
  error?: string
}

export interface FetchEmployeesResult {
  employees: EmployeeMap
  configured: boolean
}

/**
 * Busca os funcionários (fonte única no GitHub, via backend).
 * `configured` = false quando o servidor está sem GITHUB_TOKEN ou inacessível;
 * nesse caso a app usa o mapa fixo embutido como fallback.
 */
export async function fetchEmployees(): Promise<FetchEmployeesResult> {
  try {
    const res = await fetch(`${API_URL}/api/employees`)
    if (!res.ok) return { employees: {}, configured: false }
    const data = await res.json()
    return {
      employees: (data.employees as EmployeeMap) || {},
      configured: Boolean(data.configured),
    }
  } catch {
    return { employees: {}, configured: false }
  }
}

async function mutate(
  method: 'POST' | 'PUT' | 'DELETE',
  body: Record<string, unknown>,
  adminPassword?: string
): Promise<AddEmployeeResult> {
  try {
    const res = await fetch(`${API_URL}/api/employees`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(adminPassword ? { 'x-admin-password': adminPassword } : {}),
      },
      body: JSON.stringify(body),
    })
    return await res.json()
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message || 'Erro de conexão com o servidor',
    }
  }
}

/** Cadastra um novo funcionário (nome + Slack ID). */
export function addEmployee(
  name: string,
  slackId: string,
  adminPassword?: string
): Promise<AddEmployeeResult> {
  return mutate('POST', { name, slackId }, adminPassword)
}

/** Edita um funcionário: renomeia e/ou muda o Slack ID. */
export function updateEmployee(
  oldName: string,
  name: string,
  slackId: string,
  adminPassword?: string
): Promise<AddEmployeeResult> {
  return mutate('PUT', { oldName, name, slackId }, adminPassword)
}

/** Remove um funcionário. */
export function removeEmployee(
  name: string,
  adminPassword?: string
): Promise<AddEmployeeResult> {
  return mutate('DELETE', { name }, adminPassword)
}
