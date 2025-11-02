# 🎯 FEATURES MANQUANTES - DUOQ Tracker

> **Statut actuel:** ✅ Build 100% fonctionnel - 461/461 tests passants - 0 erreurs TypeScript

---

## ✅ COMPLÉTÉ - Phase 9 (Session actuelle)

### Phase 9: Résolution Complète Erreurs TypeScript
**Début:** 108 erreurs | **Fin:** 0 erreurs (-100%) 🎉

- ✅ Conversion RankInfo (string → objects)
- ✅ Migration tests vers fixtures helpers
- ✅ Fixes types union (Config | ConfigService, Discord embeds)
- ✅ Completion TrackedGame interface
- ✅ Types Riot API responses
- ✅ Production build fonctionnel

---

## 🔴 FEATURES CRITIQUES MANQUANTES

### 1️⃣ **Rank Change Tracking** (PRIORITÉ 1)
**Impact:** Scoring imprécis - ne reflète pas les gains/pertes de rank réels

#### Problème Actuel
```typescript
// bot/index.ts lignes 171, 186
previousRank: noob.currentRank,  // ❌ FAUX - rank d'avant le match inconnu
newRank: noob.currentRank,       // ❌ FAUX - rank après le match inconnu
```

Le scoring utilise actuellement le même rank avant/après, ce qui empêche :
- ❌ Détection des promotions/démotions
- ❌ Calcul précis des points (bonus promo, malus démo)
- ❌ Tracking progression réelle des joueurs

#### Solution Requise

**A. Créer endpoint Riot API rank lookup**
```typescript
// src/services/riot/riot-api.service.ts
async getRankBySummonerId(summonerId: string): Promise<RankInfo> {
  // GET /lol/league/v4/entries/by-summoner/{summonerId}
  // Retourner { tier: 'GOLD', division: 'III', lp: 50 }
}
```

**B. Fetch rank après chaque game**
```typescript
// bot/index.ts GAME_RESULT_FOUND (avant scoring)
const noobNewRank = await riotService.getRankBySummonerId(noobData.summonerId)
const carryNewRank = await riotService.getRankBySummonerId(carryData.summonerId)

// Utiliser dans GameData
previousRank: noob.currentRank,  // ✅ Rank avant
newRank: noobNewRank,            // ✅ Rank après

// Mettre à jour player après scoring
noob.currentRank = noobNewRank
```

**C. Gestion erreurs API**
- Rate limit (429): Fallback vers currentRank + log warning
- Non classé (404): Utiliser UNRANKED tier
- Timeout: Retry 1x, puis fallback

**Fichiers à modifier:**
1. `src/services/riot/riot-api.service.ts` - Ajouter getRankBySummonerId()
2. `src/bot/index.ts` - Intégrer dans GAME_RESULT_FOUND
3. `src/types/rank.ts` - Possiblement ajouter UNRANKED tier

---

### 2️⃣ **Off-Role Detection** (PRIORITÉ 2)
**Impact:** Pénalités off-role non appliquées

#### Problème Actuel
```typescript
// bot/index.ts lignes 172, 187
isOffRole: false,  // ❌ Hardcodé - jamais détecté
```

Le scoring ne pénalise jamais les joueurs qui jouent off-role.

#### Solution Requise

**A. Ajouter champ mainRole dans Player**
```typescript
// src/types/player.ts
export interface Player {
  // ... existing fields
  mainRole?: 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY'
}
```

**B. Détecter off-role dans scoring**
```typescript
// bot/index.ts GAME_RESULT_FOUND
const isNoobOffRole = noob.mainRole && noob.mainRole !== noobData.teamPosition
const isCarryOffRole = carry.mainRole && carry.mainRole !== carryData.teamPosition
```

**C. Ajouter commande /profile set-role**
```typescript
// Nouveau: src/bot/commands/profile-set-role.ts
// Permet aux joueurs de définir leur main role
// Options: TOP | JUNGLE | MID | ADC | SUPPORT
```

**Fichiers à créer/modifier:**
1. `src/types/player.ts` - Ajouter mainRole field
2. `src/bot/index.ts` - Détecter off-role
3. `src/bot/commands/profile-set-role.ts` - Nouvelle commande
4. Tests associés

---

### 3️⃣ **Off-Champion Detection** (PRIORITÉ 3)
**Impact:** Pénalités off-champion non appliquées

#### Problème Actuel
```typescript
// bot/index.ts lignes 173, 188
isOffChampion: false,  // ❌ Hardcodé - jamais détecté
```

#### Solution Requise

**A. Field déjà existe dans Player**
```typescript
// src/types/player.ts - DÉJÀ PRÉSENT ✅
mainChampion: string  // Nom du champion (ex: "Jinx")
```

**B. Détecter off-champion dans scoring**
```typescript
// bot/index.ts GAME_RESULT_FOUND
const isNoobOffChampion = noob.mainChampion &&
  noob.mainChampion !== noobData.championName

const isCarryOffChampion = carry.mainChampion &&
  carry.mainChampion !== carryData.championName
```

**C. Optionnel: Ajouter commande /profile set-champion**
```typescript
// Permet aux joueurs de changer leur main champion
// Actuellement défini lors du /register
```

**Fichiers à modifier:**
1. `src/bot/index.ts` - Détecter off-champion (1 ligne de code)
2. Tests associés

**Note:** Cette feature est la plus simple - juste une comparaison de strings !

---

## 🟡 FEATURES SECONDAIRES

### 4️⃣ **Auto-Role Detection**
**Impact:** Améliore l'expérience utilisateur

Actuellement, `detectedMainRole` existe mais n'est jamais rempli.

**Solution:**
- Analyser les 10-20 dernières games du joueur
- Calculer le rôle le plus joué
- Mettre à jour `player.detectedMainRole`
- Utiliser comme fallback si `mainRole` non défini

**Effort:** Medium - Nécessite historique de games

---

### 5️⃣ **Rate Limiter Riot API**
**Impact:** Éviter bans API Riot

**Solution:**
- Implémenter rate limiter dans RiotApiService
- Respecter limites: 20 req/sec, 100 req/2min
- Queue system pour requêtes
- Backoff exponentiel sur 429

**Effort:** Medium - Importante pour production

---

### 6️⃣ **Persistent Storage**
**Impact:** État perdu au redémarrage bot

**Solution:**
- Ajouter persistence layer (JSON files ou SQLite)
- Sauvegarder state.players, state.duos, state.games périodiquement
- Charger au démarrage

**Effort:** High - Nécessite migration strategy

---

## 📊 Résumé Priorités

| Feature | Priorité | Impact | Effort | Fichiers |
|---------|----------|--------|--------|----------|
| **Rank Tracking** | 🔴 P1 | ⭐⭐⭐⭐⭐ Critique | Medium | 3 |
| **Off-Role Detection** | 🔴 P2 | ⭐⭐⭐⭐ Important | Low-Medium | 3 |
| **Off-Champion Detection** | 🔴 P3 | ⭐⭐⭐ Important | Very Low | 1 |
| Auto-Role Detection | 🟡 P4 | ⭐⭐ Nice-to-have | Medium | 2 |
| Rate Limiter | 🟡 P5 | ⭐⭐⭐ Production | Medium | 1 |
| Persistent Storage | 🟡 P6 | ⭐⭐⭐⭐ Production | High | 5+ |

---

## 🎯 Plan d'Action Recommandé

### Session Prochaine (2-3h)
1. ✅ **Off-Champion Detection** (15 min) - Quick win facile
2. 🔴 **Rank Tracking** (2h) - Feature la plus critique
   - Créer getRankBySummonerId()
   - Intégrer dans GAME_RESULT_FOUND
   - Tests + validation

### Session Suivante (1-2h)
3. 🔴 **Off-Role Detection** (1-2h)
   - Ajouter mainRole field
   - Commande /profile set-role
   - Détection dans scoring
   - Tests

### Plus tard
4. 🟡 Rate Limiter (si déploiement production prévu)
5. 🟡 Persistent Storage (si déploiement production prévu)
6. 🟡 Auto-Role Detection (nice-to-have)

---

**Date:** 2025-11-02
**Statut:** ✅ Codebase 100% clean - Prêt pour nouvelles features
**Build:** ✅ 0 erreurs TypeScript
**Tests:** ✅ 461/461 passing
