import { sanitizeFilename } from './sanitize'

/**
 * Blacklist of company names and common phrases that are NOT employee names
 */
const BLACKLIST_PHRASES = [
  'ACQUA DISTRIBUIDORA',
  'DISTRIBUIDORA DE PERFUMES',
  'ALAN MARTINS TAVARES',
  'PARABENS PELO SEU',
  'ANIVERSARIO NO DIA',
  'ASSINATURA DO FUNCIONARIO',
  'DECLARO TER RECEBIDO',
]

/**
 * Check if text contains any blacklisted phrase
 */
function containsBlacklistPhrase(text: string): boolean {
  const normalized = text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')

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
 * Validate if a string looks like a valid Brazilian person name
 */
function isValidPersonName(name: string): boolean {
  if (!name || name.length < 8) return false

  const trimmed = name.trim()

  // Must have 2-7 words
  const words = trimmed.split(/\s+/)
  if (words.length < 2 || words.length > 7) return false

  // Each word must be at least 2 letters
  if (words.some((w) => w.length < 2)) return false

  // Must be only letters and spaces (allow accents)
  if (!/^[A-ZÀ-Ú\s]+$/i.test(trimmed)) return false

  // Check blacklist
  if (containsBlacklistPhrase(trimmed)) return false

  return true
}

/**
 * Extract employee name from page text
 */
export function extractEmployeeName(pageText: string): string | null {
  // Normalize text: collapse multiple spaces to single space
  const text = pageText.replace(/\s+/g, ' ').trim()

  // MAIN PATTERN: The PDF structure is:
  // "[code] Código [NAME] Nome do Funcionário CBO [CBO number]"
  // Example: "20 Código AMANDA SANTOS COSTA Nome do Funcionário CBO 212405"
  const mainPattern =
    /(\d{1,3})\s+C[oó]digo\s+([A-ZÀ-Ú][A-ZÀ-Ú\s]+?)\s+Nome\s+do\s+Funcion[aá]rio\s+CBO\s+(\d{6})/gi

  let match
  const candidates: string[] = []

  while ((match = mainPattern.exec(text)) !== null) {
    const code = parseInt(match[1], 10)
    const potentialName = match[2].trim()

    // Employee code should be 1-500
    if (code < 1 || code > 500) continue

    if (isValidPersonName(potentialName)) {
      candidates.push(potentialName)
    }
  }

  // Return first valid candidate
  if (candidates.length > 0) {
    return sanitizeFilename(candidates[0])
  }

  // FALLBACK PATTERN: Sometimes text comes as:
  // "Código [code] [NAME] Nome do Funcionário CBO [CBO]"
  const fallbackPattern =
    /C[oó]digo\s+(\d{1,3})\s+([A-ZÀ-Ú][A-ZÀ-Ú\s]+?)\s+Nome\s+do\s+Funcion[aá]rio/gi

  while ((match = fallbackPattern.exec(text)) !== null) {
    const code = parseInt(match[1], 10)
    const potentialName = match[2].trim()

    if (code < 1 || code > 500) continue

    if (isValidPersonName(potentialName)) {
      candidates.push(potentialName)
    }
  }

  if (candidates.length > 0) {
    return sanitizeFilename(candidates[0])
  }

  return null
}
