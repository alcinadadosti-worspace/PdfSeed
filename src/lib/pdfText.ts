import * as pdfjs from 'pdfjs-dist'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'

// Configure the worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export interface PageText {
  pageNumber: number
  text: string
}

/**
 * Extract text from all pages of a PDF
 */
export async function extractTextFromPDF(
  pdfData: ArrayBuffer,
  onProgress?: (current: number, total: number) => void
): Promise<PageText[]> {
  const pdf = await pdfjs.getDocument({ data: pdfData }).promise
  const totalPages = pdf.numPages
  const pageTexts: PageText[] = []

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()

    // Build text from items, preserving approximate order
    const textItems = textContent.items
      .filter((item): item is TextItem => 'str' in item)
      .map((item) => item.str)
      .join(' ')

    pageTexts.push({
      pageNumber: i,
      text: textItems,
    })

    if (onProgress) {
      onProgress(i, totalPages)
    }

    // Yield to UI every page
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  return pageTexts
}

/**
 * Get total number of pages in a PDF
 */
export async function getPDFPageCount(pdfData: ArrayBuffer): Promise<number> {
  const pdf = await pdfjs.getDocument({ data: pdfData }).promise
  return pdf.numPages
}
