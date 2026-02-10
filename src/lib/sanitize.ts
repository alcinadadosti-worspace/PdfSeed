/**
 * Sanitize a string to be used as a filename
 */
export function sanitizeFilename(name: string): string {
  // Remove invalid filename characters: \ / : * ? " < > |
  let sanitized = name.replace(/[\\/:*?"<>|]/g, '')

  // Replace multiple spaces with single space
  sanitized = sanitized.replace(/\s+/g, ' ')

  // Trim whitespace
  sanitized = sanitized.trim()

  // Convert to uppercase
  sanitized = sanitized.toUpperCase()

  // Limit length to 120 characters
  if (sanitized.length > 120) {
    sanitized = sanitized.substring(0, 120).trim()
  }

  // If empty after sanitization, return a default name
  if (!sanitized) {
    return 'SEM_NOME'
  }

  return sanitized
}

/**
 * Normalize text for processing
 */
export function normalizeText(text: string): string {
  // Normalize unicode
  let normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // Replace multiple spaces/newlines with single space
  normalized = normalized.replace(/\s+/g, ' ')

  // Trim
  normalized = normalized.trim()

  return normalized
}
