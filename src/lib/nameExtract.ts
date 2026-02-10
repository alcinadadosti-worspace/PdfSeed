import { sanitizeFilename } from './sanitize'

/**
 * Blacklist of company names and common phrases that are NOT employee names
 */
const BLACKLIST_PHRASES = [
  // Company names
  'ACQUA DISTRIBUIDORA',
  'DISTRIBUIDORA DE PERFUMES',
  'PERFUMES COSMETICOS',
  'ALAN MARTINS TAVARES',
  'CIA LTDA',

  // Birthday messages
  'PARABENS PELO SEU',
  'ANIVERSARIO NO DIA',
  'PELO SEU ANIVERSARIO',

  // Payroll terms
  'ASSINATURA DO FUNCIONARIO',
  'DECLARO TER RECEBIDO',
  'NOME DO FUNCIONARIO',
  'TOTAL DE VENCIMENTOS',
  'TOTAL DE DESCONTOS',
  'VALOR LIQUIDO',
  'HORAS NORMAIS',
  'HORAS FERIAS',
  'HORAS EXTRAS',
  'BASE CALCULO',
  'BASE CALC FGTS',
  'BASE CALC IRRF',
  'FOLHA MENSAL',
  'DISTRIBUICAO DE LUCROS',
  'DAS FERIAS',
  'DE FERIAS',
  'ADIANTAMENTO DE FERIAS',
  'MEDIA HORAS FERIAS',
  'MEDIA VALOR FERIAS',
  'MEDIA COMISSOES FERIAS',
  'DIFERENCA MEDIA VALOR',
  'DIFERENCA DE 1/3',
  'INSS FERIAS',
  'INSS DIFERENCA',
  'IRRF FERIAS',
  'REFLEXO COMISSOES DSR',
  'REFLEXO EXTRAS DSR',
  'VALE TRANSPORTE',
  'DESC PLANO ODONTO',
  'PLANO ODONTO FERIAS',
  'PRODUTOS FUNCIONARIOS',
  'SALARIO FAMILIA',
  'AJUDA DE CUSTO',
  'QUEBRA DE CAIXA',
  'VANTAGENS FERIAS',
  'GRATIFICACOES FIXA',
  'ADICIONAL NOTURNO',
  'DESCONTO CONVENIO',
]

/**
 * Individual blacklisted words
 */
const BLACKLIST_WORDS = new Set([
  // Document structure
  'CODIGO', 'CÓDIGO', 'CBO', 'CNPJ', 'CPF', 'CTPS', 'PIS',
  'INSS', 'IRRF', 'FGTS', 'DSR',

  // Company terms
  'LTDA', 'CIA', 'DISTRIBUIDORA', 'COSMETICOS', 'PERFUMES',

  // Document labels
  'ASSINATURA', 'FUNCIONARIO', 'FUNCIONÁRIO', 'DECLARO', 'RECEBIDO', 'RECIBO',
  'VENCIMENTOS', 'DESCONTOS', 'LIQUIDO', 'LÍQUIDO', 'TOTAL', 'TRANSPORTAR',

  // Financial terms
  'BASE', 'CALCULO', 'CÁLCULO', 'SALARIO', 'SALÁRIO', 'CONTR', 'CALC',

  // Time/period
  'FOLHA', 'MENSAL', 'GERAL', 'DATA', 'MES', 'MÊS', 'FAIXA',
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'MARCO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO',

  // Structure terms
  'DEPARTAMENTO', 'FILIAL', 'ADMISSAO', 'ADMISSÃO', 'MATRICULA', 'MATRÍCULA',
  'REFERENCIA', 'REFERÊNCIA', 'DESCRICAO', 'DESCRIÇÃO',

  // Payroll items
  'HORAS', 'FERIAS', 'FÉRIAS', 'NORMAIS', 'EXTRAS', 'NOTURNA', 'NOTURNO',
  'COMISSOES', 'COMISSÕES', 'REFLEXO', 'MEDIA', 'MÉDIA', 'DIFERENCA', 'DIFERENÇA',
  'ADIANTAMENTO', 'VALE', 'TRANSPORTE', 'DESC', 'PLANO', 'ODONTO',
  'PRODUTOS', 'FAMILIA', 'FAMÍLIA', 'AJUDA', 'CUSTO', 'QUEBRA', 'CAIXA',
  'VANTAGENS', 'GRATIFICACOES', 'GRATIFICAÇÕES', 'ADICIONAL', 'CONVENIO', 'CONVÊNIO',
  'OTICA', 'ÓPTICA', 'CRED', 'TRAB', 'EMP', 'LUCROS',

  // Birthday
  'PARABENS', 'PARABÉNS', 'ANIVERSARIO', 'ANIVERSÁRIO', 'DIA',

  // Bank
  'CAIXA', 'AGENCIA', 'AGÊNCIA', 'CONTA', 'AG',

  // Job titles (to avoid capturing them)
  'ANALISTA', 'SUPERVISOR', 'COORDENADOR', 'GERENTE', 'DIRETOR',
  'ATENDENTE', 'OPERADOR', 'ESTOQUISTA', 'MOTORISTA', 'PROMOTOR',
  'CONSULTOR', 'VENDEDOR', 'AUXILIAR', 'ASSISTENTE', 'APRENDIZ',
  'JUNIOR', 'PLENO', 'SENIOR', 'DADOS', 'MARKETING', 'VENDAS', 'CONTAS',
])

/**
 * Check if text contains any blacklisted phrase
 */
function containsBlacklistPhrase(text: string): boolean {
  const normalized = text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  for (const phrase of BLACKLIST_PHRASES) {
    const normalizedPhrase = phrase
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    if (normalized.includes(normalizedPhrase)) {
      return true
    }
  }
  return false
}

/**
 * Check if name has too many blacklisted words
 */
function hasTooManyBlacklistWords(name: string): boolean {
  const normalized = name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const words = normalized.split(/\s+/)
  let blacklistCount = 0

  for (const word of words) {
    if (BLACKLIST_WORDS.has(word)) {
      blacklistCount++
    }
  }

  // If more than 1/3 of words are blacklisted, reject
  return blacklistCount > words.length / 3
}

/**
 * Validate if a string looks like a valid Brazilian person name
 */
function isValidPersonName(name: string): boolean {
  if (!name || name.length < 10) return false

  const trimmed = name.trim()

  // Must have 2-6 words (typical Brazilian names)
  const words = trimmed.split(/\s+/)
  if (words.length < 2 || words.length > 7) return false

  // Each word must be at least 2 letters
  if (words.some((w) => w.length < 2)) return false

  // Must be only letters and spaces
  if (!/^[A-ZÀ-Ú\s]+$/i.test(trimmed)) return false

  // No numbers allowed
  if (/\d/.test(trimmed)) return false

  // Check blacklists
  if (containsBlacklistPhrase(trimmed)) return false
  if (hasTooManyBlacklistWords(trimmed)) return false

  // First word should look like a first name (not a document term)
  const firstWord = words[0].toUpperCase()
  if (BLACKLIST_WORDS.has(firstWord)) return false

  return true
}

/**
 * Extract employee name from page text
 */
export function extractEmployeeName(pageText: string): string | null {
  // Normalize text: single spaces
  const text = pageText.replace(/\s+/g, ' ').trim()

  // PATTERN 1: Look for employee code + name + CBO pattern
  // Format in PDF: "Código [header] Nome do Funcionário [header] CBO [header]"
  // Data row: "[code] [NAME] [CBO number]"
  // So after headers, we get: "20 AMANDA SANTOS COSTA 212405"
  const pattern1 = /\b(\d{1,3})\s+([A-ZÀ-Ú][A-ZÀ-Ú\s]{8,50}?)\s+(\d{6})\b/gi

  let match
  const candidates: Array<{ name: string; priority: number }> = []

  while ((match = pattern1.exec(text)) !== null) {
    const code = parseInt(match[1], 10)
    const potentialName = match[2].trim()
    const cbo = match[3]

    // Employee code should be small (1-99 typically, max 500)
    if (code > 500 || code < 1) continue

    // CBO codes typically start with 1-9
    if (!/^[1-9]/.test(cbo)) continue

    if (isValidPersonName(potentialName)) {
      // Higher priority for codes 1-99
      const priority = code <= 99 ? 2 : 1
      candidates.push({ name: potentialName, priority })
    }
  }

  // PATTERN 2: Look for "Nome do Funcionário" followed directly by name
  // Sometimes the text is: "Nome do Funcionário CBO ... [code] [NAME] [CBO]"
  const pattern2 =
    /Nome\s+do\s+Funcion[aá]rio[\s\S]{0,30}?(\d{1,3})\s+([A-ZÀ-Ú][A-ZÀ-Ú\s]{8,50}?)\s+(\d{6})/gi

  while ((match = pattern2.exec(text)) !== null) {
    const potentialName = match[2].trim()
    if (isValidPersonName(potentialName)) {
      candidates.push({ name: potentialName, priority: 3 })
    }
  }

  // Sort by priority (higher first) and return the best match
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.priority - a.priority)

    // Return the first valid candidate
    for (const candidate of candidates) {
      // Double-check it's not a company name or phrase
      if (!containsBlacklistPhrase(candidate.name)) {
        return sanitizeFilename(candidate.name)
      }
    }
  }

  return null
}
