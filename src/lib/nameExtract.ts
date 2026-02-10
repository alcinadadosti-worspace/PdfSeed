import { sanitizeFilename } from './sanitize'

/**
 * Validate if a string looks like a valid Brazilian name
 */
function isValidName(name: string): boolean {
  if (!name || name.length < 5) return false

  // Count words (at least 2 for a valid name)
  const words = name.trim().split(/\s+/)
  if (words.length < 2) return false

  // Check if mostly letters and spaces
  const letterCount = (name.match(/[A-ZÀ-Úa-zà-ú]/g) || []).length
  const digitCount = (name.match(/\d/g) || []).length

  // Should be mostly letters
  if (letterCount < name.length * 0.7) return false

  // Should have very few digits (ideally 0)
  if (digitCount > 2) return false

  // Each word should have at least 2 characters
  if (words.some((w) => w.length < 2)) return false

  return true
}

/**
 * Clean up extracted name
 */
function cleanName(name: string): string {
  // Remove extra whitespace
  let cleaned = name.replace(/\s+/g, ' ').trim()

  // Remove leading/trailing numbers and special chars
  cleaned = cleaned.replace(/^[\d\s\-_.]+/, '').replace(/[\d\s\-_.]+$/, '')

  // Remove common header words that might be captured
  const stopWords = [
    'CBO',
    'DEPARTAMENTO',
    'FILIAL',
    'CARGO',
    'FUNCAO',
    'FUNÇÃO',
    'ADMISSAO',
    'ADMISSÃO',
    'SALARIO',
    'SALÁRIO',
    'BASE',
    'CTPS',
    'CPF',
    'RG',
    'PIS',
  ]

  for (const word of stopWords) {
    const idx = cleaned.toUpperCase().indexOf(word)
    if (idx !== -1) {
      cleaned = cleaned.substring(0, idx).trim()
    }
  }

  return cleaned.trim()
}

/**
 * Extract employee name from page text using multiple heuristics
 */
export function extractEmployeeName(pageText: string): string | null {
  // Normalize text: uppercase and compact whitespace
  const text = pageText.toUpperCase().replace(/\s+/g, ' ')

  // Heuristic 1: Pattern "CÓDIGO [numero] [NOME] NOME DO FUNCIONÁRIO"
  const pattern1 =
    /C[OÓ]DIGO\s+(\d+)\s+([A-ZÀ-Ú][A-ZÀ-Ú\s]{5,}?)\s+NOME\s+DO\s+FUNCION[AÁ]RIO/i
  const match1 = text.match(pattern1)

  if (match1 && match1[2]) {
    const name = cleanName(match1[2])
    if (isValidName(name)) {
      return sanitizeFilename(name)
    }
  }

  // Heuristic 2: Pattern "CÓDIGO [numero]" followed by uppercase name
  const pattern2 =
    /C[OÓ]DIGO\s+\d+\s+([A-ZÀ-Ú]{2,}(?:\s+[A-ZÀ-Ú]{2,}){1,10})/i
  const match2 = text.match(pattern2)

  if (match2 && match2[1]) {
    const name = cleanName(match2[1])
    if (isValidName(name)) {
      return sanitizeFilename(name)
    }
  }

  // Heuristic 3: Look between "FUNCIONÁRIO:" and common end markers
  const pattern3 =
    /FUNCION[AÁ]RIO[:\s]+([A-ZÀ-Ú]{2,}(?:\s+[A-ZÀ-Ú]{2,}){1,10})/i
  const match3 = text.match(pattern3)

  if (match3 && match3[1]) {
    const name = cleanName(match3[1])
    if (isValidName(name)) {
      return sanitizeFilename(name)
    }
  }

  // Heuristic 4: Look for "NOME:" followed by uppercase name
  const pattern4 = /NOME[:\s]+([A-ZÀ-Ú]{2,}(?:\s+[A-ZÀ-Ú]{2,}){1,10})/i
  const match4 = text.match(pattern4)

  if (match4 && match4[1]) {
    const name = cleanName(match4[1])
    if (isValidName(name)) {
      return sanitizeFilename(name)
    }
  }

  // Heuristic 5 (fallback): First occurrence of 3+ uppercase words together
  const pattern5 = /\b([A-ZÀ-Ú]{2,}(?:\s+[A-ZÀ-Ú]{2,}){2,})\b/
  const match5 = text.match(pattern5)

  if (match5 && match5[1]) {
    const name = cleanName(match5[1])
    if (isValidName(name)) {
      return sanitizeFilename(name)
    }
  }

  return null
}
