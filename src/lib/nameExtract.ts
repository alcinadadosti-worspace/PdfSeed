import { sanitizeFilename } from './sanitize'

/**
 * List of words that should NOT be considered as employee names
 */
const BLACKLIST_WORDS = [
  'DECLARO',
  'TER',
  'RECEBIDO',
  'IMPORTANCIA',
  'LIQUIDA',
  'DISCRIMINADA',
  'NESTE',
  'RECIBO',
  'ASSINATURA',
  'FUNCIONARIO',
  'TOTAL',
  'VENCIMENTOS',
  'DESCONTOS',
  'VALOR',
  'LIQUIDO',
  'HORAS',
  'NORMAIS',
  'COMISSOES',
  'REFLEXO',
  'BASE',
  'CALCULO',
  'FGTS',
  'INSS',
  'IRRF',
  'FAIXA',
  'SALARIO',
  'ALAN',
  'MARTINS',
  'TAVARES',
  'CIA',
  'LTDA',
  'CNPJ',
  'FOLHA',
  'MENSAL',
  'GERAL',
  'MENSALISTA',
  'JANEIRO',
  'FEVEREIRO',
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
  'CAIXA',
  'AGENCIA',
  'CONTA',
  'CODIGO',
  'DESCRICAO',
  'REFERENCIA',
  'DATA',
  'ADMISSAO',
  'DEPARTAMENTO',
  'FILIAL',
  'DISTRIBUICAO',
  'LUCROS',
  'PRODUTOS',
  'FUNCIONARIOS',
  'DESC',
  'EMP',
  'CRED',
  'TRAB',
  'MATRICULA',
]

/**
 * Check if a name contains blacklisted words
 */
function containsBlacklistedWords(name: string): boolean {
  const upperName = name.toUpperCase()
  const words = upperName.split(/\s+/)

  // If more than half of the words are blacklisted, reject
  let blacklistedCount = 0
  for (const word of words) {
    const cleanWord = word.replace(/[^A-Z]/gi, '')
    if (BLACKLIST_WORDS.includes(cleanWord)) {
      blacklistedCount++
    }
  }

  return blacklistedCount >= words.length / 2
}

/**
 * Validate if a string looks like a valid Brazilian name
 */
function isValidName(name: string): boolean {
  if (!name || name.length < 8) return false

  // Count words (at least 2 for a valid name)
  const words = name.trim().split(/\s+/)
  if (words.length < 2) return false

  // Check if mostly letters and spaces
  const letterCount = (name.match(/[A-ZÀ-Úa-zà-ú]/g) || []).length
  const digitCount = (name.match(/\d/g) || []).length

  // Should be mostly letters
  if (letterCount < name.length * 0.8) return false

  // Should have no digits
  if (digitCount > 0) return false

  // Each word should have at least 2 characters
  if (words.some((w) => w.length < 2)) return false

  // Check against blacklist
  if (containsBlacklistedWords(name)) return false

  return true
}

/**
 * Clean up extracted name
 */
function cleanName(name: string): string {
  // Remove extra whitespace
  let cleaned = name.replace(/\s+/g, ' ').trim()

  // Remove leading/trailing numbers and special chars
  cleaned = cleaned.replace(/^[\d\s\-_.,:;]+/, '').replace(/[\d\s\-_.,:;]+$/, '')

  // Remove trailing cargo/function names
  const stopPatterns = [
    /\s+CONSULTOR.*$/i,
    /\s+COORDENADOR.*$/i,
    /\s+GERENTE.*$/i,
    /\s+VENDEDOR.*$/i,
    /\s+AUXILIAR.*$/i,
    /\s+ANALISTA.*$/i,
    /\s+ASSISTENTE.*$/i,
    /\s+SUPERVISOR.*$/i,
    /\s+DIRETOR.*$/i,
    /\s+OPERADOR.*$/i,
    /\s+TECNICO.*$/i,
    /\s+ESTAGIARIO.*$/i,
  ]

  for (const pattern of stopPatterns) {
    cleaned = cleaned.replace(pattern, '')
  }

  return cleaned.trim()
}

/**
 * Extract employee name from page text using multiple heuristics
 */
export function extractEmployeeName(pageText: string): string | null {
  // Normalize text: compact whitespace but preserve some structure
  const text = pageText.replace(/\s+/g, ' ').trim()
  const upperText = text.toUpperCase()

  // Heuristic 1: Look for pattern where we have a number followed by a name followed by CBO number
  // Pattern: [small number 1-999] [NAME IN CAPS 3+ words] [6-digit CBO]
  // Example: "12 BRUNA RAYANE OLIVEIRA DOS SANTOS 521110"
  const pattern1 = /\b(\d{1,3})\s+([A-ZÀ-Ú][A-ZÀ-Ú\s]{10,60}?)\s+(\d{6})\b/g
  let match1
  while ((match1 = pattern1.exec(upperText)) !== null) {
    const potentialName = cleanName(match1[2])
    if (isValidName(potentialName)) {
      return sanitizeFilename(potentialName)
    }
  }

  // Heuristic 2: Look for "Nome do Funcionário" followed by name and CBO
  // The name appears AFTER "Nome do Funcionário" header and before CBO number
  const pattern2 =
    /NOME\s+DO\s+FUNCION[AÁ]RIO\s+CBO[\s\S]{0,50}?(\d{1,3})\s+([A-ZÀ-Ú][A-ZÀ-Ú\s]{10,60}?)\s+(\d{6})/i
  const match2 = upperText.match(pattern2)
  if (match2 && match2[2]) {
    const potentialName = cleanName(match2[2])
    if (isValidName(potentialName)) {
      return sanitizeFilename(potentialName)
    }
  }

  // Heuristic 3: Look for name between "Código" header row and CBO
  // Pattern captures the structure: Código Nome do Funcionário CBO ... [num] [NAME] [CBO num]
  const pattern3 =
    /C[OÓ]DIGO\s+NOME\s+DO\s+FUNCION[AÁ]RIO\s+CBO[\s\S]{0,100}?(\d{1,3})\s+([A-ZÀ-Ú][A-ZÀ-Ú\s]{10,60}?)\s+(\d{6})/i
  const match3 = upperText.match(pattern3)
  if (match3 && match3[2]) {
    const potentialName = cleanName(match3[2])
    if (isValidName(potentialName)) {
      return sanitizeFilename(potentialName)
    }
  }

  // Heuristic 4: Find all sequences of 3+ uppercase words and validate
  const pattern4 = /\b([A-ZÀ-Ú]{2,}(?:\s+[A-ZÀ-Ú]{2,}){2,})\b/g
  const candidates: string[] = []
  let match4
  while ((match4 = pattern4.exec(upperText)) !== null) {
    const potentialName = cleanName(match4[1])
    if (isValidName(potentialName) && potentialName.length >= 15) {
      candidates.push(potentialName)
    }
  }

  // Return the first valid candidate that's not blacklisted
  for (const candidate of candidates) {
    if (!containsBlacklistedWords(candidate)) {
      return sanitizeFilename(candidate)
    }
  }

  return null
}
