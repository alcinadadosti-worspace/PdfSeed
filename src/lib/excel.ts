import * as XLSX from 'xlsx'

export interface Employee {
  name: string
  email: string
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

  if (!nameKey) {
    throw new Error(
      'Coluna de nome não encontrada. Use "Nome", "Name", "Funcionario" ou "Colaborador"'
    )
  }

  if (!emailKey) {
    throw new Error(
      'Coluna de email não encontrada. Use "Email", "E-mail" ou "Mail"'
    )
  }

  // Extract employees
  const employees: Employee[] = []

  for (const row of data) {
    const name = String(row[nameKey] || '').trim()
    const email = String(row[emailKey] || '').trim()

    if (name && email) {
      employees.push({ name, email })
    }
  }

  if (employees.length === 0) {
    throw new Error('Nenhum funcionário válido encontrado na planilha')
  }

  return employees
}
