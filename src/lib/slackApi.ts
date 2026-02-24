// Em produção usa caminho relativo (mesmo servidor), em dev usa localhost:3001
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001')

export interface SlackSendResult {
  success: boolean
  error?: string
}

/**
 * Testa a conexão com o Slack
 */
export async function testSlackConnection(): Promise<{
  ok: boolean
  team?: string
  error?: string
}> {
  const response = await fetch(`${API_URL}/api/slack/test`)
  return response.json()
}

/**
 * Envia um PDF para um usuário via Slack DM usando o Slack ID
 */
export async function sendPdfToSlack(
  slackId: string,
  pdfData: Uint8Array,
  fileName: string,
  employeeName: string
): Promise<SlackSendResult> {
  // Convert Uint8Array to base64
  const pdfBase64 = uint8ArrayToBase64(pdfData)

  const response = await fetch(`${API_URL}/api/slack/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      slackId,
      pdfBase64,
      fileName,
      employeeName,
    }),
  })

  return response.json()
}

/**
 * Converte Uint8Array para base64
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
