# Trading AI Platform - PRD

## Problem Statement
Plateforme SaaS pour traders avec assistant IA, journal de trading, coaching personnalisé et système de communauté.

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

### Nouvelles Features ✅
- [x] Calendrier mensuel des trades
- [x] Graphique durée des trades (Recharts)
- [x] Journal économique avec analyse IA des événements
- [x] Système de tickets pour consultations experts
- [x] **Communauté** (posts, commentaires, likes, profils)

### Communauté Features ✅
- Posts avec 6 catégories (Setup, Win, Loss, Experience, Question, Education)
- Commentaires sur les posts
- Système de likes (posts et commentaires)
- Upload d'images dans les posts
- Filtrage par catégorie
- Profils utilisateurs publics

### Intégrations ✅
- GPT-5.2 (analyse setup, coaching, briefing, analyse économique)
- Stripe (checkout, webhooks, gestion abonnements)
- MongoDB (toutes collections)

## Prioritized Backlog

### P0 - Critical
- [ ] Notification push pour événements économiques
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

## Next Steps
1. Implémenter les notifications push
2. Créer le système éducatif avec modules progressifs
3. Ajouter le backtesting assisté
4. Dashboard admin pour les experts

## Technical Debt
- Optimiser les requêtes MongoDB avec indexes
- Ajouter cache Redis pour les stats fréquentes
- Tests unitaires et E2E complets
