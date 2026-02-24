import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { sendPdfToUser, testSlackConnection } from './slack.js'

const app = express()
const PORT = process.env.PORT || 3001

// CORS configuration
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
app.use(
  cors({
    origin: [frontendUrl, 'http://localhost:5173', 'http://localhost:4173'],
    methods: ['GET', 'POST'],
    credentials: true,
  })
)

// Parse JSON bodies (limit increased for PDF base64)
app.use(express.json({ limit: '50mb' }))

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Test Slack connection
app.get('/api/slack/test', async (_req, res) => {
  const result = await testSlackConnection()
  res.json(result)
})

// Send PDF via Slack
interface SendRequest {
  slackId: string
  pdfBase64: string
  fileName: string
  employeeName: string
}

app.post('/api/slack/send', async (req, res) => {
  const { slackId, pdfBase64, fileName, employeeName } = req.body as SendRequest

  if (!slackId || !pdfBase64 || !fileName) {
    res.status(400).json({
      success: false,
      error: 'Campos obrigatórios: slackId, pdfBase64, fileName',
    })
    return
  }

  try {
    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64')

    const result = await sendPdfToUser(
      slackId,
      pdfBuffer,
      fileName,
      employeeName || 'Funcionário'
    )

    if (result.success) {
      res.json(result)
    } else {
      res.status(400).json(result)
    }
  } catch (error: unknown) {
    const err = error as Error
    console.error('Erro no endpoint /api/slack/send:', err)
    res.status(500).json({
      success: false,
      error: err.message || 'Erro interno do servidor',
    })
  }
})

// Batch send PDFs
interface BatchSendRequest {
  items: Array<{
    slackId: string
    pdfBase64: string
    fileName: string
    employeeName: string
  }>
}

app.post('/api/slack/send-batch', async (req, res) => {
  const { items } = req.body as BatchSendRequest

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({
      success: false,
      error: 'Campo obrigatório: items (array)',
    })
    return
  }

  const results = []

  for (const item of items) {
    try {
      const pdfBuffer = Buffer.from(item.pdfBase64, 'base64')
      const result = await sendPdfToUser(
        item.slackId,
        pdfBuffer,
        item.fileName,
        item.employeeName || 'Funcionário'
      )
      results.push({
        slackId: item.slackId,
        ...result,
      })
    } catch (error: unknown) {
      const err = error as Error
      results.push({
        slackId: item.slackId,
        success: false,
        error: err.message,
      })
    }

    // Small delay between requests to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500))
  }

  res.json({
    success: true,
    results,
    summary: {
      total: results.length,
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    },
  })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Frontend URL: ${frontendUrl}`)
})
