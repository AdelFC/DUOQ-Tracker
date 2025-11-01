import type { Message, Response } from '../../types/message.js'
import type { State } from '../../types/state.js'
import { MessageType } from '../../types/message.js'

const PAGE_SIZE = 10

export function historyHandler(msg: Message, state: State, responses: Response[]): void {
  const sourceId = msg.sourceId
  const payload = msg.payload as { targetId?: string; page?: number } | undefined

  // Extraire l'utilisateur cible (targetId fourni ou soi-même)
  const targetUserId = payload?.targetId || sourceId

  // Vérifier que le joueur cible existe
  const targetPlayer = state.players.get(targetUserId)
  if (!targetPlayer) {
    responses.push({
      type: MessageType.ERROR,
      targetId: sourceId,
      content: `❌ Ce joueur n'est pas inscrit au challenge DuoQ.`,
      ephemeral: true,
    })
    return
  }

  // Si le joueur n'a pas de duo, afficher message vide
  if (!targetPlayer.duoId || targetPlayer.duoId === 0) {
    const embed = {
      title: '📜 Historique',
      description: 'Aucune game jouée. Créez un duo pour commencer !',
      color: 0x95a5a6,
      footer: {
        text: 'DuoQ Tracker',
      },
    }

    responses.push({
      type: MessageType.INFO,
      targetId: sourceId,
      content: JSON.stringify(embed),
      ephemeral: false,
    })
    return
  }

  const duo = state.duos.get(targetPlayer.duoId)
  if (!duo) {
    responses.push({
      type: MessageType.ERROR,
      targetId: sourceId,
      content: `❌ Duo introuvable.`,
      ephemeral: true,
    })
    return
  }

  // Récupérer toutes les games du duo
  const duoGames = Array.from(state.games.values()).filter((game: any) => game.duoId === targetPlayer.duoId)

  // Si aucune game
  if (duoGames.length === 0) {
    const embed = {
      title: `📜 Historique de ${duo.name}`,
      description: 'Aucune game jouée pour le moment.',
      color: 0x95a5a6,
      footer: {
        text: 'DuoQ Tracker',
      },
    }

    responses.push({
      type: MessageType.INFO,
      targetId: sourceId,
      content: JSON.stringify(embed),
      ephemeral: false,
    })
    return
  }

  // Trier par date décroissante (plus récent en premier)
  duoGames.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())

  // Pagination
  let page = payload?.page || 1
  if (page < 1) page = 1

  const totalGames = duoGames.length
  const totalPages = Math.ceil(totalGames / PAGE_SIZE)

  const startIndex = (page - 1) * PAGE_SIZE
  const gamesPage = duoGames.slice(startIndex, startIndex + PAGE_SIZE)

  // Construire la description
  const lines: string[] = []

  for (const game of gamesPage) {
    const emoji = game.win ? '🏆' : '💀'
    const result = game.win ? 'Victoire' : 'Défaite'
    const points = game.pointsAwarded >= 0 ? `+${game.pointsAwarded}` : `${game.pointsAwarded}`

    const noobKDA = `${game.noobKills}/${game.noobDeaths}/${game.noobAssists}`
    const carryKDA = `${game.carryKills}/${game.carryDeaths}/${game.carryAssists}`

    const durationMin = Math.floor(game.duration / 60)

    lines.push(`${emoji} **${result}** • ${points} pts • ${durationMin}min`)
    lines.push(`├─ Noob: ${noobKDA}`)
    lines.push(`└─ Carry: ${carryKDA}`)
    lines.push(`   \`${game.matchId}\``)
    lines.push('')
  }

  const embed = {
    title: `📜 Historique de ${duo.name}`,
    description: lines.join('\n'),
    color: 0x3498db,
    footer: {
      text: `Page ${page}/${totalPages} • ${totalGames} games`,
    },
  }

  responses.push({
    type: MessageType.SUCCESS,
    targetId: sourceId,
    content: JSON.stringify(embed),
    ephemeral: false,
  })
}
