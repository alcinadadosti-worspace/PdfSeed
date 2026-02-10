/**
 * Deduplicate filenames by adding (2), (3), etc. suffix
 */
export function deduplicateFilenames(names: string[]): string[] {
  const counts: Map<string, number> = new Map()
  const result: string[] = []

  for (const name of names) {
    const upperName = name.toUpperCase()
    const count = counts.get(upperName) || 0

    if (count === 0) {
      result.push(name)
    } else {
      result.push(`${name} (${count + 1})`)
    }

    counts.set(upperName, count + 1)
  }

  return result
}

/**
 * Get unique filename for a single name given existing names
 */
export function getUniqueFilename(
  name: string,
  existingNames: Set<string>
): string {
  const upperName = name.toUpperCase()

  if (!existingNames.has(upperName)) {
    return name
  }

  let counter = 2
  while (existingNames.has(`${upperName} (${counter})`)) {
    counter++
  }

  return `${name} (${counter})`
}
