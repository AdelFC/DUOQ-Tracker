# DuoQ Challenge - Spécifications Complètes v2.1

**Dates** : 1er au 30 novembre 2025
**Participants** : 3 à 10 duos fixes
**Queue** : Solo/Duo Ranked uniquement
**Classement** : Par duo (somme des points)

---

## 0️⃣ Principes Fondamentaux

### Rôles
- **Noob** : Joueur avec le plus bas MMR/rank initial dans le duo
- **Carry** : Joueur avec le plus haut MMR/rank initial dans le duo
- **Fixes** : Les rôles ne changent pas pendant le challenge

### Objectifs du système
- ✅ Récompenser la performance individuelle
- ✅ Encourager la prise de risque (hors main role/champion)
- ✅ Valoriser la progression (montée de rank)
- ❌ Punir le feed du Carry
- ❌ Punir les downranks (double malus)

### Règles générales
- **Toutes les parties Solo/Duo Ranked comptent** (y compris les placements)
- **Calculs en décimal**, arrondi final à l'entier après application des plafonds
- **Règle d'arrondi** : au plus proche (0.5 → arrondi supérieur)

---

## 1️⃣ Score KDA (pour les deux joueurs)

### Formule de base
```
P_base = 1.0 × K + 0.5 × A - 1.0 × D
```

### Biais de rôle

**Noob** (récompense la bonne performance) :
```
P_KDA_noob = P_base + 0.5 × K + 0.25 × A
```

**Carry** (punit davantage les deaths) :
```
P_KDA_carry = P_base - 0.5 × D
```

### Effet attendu
- Un **Noob performant** marque beaucoup de points
- Un **Carry qui int** prend très cher

### Exemples

**Exemple 1 - Noob performant**
- Stats : 8K / 2D / 12A
- P_base = 8 + 6 - 2 = 12
- Bonus Noob = 0.5 × 8 + 0.25 × 12 = 4 + 3 = 7
- **P_KDA = 12 + 7 = 19 points**

**Exemple 2 - Carry qui feed**
- Stats : 5K / 10D / 8A
- P_base = 5 + 4 - 10 = -1
- Malus Carry = -0.5 × 10 = -5
- **P_KDA = -1 - 5 = -6 points**

**Exemple 3 - Carry propre**
- Stats : 12K / 2D / 15A
- P_base = 12 + 7.5 - 2 = 17.5
- Malus Carry = -0.5 × 2 = -1
- **P_KDA = 17.5 - 1 = 16.5 points**

---

## 2️⃣ Résultat de la partie

### Points par résultat
- **Victoire standard** : +5 points
- **Victoire rapide** (< 25:00) : +8 points
- **Défaite** : -5 points
- **FF/Surrender** : -10 points
- **AFK/Leave** : 0 points (la perte d'LP suffit)
- **Remake** (Riot) : 0 points (aucun point, aucune progression)

### Priorité d'application
```
Remake > FF > Win <25min > Win > Loss
```

Une seule des lignes ci-dessus est appliquée par partie.

---

## 3️⃣ Progression de rank

### Bonus/Malus par changement de rank

**Montée** :
- **+1 division** (ex: Gold IV → Gold III) : **+50 points**
- **+1 tier** (ex: Gold → Platine) : **+100 points**

**Descente** (fun sadique - double malus) :
- **-1 division** : **-100 points**
- **-1 tier** : **-200 points**

### Règles spécifiques
- Appliqué **uniquement sur la game du changement**
- **Placements** : Les bonus/malus se déclenchent uniquement quand Riot confirme une division/tier visible (fin de provisoires ou changement effectif)

### Exemples
- Gold II → Gold I (win) : +50 points de progression + points de game
- Platine IV → Gold I (loss) : -100 points de descente + points négatifs de game
- Gold I → Platine IV (win) : +100 points (tier) + points de game

---

## 4️⃣ Streaks

### Win Streaks (bonus)
- **3 wins consécutives** : +10 points
- **5 wins consécutives** : +25 points
- **7 wins consécutives** : +50 points

### Lose Streaks (malus)
- **3 losses consécutives** : -10 points
- **5 losses consécutives** : -25 points

### Règles
- Le bonus/malus s'applique **sur la game qui atteint le seuil**
- Calculé **à la fin de la game**
- Les streaks sont **individuelles** par joueur

### Exemples
- Joueur avec 2 wins, puis win : +10 points de streak sur cette 3ème game
- Joueur avec 4 wins, puis win : +25 points de streak sur cette 5ème game (pas +10, juste +25)
- Joueur avec 4 losses, puis loss : -25 points de streak

---

## 5️⃣ Prise de risque (anti-confort) - Bonus DUO

### Concept
Récompenser les duos qui sortent de leur zone de confort en jouant hors main role/champion.

### Évaluation (4 conditions)
1. Noob hors **rôle principal** déclaré ?
2. Noob hors **pick principal** déclaré ?
3. Carry hors **rôle principal** déclaré ?
4. Carry hors **pick principal** déclaré ?

**H** = nombre de conditions vraies (0 à 4)

### Bonus selon H
- **H = 4** : +25 points (duo)
- **H = 3** : +15 points (duo)
- **H = 2** : +5 points (duo)
- **H ≤ 1** : 0 points

### Définitions
- **Hors rôle** : Lane jouée ≠ rôle principal déclaré à l'auth
- **Hors pick** : Champion joué ≠ champion principal déclaré à l'auth

### Exemples
- Noob main MID/Ahri joue TOP/Darius : 2 conditions (hors rôle + hors pick)
- Carry main ADC/Jinx joue ADC/Caitlyn : 1 condition (hors pick)
- Total H = 3 → **+15 points au duo**

---

## 6️⃣ Bonus spéciaux (optionnels)

### MVP Global
- **Condition** : Meilleur KDA ratio classique parmi les 10 joueurs de la game
- **Formule** : `KDA_ratio = (K + A) / max(1, D)`
- **Bonus** : **+10 points** au joueur

### Duo "No Death"
- **Condition** : Les 2 joueurs du duo ont **0 death**
- **Bonus** : **+30 points** au duo

### Pentakill
- **Condition** : Un joueur réalise un pentakill
- **Bonus** : **+25 points** au joueur

---

## 7️⃣ Plafonds (anti-exploit)

### Par joueur / game
- **Minimum** : -25 points
- **Maximum** : +70 points

### Par duo / game
- **Minimum** : -50 points
- **Maximum** : +120 points

### Application 

(Ne s'applique pas aux passages de divisions)

1. Plafonds individuels appliqués **après calcul individuel complet**
2. Arrondi à l'entier par joueur
3. Somme des 2 joueurs + bonus duo (risque, No-Death)
4. Plafond duo appliqué
5. Arrondi final

---

## 8️⃣ Ordre de calcul (STRICT)

### Étape par étape

```
┌─────────────────────────────────────────────────────────┐
│ CALCUL INDIVIDUEL (pour chaque joueur)                  │
└─────────────────────────────────────────────────────────┘

1. P_KDA individuel (avec biais de rôle)
   → Noob: P_base + 0.5*K + 0.25*A
   → Carry: P_base - 0.5*D

2. Résultat de game
   → Win: +5 | Win<25: +8 | Loss: -5 | FF: -10 | Remake: 0

3. Streak (si seuil atteint)
   → Win streak: 3→+10, 5→+25, 7→+50
   → Lose streak: 3→-10, 5→-25

4. Rank up/down (si déclenché)
   → +1 div: +50 | +1 tier: +100
   → -1 div: -100 | -1 tier: -200

5. Bonus spéciaux individuels
   → MVP: +10 | Pentakill: +15

6. Plafonds individuels
   → min: -25 | max: +70

7. Arrondi à l'entier par joueur

┌─────────────────────────────────────────────────────────┐
│ CALCUL DUO                                              │
└─────────────────────────────────────────────────────────┘

8. Somme duo = Points_Noob + Points_Carry

9. Prise de risque (H)
   → H=4: +25 | H=3: +15 | H=2: +5 | H≤1: 0

10. Bonus spéciaux de duo
    → No-Death: +20

11. Plafond duo
    → min: -50 | max: +120

12. Arrondi final
```

---

## 📊 Exemple de calcul complet

### Setup
**Duo** : Noob (Bronze I) + Carry (Gold III)
**Game** : Victoire en 22 minutes (win rapide)

**Noob** :
- Stats : 10K / 3D / 15A
- Hors rôle (MID au lieu de TOP) + Hors pick (Yasuo au lieu de Garen)
- Win streak : 3ème victoire consécutive
- Rank : Bronze I → Silver IV (+1 tier)

**Carry** :
- Stats : 8K / 5D / 20A
- Main rôle (ADC) + Main pick (Jinx)
- Pas de streak
- Rank : Gold III stable

### Calcul Noob

1. **P_KDA** :
   - P_base = 10 + 7.5 - 3 = 14.5
   - Bonus = 0.5×10 + 0.25×15 = 5 + 3.75 = 8.75
   - **P_KDA = 14.5 + 8.75 = 23.25**

2. **Résultat** : Win <25min → **+8**

3. **Streak** : 3 wins → **+10**

4. **Rank** : +1 tier → **+100**

5. **MVP** : KDA = (10+15)/3 = 8.33 (meilleur de la game) → **+10**

6. **Sous-total** : 23.25 + 8 + 10 + 100 + 10 = **151.25**

7. **Plafond individuel** : max +70 → **70 points**

8. **Arrondi** : **70 points**

### Calcul Carry

1. **P_KDA** :
   - P_base = 8 + 10 - 5 = 13
   - Malus = -0.5×5 = -2.5
   - **P_KDA = 13 - 2.5 = 10.5**

2. **Résultat** : Win <25min → **+8**

3. **Streak** : Aucun → **0**

4. **Rank** : Stable → **0**

5. **MVP** : KDA = (8+20)/5 = 5.6 (pas le meilleur) → **0**

6. **Sous-total** : 10.5 + 8 = **18.5**

7. **Plafond individuel** : OK → **18.5**

8. **Arrondi** : **19 points** (0.5 → sup)

### Calcul Duo

8. **Somme** : 70 + 19 = **89 points**

9. **Prise de risque** :
   - Noob hors rôle : ✅
   - Noob hors pick : ✅
   - Carry main rôle : ❌
   - Carry main pick : ❌
   - **H = 2** → **+5 points**

10. **No-Death** : Non (3 deaths + 5 deaths) → **0**

11. **Total** : 89 + 5 = **94 points**

12. **Plafond duo** : max +120, OK → **94 points**

13. **Arrondi final** : **94 points pour le duo**

---

## 🎮 Features du Bot

### Authentification
- `/duoq register [riot_name] [riot_tag] [role] [main_role] [main_champion]`
  - Ex: `/duoq register Faker KR1 noob MID Ahri`
- `/duoq link [@partner]` - Créer le duo avec son partenaire
- `/duoq unregister` - Se désinscrire

### Tracking & Notifications
- **Polling** : Toutes les 10 secondes
- **Notification** après chaque game :
  - Récap détaillé par joueur (KDA, résultat, streak, rank change, bonus)
  - Points gagnés individuellement
  - Points totaux du duo
  - Breakdown complet du calcul

### Ladder
- **Affichage automatique** : Toutes les 12h
- `/duoq ladder` - Consulter le classement à tout moment
- Format : Rang, Duo, Points totaux, Trend (↑↓)

### Historique & Stats
- `/duoq stats [@duo]` - Stats détaillées d'un duo
- `/duoq history [@duo]` - Historique des games
- `/duoq compare [@duo1] [@duo2]` - Comparer 2 duos

### Modération
- `/duoq admin add-points [@duo] [points] [reason]` - Ajouter des points (events)
- `/duoq admin remove-points [@duo] [points] [reason]` - Retirer des points
- **3 modérateurs** désignés avec permissions spéciales

---

## 🗂️ Base de données

### Table `duos`
- `duo_id` (PK)
- `noob_discord_id`
- `carry_discord_id`
- `total_points`
- `games_played`
- `created_at`

### Table `players`
- `discord_id` (PK)
- `riot_puuid`
- `riot_name`
- `riot_tag`
- `role` (noob/carry)
- `main_role` (TOP/JGL/MID/ADC/SUP)
- `main_champion`
- `current_rank`
- `reference_rank`
- `win_streak`
- `loss_streak`

### Table `games`
- `game_id` (PK)
- `duo_id` (FK)
- `riot_match_id`
- `played_at`
- `noob_points`
- `carry_points`
- `duo_points`
- `breakdown` (JSON)

### Table `point_adjustments`
- `adjustment_id` (PK)
- `duo_id` (FK)
- `moderator_id`
- `points_delta`
- `reason`
- `created_at`

---

## 📝 Notes d'implémentation

### Priorités
1. ✅ Système d'auth (duo, rôles, mains)
2. ✅ Tracking automatique (polling 10s)
3. ✅ Calcul de points (ordre strict)
4. ✅ Notifications Discord (breakdown détaillé)
5. ✅ Ladder automatique (12h)
6. ✅ Commandes modération

### Points d'attention
- **Riot API** : Rate limiting (100 req/2min)
- **Calculs décimaux** : Utiliser `Number` avec précision, arrondir à la fin
- **Détection hors-main** : Comparer `position` ET `champion_id` avec déclarations
- **Streaks** : Tracker individuellement par joueur, pas par duo
- **Plafonds** : Appliquer APRÈS tous les calculs, mais AVANT arrondi

---

## 🚀 Roadmap

### Phase 1 - MVP (1 semaine)
- [ ] Structure projet (TypeScript, Discord.js, SQLite)
- [ ] Auth system (register, link duo)
- [ ] Riot API client (réutiliser V2)
- [ ] Game tracker (réutiliser V2)
- [ ] Calcul de points (formules complètes)
- [ ] Notifications basiques

### Phase 2 - Features (1 semaine)
- [ ] Ladder automatique (cron 12h)
- [ ] Commandes stats/history
- [ ] Breakdown détaillé des points
- [ ] Système de modération
- [ ] Détection hors-main (role + champion)

### Phase 3 - Polish (avant le 1er nov)
- [ ] Tests complets
- [ ] Logs & monitoring
- [ ] Documentation
- [ ] Déploiement

---

**Date de création** : 30 octobre 2025
**Version** : 2.1
**Auteur** : AdelFC
