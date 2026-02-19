import { Employee } from './excel'
import { PageResult } from '../components/ResultItem'

export interface EmailMatch {
  pageIndex: number
  pageNumber: number
  pdfName: string | null
  employee: Employee | null
  matchScore: number // 0-100, higher is better
  status: 'matched' | 'no_name' | 'not_found' | 'manual'
}

/**
 * Normalize a name for comparison
 * Removes accents, converts to uppercase, and removes extra spaces
 */
function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calculate similarity between two names (0-100)
 * Uses a combination of exact match, contains check, and word matching
 */
function calculateSimilarity(name1: string, name2: string): number {
  const n1 = normalizeName(name1)
  const n2 = normalizeName(name2)

  // Exact match
  if (n1 === n2) return 100

  // One contains the other
  if (n1.includes(n2) || n2.includes(n1)) {
    const shorter = n1.length < n2.length ? n1 : n2
    const longer = n1.length < n2.length ? n2 : n1
    return Math.round((shorter.length / longer.length) * 90)
  }

  // Word-based matching
  const words1 = n1.split(' ')
  const words2 = n2.split(' ')

  let matchedWords = 0
  for (const w1 of words1) {
    if (words2.some((w2) => w1 === w2 || w1.includes(w2) || w2.includes(w1))) {
      matchedWords++
    }
  }

  const maxWords = Math.max(words1.length, words2.length)
  if (maxWords === 0) return 0

  return Math.round((matchedWords / maxWords) * 80)
}

/**
 * Find the best matching employee for a given name
 */
function findBestMatch(
  pdfName: string,
  employees: Employee[]
): { employee: Employee; score: number } | null {
  let bestMatch: Employee | null = null
  let bestScore = 0

  for (const emp of employees) {
    const score = calculateSimilarity(pdfName, emp.name)
    if (score > bestScore) {
      bestScore = score
      bestMatch = emp
    }
  }

  // Only return if score is above threshold (60%)
  if (bestMatch && bestScore >= 60) {
    return { employee: bestMatch, score: bestScore }
  }

  return null
}

/**
 * Match PDF results with employee list
 */
export function matchEmployees(
  results: PageResult[],
  employees: Employee[]
): EmailMatch[] {
  return results.map((result) => {
    if (!result.name) {
      return {
        pageIndex: result.pageIndex,
        pageNumber: result.pageNumber,
        pdfName: null,
        employee: null,
        matchScore: 0,
        status: 'no_name' as const,
      }
    }

    const match = findBestMatch(result.name, employees)

    if (match) {
      return {
        pageIndex: result.pageIndex,
        pageNumber: result.pageNumber,
        pdfName: result.name,
        employee: match.employee,
        matchScore: match.score,
        status: 'matched' as const,
      }
    }

    return {
      pageIndex: result.pageIndex,
      pageNumber: result.pageNumber,
      pdfName: result.name,
      employee: null,
      matchScore: 0,
      status: 'not_found' as const,
    }
  })
}

/**
 * Get statistics about matches
 */
export function getMatchStats(matches: EmailMatch[]): {
  total: number
  matched: number
  noName: number
  notFound: number
  manual: number
} {
  return {
    total: matches.length,
    matched: matches.filter((m) => m.status === 'matched').length,
    noName: matches.filter((m) => m.status === 'no_name').length,
    notFound: matches.filter((m) => m.status === 'not_found').length,
    manual: matches.filter((m) => m.status === 'manual').length,
  }
}
