import type { Message, Response } from '../../types/message.js'
import type { State } from '../../types/state.js'
import { MessageType } from '../../types/message.js'
import { formatLadder } from '../../formatters/embeds.js'

const PAGE_SIZE = 10

/**
 * Handler pour afficher le classement des duos
 *
 * Usage: /ladder [page]
 *
 * Comportement :
 * - Récupère tous les duos
 * - Trie par totalPoints DESC
 * - Pagination (10 duos par page)
 * - Détecte la position du duo du requester s'il en a un
 * - Utilise formatLadder() pour créer l'embed Discord
 *
 * @param msg - Message de commande
 * @param state - État global
 * @param responses - Tableau de réponses à envoyer
 */
export function ladderHandler(msg: Message, state: State, responses: Response[]): void {
  const sourceId = msg.sourceId
  const payload = msg.payload as { page?: number } | undefined

  // Parser la page (défaut: 1)
  let page = payload?.page || 1
  if (page < 1) page = 1

  // Récupérer tous les duos
  const allDuos = Array.from(state.duos.values())

  // Trier par totalPoints DESC, puis par winrate DESC (tie-breaker)
  allDuos.sort((a, b) => {
    // Tri primaire: points
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints
    }

    // Tri secondaire: winrate (en cas d'égalité de points)
    const winrateA = a.gamesPlayed > 0 ? a.wins / a.gamesPlayed : 0
    const winrateB = b.gamesPlayed > 0 ? b.wins / b.gamesPlayed : 0

    if (winrateB !== winrateA) {
      return winrateB - winrateA
    }

    // Tri tertiaire: nombre de victoires (si même winrate)
    return b.wins - a.wins
  })

  // Calculer la pagination
  const totalDuos = allDuos.length
  const totalPages = Math.ceil(totalDuos / PAGE_SIZE)

  // Si page invalide, ramener à la page 1
  if (page > totalPages && totalPages > 0) {
    page = totalPages
  }

  const startIndex = (page - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const duosPage = allDuos.slice(startIndex, endIndex)

  // Trouver la position du duo du requester
  let userDuoRank: number | undefined
  const requester = state.players.get(sourceId)
  if (requester && requester.duoId && requester.duoId !== 0) {
    const userDuoIndex = allDuos.findIndex((d) => d.id === requester.duoId)
    if (userDuoIndex !== -1) {
      userDuoRank = userDuoIndex + 1 // Rang commence à 1
    }
  }

  // Préparer les données pour le formatter
  const ladderData = duosPage.map((duo, index) => {
    const rank = startIndex + index + 1
    const noob = state.players.get(duo.noobId)
    const carry = state.players.get(duo.carryId)

    return {
      rank,
      duoName: duo.name,
      noobName: noob?.gameName || '[Parti]',
      carryName: carry?.gameName || '[Parti]',
      totalPoints: duo.totalPoints,
      wins: duo.wins,
      losses: duo.losses,
    }
  })

  // Utiliser le formatter pour créer l'embed
  const embed = formatLadder({
    duos: ladderData,
    page,
    totalPages,
    totalDuos,
    userDuoRank,
  })

  // Envoyer la réponse
  responses.push({
    type: MessageType.SUCCESS,
    targetId: sourceId,
    content: JSON.stringify(embed), // Le bot Discord parsera l'embed
    ephemeral: false,
  })
}
