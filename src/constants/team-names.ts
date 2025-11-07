/**
 * Liste de noms de teams prédéfinis
 *
 * Noms basés sur le lore de League of Legends (en anglais)
 * Utilisés pour attribution automatique lors de /link si team_name non fourni
 */

export const TEAM_NAMES = [
  // Epic Monsters & Objectives
  'The Grubs',
  'Team Nashor',
  'Team Nexus',
  'The Drakes',
  'The Heralds',
  'The Barons',
  'The Voidborn',
  'The Watchers',

  // Regions & Factions
  'Demacia United',
  'Noxus Invaders',
  'Ionia Spirits',
  'Freljord Warriors',
  'Shadow Isles',
  'Shurima Ascended',
  'Piltover Hextech',
  'Zaun Chemtanks',
  'Bilgewater Pirates',
  'Targon Climbers',
  'The Void Walkers',
  'Bandle Scouts',
  'Ixtal Elementalists',

  // Champion Groups & Classes
  'The Sentinels',
  'The Assassins',
  'The Mages',
  'The Marksmen',
  'The Tanks',
  'The Fighters',
  'The Supports',
  'The Enchanters',
  'The Skirmishers',
  'The Divers',

  // Lore-based Teams
  'The Kinkou Order',
  'The Black Rose',
  'The Solari',
  'The Lunari',
  'The Ruined',
  'The Redeemed',
  'The Wardens',
  'The Protectors',
  'The Destroyers',
  'The Yordles',

  // Gameplay References
  'The Split Pushers',
  'The Teamfighters',
  'The Macro Kings',
  'The Roamers',
  'The Gankers',
  'The Scalers',
  'The Snowballers',
  'The Comeback Kids',
  'The Pentakills',
  'The Flashers',

  // Epic & Creative
  'The Summoners',
  'The Champions',
  'The Legends',
  'The Mythics',
  'The Immortals',
  'The Eternals',
  'The Conquerors',
  'The Victorious',
  'The Glorious',
  'The Masterminds',

  // Duo-themed
  'The Dynamic Duo',
  'The Perfect Pair',
  'The Twin Blades',
  'The Partners',
  'The Brothers',
  'The Alliance',
  'The Coalition',
  'The Synergy',
  'The Harmony',
  'The Unity',
]

/**
 * Sélectionne un nom de team aléatoire non utilisé
 * Si tous les noms sont utilisés, ajoute un suffixe numérique
 */
export function getRandomTeamName(usedNames: Set<string>): string {
  // Filtrer les noms non utilisés
  const availableNames = TEAM_NAMES.filter(name => !usedNames.has(name))

  // Si des noms disponibles, en choisir un aléatoirement
  if (availableNames.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableNames.length)
    return availableNames[randomIndex]
  }

  // Sinon, prendre un nom au hasard et ajouter un suffixe
  const randomIndex = Math.floor(Math.random() * TEAM_NAMES.length)
  const baseName = TEAM_NAMES[randomIndex]

  // Trouver un suffixe non utilisé
  let suffix = 2
  while (usedNames.has(`${baseName} ${suffix}`)) {
    suffix++
  }

  return `${baseName} ${suffix}`
}
