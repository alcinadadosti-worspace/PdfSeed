/**
 * Armazenamento dos funcionários cadastrados pela app.
 *
 * Usa um arquivo JSON no próprio repositório do GitHub como "banco de dados"
 * (grátis, compartilhado e permanente), lido e escrito via GitHub Contents API.
 * Cada cadastro/remoção vira um commit — o mesmo fluxo que hoje é feito na mão.
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = process.env.GITHUB_REPO || 'alcinadadosti-worspace/PdfSeed'
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main'
const GITHUB_FILE_PATH = process.env.GITHUB_FILE_PATH || 'data/employees.json'

const API_BASE = 'https://api.github.com'
const CACHE_TTL_MS = 30_000

export type EmployeeMap = Record<string, string>

interface CacheEntry {
  map: EmployeeMap
  sha: string | null
  fetchedAt: number
}

let cache: CacheEntry | null = null

/**
 * Indica se o armazenamento no GitHub está configurado (token presente).
 */
export function isConfigured(): boolean {
  return Boolean(GITHUB_TOKEN)
}

function githubHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'pdfseed-app',
  }
}

/**
 * Normaliza o nome para virar a "chave" no JSON (uppercase, sem espaços extras).
 * Mantém os acentos, no mesmo estilo do mapa fixo.
 */
function normalizeName(name: string): string {
  return name.replace(/\s+/g, ' ').trim().toUpperCase()
}

/**
 * Ordena o mapa por nome, para o arquivo commitado ficar organizado.
 */
function sortMap(map: EmployeeMap): EmployeeMap {
  const sorted: EmployeeMap = {}
  for (const key of Object.keys(map).sort((a, b) => a.localeCompare(b, 'pt-BR'))) {
    sorted[key] = map[key]
  }
  return sorted
}

/**
 * Lê o arquivo JSON diretamente do GitHub, retornando o mapa e o SHA atual
 * (necessário para escrever por cima sem conflito).
 */
async function fetchFromGitHub(): Promise<{ map: EmployeeMap; sha: string | null }> {
  const url = `${API_BASE}/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}?ref=${GITHUB_BRANCH}`
  const res = await fetch(url, { headers: githubHeaders() })

  // Arquivo ainda não existe — será criado no primeiro cadastro
  if (res.status === 404) {
    return { map: {}, sha: null }
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GitHub GET falhou (${res.status}): ${text}`)
  }

  const data = (await res.json()) as { content: string; sha: string }
  const decoded = Buffer.from(data.content, 'base64').toString('utf-8')
  let map: EmployeeMap = {}
  try {
    map = decoded.trim() ? (JSON.parse(decoded) as EmployeeMap) : {}
  } catch {
    map = {}
  }
  return { map, sha: data.sha }
}

/**
 * Escreve (commita) o mapa no GitHub.
 */
async function commitToGitHub(
  map: EmployeeMap,
  sha: string | null,
  message: string
): Promise<string> {
  const url = `${API_BASE}/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`
  const content = Buffer.from(
    JSON.stringify(sortMap(map), null, 2) + '\n',
    'utf-8'
  ).toString('base64')

  const body: Record<string, unknown> = { message, content, branch: GITHUB_BRANCH }
  if (sha) body.sha = sha

  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...githubHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GitHub PUT falhou (${res.status}): ${text}`)
  }
  const data = (await res.json()) as { content: { sha: string } }
  return data.content.sha
}

/**
 * Retorna a lista de funcionários cadastrados (com cache curto).
 */
export async function getEmployees(force = false): Promise<EmployeeMap> {
  if (!force && cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.map
  }
  const { map, sha } = await fetchFromGitHub()
  cache = { map, sha, fetchedAt: Date.now() }
  return map
}

/**
 * Cadastra (ou atualiza) um funcionário e commita no GitHub.
 */
export async function addEmployee(name: string, slackId: string): Promise<EmployeeMap> {
  // Relê fresco para pegar o SHA mais recente e evitar conflito.
  const { map, sha } = await fetchFromGitHub()
  const key = normalizeName(name)
  const next = { ...map, [key]: slackId.trim() }
  const newSha = await commitToGitHub(next, sha, `feat: cadastrar ${key}`)
  cache = { map: next, sha: newSha, fetchedAt: Date.now() }
  return next
}

/**
 * Remove um funcionário e commita no GitHub.
 */
export async function removeEmployee(name: string): Promise<EmployeeMap> {
  const { map, sha } = await fetchFromGitHub()
  const key = normalizeName(name)
  if (!(key in map)) {
    return map
  }
  const next = { ...map }
  delete next[key]
  const newSha = await commitToGitHub(next, sha, `chore: remover ${key}`)
  cache = { map: next, sha: newSha, fetchedAt: Date.now() }
  return next
}
