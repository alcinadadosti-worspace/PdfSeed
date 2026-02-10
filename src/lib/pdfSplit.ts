import { PDFDocument } from 'pdf-lib'

/**
 * Extract a single page from a PDF and return as bytes
 */
export async function extractSinglePage(
  pdfData: ArrayBuffer,
  pageIndex: number
): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(pdfData)
  const newPdf = await PDFDocument.create()

  const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageIndex])
  newPdf.addPage(copiedPage)

  return await newPdf.save()
}

/**
 * Extract multiple pages from a PDF, returning array of page bytes
 */
export async function extractAllPages(
  pdfData: ArrayBuffer,
  onProgress?: (current: number, total: number) => void
): Promise<Uint8Array[]> {
  const sourcePdf = await PDFDocument.load(pdfData)
  const totalPages = sourcePdf.getPageCount()
  const pages: Uint8Array[] = []

  for (let i = 0; i < totalPages; i++) {
    const newPdf = await PDFDocument.create()
    const [copiedPage] = await newPdf.copyPages(sourcePdf, [i])
    newPdf.addPage(copiedPage)

    pages.push(await newPdf.save())

    if (onProgress) {
      onProgress(i + 1, totalPages)
    }

    // Yield to UI
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  return pages
}

/**
 * Download a PDF file
 */
export function downloadPDF(data: Uint8Array, filename: string): void {
  const blob = new Blob([new Uint8Array(data)], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
