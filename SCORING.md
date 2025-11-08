# Système de Scoring - DuoQ Challenge

Ce document décrit en détail le système de calcul des points pour le DuoQ Challenge.

**Dernière mise à jour** : 2025-11-08
**Version** : 2.4

## Vue d'ensemble

Le système de scoring évalue la performance d'un duo (Noob + Carry) sur chaque partie jouée. Le score final est calculé en **14 étapes séquentielles** qui prennent en compte :

- **Performance individuelle** (KDA, rank change, streaks)
- **Résultat de la partie** (victoire/défaite/remake/surrender)
- **Performance collective** (bonus duo, prise de risque)
- **Anti-smurf** (multiplicateur peak elo)
- **Plafonds** (caps pour éviter les exploits)

---

## Architecture du scoring

```
┌─────────────────────────────────────────────────────┐
│         CALCUL INDIVIDUEL (Noob)                    │
├─────────────────────────────────────────────────────┤
│ 1. P_KDA (avec bonus Noob)                          │
│ 2. Résultat de game (+5/-5/+8/-10/0)                │
│ 3. Streak bonus/malus                               │
│ 4. Rank change (+50/+100/-100/-200)                 │
│ 5. Bonus spéciaux (Penta/Quadra/Triple/FB/KS)       │
│ 6. Sous-total Noob                                  │
│ 7. Cap individuel (-25 / +70)                       │
│ 7.5. Multiplicateur peak elo (0.75x - 1.15x)        │
│ 8. Arrondi → Score Noob final                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│         CALCUL INDIVIDUEL (Carry)                   │
├─────────────────────────────────────────────────────┤
│ 1. P_KDA (avec malus Carry)                         │
│ 2. Résultat de game                                 │
│ 3. Streak bonus/malus                               │
│ 4. Rank change                                      │
│ 5. Bonus spéciaux (Penta/Quadra/Triple/FB/KS)       │
│ 6. Sous-total Carry                                 │
│ 7. Cap individuel (-25 / +70)                       │
│ 7.5. Multiplicateur peak elo (0.75x - 1.15x)        │
│ 8. Arrondi → Score Carry final                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│         CALCUL DUO                                  │
├─────────────────────────────────────────────────────┤
│ 9. Somme = Score Noob + Score Carry                 │
│ 10. Bonus de prise de risque (0/+5/+15/+25)         │
│ 11. Bonus "No Death" (+20 si 0 mort pour les 2)     │
│ 12. Sous-total Duo                                  │
│ 13. Cap duo (-50 / +120)                            │
│ 14. Arrondi → SCORE FINAL                           │
└─────────────────────────────────────────────────────┘
```

---

## Phase 1 : Calcul Individuel

### 1.1. Score KDA

Le score KDA est la base de la performance individuelle. Il utilise une formule différente selon le rôle.

#### Formule de base (commune)
```
P_base = 1.0×K + 0.5×A - 1.0×D
```

#### Ajustement par rôle

**Noob** (reçoit un **bonus** pour encourager la progression) :
```
P_KDA = P_base + (0.5×K + 0.25×A)
P_KDA = 1.5×K + 0.75×A - 1.0×D
```

**Carry** (reçoit un **malus** sur les deaths pour responsabiliser) :
```
P_KDA = P_base - 0.5×D
P_KDA = 1.0×K + 0.5×A - 1.5×D
```

#### Exemples

| Rôle  | K | D | A | P_base | Ajustement | P_KDA |
|-------|---|---|---|--------|------------|-------|
| Noob  | 8 | 3 | 6 | 11.0   | +7.5       | **18.5** |
| Carry | 8 | 3 | 6 | 11.0   | -1.5       | **9.5** |
| Noob  | 2 | 7 | 4 | -3.0   | +2.0       | **-1.0** |
| Carry | 2 | 7 | 4 | -3.0   | -3.5       | **-6.5** |

**Observation** : Le Noob est **plus récompensé pour les kills/assists** tandis que le Carry est **plus pénalisé pour les deaths**.

#### Implémentation
Voir [src/services/scoring/kda.ts](src/services/scoring/kda.ts)

---

### 1.2. Résultat de partie

Le résultat de la partie donne des points fixes selon l'issue.

| Résultat | Points | Conditions |
|----------|--------|------------|
| **Remake** | **0** | Partie annulée (priorité maximale) |
| **Surrender** | **-10** | Forfait (uniquement si défaite) |
| **Victoire rapide** | **+8** | Victoire en < 25 minutes (1500 sec) |
| **Victoire standard** | **+5** | Victoire normale |
| **Défaite standard** | **-5** | Défaite normale |

#### Priorité d'application
```
Remake > Surrender > Victoire rapide > Victoire > Défaite
```

#### Exemples

| Win | Duration | Surrender | Remake | Points |
|-----|----------|-----------|--------|--------|
| ✓   | 22:30    | -         | -      | **+8** (rapide) |
| ✓   | 35:00    | -         | -      | **+5** (standard) |
| ✗   | 28:00    | -         | -      | **-5** (défaite) |
| ✗   | 18:00    | ✓         | -      | **-10** (surrender) |
| -   | 03:00    | -         | ✓      | **0** (remake) |

#### Implémentation
Voir [src/services/scoring/game-result.ts](src/services/scoring/game-result.ts)

---

### 1.3. Bonus/Malus de Streak

Les streaks récompensent la **constance** (win streaks) et pénalisent les **chutes** (loss streaks).

#### Win Streaks (bonus progressifs)

| Seuil | Bonus | Commentaire |
|-------|-------|-------------|
| 3 wins consécutives | **+10 pts** | Début de streak |
| 5 wins consécutives | **+25 pts** | Streak confirmé |
| 7 wins consécutives | **+50 pts** | Hot streak ! |

#### Loss Streaks (malus progressifs)

| Seuil | Malus | Commentaire |
|-------|-------|-------------|
| 3 losses consécutives | **-10 pts** | Début de tilt |
| 5 losses consécutives | **-25 pts** | Tilt confirmé |

**Note** : Le bonus/malus s'applique **uniquement sur la game qui atteint le seuil**. Les games suivantes ne donnent rien tant qu'un nouveau seuil n'est pas atteint.

#### Exemples

```
Game 1 (W) : streak = 1  → bonus = 0
Game 2 (W) : streak = 2  → bonus = 0
Game 3 (W) : streak = 3  → bonus = +10 ✓
Game 4 (W) : streak = 4  → bonus = 0
Game 5 (W) : streak = 5  → bonus = +25 ✓
Game 6 (L) : streak = -1 → bonus = 0 (reset)
```

#### Implémentation
Voir [src/services/scoring/streaks.ts](src/services/scoring/streaks.ts)

---

### 1.4. Rank Change

Le changement de rank entre le début et la fin de la partie est fortement impactant.

#### Montée de rank (récompensée)

| Changement | Points | Exemple |
|------------|--------|---------|
| **+1 division** | **+50 pts** | Silver III → Silver II |
| **+1 tier** | **+100 pts** | Gold I → Platinum IV |

#### Descente de rank (double malus)

| Changement | Points | Exemple |
|------------|--------|---------|
| **-1 division** | **-100 pts** | Gold II → Gold III |
| **-1 tier** | **-200 pts** | Platinum IV → Gold I |

**Observation** : Les descentes sont **doublement pénalisées** pour encourager la prudence.

#### Conversion LP (League Points)

Les LP sont maintenant pris en compte via un système de conversion :

**Conversion** : **1 LP = 0.4 point**

| Variation LP | Points | Commentaire |
|--------------|--------|-------------|
| +20 LP | **+8 pts** | Belle victoire |
| +15 LP | **+6 pts** | Victoire standard |
| -15 LP | **-6 pts** | Défaite standard |
| -20 LP | **-8 pts** | Grosse défaite |

**Règles d'application** :
- Les LP ne comptent que **si pas de changement de division/tier**
- Si division change, seul le bonus de division/tier s'applique (pas de cumul avec LP)
- Pour Master+ (pas de divisions), les LP comptent toujours

**Exemples** :
```
Gold III (50 LP) → Gold III (70 LP) : +20 LP × 0.4 = +8 pts ✓
Gold III (95 LP) → Gold II (0 LP)   : +50 pts (division), LP ignorés
Master (150 LP) → Master (175 LP)   : +25 LP × 0.4 = +10 pts ✓
```

#### Implémentation
Voir [src/services/scoring/rank-change.ts](src/services/scoring/rank-change.ts)

---

### 1.5. Bonus Spéciaux Individuels

Les bonus spéciaux récompensent les performances exceptionnelles individuelles (multikills, first blood, killing sprees).

#### Formule

**Multikills** (mutuellement exclusifs - seul le meilleur compte) :
```
Si pentaKills > 0:
  bonus += 30 × pentaKills
Sinon si quadraKills > 0:
  bonus += 15 × quadraKills
Sinon si tripleKills > 0:
  bonus += 5 × tripleKills
```

**Bonus cumulatifs** (s'ajoutent aux multikills) :
```
Si firstBloodKill = true:
  bonus += 5

Si largestKillingSpree >= 7:
  bonus += 10
```

#### Tableau récapitulatif

| Bonus | Points | Cumulative ? | Seuil |
|-------|--------|--------------|-------|
| **Pentakill** | **+30 pts** | Non (prioritaire) | 1+ pentakill |
| **Quadrakill** | **+15 pts** | Non (si pas de penta) | 1+ quadrakill |
| **Triple kill** | **+5 pts** | Non (si pas de quadra/penta) | 1+ triple kill |
| **First Blood** | **+5 pts** | Oui | First Blood obtenu |
| **Killing Spree** | **+10 pts** | Oui | 7+ kills d'affilée |

**Note** : Les multikills (Penta/Quadra/Triple) sont **mutuellement exclusifs** car un pentakill inclut déjà un quadra et un triple. Seul le meilleur multikill est compté. En revanche, First Blood et Killing Spree sont **cumulatifs** et s'ajoutent au multikill.

#### Exemples

**Exemple 1 : Carry avec Pentakill + First Blood + Killing Spree**
```
pentaKills = 1
firstBloodKill = true
largestKillingSpree = 15

Bonus = 30 (penta) + 5 (FB) + 10 (KS) = 45 pts
```

**Exemple 2 : Noob avec Quadra + First Blood**
```
quadraKills = 1
firstBloodKill = true
largestKillingSpree = 4 (< 7, pas de bonus)

Bonus = 15 (quadra) + 5 (FB) = 20 pts
```

**Exemple 3 : Carry avec Triple kill seulement**
```
tripleKills = 1
firstBloodKill = false
largestKillingSpree = 3

Bonus = 5 (triple) = 5 pts
```

**Exemple 4 : Noob avec First Blood + Killing Spree (sans multikill)**
```
tripleKills = 0
firstBloodKill = true
largestKillingSpree = 8

Bonus = 5 (FB) + 10 (KS) = 15 pts
```

**Exemple 5 : Game moyenne sans bonus spéciaux**
```
pentaKills = 0
quadraKills = 0
tripleKills = 0
firstBloodKill = false
largestKillingSpree = 3

Bonus = 0 pts
```

#### Justification

**Pourquoi ces bonus ?**
- **Pentakill** : Performance exceptionnelle (rare) → forte récompense (+30 pts)
- **Quadrakill** : Très bonne performance → récompense modérée (+15 pts)
- **Triple kill** : Bonne performance → petite récompense (+5 pts)
- **First Blood** : Avantage early game → récompense fixe (+5 pts)
- **Killing Spree** : Domination sans mourir → récompense fixe (+10 pts)

**Impact sur le scoring** :
- Encourage les joueurs à viser des performances exceptionnelles
- Les multikills sont rares donc ont un impact limité sur le ladder global
- First Blood et Killing Spree sont plus accessibles et encouragent l'agression early game

#### Implémentation
Voir [src/services/scoring/bonuses.ts](src/services/scoring/bonuses.ts)

**Backward compatibility** : Tous les champs sont optionnels. Si les données ne sont pas présentes dans la Riot API, le bonus est simplement de 0 pts (pas de crash).

---

### 1.6. Cap Individuel

Après calcul du sous-total, chaque joueur est plafonné pour éviter les exploits.

| Limite | Valeur |
|--------|--------|
| **Minimum** | **-25 pts** |
| **Maximum** | **+70 pts** |

**Exemple** :
```
Sous-total Noob = 85 pts
→ Après cap = 70 pts (plafond atteint)

Sous-total Carry = -30 pts
→ Après cap = -25 pts (plancher atteint)
```

#### Implémentation
Voir [src/services/scoring/caps.ts](src/services/scoring/caps.ts)

---

### 1.7. Multiplicateur Peak Elo (Anti-Smurf)

Le multiplicateur peak elo est un système **anti-smurf** qui pénalise les joueurs jouant significativement en dessous de leur vrai niveau (peak elo), tout en **récompensant la progression** pour ceux qui dépassent leur peak.

#### Principe

- Compare le **peak elo** du joueur (son meilleur rang historique) avec son **rank actuel**
- Applique un **bonus** si le joueur dépasse son peak (progression)
- Applique un **malus** si le joueur est trop en dessous de son peak (smurf)
- Tolérance de **1 tier** en dessous (normal decay, meta shifts)

#### Formule

```
tierDiff = floor((peakValue - currentValue) / 4)

BONUS (au-dessus du peak elo):
  Si tierDiff < 0 (joueur au-dessus de son peak):
    tierAbove = abs(tierDiff)
    Si tierAbove >= 3: multiplier = 1.15 (+15% bonus max)
    Si tierAbove === 2: multiplier = 1.10 (+10% bonus)
    Si tierAbove === 1: multiplier = 1.05 (+5% bonus)

TOLÉRANCE (0-1 tier en dessous):
  Si tierDiff <= 1:
    multiplier = 1.0 (pas de malus)

MALUS (smurfs, 2+ tiers en dessous):
  Si tierDiff === 2: multiplier = 0.95  (-5%)
  Si tierDiff === 3: multiplier = 0.875 (-12.5%)
  Si tierDiff === 4: multiplier = 0.80  (-20%)
  Si tierDiff >= 5: multiplier = 0.75  (-25% max)
```

#### Exemples

**Cas 1 : Progression (BONUS)**
```
Peak Elo: Gold IV (rank = 12)
Current Rank: Emerald IV (rank = 20)
Écart: +8 divisions = +2 tiers

→ tierDiff = floor((12 - 20) / 4) = -2
→ tierAbove = 2
→ multiplier = 1.10 (+10% bonus pour progression!)
```

**Cas 2 : Tolérance (pas de malus)**
```
Peak Elo: Platinum IV (rank = 16)
Current Rank: Gold II (rank = 14)
Écart: -2 divisions = -0.5 tier

→ tierDiff = floor((16 - 14) / 4) = 0
→ multiplier = 1.0 (tolérance, pas de malus)
```

**Cas 3 : Petit smurf (léger malus)**
```
Peak Elo: Platinum IV (rank = 16)
Current Rank: Silver IV (rank = 8)
Écart: -8 divisions = -2 tiers

→ tierDiff = floor((16 - 8) / 4) = 2
→ multiplier = 0.95 (-5% malus)
```

**Cas 4 : Gros smurf (malus sévère)**
```
Peak Elo: Diamond IV (rank = 24)
Current Rank: Bronze IV (rank = 4)
Écart: -20 divisions = -5 tiers

→ tierDiff = floor((24 - 4) / 4) = 5
→ multiplier = 0.75 (-25% malus max)
```

#### Tableau récapitulatif

| Écart peak → current | tierDiff | Multiplicateur | Impact |
|----------------------|----------|----------------|--------|
| +3 tiers ou plus | <= -3 | **1.15x** | +15% bonus max |
| +2 tiers | -2 | **1.10x** | +10% bonus |
| +1 tier | -1 | **1.05x** | +5% bonus |
| 0-1 tier en dessous | 0 ou 1 | **1.00x** | Tolérance |
| -2 tiers | 2 | **0.95x** | -5% malus |
| -3 tiers | 3 | **0.875x** | -12.5% malus |
| -4 tiers | 4 | **0.80x** | -20% malus |
| -5 tiers ou plus | >= 5 | **0.75x** | -25% malus max |

#### Justification

**Pourquoi ce système ?**
- **Fairness** : Empêche les smurfs de dominer le ladder en jouant en bas elo
- **Progression encouragée** : Récompense les joueurs qui s'améliorent et dépassent leur peak
- **Tolérance** : Pas de pénalité pour 1 tier de descente (normal decay, meta changes)
- **Malus progressif** : Plus l'écart est grand, plus la pénalité est sévère

**Impact sur un challenge "Fresh Start"**
- Si tous les duos partent de Bronze IV avec des peak elos variés, ce système pénalise les joueurs forts qui ne remontent pas assez vite
- Le bonus de progression encourage les joueurs à climb activement

#### Implémentation
Voir [src/services/scoring/peak-elo-multiplier.ts](src/services/scoring/peak-elo-multiplier.ts)

---

## Phase 2 : Calcul Duo

Une fois les scores individuels calculés, on passe au calcul du score de duo.

### 2.1. Somme des scores individuels

```
Somme Duo = Score Noob (final) + Score Carry (final)
```

---

### 2.2. Bonus de Prise de Risque

Le bonus de prise de risque récompense les duos qui sortent de leur zone de confort.

#### Conditions évaluées (4 au total)

1. **Noob hors rôle principal ?**
2. **Noob hors champion principal ?**
3. **Carry hors rôle principal ?**
4. **Carry hors champion principal ?**

#### Formule

```
H = nombre de conditions vraies

Si H = 4 : +25 pts (risque maximal)
Si H = 3 : +15 pts
Si H = 2 : +5 pts
Si H ≤ 1 : 0 pts (pas de bonus)
```

#### Exemples

| Noob Off-Role | Noob Off-Champ | Carry Off-Role | Carry Off-Champ | H | Bonus |
|---------------|----------------|----------------|-----------------|---|-------|
| ✓ | ✓ | ✓ | ✓ | 4 | **+25** |
| ✓ | ✓ | ✓ | ✗ | 3 | **+15** |
| ✓ | ✗ | ✓ | ✗ | 2 | **+5** |
| ✓ | ✗ | ✗ | ✗ | 1 | **0** |

#### Implémentation
Voir [src/services/scoring/risk.ts](src/services/scoring/risk.ts)

---

### 2.3. Bonus "No Death"

Si **les DEUX joueurs** du duo terminent la partie avec **0 mort**, le duo reçoit un bonus.

| Condition | Bonus |
|-----------|-------|
| Noob deaths = 0 **ET** Carry deaths = 0 | **+20 pts** |
| Sinon | **0 pts** |

#### Exemples

| Noob Deaths | Carry Deaths | Bonus |
|-------------|--------------|-------|
| 0 | 0 | **+20** ✓ |
| 0 | 1 | **0** ✗ |
| 1 | 0 | **0** ✗ |

#### Implémentation
Voir [src/services/scoring/bonuses.ts](src/services/scoring/bonuses.ts)

---

### 2.4. Cap Duo

Après ajout des bonus duo, le score total est plafonné.

| Limite | Valeur |
|--------|--------|
| **Minimum** | **-50 pts** |
| **Maximum** | **+120 pts** |

**Exemple** :
```
Sous-total Duo = 135 pts
→ Après cap = 120 pts (plafond atteint)
```

#### Implémentation
Voir [src/services/scoring/caps.ts](src/services/scoring/caps.ts)

---

### 2.5. Score Final

Le score final est **arrondi à l'entier** le plus proche.

```
Score Final = round(Score Duo cappé)
```

---

## Exemple Complet

### Données d'entrée

**Duo** : Carry (Platinum II) + Noob (Gold III)

**Game** :
- Résultat : Victoire (30 min)
- Noob : 5/2/8, Gold III → Gold II (+1 division), streak avant = +2
- Carry : 12/3/7, Platinum II (inchangé), streak avant = +2
- Off-role : Noob ✓, Carry ✗
- Off-champion : Noob ✗, Carry ✗

---

### Calcul Noob

```
1. KDA : 1.5×5 + 0.75×8 - 1.0×2 = 11.5
2. Résultat : +5 (victoire standard)
3. Streak : 0 (pas de seuil atteint)
4. Rank change : +50 (Gold III → Gold II)
5. Bonus spéciaux : 0
6. Sous-total : 11.5 + 5 + 0 + 50 + 0 = 66.5
7. Cap individuel : 66.5 (dans les limites)
7.5. Multiplicateur : 1.0 (pas de déséquilibre)
8. Score Noob final : round(66.5) = 67
```

---

### Calcul Carry

```
1. KDA : 1.0×12 + 0.5×7 - 1.5×3 = 11.0
2. Résultat : +5 (victoire standard)
3. Streak : 0 (pas de seuil atteint)
4. Rank change : 0 (pas de changement)
5. Bonus spéciaux : 0
6. Sous-total : 11.0 + 5 + 0 + 0 + 0 = 16.0
7. Cap individuel : 16.0 (dans les limites)
7.5. Multiplicateur : 1.0 (pas de déséquilibre)
8. Score Carry final : round(16.0) = 16
```

---

### Calcul Duo

```
9. Somme : 67 + 16 = 83
10. Bonus risque : H=1 (Noob off-role uniquement) → 0
11. Bonus No Death : Noob 2 morts → 0
12. Sous-total Duo : 83 + 0 + 0 = 83
13. Cap duo : 83 (dans les limites)
14. Score final : round(83) = 83
```

**Résultat** : Le duo gagne **83 points** pour cette partie.

---

## Notes Techniques

### Détection Automatique des Games (AutoPollService)

Le bot détecte automatiquement les games terminées via polling régulier :
- **Intervalle** : 30 secondes (ajusté pour éviter rate limiting Riot API)
- **Limite Riot API** : 50 calls/min
- **Capacité** : Supporte jusqu'à 12 duos simultanés (48 calls/min)
- **Latence** : Games détectées en max 30s après fin de partie

### Discord Logging

Le bot envoie automatiquement les erreurs et warnings vers le channel dev Discord :
- ⚠️ Rate limiting Riot API
- 🔴 Erreurs AutoPoll service
- 🔴 Erreurs scoring
- Voir `src/utils/discord-logger.ts`

### Bugs Corrigés (v2.1)

**Grandmaster Rank Display** :
- Fix emoji/couleur incorrects pour les joueurs Grandmaster
- Le check `GM` est maintenant effectué avant le switch dans `getRankEmoji()` et `getRankColor()`

**Progress Bar Division by Zero** :
- Protection contre `total = 0` dans `createProgressBar()`
- Protection contre valeurs négatives et `current > total`

---

## Améliorations futures

### 1. Persistence Layer

**Status** : Actuellement in-memory (volatile)

**Recommandation future** : Migrer vers SQLite pour persistence entre redémarrages

---

## Fichiers sources

| Module | Fichier | Description |
|--------|---------|-------------|
| **Engine** | [src/services/scoring/engine.ts](src/services/scoring/engine.ts) | Orchestrateur principal (14 étapes) |
| **KDA** | [src/services/scoring/kda.ts](src/services/scoring/kda.ts) | Calcul KDA avec ajustement par rôle |
| **Game Result** | [src/services/scoring/game-result.ts](src/services/scoring/game-result.ts) | Points de victoire/défaite/remake |
| **Streaks** | [src/services/scoring/streaks.ts](src/services/scoring/streaks.ts) | Bonus/malus de streaks |
| **Rank Change** | [src/services/scoring/rank-change.ts](src/services/scoring/rank-change.ts) | Bonus/malus de changement de rank |
| **Risk** | [src/services/scoring/risk.ts](src/services/scoring/risk.ts) | Bonus de prise de risque (off-role/champ) |
| **Bonuses** | [src/services/scoring/bonuses.ts](src/services/scoring/bonuses.ts) | Bonus "No Death" + Bonus spéciaux individuels |
| **Caps** | [src/services/scoring/caps.ts](src/services/scoring/caps.ts) | Plafonds individuels et duo |
| **Peak Elo Multiplier** | [src/services/scoring/peak-elo-multiplier.ts](src/services/scoring/peak-elo-multiplier.ts) | Multiplicateur anti-smurf basé sur peak elo |
| **Rank Utils** | [src/services/scoring/rank-utils.ts](src/services/scoring/rank-utils.ts) | Utilitaires de conversion rank ↔ valeur |

---

## Tests

Tous les modules de scoring ont des tests unitaires complets dans `src/tests/services/scoring/`.

Pour lancer les tests :
```bash
npm test
```
