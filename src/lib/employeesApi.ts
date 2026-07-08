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

/**
 * Busca os funcionários cadastrados pela app (guardados no GitHub via backend).
 * Em caso de erro, retorna vazio para não quebrar a app (o mapa fixo continua valendo).
 */
export async function fetchEmployees(): Promise<EmployeeMap> {
  try {
    const res = await fetch(`${API_URL}/api/employees`)
    if (!res.ok) return {}
    const data = await res.json()
    return (data.employees as EmployeeMap) || {}
  } catch {
    return {}
  }
}

/**
 * Cadastra um novo funcionário (nome + Slack ID).
 */
export async function addEmployee(
  name: string,
  slackId: string,
  adminPassword?: string
): Promise<AddEmployeeResult> {
  try {
    const res = await fetch(`${API_URL}/api/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminPassword ? { 'x-admin-password': adminPassword } : {}),
      },
      body: JSON.stringify({ name, slackId }),
    })
    return await res.json()
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message || 'Erro de conexão com o servidor',
    }
  }
}

/**
 * Remove um funcionário cadastrado pela app.
 */
export async function removeEmployee(
  name: string,
  adminPassword?: string
): Promise<AddEmployeeResult> {
  try {
    const res = await fetch(`${API_URL}/api/employees`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(adminPassword ? { 'x-admin-password': adminPassword } : {}),
      },
      body: JSON.stringify({ name }),
    })
    return await res.json()
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message || 'Erro de conexão com o servidor',
    }
  }
}
