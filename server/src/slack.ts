import { WebClient } from '@slack/web-api'

const token = process.env.SLACK_BOT_TOKEN
if (!token) {
  console.warn('SLACK_BOT_TOKEN não configurado')
}

const slack = new WebClient(token)

export interface SlackSendResult {
  success: boolean
  error?: string
}

/**
 * Abre uma conversa DM com um usuário pelo Slack ID
 */
async function openDM(slackId: string): Promise<string> {
  const result = await slack.conversations.open({ users: slackId })
  if (!result.channel?.id) {
    throw new Error('Não foi possível abrir conversa com o usuário')
  }
  return result.channel.id
}

/**
 * Envia um arquivo PDF para um usuário via DM usando o Slack ID direto
 */
export async function sendPdfToUser(
  slackId: string,
  pdfBuffer: Buffer,
  fileName: string,
  employeeName: string
): Promise<SlackSendResult> {
  try {
    // 1. Abrir DM com o usuário pelo Slack ID
    const channelId = await openDM(slackId)

    // 2. Fazer upload do arquivo e enviar
    await slack.filesUploadV2({
      channel_id: channelId,
      file: pdfBuffer,
      filename: fileName,
      initial_comment: `Olá ${employeeName}! Segue em anexo o seu holerite.`,
    })

    return { success: true }
  } catch (error: unknown) {
    const err = error as Error
    console.error('Erro ao enviar PDF via Slack:', err)
    return {
      success: false,
      error: err.message || 'Erro desconhecido ao enviar via Slack',
    }
  }
}

/**
 * Verifica se o token do Slack está configurado e válido
 */
export async function testSlackConnection(): Promise<{
  ok: boolean
  team?: string
  error?: string
}> {
  try {
    if (!token) {
      return { ok: false, error: 'SLACK_BOT_TOKEN não configurado' }
    }
    const result = await slack.auth.test()
    return { ok: true, team: result.team }
  } catch (error: unknown) {
    const err = error as Error
    return { ok: false, error: err.message }
  }
}
