import * as XLSX from 'xlsx'

export interface Employee {
  name: string
  email: string
  slackId?: string
}

/**
 * Load employee list from the default path (public/data/emails.xlsx)
 */
export async function loadEmployeeListFromPath(): Promise<Employee[]> {
  const response = await fetch('/data/emails.xlsx')

  if (!response.ok) {
    throw new Error('Planilha de emails não encontrada em data/emails.xlsx')
  }

  const arrayBuffer = await response.arrayBuffer()
  return parseEmployeeList(arrayBuffer)
}

/**
 * Read the Excel file and extract employee names and emails
 * Expected columns: Nome (or name) and Email (or email)
 */
export async function readEmployeeList(file: File): Promise<Employee[]> {
  const arrayBuffer = await file.arrayBuffer()
  return parseEmployeeList(arrayBuffer)
}

/**
 * Parse employee list from ArrayBuffer
 */
function parseEmployeeList(arrayBuffer: ArrayBuffer): Employee[] {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })

  // Get the first sheet
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  // Convert to JSON
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

  if (data.length === 0) {
    throw new Error('A planilha está vazia')
  }

  // Find the name and email columns (case-insensitive)
  const firstRow = data[0]
  const keys = Object.keys(firstRow)

  const nameKey = keys.find(
    (k) =>
      k.toLowerCase() === 'nome' ||
      k.toLowerCase() === 'name' ||
      k.toLowerCase() === 'funcionario' ||
      k.toLowerCase() === 'colaborador'
  )

  const emailKey = keys.find(
    (k) =>
      k.toLowerCase() === 'email' ||
      k.toLowerCase() === 'e-mail' ||
      k.toLowerCase() === 'mail'
  )

  const slackIdKey = keys.find(
    (k) =>
      k.toLowerCase() === 'slackid' ||
      k.toLowerCase() === 'slack_id' ||
      k.toLowerCase() === 'slack id' ||
      k.toLowerCase() === 'slack'
  )

  if (!nameKey) {
    throw new Error(
      'Coluna de nome não encontrada. Use "Nome", "Name", "Funcionario" ou "Colaborador"'
    )
  }

  // Email é opcional se tiver Slack ID
  if (!emailKey && !slackIdKey) {
    throw new Error(
      'Coluna de email ou Slack ID não encontrada. Use "Email", "SlackId" ou "Slack"'
    )
  }

  // Extract employees
  const employees: Employee[] = []

  for (const row of data) {
    const name = String(row[nameKey] || '').trim()
    const email = emailKey ? String(row[emailKey] || '').trim() : ''
    const slackId = slackIdKey ? String(row[slackIdKey] || '').trim() : undefined

    // Precisa ter nome e pelo menos email ou slackId
    if (name && (email || slackId)) {
      employees.push({ name, email, slackId })
    }
  }

  if (employees.length === 0) {
    throw new Error('Nenhum funcionário válido encontrado na planilha')
  }

  return employees
}
