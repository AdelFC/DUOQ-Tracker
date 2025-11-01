import { Message, State, Response } from '../../types'

/**
 * Handler pour le polling des matchs terminés
 *
 * Comportement :
 * - Parcourt tous les duos actifs
 * - Pour chaque duo, récupère les derniers matchs des 2 joueurs via Riot API
 * - Détecte si les 2 joueurs ont joué ensemble dans un match récent
 * - Si oui et match pas déjà scoré → déclenche le scoring via game/end
 *
 * Cette approche remplace la détection de games en cours (endpoint bloqué par Riot)
 *
 * @param msg - Message de commande (généralement appelé par un cron/scheduler)
 * @param state - État global
 * @param responses - Tableau de réponses à envoyer
 */
export function pollGamesHandler(msg: Message, state: State, responses: Response[]): void {
  // Récupérer tous les duos actifs
  const duos = Array.from(state.duos.values())

  if (duos.length === 0) {
    // Aucun duo à tracker, sortir silencieusement
    return
  }

  // Pour chaque duo, vérifier s'il y a de nouveaux matchs
  for (const duo of duos) {
    const noob = state.players.get(duo.noobId)
    const carry = state.players.get(duo.carryId)

    if (!noob || !carry) {
      // Joueur manquant, ignorer ce duo
      continue
    }

    // TODO: Implémenter l'appel Riot API
    // 1. Récupérer PUUID des joueurs depuis gameName#tagLine
    //    GET /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}
    //
    // 2. Récupérer les derniers matchIds de chaque joueur
    //    GET /lol/match/v5/matches/by-puuid/{puuid}/ids?start=0&count=5
    //
    // 3. Pour chaque matchId commun aux deux joueurs :
    //    - Vérifier si déjà dans state.games
    //    - Si non, récupérer les détails du match
    //      GET /lol/match/v5/matches/{matchId}
    //    - Vérifier que c'est bien un ranked solo/duo
    //    - Déclencher le scoring via endGameHandler
    //
    // Pour l'instant, on fait juste un skeleton sans API
  }

  // Polling terminé sans erreur
  // (Les réponses seront générées par endGameHandler si des matchs sont scorés)
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
