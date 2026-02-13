# Trading AI Platform - Product Requirements Document

## Original Problem Statement
Build a SaaS platform for traders, migrated from Supabase/Netlify. Full-stack application with AI assistance for trading analysis, journaling, and community features.

## User Personas
- **Traders**: Primary users who log trades, analyze performance, receive AI coaching
- **Administrators**: Manage users and support tickets

## Core Requirements

### Authentication
- JWT-based email/password authentication ✅ DONE

### Dashboard
- Interactive TradingView chart with symbol selector ✅ DONE
- Performance heatmap (pending)

### Trading Journal
- Log trades with screenshots and manual entries (scaffolded)
- Calendar view of trades (pending)
- Trade duration charts (pending)

### AI Features
- Daily briefings (scaffolded)
- AI Coaching (scaffolded)
- Setup Analysis (scaffolded)
- AI-Assisted Backtesting ✅ DONE

### Payments
- Stripe integration (scaffolded, needs completion)

### Community
- Social feed for traders (scaffolded)
- Comments and likes (scaffolded)
- Trader profiles (scaffolded)

### Gamification
- Daily/weekly/monthly challenges (scaffolded)
- Leaderboard (scaffolded)
- Badges and achievements (scaffolded)
- Web Push Notifications (scaffolded, needs trigger logic)

### Data Export
- CSV/PDF export (pending)

### Admin
- Admin dashboard (pending)

### Education
- AI-powered educational system (pending)

---

## What's Been Implemented

### 2026-02-13
- ✅ Fixed deployment blocker - `/api/health` endpoint verified working
- ✅ Added `/health` endpoint for additional compatibility

### Previous Session
- ✅ JWT Authentication fixed and working
- ✅ TradingView interactive chart with symbol selector
- ✅ AI-Assisted Backtesting complete (GPT-5.2)
- ✅ Major backend refactoring (modular architecture with routers)
- ✅ Web Push Notifications scaffolding

---

## Architecture

```
/app/
├── backend/
│   ├── server.py         # Main FastAPI app
│   ├── models.py         # Pydantic models
│   ├── routers/          # Modular API logic
│   │   ├── auth.py, trades.py, ai.py
│   │   ├── community.py, gamification.py
│   │   ├── backtest.py, tickets.py, push.py
│   └── utils/
│       ├── database.py, security.py
├── frontend/
│   ├── src/app/          # Next.js pages
│   ├── src/components/   # React components
│   └── public/worker.js  # Service worker
```

## Tech Stack
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: FastAPI, Pydantic
- **Database**: MongoDB
- **Auth**: JWT
- **Integrations**: Stripe, OpenAI GPT-5.2, TradingView, Web Push

---

## Prioritized Backlog

### P0 (Critical)
- ~~Deployment health check~~ ✅ DONE

### P1 (High Priority)
- Web Push Notifications - implement trigger logic
- Stripe payment flow completion

### P2 (Medium Priority)
- CSV/PDF export
- AI Educational System
- Integrate AI modules in frontend UI

### P3 (Lower Priority)
- Admin Dashboard
- Performance heatmap
- Trade calendar view

---

## API Endpoints
- `/api/health` - Health check ✅
- `/api/auth/*` - Authentication
- `/api/trades/*` - Trade management
- `/api/ai/*` - AI features
- `/api/backtest/*` - Backtesting
- `/api/push/*` - Push notifications
- `/api/community/*` - Social features
- `/api/gamification/*` - Badges, challenges

## Third-Party Integrations
- **OpenAI GPT-5.2**: Uses Emergent LLM Key
- **Stripe**: Requires user API key
- **TradingView**: Widget integrated
- **Web Push**: pywebpush library
