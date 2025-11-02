/**
 * Constants pour le DuoQ Tracker
 * Inspiré du système de lore du Pacte V2
 *
 * Contient les emojis, couleurs Discord, et taunts motivationnels
 */

/**
 * Emojis thématiques pour le DuoQ Tracker
 */
export const EMOJIS = {
  // Rôles DuoQ
  duo: '👥',
  noob: '🎮',
  carry: '⚔️',

  // Résultats
  victory: '🏆',
  defeat: '💀',
  win: '✅',
  loss: '❌',

  // Intensité & Performance
  fire: '🔥',
  lightning: '⚡',
  star: '⭐',
  sparkles: '✨',
  trophy: '🏆',
  medal: '🏅',
  crown: '👑',
  gem: '💠',

  // Stats & Progress
  chart: '📊',
  graph: '📈',
  target: '🎯',
  muscle: '💪',
  rocket: '🚀',

  // Actions
  check: '✅',
  cross: '❌',
  warning: '⚠️',
  info: 'ℹ️',

  // Ranks League of Legends
  iron: '⚫',
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💠',
  emerald: '💚',
  diamond: '💎',
  master: '👑',
  grandmaster: '🌟',
  challenger: '⚡',

  // Divers
  calendar: '📅',
  clock: '🕐',
  game: '🎮',
  controller: '🎮',
  swords: '⚔️',
  shield: '🛡️',
  scroll: '📜',
  book: '📖',
  history: '📜',

  // Emojis fun
  poro: '🐾',
  heart: '❤️',
  brokenHeart: '💔',
  eyes: '👀',
  thinking: '🤔',
  party: '🎉',
  confetti: '🎊',
}

/**
 * Couleurs Discord (format hex → decimal)
 * Utilisées pour les embeds Discord
 */
export const COLORS = {
  // Succès & Erreurs
  success: 0x2ecc71,      // Vert
  error: 0xe74c3c,        // Rouge
  warning: 0xf39c12,      // Orange
  info: 0x3498db,         // Bleu
  neutral: 0x95a5a6,      // Gris

  // Résultats de game
  victory: 0x2ecc71,      // Vert
  defeat: 0xe74c3c,       // Rouge

  // Spéciaux
  legendary: 0xf1c40f,    // Or - Pour les exploits légendaires
  epic: 0x9b59b6,         // Violet - Pour les moments épiques
  streak: 0xe67e22,       // Orange vif - Pour les win streaks

  // Ranks (couleurs approximatives LoL)
  iron: 0x4d4d4d,         // Gris foncé
  bronze: 0xcd7f32,       // Bronze
  silver: 0xc0c0c0,       // Argent
  gold: 0xffd700,         // Or
  platinum: 0x4d9fa5,     // Platine/Cyan
  emerald: 0x50c878,      // Émeraude
  diamond: 0xb9f2ff,      // Diamant
  master: 0x9b4dca,       // Master/Violet
  grandmaster: 0xe74c3c,  // Grandmaster/Rouge
  challenger: 0xf4c2c2,   // Challenger/Or rosé
}

/**
 * Taunts motivationnels pour différentes situations
 */
export const TAUNTS = {
  // Victoires
  victory: [
    "🔥 Domination sur la Faille !",
    "⚔️ Victoire éclatante !",
    "👑 GG WP ! Le duo en feu !",
    "💎 Performance de diamant !",
    "⚡ Électriques sur cette game !",
    "🏆 Champions de la Rift !",
    "✨ Que la lumière soit... et elle fut !",
    "🎯 Objectif atteint avec style !",
    "💪 Force et honneur !",
    "🚀 Décollage vers la victoire !",
    "😎 EZ GAME ! Les adversaires en PLS !",
    "🎮 OWNED ! Allez farmer en normal !",
    "💀 Vous avez dégommé la team adverse !",
    "🔱 STOMP ! Pas de pitié sur la Rift !",
    "⚡ OUTPLAYED ! Niveau supérieur confirmé !",
    "👹 BULLYING ! L'ennemi demande sa mère !",
    "🎪 GG FF 15 pour eux ! Dominés du début à la fin !",
    "💣 BOOM ! Nexus explosé comme prévu !",
  ],

  // Défaites
  defeat: [
    "💀 Ça arrive aux meilleurs...",
    "😤 On remonte au prochain !",
    "💪 C'est dans la défaite qu'on progresse !",
    "🎯 Next game is the one !",
    "📈 Une défaite, mille leçons !",
    "🔥 Le comeback sera légendaire !",
    "⚔️ Un guerrier ne tombe que pour mieux se relever !",
    "💎 Les diamants se forment sous pression !",
    "👊 Plus déterminés que jamais !",
    "🌟 Les étoiles brillent après l'obscurité !",
    "🎮 Même Faker perd des games ! Allez go next !",
    "😤 Report jungle diff... ah non, c'est nous !",
    "💀 L'ennemi a juste eu de la chance... 5 fois de suite !",
    "🤡 C'était du trolling, on essaie sérieusement next ?",
    "😭 Difficile de carry avec 4 wards dans l'équipe !",
    "🎪 Le nexus était buggé, c'est pour ça qu'il a explosé !",
  ],

  // Win Streaks
  winStreak: [
    "🔥 EN FEU ! {{streak}} victoires consécutives !",
    "⚡ INARRÊTABLES ! {{streak}} en série !",
    "💎 PARFAITS ! {{streak}} victoires d'affilée !",
    "👑 DIVINS ! {{streak}} wins en série !",
    "🌟 LÉGENDAIRES ! {{streak}} victoires consécutives !",
    "🚀 FUSÉE ! {{streak}} wins sans arrêt !",
    "⚔️ DOMINATION ! {{streak}} victoires de suite !",
    "🔱 INVINCIBLES ! {{streak}} en série !",
  ],

  // Loss Streaks (motivationnels)
  lossStreak: [
    "💪 Persévérance ! Le comeback approche !",
    "🎯 Gardez la tête haute ! Ça va tourner !",
    "🔥 Les plus grandes remontées commencent maintenant !",
    "⚡ L'orage avant l'arc-en-ciel !",
    "💎 Chaque défaite vous forge !",
    "👑 Les champions sont ceux qui ne lâchent rien !",
    "🌟 La lumière au bout du tunnel !",
    "⚔️ Plus vous tombez, plus fort vous vous relevez !",
  ],

  // Progression rank
  rankUp: [
    "📈 RANK UP ! {{newRank}} atteint !",
    "🚀 Promotion ! Bienvenue en {{newRank}} !",
    "⭐ Level up ! {{newRank}} débloqué !",
    "👑 Ascension ! {{newRank}} atteint avec brio !",
    "💎 Promotion méritée ! {{newRank}} !",
  ],

  rankDown: [
    "📉 Démotion... mais ce n'est qu'un détour !",
    "💪 On remonte ça rapidement !",
    "🎯 Direction : reconquête !",
    "⚔️ Une bataille perdue, pas la guerre !",
  ],

  // Messages génériques motivationnels
  motivation: [
    "💪 Chaque game vous rend meilleurs !",
    "🔥 La détermination paie toujours !",
    "⚔️ Un duo qui joue ensemble, gagne ensemble !",
    "🌟 Votre heure viendra !",
    "👑 Les légendes se construisent game après game !",
    "💎 Brillez sur la Rift !",
    "🎯 Focus, synergie, victoire !",
    "⚡ L'énergie du duo est palpable !",
    "🚀 Destination : sommet du ladder !",
    "✨ Croyez en votre duo !",
  ],

  // Messages de bienvenue
  welcome: [
    "🎉 Bienvenue dans le DuoQ Tracker !",
    "✨ Prêt à dominer la Rift en duo ?",
    "🏆 Que l'aventure commence !",
    "⚔️ Forgez votre légende ensemble !",
    "💎 Le chemin vers le sommet commence ici !",
  ],

  // Messages de célébration (exploits)
  celebration: [
    "🎊 EXPLOIT LÉGENDAIRE !",
    "🌟 PERFORMANCE HISTORIQUE !",
    "👑 MOMENT DE GLOIRE !",
    "💎 PERFECTION ABSOLUE !",
    "⚡ ÉLECTRIQUE ! INCROYABLE !",
  ],

  // Taunts pour le ladder (compétition entre duos)
  ladderTrash: [
    "👀 Les autres duos transpirent en voyant votre nom !",
    "💪 Le TOP 1 vous regarde dans le rétro... s'ils osent !",
    "🎯 Les autres feraient mieux de /ff avant de vous croiser !",
    "🔥 Vous brûlez tous ceux qui osent vous défier !",
    "😎 Ez clap pour vous, cauchemar pour les autres !",
    "👑 Le trône vous attend, les prétendants peuvent pleurer !",
    "⚡ Tellement rapides que le ladder lag pour se mettre à jour !",
    "💎 Brillez tellement fort que les autres portent des lunettes !",
  ],

  ladderBottom: [
    "📈 Tout le monde commence quelque part... même en bas !",
    "💪 Le seul chemin possible : vers le haut !",
    "🎯 Les duos en TOP 1 ont aussi été là où vous êtes !",
    "🔥 Chaque défaite est une leçon, chaque leçon un pas vers la gloire !",
    "😤 Utilisez ce classement comme fuel pour votre rage !",
    "⚔️ Les meilleures remontées font les meilleures histoires !",
  ],

  ladderMiddle: [
    "📊 Solidement installés au milieu ! Le TOP vous tend les bras !",
    "💪 Ni trop haut pour être confortables, ni trop bas pour abandonner !",
    "🎯 Zone de confort INTERDITE ! Visez plus haut !",
    "🔥 C'est là que les vrais duos se révèlent !",
    "⚡ Un sprint final et le TOP est à vous !",
  ],

  // Taunts admin (pour les commandes setup)
  admin: [
    "👨‍💼 Configuration de boss activée !",
    "🎖️ Pouvoir administratif déployé avec style !",
    "⚙️ Le système vous obéit au doigt et à l'œil !",
    "🔧 Paramètres ajustés comme un pro !",
    "👑 L'admin a parlé, le bot s'exécute !",
  ],

  adminReset: [
    "💣 RESET NUCLÉAIRE ACTIVÉ !",
    "🔥 Table rase ! Tout brûle, tout recommence !",
    "⚡ CTRL+Z sur toute la saison !",
    "💀 RIP les anciennes stats... Hello nouvelle ère !",
    "🎪 Et hop, disparu comme par magie !",
  ],
}

/**
 * Messages du footer selon la performance
 */
export function getMotivationalFooter(winRate: number): string {
  if (winRate >= 70) return "🌟 Duo légendaire ! Continuez comme ça !"
  if (winRate >= 60) return "💎 Duo d'élite ! Le sommet approche !"
  if (winRate >= 50) return "💪 Duo solide ! En route vers le top !"
  if (winRate >= 40) return "📈 En progression ! Continuez à grinder !"
  if (winRate >= 30) return "🎯 Persévérance ! Chaque game compte !"
  return "⚔️ Gardez la tête haute ! Le comeback sera épique !"
}

/**
 * Obtenir l'emoji correspondant à un rank
 */
export function getRankEmoji(rankStr: string): string {
  const firstChar = rankStr[0].toUpperCase()

  switch (firstChar) {
    case 'I': return EMOJIS.iron
    case 'B': return EMOJIS.bronze
    case 'S': return EMOJIS.silver
    case 'G': return EMOJIS.gold
    case 'P': return EMOJIS.platinum
    case 'E': return EMOJIS.emerald
    case 'D': return EMOJIS.diamond
    case 'M': return EMOJIS.master
    case 'C': return EMOJIS.challenger
    default: return EMOJIS.medal
  }

  // Cas spécial Grandmaster
  if (rankStr.toUpperCase().startsWith('GM')) {
    return EMOJIS.grandmaster
  }

  return EMOJIS.medal
}

/**
 * Obtenir la couleur correspondant à un rank
 */
export function getRankColor(rankStr: string): number {
  const firstChar = rankStr[0].toUpperCase()

  switch (firstChar) {
    case 'I': return COLORS.iron
    case 'B': return COLORS.bronze
    case 'S': return COLORS.silver
    case 'G': return COLORS.gold
    case 'P': return COLORS.platinum
    case 'E': return COLORS.emerald
    case 'D': return COLORS.diamond
    case 'M': return COLORS.master
    case 'C': return COLORS.challenger
    default: return COLORS.neutral
  }

  if (rankStr.toUpperCase().startsWith('GM')) {
    return COLORS.grandmaster
  }

  return COLORS.neutral
}

/**
 * Interpoler des variables dans un string
 * Ex: "Victoires: {{wins}}" avec {wins: 5} → "Victoires: 5"
 */
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = vars[key]
    return value !== undefined ? value.toString() : `{{${key}}}`
  })
}

/**
 * Obtenir un taunt aléatoire d'une catégorie
 */
export function getRandomTaunt(
  category: keyof typeof TAUNTS,
  context: Record<string, string | number> = {}
): string {
  const tauntList = TAUNTS[category]

  if (!Array.isArray(tauntList)) {
    return String(tauntList)
  }

  const randomTaunt = tauntList[Math.floor(Math.random() * tauntList.length)]
  return interpolate(randomTaunt, context)
}

/**
 * Créer une barre de progression visuelle
 * Ex: createProgressBar(7, 10) → "███████░░░"
 */
export function createProgressBar(current: number, total: number, length: number = 10): string {
  const filled = Math.floor((current / total) * length)
  const empty = length - filled
  return '█'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, empty))
}
