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
- Log trades with screenshots and manual entries ✅ DONE
- Calendar view of trades (pending)
- Trade duration charts (pending)

### AI Features (GPT-5.2)
- Daily briefings ✅ DONE
- AI Coaching ✅ DONE
- Setup Analysis ✅ DONE
- AI-Assisted Backtesting ✅ DONE

### Payments
- Stripe integration ✅ DONE (3 plans: Free, Pro €29, Elite €79)

### Community
- Social feed for traders ✅ DONE
- Comments and likes ✅ DONE
- Trader profiles ✅ DONE

### Gamification
- Daily/weekly/monthly challenges ✅ DONE
- Leaderboard ✅ DONE
- Badges and achievements ✅ DONE
- Web Push Notifications (scaffolded, needs trigger logic)

### Data Export
- CSV/PDF export (pending)

### Admin
- Admin dashboard (pending)

### Education
- AI-powered educational system (pending)

---

## What's Been Implemented

### 2026-02-13 (Current Session)
- ✅ Fixed deployment blocker - `/api/health` endpoint verified
- ✅ Created payments router with Stripe integration
- ✅ Fixed next.config.js - dynamic backend URL
- ✅ Fixed .gitignore - allows .env files
- ✅ Optimized N+1 database queries (community, trades)
- ✅ Fixed API contract mismatch (payments checkout)
- ✅ Added FRONTEND_URL to backend/.env

### Previous Session
- ✅ JWT Authentication fixed and working
- ✅ TradingView interactive chart with symbol selector
- ✅ AI-Assisted Backtesting complete (GPT-5.2)
- ✅ Major backend refactoring (modular architecture)
- ✅ Web Push Notifications scaffolding

---

## Architecture

```
/app/
├── backend/
│   ├── server.py         # Main FastAPI app
│   ├── models.py         # Pydantic models
│   ├── routers/          # Modular API logic
│   │   ├── auth.py       # Authentication
│   │   ├── trades.py     # Trading journal
│   │   ├── ai.py         # AI features
│   │   ├── community.py  # Social features
│   │   ├── gamification.py # Challenges, badges
│   │   ├── backtest.py   # AI backtesting
│   │   ├── tickets.py    # Support system
│   │   ├── push.py       # Web push notifications
│   │   └── payments.py   # Stripe integration
│   └── utils/
│       ├── database.py
│       └── security.py
├── frontend/
│   ├── src/app/          # Next.js pages
│   ├── src/components/   # React components
│   ├── src/lib/api.js    # API client
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

### P0 (Critical) - COMPLETED
- ~~Deployment health check~~ ✅
- ~~Payments router~~ ✅
- ~~Database query optimization~~ ✅

### P1 (High Priority)
- Web Push Notifications - implement trigger logic
- CSV/PDF export

### P2 (Medium Priority)
- AI Educational System
- Admin Dashboard
- Performance heatmap

### P3 (Lower Priority)
- Trade calendar view
- Additional leaderboard optimizations

---

## API Endpoints Summary

| Module | Endpoints | Status |
|--------|-----------|--------|
| Health | `/api/health`, `/health` | ✅ |
| Auth | register, login, me, questionnaire | ✅ |
| Trades | CRUD, stats, heatmap, duration | ✅ |
| AI | analyze-setup, coaching, briefing, sentiment | ✅ |
| Backtest | create, list, trades, calculate | ✅ |
| Community | posts, likes, comments, profiles | ✅ |
| Gamification | challenges, leaderboard, achievements, rewards | ✅ |
| Tickets | CRUD, replies | ✅ |
| Push | subscribe, status, vapid-key | ✅ |
| Payments | plans, checkout, status, webhook, cancel | ✅ |

## Deployment Status
**✅ READY FOR DEPLOYMENT**

All critical blockers resolved. Application passes health checks.
