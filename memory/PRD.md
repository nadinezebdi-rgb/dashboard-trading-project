# Trading AI Platform - PRD

## Problem Statement
Plateforme SaaS pour traders avec assistant IA, journal de trading, coaching personnalisé, communauté et système de gamification complet avec récompenses.

## User Personas
1. **Trader Débutant** - Cherche à apprendre et éviter les erreurs communes
2. **Trader Intermédiaire** - Veut analyser ses trades et améliorer sa rentabilité
3. **Trader Avancé** - Recherche des outils IA pour optimiser ses stratégies

## Core Requirements
- Assistant IA basé sur GPT-5.2
- Journal de trading avec screenshots
- Dashboard intelligent avec statistiques
- Coaching personnalisé quotidien
- Mode sombre/clair
- Interface en français
- Système de gamification complet pour fidélisation

## Architecture
- **Frontend**: Next.js 14 + React 18 + Tailwind CSS + Recharts
- **Backend**: FastAPI (Python) + MongoDB
- **IA**: GPT-5.2 via Emergent LLM Key
- **Paiements**: Stripe (Starter/Pro/Elite)
- **Auth**: JWT

## What's Been Implemented (Feb 2026)

### Core Features ✅
- [x] Landing page avec design percutant
- [x] Mode Sombre/Clair avec toggle
- [x] Authentification JWT (register/login)
- [x] Onboarding questionnaire multi-étapes
- [x] Dashboard avec stats et heatmap PnL 365 jours
- [x] Journal de trading (entrée manuelle + screenshots)
- [x] Analyse de setup IA avec vision GPT-5.2

### Analytiques ✅
- [x] Calendrier mensuel des trades
- [x] Graphique durée des trades (Recharts)
- [x] Journal économique avec analyse IA des événements

### Engagement & Fidélisation ✅
- [x] Système de tickets pour consultations experts
- [x] **Communauté** (posts, commentaires, likes, profils)
- [x] **Challenges** (quotidiens, hebdomadaires, mensuels)
- [x] **Leaderboard** (classements par période + saison)
- [x] **Hall of Fame** (Top Niveaux, PnL, Winrate)
- [x] **Badges/Achievements** (18 badges débloquables)
- [x] **Système XP/Niveaux** (10 niveaux avec progression)
- [x] **Streaks** (jours de connexion consécutifs)
- [x] **Check-in quotidien** avec bonus XP

### Système de Récompenses ✅ (NOUVEAU)
- [x] **Notifications** (niveau, badges, saison)
- [x] **10 Thèmes** débloquables par niveau (Classique, Bronze, Argent, Or, Platine, Diamant, Néon, Feu, Glace, Champion)
- [x] **Perks par niveau** (support prioritaire, accès webinaires, réductions mentoring)
- [x] **Système de Saisons** (mensuel avec reset leaderboard)
- [x] **Récompenses Top Performers**:
  - Top 1: Mois gratuit, webinaire exclusif, mentoring 1-on-1, badge Champion, -50% abo
  - Top 2: Webinaire, -50% mentoring, badge Argent, -30% abo
  - Top 3: Webinaire, -30% mentoring, badge Bronze, -20% abo
  - Top 10: Webinaire exclusif, -10% mentoring, -10% abo

### Intégrations ✅
- GPT-5.2 (analyse setup, coaching, briefing, analyse économique)
- Stripe (checkout, webhooks, gestion abonnements)
- MongoDB (toutes collections)

## Prioritized Backlog

### P0 - Critical
- [ ] Notification push navigateur (Web Push)
- [ ] Export des données de trading (CSV/PDF)

### P1 - Important
- [ ] Système éducatif IA complet (modules d'apprentissage)
- [ ] Backtesting assisté par IA
- [ ] Dashboard admin pour gestion des tickets

### P2 - Nice to Have
- [ ] Intégration API courtiers (Binance, MT4)
- [ ] Alertes de trading personnalisées
- [ ] Mode social trading (copie de trades)
- [ ] Application mobile (React Native)

## Technical Details

### Gamification System
- **Levels**: 1-10+ avec XP: 0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 20000
- **Challenges**: 8 actifs (2 daily, 3 weekly, 3 monthly)
- **Achievements**: 18 badges débloquables
- **Themes**: 10 thèmes avec couleurs personnalisées
- **Seasons**: Mensuelles avec récompenses automatiques

### Level Titles
1. Novice → 2. Apprenti → 3. Trader → 4. Trader Confirmé → 5. Expert
6. Expert Senior → 7. Maître → 8. Grand Maître → 9. Légende → 10. Élite

## Next Steps
1. Implémenter Web Push notifications
2. Créer le système éducatif avec modules progressifs
3. Ajouter le backtesting assisté
4. Dashboard admin pour les experts

## Technical Debt
- Optimiser les requêtes MongoDB avec indexes
- Ajouter cache Redis pour les stats fréquentes
- Tests unitaires et E2E complets
