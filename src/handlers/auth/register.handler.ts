/**
 * Handler REGISTER
 *
 * Lie le compte Riot d'un joueur avec :
 * - Son Riot ID (gameName#tagLine)
 * - Son rôle principal (TOP, JUNGLE, MID, ADC, SUPPORT)
 * - Son champion principal
 * - Son peak elo (elo de référence pour balancing)
 */

import type { Message, Response } from '../../types/message.js'
import type { State } from '../../types/state.js'
import type { Player } from '../../types/player.js'
import { MessageType } from '../../types/message.js'
import { parseRankString } from '../../services/scoring/rank-utils.js'

interface RegisterPayload {
  riotId: string
  mainRole: string
  mainChampion: string
  peakElo: string
}

/**
 * Valide le format du Riot ID (gameName#tagLine)
 */
function validateRiotId(riotId: string): { valid: boolean; error?: string } {
  if (!riotId || typeof riotId !== 'string') {
    return { valid: false, error: 'Le riotId est requis' }
  }

  const trimmed = riotId.trim()
  const parts = trimmed.split('#')

  if (parts.length !== 2) {
    return {
      valid: false,
      error: 'Le format du riotId doit être: gameName#tagLine (ex: Player#EUW)',
    }
  }

  const [gameName, tagLine] = parts

  if (!gameName || gameName.trim() === '') {
    return { valid: false, error: 'Le gameName ne peut pas être vide' }
  }

  if (!tagLine || tagLine.trim() === '') {
    return { valid: false, error: 'Le tagLine ne peut pas être vide' }
  }

  return { valid: true }
}

/**
 * Valide le format du peak elo
 */
function validatePeakElo(peakElo: string): { valid: boolean; error?: string } {
  if (!peakElo || typeof peakElo !== 'string') {
    return { valid: false, error: "Le peak elo est requis (ex: 'G4', 'P2', 'D1')" }
  }

  const trimmed = peakElo.trim().toUpperCase()

  if (trimmed === '') {
    return { valid: false, error: "Le peak elo ne peut pas être vide" }
  }

  // Valider avec parseRankString
  try {
    parseRankString(trimmed)
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: `Format de peak elo invalide: '${peakElo}'. Formats acceptés: I4, B3, S2, G1, P4, E3, D2, M, GM, C`,
    }
  }
}

/**
 * Valide le rôle principal
 */
function validateMainRole(role: string): { valid: boolean; error?: string } {
  if (!role || typeof role !== 'string') {
    return { valid: false, error: "Le rôle principal est requis (TOP, JUNGLE, MID, ADC, SUPPORT)" }
  }

  const normalized = role.trim().toUpperCase()
  const validRoles = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']

  if (!validRoles.includes(normalized)) {
    return { valid: false, error: "Le rôle doit être: TOP, JUNGLE, MID, ADC ou SUPPORT" }
  }

  return { valid: true }
}

/**
 * Valide le champion principal
 */
function validateMainChampion(champion: string): { valid: boolean; error?: string } {
  if (!champion || typeof champion !== 'string') {
    return { valid: false, error: "Le champion principal est requis (ex: Yasuo, Jinx, Thresh)" }
  }

  const trimmed = champion.trim()

  if (trimmed === '') {
    return { valid: false, error: "Le champion principal ne peut pas être vide" }
  }

  return { valid: true }
}

/**
 * Handler principal
 */
export async function registerHandler(msg: Message, state: State, responses: Response[]): Promise<void> {
  const discordId = msg.sourceId
  const payload = msg.payload as RegisterPayload

  // Validation 1: Joueur déjà inscrit
  if (state.players.has(discordId)) {
    responses.push({
      type: MessageType.ERROR,
      targetId: discordId,
      content: JSON.stringify({
        title: 'Déjà enregistré',
        description: 'Tu as déjà lié ton compte Riot ! Utilise /unregister d\'abord si tu veux changer de compte.',
        color: 0xff0000,
      }),
      ephemeral: true,
    })
    return
  }

  // Validation 2: Riot ID
  const riotIdValidation = validateRiotId(payload?.riotId)
  if (!riotIdValidation.valid) {
    responses.push({
      type: MessageType.ERROR,
      targetId: discordId,
      content: JSON.stringify({
        title: 'Riot ID invalide',
        description: riotIdValidation.error,
        color: 0xff0000,
      }),
      ephemeral: true,
    })
    return
  }

  // Validation 3: Main Role
  const roleValidation = validateMainRole(payload?.mainRole)
  if (!roleValidation.valid) {
    responses.push({
      type: MessageType.ERROR,
      targetId: discordId,
      content: `❌ ${roleValidation.error}`,
      ephemeral: true,
    })
    return
  }

  // Validation 4: Main Champion
  const championValidation = validateMainChampion(payload?.mainChampion)
  if (!championValidation.valid) {
    responses.push({
      type: MessageType.ERROR,
      targetId: discordId,
      content: `❌ ${championValidation.error}`,
      ephemeral: true,
    })
    return
  }

  // Validation 5: Peak Elo
  const peakEloValidation = validatePeakElo(payload?.peakElo)
  if (!peakEloValidation.valid) {
    responses.push({
      type: MessageType.ERROR,
      targetId: discordId,
      content: `❌ ${peakEloValidation.error}`,
      ephemeral: true,
    })
    return
  }

  // Parsing des données
  const [gameName, tagLine] = payload.riotId.trim().split('#')
  const mainRole = payload.mainRole.trim().toUpperCase()
  const mainChampion = payload.mainChampion.trim()
  const peakElo = payload.peakElo.trim().toUpperCase()

  // Parser le peak elo pour initialiser le rank actuel
  const peakRankInfo = parseRankString(peakElo)

  // Validation 6: Vérifier le Riot ID via l'API Riot et récupérer le rang actuel
  let puuid = ''
  let validatedGameName = gameName.trim()
  let validatedTagLine = tagLine.trim()
  let summonerId = ''
  let currentActualRank = peakRankInfo // Fallback si on ne peut pas fetcher

  if (state.riotService) {
    try {
      const accountInfo = await state.riotService.getAccountByRiotId(
        gameName.trim(),
        tagLine.trim()
      )

      // Vérifier que ce PUUID n'est pas déjà utilisé par un autre joueur
      const existingPlayer = Array.from(state.players.values()).find(
        (p) => p.puuid === accountInfo.puuid
      )

      if (existingPlayer) {
        responses.push({
          type: MessageType.ERROR,
          targetId: discordId,
          content: JSON.stringify({
            title: 'Compte déjà lié',
            description: `Ce compte Riot est déjà lié à un autre utilisateur Discord.`,
            color: 0xff0000,
          }),
          ephemeral: true,
        })
        return
      }

      puuid = accountInfo.puuid
      validatedGameName = accountInfo.gameName
      validatedTagLine = accountInfo.tagLine

      // Récupérer le rang actuel pour initialRank (progression tracking)
      try {
        const summonerInfo = await state.riotService.getSummonerByPuuid(puuid)
        if (summonerInfo) {
          summonerId = summonerInfo.id
          const rankInfo = await state.riotService.getRankBySummonerId(summonerId)
          if (rankInfo) {
            currentActualRank = rankInfo
          }
        }
      } catch (rankError) {
        console.warn('[Register] Could not fetch current rank, using peakElo as fallback:', rankError)
        // Continue avec peakElo comme fallback
      }
    } catch (error) {
      responses.push({
        type: MessageType.ERROR,
        targetId: discordId,
        content: JSON.stringify({
          title: 'Erreur de validation',
          description:
            error instanceof Error
              ? error.message
              : 'Impossible de valider votre Riot ID. Vérifiez votre pseudo et tag.',
          color: 0xff0000,
        }),
        ephemeral: true,
      })
      return
    }
  } else {
    // Pas de service Riot disponible (tests)
    puuid = `mock_puuid_${discordId}`
  }

  // Créer le joueur
  const player: Player = {
    discordId,
    puuid,
    gameName: validatedGameName,
    tagLine: validatedTagLine,
    role: 'noob', // Par défaut, sera déterminé lors du /link
    duoId: 0, // À assigner lors du /link
    peakElo,
    initialRank: currentActualRank, // Rang actuel au moment de l'inscription (pour progression)
    currentRank: currentActualRank, // Rang actuel (sera mis à jour après chaque game)
    mainRoleString: mainRole,
    mainChampion,
    detectedMainRole: null, // À détecter après analyse des games
    totalPoints: 0,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    streaks: {
      current: 0,
      longestWin: 0,
      longestLoss: 0,
    },
    registeredAt: state.clock?.now() || new Date(),
    lastGameAt: null,
  }

  // Sauvegarder
  state.players.set(discordId, player)

  // Formater le rang actuel pour l'affichage
  const formatRankForDisplay = (rank: typeof currentActualRank): string => {
    if (rank.tier === 'MASTER' || rank.tier === 'GRANDMASTER' || rank.tier === 'CHALLENGER') {
      return `${rank.tier} (${rank.lp} LP)`
    }
    return `${rank.tier} ${rank.division} (${rank.lp} LP)`
  }

  // Réponse de succès
  responses.push({
    type: MessageType.SUCCESS,
    targetId: discordId,
    content: JSON.stringify({
      title: 'Compte Riot lié avec succès !',
      description: `Ton compte a été validé et enregistré. Tu peux maintenant former un duo et commencer à tracker vos games !`,
      fields: [
        {
          name: 'Riot ID',
          value: `${validatedGameName}#${validatedTagLine}`,
          inline: true,
        },
        {
          name: 'Rôle principal',
          value: mainRole,
          inline: true,
        },
        {
          name: 'Champion principal',
          value: mainChampion,
          inline: true,
        },
        {
          name: 'Peak Elo',
          value: peakElo,
          inline: true,
        },
        {
          name: 'Rang actuel',
          value: formatRankForDisplay(currentActualRank),
          inline: true,
        },
      ],
      color: 0x00ff00,
      footer: {
        text: 'Prochaine étape : Utilise /link @partenaire pour créer un duo',
      },
    }),
    ephemeral: true,
  })
}
