/**
 * Mapeamento fixo de nomes para Slack IDs
 * Adicione novos funcionários aqui no formato:
 * 'NOME COMPLETO': 'SLACK_ID'
 */
export const slackIdMap: Record<string, string> = {
  'CARLOS EDUARDO SILVA DE OLIVEIRA': 'U0895CZ8HU7',
}

/**
 * Normaliza o nome para comparação (remove acentos, uppercase)
 */
function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Busca o Slack ID pelo nome do funcionário
 */
export function getSlackIdByName(name: string): string | undefined {
  const normalizedInput = normalizeName(name)

  // Primeiro tenta match exato
  for (const [mapName, slackId] of Object.entries(slackIdMap)) {
    if (normalizeName(mapName) === normalizedInput) {
      return slackId
    }
  }

  // Depois tenta match parcial (um contém o outro)
  for (const [mapName, slackId] of Object.entries(slackIdMap)) {
    const normalizedMapName = normalizeName(mapName)
    if (normalizedInput.includes(normalizedMapName) || normalizedMapName.includes(normalizedInput)) {
      return slackId
    }
  }

  return undefined
}
