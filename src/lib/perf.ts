/**
 * Yield control to the UI thread to prevent blocking
 */
export async function yieldToUI(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Process items in batches with UI yielding
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  onProgress?: (current: number, total: number) => void,
  batchSize: number = 1
): Promise<R[]> {
  const results: R[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)

    for (let j = 0; j < batch.length; j++) {
      const index = i + j
      const result = await processor(batch[j], index)
      results.push(result)

      if (onProgress) {
        onProgress(index + 1, items.length)
      }
    }

    await yieldToUI()
  }

  return results
}
