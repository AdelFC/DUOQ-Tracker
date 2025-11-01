import type { Message, Response } from '../../types/message.js'
import type { State } from '../../types/state.js'
import type { GameData } from '../../types/game.js'
import { MessageType } from '../../types/message.js'
import { calculateGameScore } from '../../services/scoring/engine.js'

/**
 * Handler pour la fin d'un game
 *
 * Comportement :
 * - Récupère les stats du game (KDA, résultat, rank change)
 * - Applique le scoring engine
 * - Met à jour les stats des joueurs et du duo
 * - Notifie avec embed formaté
 *
 * @param msg - Message de fin de game avec gameData
 * @param state - État global
 * @param responses - Tableau de réponses à envoyer
 */
export function endGameHandler(msg: Message, state: State, responses: Response[]): void {
  // Valider les données du game
  const gameData = msg.payload as GameData | undefined

  if (!gameData) {
    responses.push({
      type: MessageType.ERROR,
      targetId: 'system',
      content: '❌ Erreur : données de game manquantes.',
      ephemeral: true,
    })
    return
  }

  // Récupérer les playerIds depuis les stats
  const noobId = gameData.noobStats.puuid
  const carryId = gameData.carryStats.puuid

  const noob = state.players.get(noobId)
  const carry = state.players.get(carryId)

  // Vérifier que les deux joueurs existent et sont en duo
  if (!noob || !carry) {
    return // Joueurs non inscrits
  }

  if (!noob.duoId || !carry.duoId || noob.duoId !== carry.duoId) {
    return // Pas dans le même duo
  }

  const duo = state.duos.get(noob.duoId)
  if (!duo) {
    return // Duo introuvable
  }

  const noobStats = gameData.noobStats
  const carryStats = gameData.carryStats

  // CRITICAL: Vérifier que les deux joueurs sont dans la MÊME ÉQUIPE
  // Sinon on scorerait des games soloQ où les joueurs jouent en même temps mais pas ensemble
  if (noobStats.teamId !== carryStats.teamId) {
    return // Pas dans la même équipe
  }

  // Appliquer le scoring engine
  const scoreResult = calculateGameScore({
    gameData,
    noobStreak: noob.streaks.current,
    carryStreak: carry.streaks.current,
  })

  const noobPoints = scoreResult.noob.final
  const carryPoints = scoreResult.carry.final
  const duoPoints = scoreResult.total

  // Mettre à jour les stats des joueurs
  noob.totalPoints += noobPoints
  noob.currentRank = noobStats.newRank

  carry.totalPoints += carryPoints
  carry.currentRank = carryStats.newRank

  if (gameData.win) {
    noob.wins += 1
    noob.streaks.current += 1
    if (noob.streaks.current > noob.streaks.longestWin) {
      noob.streaks.longestWin = noob.streaks.current
    }
    carry.wins += 1
    carry.streaks.current += 1
    if (carry.streaks.current > carry.streaks.longestWin) {
      carry.streaks.longestWin = carry.streaks.current
    }
    duo.wins += 1
    duo.currentStreak += 1
    if (duo.currentStreak > duo.longestWinStreak) {
      duo.longestWinStreak = duo.currentStreak
    }
  } else {
    noob.losses += 1
    noob.streaks.current = 0
    carry.losses += 1
    carry.streaks.current = 0
    duo.losses += 1
    duo.currentStreak = 0
  }

  // Mettre à jour le duo
  duo.totalPoints += duoPoints

  // Notifier avec le résultat
  const result = gameData.win ? 'victoire' : 'défaite'
  const emoji = gameData.win ? '🏆' : '💀'

  responses.push({
    type: MessageType.INFO,
    targetId: 'broadcast',
    content: `${emoji} **${duo.name}** - ${result} ! | Noob: ${noobPoints >= 0 ? '+' : ''}${noobPoints} pts | Carry: ${carryPoints >= 0 ? '+' : ''}${carryPoints} pts | Total: ${duoPoints >= 0 ? '+' : ''}${duoPoints} pts`,
    ephemeral: false,
  })
}
