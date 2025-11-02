import type { Message, Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import type { State } from '../../types/state.js'
import { formatGameDetected, formatError } from '../../formatters/embeds.js'

/**
 * Handler pour le polling des matchs terminés
 *
 * Comportement :
 * - Parcourt tous les duos actifs
 * - Pour chaque duo, récupère les derniers matchs des 2 joueurs via Riot API
 * - Détecte si les 2 joueurs ont joué ensemble dans un match récent
 * - Si oui et match pas déjà scoré → déclenche la notification
 *
 * Cette approche remplace la détection de games en cours (endpoint bloqué par Riot)
 *
 * @param msg - Message de commande (généralement appelé par un cron/scheduler)
 * @param state - État global
 * @param responses - Tableau de réponses à envoyer
 */
export async function pollGamesHandler(msg: Message, state: State, responses: Response[]): Promise<void> {
  // Récupérer tous les duos actifs
  const duos = Array.from(state.duos.values())

  if (duos.length === 0) {
    // Aucun duo à tracker
    responses.push({
      type: MessageType.INFO,
      targetId: msg.sourceId,
      content: JSON.stringify(formatError({ error: 'Aucun duo enregistré à tracker.' })),
      ephemeral: true,
    })
    return
  }

  let gamesFound = 0
  let gamesAlreadyTracked = 0

  // Pour chaque duo, vérifier s'il y a de nouveaux matchs
  for (const duo of duos) {
    const noob = state.players.get(duo.noobId)
    const carry = state.players.get(duo.carryId)

    if (!noob || !carry) {
      // Joueur manquant, ignorer ce duo
      console.warn(`[Poll] Duo ${duo.id} has missing players`)
      continue
    }

    // Vérifier si les joueurs ont un PUUID
    if (!noob.puuid || !carry.puuid) {
      console.warn(`[Poll] Duo ${duo.id} has players without PUUID`)
      continue
    }

    try {
      // 1. Récupérer les 5 derniers matchs de chaque joueur
      const [noobMatches, carryMatches] = await Promise.all([
        state.riotService.getRecentMatchIds(noob.puuid, 5),
        state.riotService.getRecentMatchIds(carry.puuid, 5),
      ])

      // 2. Trouver les matchs communs
      const commonMatches = findCommonMatches(noobMatches, carryMatches)

      if (commonMatches.length === 0) {
        continue
      }

      // 3. Pour chaque match commun, vérifier s'il est nouveau et ranked
      for (const matchId of commonMatches) {
        // Vérifier si déjà tracké
        if (isMatchAlreadyScored(matchId, state)) {
          gamesAlreadyTracked++
          continue
        }

        // Récupérer les détails du match
        const matchDetails = await state.riotService.getMatchDetails(matchId)

        if (!matchDetails) {
          console.warn(`[Poll] Could not fetch details for match ${matchId}`)
          continue
        }

        // Vérifier que c'est bien un ranked solo/duo (queueId 420)
        if (matchDetails.queueId !== 420) {
          console.log(`[Poll] Match ${matchId} is not ranked solo/duo (queueId: ${matchDetails.queueId})`)
          continue
        }

        // Vérifier que les deux joueurs étaient dans la même équipe
        const noobData = matchDetails.participants.find((p) => p.puuid === noob.puuid)
        const carryData = matchDetails.participants.find((p) => p.puuid === carry.puuid)

        if (!noobData || !carryData) {
          console.warn(`[Poll] Players not found in match ${matchId}`)
          continue
        }

        if (noobData.teamId !== carryData.teamId) {
          console.log(`[Poll] Match ${matchId}: players were not on same team`)
          continue
        }

        // Nouveau match trouvé ! L'ajouter au state et notifier
        gamesFound++

        // Marquer comme tracké (ajouter au state.games)
        state.games.set(matchId, {
          id: matchId,
          duoId: duo.id,
          startTime: new Date(matchDetails.gameCreation),
          endTime: new Date(matchDetails.gameCreation + matchDetails.gameDuration * 1000),
          win: noobData.win,
          noobKDA: `${noobData.kills}/${noobData.deaths}/${noobData.assists}`,
          carryKDA: `${carryData.kills}/${carryData.deaths}/${carryData.assists}`,
          noobChampion: noobData.championName,
          carryChampion: carryData.championName,
          duration: matchDetails.gameDuration,
          scored: false, // Sera scoré par endGameHandler
        })

        // Notifier dans le tracker channel
        const trackerChannelId =
          typeof state.config === 'object' && 'getSync' in state.config
            ? state.config.getSync('trackerChannelId')
            : (state.config as any).trackerChannelId

        if (trackerChannelId) {
          const embed = formatGameDetected({
            duoName: duo.name || `${noob.gameName} & ${carry.gameName}`,
            noobName: `${noob.gameName}#${noob.tagLine}`,
            carryName: `${carry.gameName}#${carry.tagLine}`,
            gameMode: 'RANKED_SOLO_5x5',
            detectedAt: new Date(),
          })

          responses.push({
            type: MessageType.INFO,
            targetId: trackerChannelId,
            content: JSON.stringify(embed),
            ephemeral: false,
          })
        }

        console.log(`[Poll] New game detected: ${matchId} for duo ${duo.id}`)
      }
    } catch (error) {
      console.error(`[Poll] Error polling duo ${duo.id}:`, error)
    }
  }

  // Réponse finale
  const summary = `Polling terminé : ${gamesFound} nouveau(x) match(s) détecté(s), ${gamesAlreadyTracked} déjà tracké(s).`

  responses.push({
    type: MessageType.INFO,
    targetId: msg.sourceId,
    content: JSON.stringify({
      title: '🔍 Polling terminé',
      description: summary,
      color: 0x5865f2,
    }),
    ephemeral: true,
  })

  console.log(`[Poll] ${summary}`)
}

/**
 * Fonction utilitaire pour vérifier si un match a déjà été scoré
 */
function isMatchAlreadyScored(matchId: string, state: State): boolean {
  return state.games.has(matchId)
}

/**
 * Fonction utilitaire pour trouver les matchIds communs entre deux joueurs
 */
function findCommonMatches(noobMatches: string[], carryMatches: string[]): string[] {
  return noobMatches.filter((matchId) => carryMatches.includes(matchId))
}
