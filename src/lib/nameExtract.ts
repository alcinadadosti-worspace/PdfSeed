import { sanitizeFilename } from './sanitize'

/**
 * List of phrases/words that should NOT be considered as employee names
 */
const BLACKLIST_PHRASES = [
  'ASSINATURA DO FUNCIONARIO',
  'ASSINATURA DO FUNCIONÁRIO',
  'DECLARO TER RECEBIDO',
  'NOME DO FUNCIONARIO',
  'NOME DO FUNCIONÁRIO',
  'TOTAL DE VENCIMENTOS',
  'TOTAL DE DESCONTOS',
  'VALOR LIQUIDO',
  'VALOR LÍQUIDO',
  'HORAS NORMAIS',
  'BASE CALCULO',
  'BASE CÁLCULO',
  'FOLHA MENSAL',
  'DISTRIBUICAO DE LUCROS',
  'DISTRIBUIÇÃO DE LUCROS',
]

const BLACKLIST_WORDS = [
  'CODIGO',
  'CÓDIGO',
  'CBO',
  'CNPJ',
  'CPF',
  'INSS',
  'IRRF',
  'FGTS',
  'LTDA',
  'CIA',
  'ASSINATURA',
  'FUNCIONARIO',
  'FUNCIONÁRIO',
  'DECLARO',
  'RECEBIDO',
  'RECIBO',
  'VENCIMENTOS',
  'DESCONTOS',
  'LIQUIDO',
  'LÍQUIDO',
  'TOTAL',
  'BASE',
  'CALCULO',
  'CÁLCULO',
  'SALARIO',
  'SALÁRIO',
  'FOLHA',
  'MENSAL',
  'GERAL',
  'DATA',
  'DEPARTAMENTO',
  'FILIAL',
  'ADMISSAO',
  'ADMISSÃO',
  'REFERENCIA',
  'REFERÊNCIA',
  'DESCRICAO',
  'DESCRIÇÃO',
  'JANEIRO',
  'FEVEREIRO',
  'MARÇO',
  'MARCO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO',
]

/**
 * Check if text matches any blacklisted phrase
 */
function matchesBlacklistPhrase(text: string): boolean {
  const upper = text.toUpperCase().trim()
  return BLACKLIST_PHRASES.some((phrase) => upper.includes(phrase))
}

/**
 * Check if name contains blacklisted words
 */
function containsBlacklistedWord(name: string): boolean {
  const words = name.toUpperCase().split(/\s+/)
  return words.some((word) => BLACKLIST_WORDS.includes(word))
}

/**
 * Validate if a string looks like a valid Brazilian name
 */
function isValidName(name: string): boolean {
  if (!name || name.length < 10) return false

  const trimmed = name.trim()

  // Must have at least 2 words (first name + last name)
  const words = trimmed.split(/\s+/)
  if (words.length < 2) return false

  // Each word must be at least 2 letters
  if (words.some((w) => w.length < 2)) return false

  // Must be mostly letters (allow spaces)
  const letterCount = (trimmed.match(/[A-ZÀ-Úa-zà-ú]/g) || []).length
  const spaceCount = (trimmed.match(/\s/g) || []).length
  if (letterCount + spaceCount < trimmed.length * 0.95) return false

  // No digits allowed
  if (/\d/.test(trimmed)) return false

  // Check against blacklist
  if (matchesBlacklistPhrase(trimmed)) return false
  if (containsBlacklistedWord(trimmed)) return false

  return true
}

/**
 * Extract employee name from page text
 */
export function extractEmployeeName(pageText: string): string | null {
  // Normalize: single spaces
  const text = pageText.replace(/\s+/g, ' ').trim()

  let match
  const candidates: string[] = []

  // PATTERN 1: "Código [num] [NAME] Nome do Funcionário CBO [cbo]"
  // This matches the exact structure seen in the payslips
  const pattern1 =
    /C[oó]digo\s+(\d{1,3})\s+([A-ZÀ-Ú][A-ZÀ-Ú\s]+?)\s+Nome\s+do\s+Funcion[aá]rio\s+CBO\s+(\d{6})/gi
  while ((match = pattern1.exec(text)) !== null) {
    const potentialName = match[2].trim()
    if (isValidName(potentialName)) {
      candidates.push(potentialName)
    }
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.length - a.length)
    return sanitizeFilename(candidates[0])
  }

  // PATTERN 2: "[num] [NAME] [6-digit CBO]" - direct pattern
  const pattern2 = /\b(\d{1,3})\s+([A-ZÀ-Ú][A-ZÀ-Ú\s]{10,50}?)\s+(\d{6})\b/g
  while ((match = pattern2.exec(text)) !== null) {
    const codeNum = parseInt(match[1], 10)
    const potentialName = match[2].trim()

    // Code should be employee code (1-500)
    if (codeNum > 500) continue

    if (isValidName(potentialName)) {
      candidates.push(potentialName)
    }
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.length - a.length)
    return sanitizeFilename(candidates[0])
  }

  // PATTERN 3: Look for "Nome do Funcionário" label followed by name
  const pattern3 =
    /Nome\s+do\s+Funcion[aá]rio[:\s]+([A-ZÀ-Ú][A-ZÀ-Ú\s]{10,50}?)(?:\s+CBO|\s+\d{6}|\s+Departamento)/gi
  while ((match = pattern3.exec(text)) !== null) {
    const potentialName = match[1].trim()
    if (isValidName(potentialName)) {
      candidates.push(potentialName)
    }
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.length - a.length)
    return sanitizeFilename(candidates[0])
  }

  // FALLBACK: Find sequences of 3+ uppercase words that look like names
  const fallbackPattern = /\b([A-ZÀ-Ú]{2,}(?:\s+[A-ZÀ-Ú]{2,}){2,})\b/g
  const fallbackCandidates: string[] = []

  while ((match = fallbackPattern.exec(text)) !== null) {
    const potentialName = match[1].trim()
    if (isValidName(potentialName) && potentialName.length >= 15) {
      fallbackCandidates.push(potentialName)
    }
  }

  if (fallbackCandidates.length > 0) {
    fallbackCandidates.sort((a, b) => b.length - a.length)
    return sanitizeFilename(fallbackCandidates[0])
  }

  return null
}
