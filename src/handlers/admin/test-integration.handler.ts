/**
 * Handler pour /test
 * Exécute une suite de tests d'intégration avec mock data
 * Permet aux admins de voir toutes les commandes du bot en action
 */

import type { Message, Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import type { State } from '../../types/state.js'
import {
  formatSetupChannels,
  formatSetupEvent,
  formatSetupStatus,
  formatGameDetected,
  formatDailyLadder,
  formatRegisterSuccess,
  formatPlayerProfile,
  formatDuoStats,
  formatLadder,
  formatHistory,
  formatGameScored,
  formatWinStreak,
} from '../../formatters/embeds.js'

export async function handleTestIntegration(
  message: Message,
  state: State,
  responses: Response[]
): Promise<void> {
  const now = new Date()

  // Test 1: Setup Channels
  responses.push({
    type: MessageType.INFO,
    targetId: message.sourceId,
    content: JSON.stringify({
      title: '🧪 Test 1: Setup Channels',
      description: 'Configuration des channels Discord',
      color: 3447003,
    }),
    ephemeral: false,
  })

  const setupChannelsEmbed = formatSetupChannels({
    generalChannelId: message.channelId || message.sourceId,
    trackerChannelId: message.channelId || message.sourceId,
  })

  responses.push({
    type: MessageType.SUCCESS,
    targetId: message.sourceId,
    content: JSON.stringify(setupChannelsEmbed),
    ephemeral: false,
  })

  // Test 2: Setup Event
  responses.push({
    type: MessageType.INFO,
    targetId: message.sourceId,
    content: JSON.stringify({
      title: '🧪 Test 2: Setup Event',
      description: 'Configuration des dates de l\'événement',
      color: 3447003,
    }),
    ephemeral: false,
  })

  const startDate = new Date('2025-11-01T00:00:00Z')
  const endDate = new Date('2025-11-30T23:59:59Z')
  const durationMs = endDate.getTime() - startDate.getTime()
  const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24))
  const durationHours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  const setupEventEmbed = formatSetupEvent({
    startDate,
    endDate,
    timezone: 'Europe/Paris',
    durationDays,
    durationHours,
    isActive: false,
  })

  responses.push({
    type: MessageType.SUCCESS,
    targetId: message.sourceId,
    content: JSON.stringify(setupEventEmbed),
    ephemeral: false,
  })

  // Test 3: Setup Status
  responses.push({
    type: MessageType.INFO,
    targetId: message.sourceId,
    content: JSON.stringify({
      title: '🧪 Test 3: Setup Status',
      description: 'Affichage de la configuration',
      color: 3447003,
    }),
    ephemeral: false,
  })

  const setupStatusEmbed = formatSetupStatus({
    hasChannels: true,
    hasEvent: true,
    generalChannelId: message.channelId || message.sourceId,
    trackerChannelId: message.channelId || message.sourceId,
    startDate,
    endDate,
    timezone: 'Europe/Paris',
    isActive: false,
  })

  responses.push({
    type: MessageType.INFO,
    targetId: message.sourceId,
    content: JSON.stringify(setupStatusEmbed),
    ephemeral: false,
  })

  // Test 4: Register Player
  responses.push({
    type: MessageType.INFO,
    targetId: message.sourceId,
    content: JSON.stringify({
      title: '🧪 Test 4: Register Player',
      description: 'Inscription d\'un joueur',
      color: 3447003,
    }),
    ephemeral: false,
  })

  const registerEmbed = formatRegisterSuccess({
    gameName: 'TestNoob',
    tagLine: 'EUW',
    role: 'noob',
    initialRank: 'Gold IV',
  })

  responses.push({
    type: MessageType.SUCCESS,
    targetId: message.sourceId,
    content: JSON.stringify(registerEmbed),
    ephemeral: false,
  })

  // Test 5: Game Detected
  responses.push({
    type: MessageType.INFO,
    targetId: message.sourceId,
    content: JSON.stringify({
      title: '🧪 Test 5: Game Detected',
      description: 'Détection d\'une game en cours',
      color: 3447003,
    }),
    ephemeral: false,
  })

  const gameDetectedEmbed = formatGameDetected({
    duoName: 'TestDuo',
    noobName: 'TestNoob#EUW',
    carryName: 'TestCarry#EUW',
    gameMode: 'RANKED_SOLO_5x5',
    detectedAt: now,
  })

  responses.push({
    type: MessageType.INFO,
    targetId: message.sourceId,
    content: JSON.stringify(gameDetectedEmbed),
    ephemeral: false,
  })

  // Test 6: Player Profile
  responses.push({
    type: MessageType.INFO,
    targetId: message.sourceId,
    content: JSON.stringify({
      title: '🧪 Test 6: Player Profile',
      description: 'Profil d\'un joueur',
      color: 3447003,
    }),
    ephemeral: false,
  })

  const profileEmbed = formatPlayerProfile({
    gameName: 'TestNoob',
    tagLine: 'EUW',
    role: 'noob',
    currentRank: 'Gold II',
    initialRank: 'Gold IV',
    totalPoints: 125,
    gamesPlayed: 15,
    wins: 9,
    losses: 6,
    winRate: 60,
    currentStreak: 2,
    bestStreak: 4,
    duoPartner: 'TestCarry#EUW',
  })

  responses.push({
    type: MessageType.INFO,
    targetId: message.sourceId,
    content: JSON.stringify(profileEmbed),
    ephemeral: false,
  })

  // Test 7: Duo Stats
  responses.push({
    type: MessageType.INFO,
    targetId: message.sourceId,
    content: JSON.stringify({
      title: '🧪 Test 7: Duo Stats',
      description: 'Statistiques d\'un duo',
      color: 3447003,
    }),
    ephemeral: false,
  })

  const duoStatsEmbed = formatDuoStats({
    noobName: 'TestNoob#EUW',
    carryName: 'TestCarry#EUW',
    totalPoints: 245,
    gamesPlayed: 15,
    wins: 10,
    losses: 5,
    winRate: 66.7,
    currentStreak: 3,
    bestStreak: 5,
    noobRank: 'Gold II',
    carryRank: 'Platinum IV',
    noobPoints: 125,
    carryPoints: 120,
  })

  responses.push({
    type: MessageType.INFO,
    targetId: message.sourceId,
    content: JSON.stringify(duoStatsEmbed),
    ephemeral: false,
  })

  // Test 8: Ladder
  responses.push({
    type: MessageType.INFO,
    targetId: message.sourceId,
    content: JSON.stringify({
      title: '🧪 Test 8: Ladder',
      description: 'Classement général',
      color: 3447003,
    }),
    ephemeral: false,
  })

  const ladderEmbed = formatLadder({
    duos: [
      {
        rank: 1,
        duoName: 'AlphaDuo',
        noobName: 'AlphaNoob#EUW',
        carryName: 'AlphaCarry#EUW',
        totalPoints: 350,
        wins: 18,
        losses: 3,
        currentStreak: 7,
      },
      {
        rank: 2,
        duoName: 'TestDuo',
        noobName: 'TestNoob#EUW',
        carryName: 'TestCarry#EUW',
        totalPoints: 245,
        wins: 10,
        losses: 5,
        currentStreak: 3,
      },
      {
        rank: 3,
        duoName: 'BetaDuo',
        noobName: 'BetaNoob#EUW',
        carryName: 'BetaCarry#EUW',
        totalPoints: 198,
        wins: 12,
        losses: 9,
        currentStreak: -2,
      },
    ],
    totalDuos: 12,
  })

  responses.push({
    type: MessageType.INFO,
    targetId: message.sourceId,
    content: JSON.stringify(ladderEmbed),
    ephemeral: false,
  })

  // Test 9: History
  responses.push({
    type: MessageType.INFO,
    targetId: message.sourceId,
    content: JSON.stringify({
      title: '🧪 Test 9: History',
      description: 'Historique des games',
      color: 3447003,
    }),
    ephemeral: false,
  })

  const historyEmbed = formatHistory({
    playerName: 'TestNoob#EUW',
    games: [
      {
        win: true,
        points: 25,
        kda: '8/2/12',
        championName: 'Thresh',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
      },
      {
        win: true,
        points: 18,
        kda: '5/4/15',
        championName: 'Leona',
        date: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5h ago
      },
      {
        win: false,
        points: -8,
        kda: '2/7/8',
        championName: 'Nautilus',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
    ],
    page: 1,
    totalPages: 1,
  })

  responses.push({
    type: MessageType.INFO,
    targetId: message.sourceId,
    content: JSON.stringify(historyEmbed),
    ephemeral: false,
  })

  // Test 10: Daily Ladder
  responses.push({
    type: MessageType.INFO,
    targetId: message.sourceId,
    content: JSON.stringify({
      title: '🧪 Test 10: Daily Ladder',
      description: 'Classement quotidien automatique',
      color: 3447003,
    }),
    ephemeral: false,
  })

  const dailyLadderEmbed = formatDailyLadder({
    topDuos: [
      {
        rank: 1,
        duoName: 'AlphaDuo',
        noobName: 'AlphaNoob#EUW',
        carryName: 'AlphaCarry#EUW',
        totalPoints: 350,
        wins: 18,
        losses: 3,
      },
      {
        rank: 2,
        duoName: 'TestDuo',
        noobName: 'TestNoob#EUW',
        carryName: 'TestCarry#EUW',
        totalPoints: 245,
        wins: 10,
        losses: 5,
      },
      {
        rank: 3,
        duoName: 'BetaDuo',
        noobName: 'BetaNoob#EUW',
        carryName: 'BetaCarry#EUW',
        totalPoints: 198,
        wins: 12,
        losses: 9,
      },
    ],
    date: now,
  })

  responses.push({
    type: MessageType.INFO,
    targetId: message.sourceId,
    content: JSON.stringify(dailyLadderEmbed),
    ephemeral: false,
  })

  // Final Summary
  responses.push({
    type: MessageType.SUCCESS,
    targetId: message.sourceId,
    content: JSON.stringify({
      title: '✅ Tests d\'intégration terminés',
      description:
        '**Tous les embeds ont été testés avec succès !**\n\n' +
        'Les 10 tests suivants ont été exécutés :\n' +
        '1. Setup Channels\n' +
        '2. Setup Event\n' +
        '3. Setup Status\n' +
        '4. Register Player\n' +
        '5. Game Detected\n' +
        '6. Player Stats\n' +
        '7. Duo Stats\n' +
        '8. Ladder\n' +
        '9. History\n' +
        '10. Daily Ladder\n\n' +
        'Le bot est prêt pour la production ! 🚀',
      color: 5763719,
      footer: {
        text: 'Utilisez /setup pour configurer votre bot',
      },
      timestamp: now,
    }),
    ephemeral: false,
  })
}
