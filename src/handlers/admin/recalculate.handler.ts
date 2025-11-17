/**
 * Handler pour /admin recalculate
 * Re-poll et recalcule tous les scores depuis une date avec le système v3.0
 */

import type { Message, Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import type { State } from '../../types/state.js'
import type { GameData } from '../../types/game.js'
import { calculateGameScore } from '../../services/scoring/engine.js'

export async function handleRecalculate(
  message: Message,
  state: State,
  responses: Response[]
): Promise<void> {
  const { startDate: startDateStr, team: teamName } = message.payload

  // Parse start date (default: 14/11/2024)
  let startDate: Date
  if (startDateStr) {
    const [day, month, year] = startDateStr.split('/')
    startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  } else {
    // Default: 14/11/2024
    startDate = new Date(2024, 10, 14) // month is 0-indexed
  }

  // Filter duos by team name if provided
  let duos = Array.from(state.duos.values())
  if (teamName) {
    const targetDuo = duos.find((d) => d.name.toLowerCase() === teamName.toLowerCase())
    if (!targetDuo) {
      responses.push({
        type: MessageType.ERROR,
        targetId: message.sourceId,
        content: JSON.stringify({
          title: 'Erreur',
          description: `Aucune team trouvée avec le nom "${teamName}"\n\nTeams disponibles:\n${duos.map((d) => `• ${d.name}`).join('\n')}`,
          color: 0xff0000,
        }),
        ephemeral: true,
      })
      return
    }
    duos = [targetDuo]
  }

  if (duos.length === 0) {
    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: JSON.stringify({
        title: 'Erreur',
        description: 'Aucun duo enregistré',
        color: 0xff0000,
      }),
      ephemeral: true,
    })
    return
  }

  // Check for RiotService
  if (!state.riotService) {
    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: JSON.stringify({
        title: 'Erreur',
        description: 'RiotService non disponible',
        color: 0xff0000,
      }),
      ephemeral: true,
    })
    return
  }

  // Send initial response
  const targetDescription = teamName
    ? `Début du recalcul des scores pour la team **${teamName}** depuis le ${startDate.toLocaleDateString('fr-FR')}.\n\nCela peut prendre quelques instants...`
    : `Début du recalcul de tous les scores depuis le ${startDate.toLocaleDateString('fr-FR')}.\n\n**Duos à traiter:** ${duos.length}\n\nCela peut prendre plusieurs minutes...`

  responses.push({
    type: MessageType.INFO,
    targetId: message.sourceId,
    content: JSON.stringify({
      title: '🔄 Recalcul en cours...',
      description: targetDescription,
      color: 0x5865f2,
    }),
    ephemeral: true,
  })

  try {
    // ========================================
    // 1. RE-POLL ALL GAMES FROM RIOT API
    // ========================================
    const allGames: Map<string, GameData> = new Map()
    let totalMatchesFetched = 0

    for (const duo of duos) {
      const noob = state.players.get(duo.noobId)
      const carry = state.players.get(duo.carryId)

      if (!noob || !carry || !noob.puuid || !carry.puuid) {
        console.warn(`[Recalculate] Duo ${duo.id} has missing players or PUUIDs`)
        continue
      }

      // Fetch up to 100 recent matches for each player (Riot API max)
      const [noobMatches, carryMatches] = await Promise.all([
        state.riotService.getRecentMatchIds(noob.puuid, 100, 420),
        state.riotService.getRecentMatchIds(carry.puuid, 100, 420),
      ])

      // Find common matches
      const commonMatches = noobMatches.filter((id) => carryMatches.includes(id))

      for (const matchId of commonMatches) {
        // Skip if already fetched (could be shared with another duo)
        if (allGames.has(matchId)) {
          continue
        }

        // Fetch match details
        const matchDetails = await state.riotService.getMatchDetails(matchId)
        if (!matchDetails) {
          continue
        }

        // Verify ranked solo/duo
        if (matchDetails.queueId !== 420) {
          continue
        }

        // Filter by start date
        const gameStartTime = new Date(matchDetails.gameCreation)
        if (gameStartTime < startDate) {
          continue
        }

        // Verify same team
        const noobData = matchDetails.participants.find((p: any) => p.puuid === noob.puuid)
        const carryData = matchDetails.participants.find((p: any) => p.puuid === carry.puuid)

        if (!noobData || !carryData || noobData.teamId !== carryData.teamId) {
          continue
        }

        // Helper: Convert user-friendly role to Riot API lane
        const roleToLane = (role: string): string => {
          const mapping: Record<string, string> = {
            TOP: 'TOP',
            JUNGLE: 'JUNGLE',
            MID: 'MIDDLE',
            ADC: 'BOTTOM',
            SUPPORT: 'UTILITY',
          }
          return mapping[role.toUpperCase()] || role
        }

        // Fetch current ranks from Riot API
        let noobNewRank = noob.currentRank
        let carryNewRank = carry.currentRank

        try {
          const [noobRank, carryRank] = await Promise.all([
            state.riotService.getRankBySummonerId(noobData.summonerId),
            state.riotService.getRankBySummonerId(carryData.summonerId),
          ])

          if (noobRank) noobNewRank = noobRank
          if (carryRank) carryNewRank = carryRank
        } catch (error) {
          console.warn('[Recalculate] Failed to fetch ranks, using current ranks:', error)
        }

        // Create GameData
        const gameData: GameData = {
          matchId,
          gameId: matchDetails.gameId,
          startTime: new Date(matchDetails.gameStartTimestamp),
          endTime: new Date(matchDetails.gameEndTimestamp),
          duration: matchDetails.gameDuration,
          duoId: duo.id,
          win: noobData.win,
          remake: matchDetails.gameEndedInEarlySurrender,
          surrender: matchDetails.gameEndedInSurrender,
          status: 'COMPLETED' as const,
          detectedAt: new Date(),
          scoredAt: null,
          noobStats: {
            puuid: noob.puuid || '',
            summonerId: noobData.summonerId,
            teamId: noobData.teamId,
            championId: noobData.championId,
            championName: noobData.championName,
            lane: (noobData.teamPosition || 'UNKNOWN') as any,
            kills: noobData.kills,
            deaths: noobData.deaths,
            assists: noobData.assists,
            previousRank: noob.currentRank,
            newRank: noobNewRank,
            peakElo: noob.peakElo,
            isOffRole: noob.mainRoleString
              ? roleToLane(noob.mainRoleString) !== noobData.teamPosition
              : false,
            isOffChampion: noob.mainChampion ? noob.mainChampion !== noobData.championName : false,
            // Multikills (bonus spéciaux)
            pentaKills: noobData.pentaKills,
            quadraKills: noobData.quadraKills,
            tripleKills: noobData.tripleKills,
            firstBloodKill: noobData.firstBloodKill,
            largestKillingSpree: noobData.largestKillingSpree,
          },
          carryStats: {
            puuid: carry.puuid || '',
            summonerId: carryData.summonerId,
            teamId: carryData.teamId,
            championId: carryData.championId,
            championName: carryData.championName,
            lane: (carryData.teamPosition || 'UNKNOWN') as any,
            kills: carryData.kills,
            deaths: carryData.deaths,
            assists: carryData.assists,
            previousRank: carry.currentRank,
            newRank: carryNewRank,
            peakElo: carry.peakElo,
            isOffRole: carry.mainRoleString
              ? roleToLane(carry.mainRoleString) !== carryData.teamPosition
              : false,
            isOffChampion: carry.mainChampion
              ? carry.mainChampion !== carryData.championName
              : false,
            // Multikills (bonus spéciaux)
            pentaKills: carryData.pentaKills,
            quadraKills: carryData.quadraKills,
            tripleKills: carryData.tripleKills,
            firstBloodKill: carryData.firstBloodKill,
            largestKillingSpree: carryData.largestKillingSpree,
          },
        }

        allGames.set(matchId, gameData)
        totalMatchesFetched++
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // ========================================
    // 2. RESET PLAYER AND DUO STATS
    // ========================================
    // Reset only the players/duos we're recalculating
    const playerIdsToReset = new Set<string>()
    for (const duo of duos) {
      playerIdsToReset.add(duo.noobId)
      playerIdsToReset.add(duo.carryId)
    }

    for (const playerId of playerIdsToReset) {
      const player = state.players.get(playerId)
      if (!player) continue
      player.totalPoints = 0
      player.gamesPlayed = 0
      player.wins = 0
      player.losses = 0
      player.streaks = { current: 0, longestWin: 0, longestLoss: 0 }
      player.lastGameAt = null
    }

    for (const duo of duos) {
      duo.totalPoints = 0
      duo.gamesPlayed = 0
      duo.wins = 0
      duo.losses = 0
      duo.currentStreak = 0
      duo.longestWinStreak = 0
      duo.longestLossStreak = 0
      duo.lastGameAt = null
    }

    // ========================================
    // 3. SORT GAMES BY CHRONOLOGICAL ORDER
    // ========================================
    const sortedGames = Array.from(allGames.values()).sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    )

    // ========================================
    // 4. RESCORE ALL GAMES WITH V3.0
    // ========================================
    let gamesProcessed = 0
    const gamePoints = new Map<string, number>() // Store duo points per matchId

    for (const gameData of sortedGames) {
      const duo = state.duos.get(gameData.duoId)
      if (!duo) {
        console.warn(`[Recalculate] Duo ${gameData.duoId} not found`)
        continue
      }

      const noob = state.players.get(duo.noobId)
      const carry = state.players.get(duo.carryId)

      if (!noob || !carry) {
        console.warn(`[Recalculate] Players not found for duo ${duo.id}`)
        continue
      }

      // Calculate score with v3.0
      const scoreResult = calculateGameScore({
        gameData,
        noobStreak: noob.streaks.current,
        carryStreak: carry.streaks.current,
      })

      const noobPoints = scoreResult.noob.final
      const carryPoints = scoreResult.carry.final
      const duoPoints = scoreResult.total

      // Update player stats
      noob.totalPoints += noobPoints
      noob.gamesPlayed += 1
      carry.totalPoints += carryPoints
      carry.gamesPlayed += 1

      // Update rank (use newRank from gameData)
      if (gameData.noobStats.newRank) {
        noob.currentRank = gameData.noobStats.newRank
      }
      if (gameData.carryStats.newRank) {
        carry.currentRank = gameData.carryStats.newRank
      }

      // Update streaks - Remake games don't affect streaks, wins, or losses
      if (gameData.remake) {
        // Remake : 0 points déjà appliqués, pas d'impact sur streaks/wins/losses
        // Les joueurs ne sont pas pénalisés par un remake
      } else if (gameData.win) {
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
        // Défaite normale : casse la streak
        noob.losses += 1
        // Track loss streak
        if (noob.streaks.current <= 0) {
          noob.streaks.current -= 1
          if (Math.abs(noob.streaks.current) > noob.streaks.longestLoss) {
            noob.streaks.longestLoss = Math.abs(noob.streaks.current)
          }
        } else {
          noob.streaks.current = -1
        }

        carry.losses += 1
        // Track loss streak
        if (carry.streaks.current <= 0) {
          carry.streaks.current -= 1
          if (Math.abs(carry.streaks.current) > carry.streaks.longestLoss) {
            carry.streaks.longestLoss = Math.abs(carry.streaks.current)
          }
        } else {
          carry.streaks.current = -1
        }

        duo.losses += 1
        // Track loss streak
        if (duo.currentStreak <= 0) {
          duo.currentStreak -= 1
          if (Math.abs(duo.currentStreak) > duo.longestLossStreak) {
            duo.longestLossStreak = Math.abs(duo.currentStreak)
          }
        } else {
          duo.currentStreak = -1
        }
      }

      duo.totalPoints += duoPoints
      duo.gamesPlayed += 1
      duo.lastGameAt = gameData.endTime
      noob.lastGameAt = gameData.endTime
      carry.lastGameAt = gameData.endTime

      // Store points for this game
      gamePoints.set(gameData.matchId, duoPoints)

      gamesProcessed++
    }

    // ========================================
    // 5. UPDATE STATE.GAMES
    // ========================================
    // If recalculating specific team, only clear/update those games
    if (teamName) {
      // Remove games from this duo
      const duoIds = new Set(duos.map((d) => d.id))
      for (const [matchId, game] of state.games) {
        if (duoIds.has(game.duoId)) {
          state.games.delete(matchId)
        }
      }
    } else {
      // Clear all if recalculating everything
      state.games.clear()
    }

    for (const [matchId, gameData] of allGames) {
      state.games.set(matchId, {
        id: matchId,
        matchId: matchId,
        duoId: gameData.duoId,
        startTime: gameData.startTime,
        endTime: gameData.endTime,
        createdAt: gameData.startTime,
        win: gameData.win,
        noobKDA: `${gameData.noobStats.kills}/${gameData.noobStats.deaths}/${gameData.noobStats.assists}`,
        carryKDA: `${gameData.carryStats.kills}/${gameData.carryStats.deaths}/${gameData.carryStats.assists}`,
        noobKills: gameData.noobStats.kills,
        noobDeaths: gameData.noobStats.deaths,
        noobAssists: gameData.noobStats.assists,
        carryKills: gameData.carryStats.kills,
        carryDeaths: gameData.carryStats.deaths,
        carryAssists: gameData.carryStats.assists,
        noobChampion: gameData.noobStats.championName,
        carryChampion: gameData.carryStats.championName,
        duration: gameData.duration,
        scored: true,
        pointsAwarded: gamePoints.get(matchId) || 0,
      })
    }

    // ========================================
    // 6. SEND SUCCESS RESPONSE
    // ========================================
    const successTitle = teamName ? `✅ Recalcul terminé pour ${teamName}` : '✅ Recalcul terminé'
    const successDesc = teamName
      ? `Les scores de la team **${teamName}** ont été recalculés avec le système v3.0`
      : `Tous les scores ont été recalculés avec le système v3.0`

    responses.push({
      type: MessageType.SUCCESS,
      targetId: message.sourceId,
      content: JSON.stringify({
        title: successTitle,
        description: successDesc,
        fields: [
          {
            name: 'Période',
            value: `Depuis le ${startDate.toLocaleDateString('fr-FR')}`,
            inline: false,
          },
          {
            name: 'Games re-pollées',
            value: `${totalMatchesFetched} match(s)`,
            inline: true,
          },
          {
            name: 'Games rescorées',
            value: `${gamesProcessed} match(s)`,
            inline: true,
          },
          {
            name: teamName ? 'Team traitée' : 'Duos traités',
            value: teamName ? teamName : `${duos.length} duo(s)`,
            inline: true,
          },
        ],
        color: 0x00ff00,
      }),
      ephemeral: true,
    })

    console.log(`[Recalculate] Completed - ${gamesProcessed} games rescored for ${duos.length} duos`)
  } catch (error) {
    console.error('[Recalculate] Error:', error)

    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: JSON.stringify({
        title: 'Erreur lors du recalcul',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        color: 0xff0000,
      }),
      ephemeral: true,
    })
  }
}
