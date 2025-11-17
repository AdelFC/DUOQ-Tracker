# Système de Scoring - DuoQ Challenge

Ce document décrit en détail le système de calcul des points pour le DuoQ Challenge.

**Dernière mise à jour** : 2025-11-17
**Version** : 3.0 (Refonte complète)

## 🔄 Changements majeurs v3.0

Cette version introduit une refonte complète du système de scoring pour corriger l'inflation de points :

### Changements principaux :
- **Suppression** du système de rank change (trop inégalitaire)
- **Nouveau système de streaks** : bonus progressifs + bonus ponctuels
- **Valeurs ajustées** : surrender -30, victoires/défaites ±20, victoire rapide +25
- **Caps modifiés** : individuel -40/+60, duo -70/+120
- **Peak Elo ajusté** : multiplicateurs renforcés (×0.70 à ×1.20)
- **Remake/Early game** : < 5 minutes = 0 points automatique
- **Alertes** : notifications spéciales pour pentakill, no death, surrender

---

## Vue d'ensemble

Le système de scoring évalue la performance d'un duo (Noob + Carry) sur chaque partie jouée. Le score final est calculé en plusieurs étapes qui prennent en compte :

- **Performance individuelle** (KDA, streaks, bonus spéciaux)
- **Résultat de la partie** (victoire/défaite/remake/surrender)
- **Performance collective** (bonus duo, prise de risque, no death)
- **Anti-smurf** (multiplicateur peak elo renforcé)
- **Plafonds** (caps pour éviter les exploits)

---

## Architecture du scoring

```
┌─────────────────────────────────────────────────────┐
│  CAS SPÉCIAL : REMAKE OU PARTIE < 5 MIN → 0 POINTS │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│         CALCUL INDIVIDUEL (Noob)                    │
├─────────────────────────────────────────────────────┤
│ 1. P_KDA (avec bonus Noob)                          │
│ 2. Résultat de game (+25/+20/-20/-30/0)             │
│ 3. Streak (progressif + ponctuel)                   │
│ 4. Bonus spéciaux (Penta/Quadra/Triple/FB/KS)       │
│ 5. Sous-total Noob                                  │
│ 6. Cap individuel (-40 / +60)                       │
│ 7. Multiplicateur peak elo (0.70x - 1.20x)          │
│ 8. Arrondi → Score Noob final                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│         CALCUL INDIVIDUEL (Carry)                   │
├─────────────────────────────────────────────────────┤
│ [Même processus que Noob avec formules Carry]       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│         CALCUL DUO                                  │
├─────────────────────────────────────────────────────┤
│ 9. Somme = Score Noob + Score Carry                 │
│ 10. Bonus de prise de risque (0/+10/+15)            │
│ 11. Bonus "No Death" (+20 si 0 mort pour les 2)     │
│ 12. Sous-total Duo                                  │
│ 13. Cap duo (-70 / +120)                            │
│ 14. Arrondi → SCORE FINAL                           │
└─────────────────────────────────────────────────────┘
```

---

## ⚠️ Cas spécial : Remake / Early Game

Si **remake** OU **partie < 5 minutes** :
- **0 points** attribués
- Arrêt immédiat du calcul
- Aucun bonus/malus appliqué

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
| **Remake / < 5 min** | **0** | Arrêt du calcul (priorité maximale) |
| **Surrender** | **-30** | Forfait (uniquement si défaite) + alerte 🏳️ |
| **Victoire rapide** | **+25** | Victoire en < 20 minutes (1200 sec) |
| **Victoire standard** | **+20** | Victoire normale |
| **Défaite standard** | **-20** | Défaite normale |

#### Priorité d'application
```
Remake/5min > Surrender > Victoire rapide > Victoire > Défaite
```

#### Exemples

| Win | Duration | Surrender | Remake | Points |
|-----|----------|-----------|--------|--------|
| ✓   | 18:30    | -         | -      | **+25** (rapide) |
| ✓   | 35:00    | -         | -      | **+20** (standard) |
| ✗   | 28:00    | -         | -      | **-20** (défaite) |
| ✗   | 18:00    | ✓         | -      | **-30** (surrender) |
| -   | 03:00    | -         | ✓      | **0** (early game) |

#### Implémentation
Voir [src/services/scoring/game-result.ts](src/services/scoring/game-result.ts)

---

### 1.3. Bonus/Malus de Streak ⭐ NOUVEAU

**Révolution v3.0** : système à deux niveaux (progressif + ponctuel)

Les streaks récompensent maintenant la **constance** avec deux mécanismes :
1. **Bonus progressif** : à chaque game selon le nombre de victoires/défaites consécutives
2. **Bonus ponctuel** : quand on atteint certains seuils (3, 5, 7 wins)

#### Win Streaks

**Bonus progressif (à chaque game)** :
| Streak | Bonus par game |
|--------|----------------|
| 2 wins | **+2 pts** |
| 3 wins | **+3 pts** |
| 4 wins | **+4 pts** |
| 5 wins | **+5 pts** |
| 6 wins | **+6 pts** |
| 7+ wins | **+7 pts** (max) |

**Bonus ponctuels (à l'atteinte du seuil)** :
| Seuil | Bonus ponctuel |
|-------|----------------|
| 3 wins | **+10 pts** |
| 5 wins | **+20 pts** |
| 7 wins | **+30 pts** |

**Ces bonus se cumulent !**
- À la 3ème victoire : +3 (progressif) + 10 (ponctuel) = **+13 pts de streak**
- À la 7ème victoire : +7 (progressif) + 30 (ponctuel) = **+37 pts de streak**

#### Loss Streaks

**Malus progressif (à chaque game)** :
| Streak | Malus par game |
|--------|----------------|
| 2 losses | **-2 pts** |
| 3 losses | **-3 pts** |
| 4 losses | **-4 pts** |
| 5+ losses | **-5 pts** (max) |

**Malus ponctuels (à l'atteinte du seuil)** :
| Seuil | Malus ponctuel |
|-------|----------------|
| 3 losses | **-10 pts** |
| 5 losses | **-25 pts** |

#### Exemples

**Scénario 1** : Un duo gagne sa 5ème game d'affilée
- Bonus progressif : +5 pts
- Bonus ponctuel (seuil 5) : +20 pts
- **Total streak : +25 pts**

**Scénario 2** : Un duo perd sa 3ème game d'affilée
- Malus progressif : -3 pts
- Malus ponctuel (seuil 3) : -10 pts
- **Total streak : -13 pts**

#### Implémentation
Voir [src/services/scoring/streaks.ts](src/services/scoring/streaks.ts)

---

### 1.4. Bonus spéciaux individuels

Ces bonus récompensent les performances exceptionnelles d'un joueur.

| Bonus | Points | Conditions | Cumulable ? |
|-------|--------|------------|-------------|
| **Pentakill** | **+30** | 5 kills d'affilée | Prioritaire (bloque quadra/triple) + alerte 🔥 |
| **Quadrakill** | **+15** | 4 kills d'affilée | Si pas de pentakill |
| **Triple Kill** | **+5** | 3 kills d'affilée | Si pas de quadra/pentakill |
| **First Blood** | **+5** | Premier kill de la game | ✓ Cumulatif |
| **Killing Spree** | **+10** | 7+ kills sans mourir | ✓ Cumulatif |

#### Exemples

| Penta | Quadra | Triple | FB | KS | Total |
|-------|--------|--------|----|----|-------|
| 1     | -      | -      | ✓  | ✓  | **45** (30+5+10) |
| -     | 1      | -      | ✓  | ✓  | **30** (15+5+10) |
| -     | -      | 2      | ✓  | ✗  | **15** (5+5+5) |

#### Implémentation
Voir [src/services/scoring/bonuses.ts](src/services/scoring/bonuses.ts)

---

### 1.5. Cap individuel

Pour éviter les scores extrêmes, un plafond est appliqué **avant** le multiplicateur peak elo.

```
Cap individuel : [-40 pts, +60 pts]
```

#### Exemples

| Sous-total | Cap appliqué | Score cappé |
|------------|--------------|-------------|
| +85        | MAX (+60)    | **+60** |
| +45        | -            | **+45** |
| -55        | MIN (-40)    | **-40** |

#### Implémentation
Voir [src/services/scoring/caps.ts](src/services/scoring/caps.ts)

---

### 1.6. Multiplicateur Peak Elo (Anti-Smurf) ⭐ RENFORCÉ

Le multiplicateur peak elo compare le **rank actuel** au **peak elo** (meilleur rank historique) pour :
- **Récompenser** la progression au-delà du peak
- **Pénaliser** le smurfing (jouer loin en dessous de son niveau)

#### Formule v3.0 (renforcée)

| Écart avec le peak | Multiplicateur | Effet |
|--------------------|----------------|-------|
| **+2+ tiers au-dessus** | **×1.20** | +20% bonus (progression max) |
| **+1 tier au-dessus** | **×1.10** | +10% bonus |
| **0-1 tier en dessous** | **×1.00** | Tolérance (pas de pénalité) |
| **-2 tiers** | **×0.90** | -10% malus |
| **-3 tiers** | **×0.80** | -20% malus |
| **-4+ tiers** | **×0.70** | -30% malus (anti-smurf max) |

#### Exemples

**Joueur A** : Peak = Diamond IV, Actuel = Diamond II (+2 divisions)
- Écart : 0 tiers
- Multiplicateur : **×1.00** (tolérance)

**Joueur B** : Peak = Platinum II, Actuel = Emerald III (+1 tier)
- Écart : +1 tier au-dessus du peak
- Multiplicateur : **×1.10** (bonus progression)
- Score cappé : 50 pts → **55 pts** après multiplicateur

**Joueur C** : Peak = Diamond I, Actuel = Silver II (-4 tiers)
- Écart : -4 tiers (smurf suspect)
- Multiplicateur : **×0.70** (malus anti-smurf)
- Score cappé : 50 pts → **35 pts** après multiplicateur

#### Implémentation
Voir [src/services/scoring/peak-elo-multiplier.ts](src/services/scoring/peak-elo-multiplier.ts)

---

## Phase 2 : Calcul Duo

### 2.1. Somme des scores individuels

```
Score Duo = Score Noob final + Score Carry final
```

Simple addition des deux scores après application des caps et multiplicateurs individuels.

---

### 2.2. Bonus de prise de risque

Le bonus de risque récompense les duos qui sortent de leur zone de confort.

#### Conditions évaluées (4)
1. Noob hors rôle principal ?
2. Noob hors champion principal ?
3. Carry hors rôle principal ?
4. Carry hors champion principal ?

#### Bonus selon le nombre de conditions remplies (H)

| H | Bonus | Commentaire |
|---|-------|-------------|
| 4 | **+15 pts** | Risque maximum |
| 3 | **+10 pts** | Risque élevé |
| 0-2 | **0 pt** | Zone de confort |

#### Exemples

- Noob off-role + off-champion + Carry off-champion → H=3 → **+10 pts**
- Noob off-role + Carry off-role + Carry off-champion → H=3 → **+10 pts**
- Les deux joueurs sur leur main → H=0 → **0 pt**

#### Implémentation
Voir [src/services/scoring/risk.ts](src/services/scoring/risk.ts)

---

### 2.3. Bonus "No Death"

Si **les deux joueurs** terminent la game avec **0 mort** :

```
Bonus No Death = +20 pts + alerte 💎
```

Sinon : 0 pt

#### Implémentation
Voir [src/services/scoring/bonuses.ts](src/services/scoring/bonuses.ts)

---

### 2.4. Cap duo

Le plafond final s'applique au score total du duo.

```
Cap duo : [-70 pts, +120 pts]
```

#### Exemples

| Sous-total duo | Cap appliqué | Score final |
|----------------|--------------|-------------|
| +145           | MAX (+120)   | **+120** |
| +95            | -            | **+95** |
| -85            | MIN (-70)    | **-70** |

#### Implémentation
Voir [src/services/scoring/caps.ts](src/services/scoring/caps.ts)

---

## 🎯 Alertes spéciales

### Nouvelles notifications v3.0

Le système affiche maintenant des alertes visuelles pour :

| Alerte | Déclencheur | Message |
|--------|-------------|---------|
| 🔥 **Pentakill** | Pentakill Noob ou Carry | "PENTAKILL du [Noob/Carry] ! +30 pts" |
| 💎 **No Death** | Les 2 joueurs à 0 mort | "Duo sans aucune mort ! +20 pts" |
| 🏳️ **Surrender** | FF sur défaite | "Cette duo a FF pour plus de fun ! -30 pts" |

Ces alertes apparaissent en haut de la notification de match dans Discord.

---

## 📊 Affichage des détails

### Nouveau dans v3.0

Chaque notification de match inclut maintenant le **détail du calcul** en italique :

**Détail Noob** :
```
KDA: +18 | Résultat: +25 | Streak: +13 (+3+10) | Bonus: +5 | Cap: +60 | Peak: ×1.10
```

**Détail Carry** :
```
KDA: +10 | Résultat: +25 | Streak: +13 (+3+10) | Cap: +48 | Peak: ×1.00
```

**Détail Duo** :
```
Somme: +114 | Risque: +10 | No Death: +20 | Cap: +120
```

---

## 🔧 Fichiers de référence

| Composant | Fichier |
|-----------|---------|
| Moteur principal | [src/services/scoring/engine.ts](src/services/scoring/engine.ts) |
| KDA | [src/services/scoring/kda.ts](src/services/scoring/kda.ts) |
| Résultat de game | [src/services/scoring/game-result.ts](src/services/scoring/game-result.ts) |
| Streaks | [src/services/scoring/streaks.ts](src/services/scoring/streaks.ts) |
| Bonus spéciaux | [src/services/scoring/bonuses.ts](src/services/scoring/bonuses.ts) |
| Caps | [src/services/scoring/caps.ts](src/services/scoring/caps.ts) |
| Peak Elo | [src/services/scoring/peak-elo-multiplier.ts](src/services/scoring/peak-elo-multiplier.ts) |
| Risque | [src/services/scoring/risk.ts](src/services/scoring/risk.ts) |
| Types | [src/types/scoring.ts](src/types/scoring.ts) |

---

## 📈 Exemples complets

### Exemple 1 : Victoire propre avec streak

**Context** :
- Victoire en 18 minutes
- Noob : 10/0/8 (KDA parfait), 3ème win d'affilée, first blood
- Carry : 8/0/12, 3ème win d'affilée
- Les deux à 0 mort
- Peak elo : les deux au peak

**Calcul Noob** :
1. KDA : 1.5×10 + 0.75×8 - 0 = **21 pts**
2. Résultat : victoire rapide = **+25 pts**
3. Streak : +3 (progressif) + 10 (ponctuel) = **+13 pts**
4. Bonus : first blood = **+5 pts**
5. Sous-total : 21 + 25 + 13 + 5 = **64 pts**
6. Cap : MAX(60) = **60 pts**
7. Peak : ×1.00 = **60 pts**

**Calcul Carry** :
1. KDA : 1.0×8 + 0.5×12 - 0 = **14 pts**
2. Résultat : **+25 pts**
3. Streak : **+13 pts**
4. Bonus : 0
5. Sous-total : **52 pts**
6. Cap : **52 pts**
7. Peak : ×1.00 = **52 pts**

**Calcul Duo** :
- Somme : 60 + 52 = **112 pts**
- Risque : 0
- No Death : **+20 pts** 💎
- Sous-total : **132 pts**
- Cap : MAX(120) = **120 pts**

**Score final : +120 pts** 🎉

---

### Exemple 2 : Défaite avec surrender

**Context** :
- Défaite par surrender en 22 minutes
- Noob : 3/8/5
- Carry : 4/6/7
- 2 losses d'affilée (cette game est la 2ème)

**Calcul Noob** :
1. KDA : 1.5×3 + 0.75×5 - 8 = **0.25 pts**
2. Résultat : surrender = **-30 pts** 🏳️
3. Streak : -2 (progressif) = **-2 pts**
4. Bonus : 0
5. Sous-total : **-31.75 pts**
6. Cap : **-31.75 pts** (dans les limites)
7. Peak : ×1.00 = **-32 pts** (arrondi)

**Calcul Carry** :
1. KDA : 1.0×4 + 0.5×7 - 1.5×6 = **-1.5 pts**
2. Résultat : **-30 pts**
3. Streak : **-2 pts**
4. Bonus : 0
5. Sous-total : **-33.5 pts**
6. Cap : **-33.5 pts**
7. Peak : ×1.00 = **-34 pts**

**Calcul Duo** :
- Somme : -32 + (-34) = **-66 pts**
- Risque : 0
- No Death : 0
- Sous-total : **-66 pts**
- Cap : **-66 pts**

**Score final : -66 pts** 💔

---

## 🎓 Philosophie du système

### Objectifs de la v3.0

1. **Équilibrage** : Corriger l'inflation de points
2. **Simplicité** : Supprimer rank change (trop complexe et inégal)
3. **Encouragement** : Système de streaks progressif plus gratifiant
4. **Transparence** : Affichage complet du détail de calcul
5. **Fun** : Alertes visuelles pour les moments épiques
6. **Anti-smurf** : Multiplicateur renforcé

### Principes clés

- **Noob encouragé** : Bonus KDA pour progresser
- **Carry responsable** : Malus deaths pour carry l'équipe
- **Streaks valorisés** : Récompenses progressives et ponctuelles
- **Prise de risque** : Bonus pour sortir de sa zone de confort
- **Perfection récompensée** : No death, pentakills, fast wins
- **Surrender pénalisé** : -30 pts pour décourager le forfait
- **Caps équilibrés** : Limites pour éviter les exploits

---

**Bon courage sur la Rift, et que le meilleur duo gagne ! 🏆**
