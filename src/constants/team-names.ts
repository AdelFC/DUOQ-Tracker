/**
 * Liste de noms de teams prédéfinis
 *
 * Utilisés pour attribution automatique lors de /link si team_name non fourni
 */

export const TEAM_NAMES = [
  // Références LoL
  'Les Barons Dansants',
  'Les Drakes Enragés',
  'Les Heralds Percutants',
  'Les Nexus Brisés',
  'Les Inhibiteurs Tombés',
  'Les Turrets Détruites',
  'Les Wards Invisibles',
  'Les Smite Volés',
  'Les Flash Ratés',
  'Les Pentakills Inattendus',

  // Stratégies
  'Les Split Pushers',
  'Les Teamfight Masters',
  'Les Macro Kings',
  'Les Roamers Fous',
  'Les Gankeurs Sauvages',
  'Les Scalers Patients',
  'Les Early Game Dominators',
  'Les Late Game Carries',

  // Références Gaming
  'Les Tryharders Éternels',
  'Les Tilts Contrôlés',
  'Les Flamers Repentis',
  'Les Reportés Injustement',
  'Les AFK Pardonnés',
  'Les Lag Warriors',
  'Les DC Heroes',

  // Fun & Créatifs
  'Les Minions Rebelles',
  'Les Scuttles Vengeurs',
  'Les Krugs Oubliés',
  'Les Raptors Furieux',
  'Les Gromp Solitaires',
  'Les Wolves Hurleurs',
  'Les Rift Explorers',
  'Les Summoners Perdus',
  'Les Items Stackés',
  'Les CS Manqués',

  // Duo themed
  'Les Duos de Fer',
  'Les Binômes Légendaires',
  'Les Paires Infernales',
  'Les Tandems Mortels',
  'Les Complices du Rift',
  'Les Partenaires du Crime',
  'Les Acolytes Victorieux',
  'Les Frères d\'Armes',

  // Epic
  'Les Conquérants de l\'Invocateur',
  'Les Gardiens du Nexus',
  'Les Protecteurs du Rift',
  'Les Champions Éternels',
  'Les Légendes Vivantes',
  'Les Dieux du Macro',
  'Les Maîtres du Micro',
  'Les Rois de la Botlane',
  'Les Seigneurs de la Toplane',
  'Les Empereurs de la Midlane',
  'Les Princes de la Jungle',
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
