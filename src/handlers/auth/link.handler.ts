/**
 * Handler LINK
 *
 * Crée un duo entre deux joueurs inscrits.
 * Détermine automatiquement qui est noob/carry selon leur peakElo.
 * Génère un nom de team automatique si non fourni.
 */

import type { Message, Response } from '../../types/message.js'
import type { State } from '../../types/state.js'
import type { Duo } from '../../types/duo.js'
import { MessageType } from '../../types/message.js'
import { rankToValue, parseRankString } from '../../services/scoring/rank-utils.js'
import { getRandomTeamName } from '../../constants/team-names.js'

interface LinkPayload {
  partnerId: string
  teamName?: string
}

/**
 * Génère un ID unique pour le duo
 */
function generateDuoId(state: State): number {
  const existingIds = Array.from(state.duos.keys())
  return existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1
}

/**
 * Détermine qui est noob et qui est carry selon leur peakElo
 * Le joueur avec le peakElo le plus bas est le noob
 * Si peakElo égaux, on compare les LP
 */
function determineRoles(
  player1Id: string,
  player2Id: string,
  state: State
): { noobId: string; carryId: string } {
  const player1 = state.players.get(player1Id)!
  const player2 = state.players.get(player2Id)!

  // Parser les peakElo
  const peak1 = parseRankString(player1.peakElo)
  const peak2 = parseRankString(player2.peakElo)

  const peak1Value = rankToValue(peak1)
  const peak2Value = rankToValue(peak2)

  // Comparer les peakElo
  if (peak1Value < peak2Value) {
    return { noobId: player1Id, carryId: player2Id }
  } else if (peak2Value < peak1Value) {
    return { noobId: player2Id, carryId: player1Id }
  } else {
    // Même peakElo, comparer les LP du currentRank
    const lp1 = player1.currentRank.lp
    const lp2 = player2.currentRank.lp

    if (lp1 < lp2) {
      return { noobId: player1Id, carryId: player2Id }
    } else {
      return { noobId: player2Id, carryId: player1Id }
    }
  }
}

/**
 * Handler principal
 */
export function linkHandler(msg: Message, state: State, responses: Response[]): void {
  const senderId = msg.sourceId
  const payload = msg.payload as LinkPayload

  // Validation 1: partnerId requis
  if (!payload?.partnerId) {
    responses.push({
      type: MessageType.ERROR,
      targetId: senderId,
      content: `❌ Le partnerId est requis pour créer un duo.`,
      ephemeral: true,
    })
    return
  }

  const { partnerId, teamName } = payload

  // Validation 2: Sender inscrit
  if (!state.players.has(senderId)) {
    responses.push({
      type: MessageType.ERROR,
      targetId: senderId,
      content: `❌ Tu n'as pas lié ton compte Riot. Utilise /register d'abord.`,
      ephemeral: true,
    })
    return
  }

  // Validation 3: Tentative de link avec soi-même
  if (senderId === partnerId) {
    responses.push({
      type: MessageType.ERROR,
      targetId: senderId,
      content: `❌ Tu ne peux pas créer un duo avec toi-même !`,
      ephemeral: true,
    })
    return
  }

  // Validation 4: Partner inscrit
  if (!state.players.has(partnerId)) {
    responses.push({
      type: MessageType.ERROR,
      targetId: senderId,
      content: `❌ Le partenaire n'a pas lié son compte Riot. Il doit utiliser /register d'abord.`,
      ephemeral: true,
    })
    return
  }

  const sender = state.players.get(senderId)!
  const partner = state.players.get(partnerId)!

  // Validation 5: Sender déjà en duo
  if (sender.duoId !== 0) {
    responses.push({
      type: MessageType.ERROR,
      targetId: senderId,
      content: `❌ Tu es déjà dans un duo. Utilise /unregister d'abord pour quitter ton duo actuel.`,
      ephemeral: true,
    })
    return
  }

  // Validation 6: Partner déjà en duo
  if (partner.duoId !== 0) {
    responses.push({
      type: MessageType.ERROR,
      targetId: senderId,
      content: `❌ Le partenaire est déjà dans un duo.`,
      ephemeral: true,
    })
    return
  }

  // Déterminer les rôles (noob/carry) selon peakElo
  const { noobId, carryId } = determineRoles(senderId, partnerId, state)

  // Créer le duo
  const duoId = generateDuoId(state)

  // Générer le nom de team (auto si non fourni)
  const usedTeamNames = new Set(Array.from(state.duos.values()).map(duo => duo.name))
  const finalTeamName = teamName?.trim() || getRandomTeamName(usedTeamNames)

  const duo: Duo = {
    id: duoId,
    name: finalTeamName,
    noobId,
    carryId,
    totalPoints: 0,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    currentStreak: 0,
    longestWinStreak: 0,
    longestLossStreak: 0,
    createdAt: state.clock?.now() || new Date(),
    lastGameAt: null,
  }

  // Sauvegarder le duo
  state.duos.set(duoId, duo)

  // Mettre à jour les joueurs avec leur duoId et role
  const noob = state.players.get(noobId)!
  const carry = state.players.get(carryId)!

  noob.duoId = duoId
  noob.role = 'noob'

  carry.duoId = duoId
  carry.role = 'carry'

  // Réponse de succès
  const noobName = noob.gameName
  const carryName = carry.gameName

  responses.push({
    type: MessageType.SUCCESS,
    targetId: senderId,
    content: `✅ Duo créé avec succès !

**Nom de l'équipe** : ${finalTeamName}
**Noob** : ${noobName} (Peak: ${noob.peakElo})
**Carry** : ${carryName} (Peak: ${carry.peakElo})

Vous êtes maintenant prêts à jouer ensemble ! Vos games seront automatiquement trackées. 🎮`,
    ephemeral: false,
  })
}
