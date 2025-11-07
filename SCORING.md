# Système de Scoring - DuoQ Challenge

Ce document décrit en détail le système de calcul des points pour le DuoQ Challenge.

## Vue d'ensemble

Le système de scoring évalue la performance d'un duo (Noob + Carry) sur chaque partie jouée. Le score final est calculé en **14 étapes séquentielles** qui prennent en compte :

- **Performance individuelle** (KDA, rank change, streaks)
- **Résultat de la partie** (victoire/défaite/remake/surrender)
- **Performance collective** (bonus duo, prise de risque)
- **Équilibrage** (multiplicateur de rank pour duos déséquilibrés)
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
│ 5. Bonus spéciaux (MVP, Penta - non implémentés)    │
│ 6. Sous-total Noob                                  │
│ 7. Cap individuel (-25 / +70)                       │
│ 7.5. Multiplicateur de rank (0.5x - 1.0x)           │
│ 8. Arrondi → Score Noob final                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│         CALCUL INDIVIDUEL (Carry)                   │
├─────────────────────────────────────────────────────┤
│ 1. P_KDA (avec malus Carry)                         │
│ 2. Résultat de game                                 │
│ 3. Streak bonus/malus                               │
│ 4. Rank change                                      │
│ 5. Bonus spéciaux                                   │
│ 6. Sous-total Carry                                 │
│ 7. Cap individuel (-25 / +70)                       │
│ 7.5. Multiplicateur de rank (0.5x - 1.0x)           │
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

#### Note sur les LP (League Points)

**IMPORTANT** : Actuellement, les LP ne sont **pas pris en compte** dans le scoring. Seuls les changements de division/tier comptent. Cela signifie que :

- Gagner +18 LP sans changer de division = **0 points**
- Perdre -15 LP sans changer de division = **0 points**

**Amélioration prévue** : Ajouter un système de conversion LP → points pour mieux refléter les petites progressions.

#### Implémentation
Voir [src/services/scoring/rank-change.ts](src/services/scoring/rank-change.ts)

---

### 1.5. Cap Individuel

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

### 1.6. Multiplicateur de Rank

Le multiplicateur de rank sert à **équilibrer les duos déséquilibrés**. Si un joueur est significativement plus bas en rank que son partenaire, ses gains sont réduits.

#### Principe

- **Le joueur avec le rank le PLUS ÉLEVÉ n'est JAMAIS pénalisé** (multiplicateur = 1.0)
- Si le joueur plus faible est > 1 tier en dessous de la moyenne du duo, son multiplicateur est réduit

#### Formule

```
Moyenne du duo = (rankNoob + rankCarry) / 2
Seuil = Moyenne - 1 tier (4 divisions)

Si playerRank >= partnerRank :
    multiplier = 1.0 (pas de pénalité)

Si playerRank >= seuil :
    multiplier = 1.0 (dans la tolérance)

Si playerRank < seuil :
    distance = seuil - playerRank
    multiplier = max(0.5, 1.0 - distance × 0.05)
```

#### Exemple : Duo déséquilibré

```
Carry : Diamond II (rank = 26)
Noob  : Silver III (rank = 9)

Moyenne = (26 + 9) / 2 = 17.5
Seuil = 17.5 - 4 = 13.5

Carry : 26 >= 9 → multiplier = 1.0 ✓ (pas de pénalité)
Noob  : 9 < 13.5 → distance = 4.5
        → multiplier = 1.0 - (4.5 × 0.05) = 0.775
```

Le Noob ne gagne que **77.5%** de ses points, le Carry garde **100%**.

#### Implémentation
Voir [src/services/scoring/rank-multiplier.ts](src/services/scoring/rank-multiplier.ts)

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

## Points d'amélioration identifiés

### 1. LP non pris en compte

**Problème** : Actuellement, seuls les changements de division/tier comptent. Les LP (League Points) ne sont pas convertis en points.

**Impact** : Un joueur qui gagne +18 LP sans changer de division reçoit 0 points pour son rank change.

**Solution proposée** : Ajouter une conversion LP → points fractionnaires. Par exemple :
```
rankChangePoints = tierBonus + (LP_delta / 100) × 10
```

Cela ajouterait entre -10 et +10 points selon la variation de LP.

### 2. Détection Remake/Surrender

**Problème** : Les flags `remake` et `surrender` ne sont pas encore détectés automatiquement depuis l'API Riot.

**Status** :
- Remake : `TODO` dans [src/services/scoring/engine.ts:48](src/services/scoring/engine.ts#L48)
- Surrender : `TODO` dans [src/services/scoring/engine.ts:47](src/services/scoring/engine.ts#L47)

**Impact** : Les remakes sont actuellement traités comme des victoires/défaites au lieu de 0 points.

### 3. Bonus spéciaux individuels non implémentés

**Status** : MVP et Pentakill bonus sont mentionnés dans les specs mais non implémentés (v1).

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
| **Bonuses** | [src/services/scoring/bonuses.ts](src/services/scoring/bonuses.ts) | Bonus "No Death" |
| **Caps** | [src/services/scoring/caps.ts](src/services/scoring/caps.ts) | Plafonds individuels et duo |
| **Rank Multiplier** | [src/services/scoring/rank-multiplier.ts](src/services/scoring/rank-multiplier.ts) | Multiplicateur pour duos déséquilibrés |
| **Rank Utils** | [src/services/scoring/rank-utils.ts](src/services/scoring/rank-utils.ts) | Utilitaires de conversion rank ↔ valeur |

---

## Tests

Tous les modules de scoring ont des tests unitaires complets dans `src/tests/services/scoring/`.

Pour lancer les tests :
```bash
npm test
```
