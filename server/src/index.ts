import 'dotenv/config'
import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { sendPdfToUser, testSlackConnection, getSlackUserName } from './slack.js'
import {
  getEmployees,
  addEmployee,
  removeEmployee,
  isConfigured as isStoreConfigured,
} from './store.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

// ============================================================
// Cadastro de funcionários (armazenados no GitHub via store.ts)
// ============================================================
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!ADMIN_PASSWORD) {
    next()
    return
  }
  if (req.header('x-admin-password') === ADMIN_PASSWORD) {
    next()
    return
  }
  res.status(401).json({ success: false, error: 'Senha de administrador inválida.' })
}

const NAME_RE = /^[A-Za-zÀ-ÿ\s]{2,80}$/
const SLACK_ID_RE = /^[UW][A-Z0-9]{7,14}$/

// Lista os funcionários cadastrados pela app
app.get('/api/employees', async (_req, res) => {
  if (!isStoreConfigured()) {
    res.json({ employees: {}, configured: false })
    return
  }
  try {
    const employees = await getEmployees()
    res.json({ employees, configured: true })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Erro ao listar funcionários:', err)
    res.status(500).json({ employees: {}, configured: true, error: err.message })
  }
})

// Cadastra (ou atualiza) um funcionário
app.post('/api/employees', requireAdmin, async (req, res) => {
  const { name, slackId } = req.body as { name?: string; slackId?: string }

  if (!name || !slackId) {
    res.status(400).json({ success: false, error: 'Campos obrigatórios: name, slackId' })
    return
  }

  const cleanName = name.replace(/\s+/g, ' ').trim()
  const cleanId = slackId.trim().toUpperCase()

  if (!NAME_RE.test(cleanName)) {
    res
      .status(400)
      .json({ success: false, error: 'Nome inválido. Use apenas letras e espaços.' })
    return
  }
  if (!SLACK_ID_RE.test(cleanId)) {
    res.status(400).json({
      success: false,
      error:
        'Slack ID inválido. Deve começar com U e conter letras/números (ex.: U07KXEJU338).',
    })
    return
  }
  if (!isStoreConfigured()) {
    res.status(503).json({
      success: false,
      error: 'Armazenamento não configurado. Defina GITHUB_TOKEN no servidor.',
    })
    return
  }

  // Confirma o ID no Slack (best-effort): bloqueia só se claramente não existir.
  let verifiedName: string | undefined
  let warning: string | undefined
  const check = await getSlackUserName(cleanId)
  if (check.ok) {
    verifiedName = check.name
  } else if (
    check.error &&
    /user_not_found|invalid_user|invalid_arguments/i.test(check.error)
  ) {
    res.status(400).json({
      success: false,
      error: 'Esse Slack ID não existe no seu workspace. Confira o ID.',
    })
    return
  } else {
    warning = 'não foi possível confirmar o ID no Slack (verifique manualmente).'
  }

  try {
    const employees = await addEmployee(cleanName, cleanId)
    res.json({ success: true, employees, verifiedName, warning })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Erro ao cadastrar funcionário:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// Remove um funcionário cadastrado
app.delete('/api/employees', requireAdmin, async (req, res) => {
  const { name } = req.body as { name?: string }
  if (!name) {
    res.status(400).json({ success: false, error: 'Campo obrigatório: name' })
    return
  }
  if (!isStoreConfigured()) {
    res.status(503).json({ success: false, error: 'Armazenamento não configurado.' })
    return
  }
  try {
    const employees = await removeEmployee(name)
    res.json({ success: true, employees })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Erro ao remover funcionário:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// Serve frontend static files in production
const distPath = path.join(__dirname, '../../dist')
app.use(express.static(distPath))

// Fallback to index.html for SPA routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
})
