import JSZip from 'jszip'
import { extractSinglePage } from './pdfSplit'
import { deduplicateFilenames } from './dedupe'

export interface ZipEntry {
  name: string
  pageIndex: number
}

/**
 * Create a ZIP file containing all PDF pages
 */
export async function createZipWithPDFs(
  pdfData: ArrayBuffer,
  entries: ZipEntry[],
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const zip = new JSZip()

  // Deduplicate filenames
  const names = entries.map((e) => e.name)
  const uniqueNames = deduplicateFilenames(names)

  for (let i = 0; i < entries.length; i++) {
    const pageData = await extractSinglePage(pdfData, entries[i].pageIndex)
    const filename = `${uniqueNames[i]}.pdf`
    zip.file(filename, pageData)

    if (onProgress) {
      onProgress(i + 1, entries.length)
    }

    // Yield to UI
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  return await zip.generateAsync({ type: 'blob' })
}

/**
 * Download a ZIP file
 */
export function downloadZip(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.zip') ? filename : `${filename}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
