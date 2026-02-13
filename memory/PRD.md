# Trading AI Platform - Product Requirements Document

## Original Problem Statement
Build a SaaS platform for traders with AI-powered analysis, journaling, gamification, and community features.

## Tech Stack
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: FastAPI, Pydantic
- **Database**: MongoDB
- **Auth**: JWT
- **AI**: OpenAI GPT-4o (via standard SDK for external deployment)
- **Payments**: Stripe

---

## What's Been Implemented

### 2026-02-13 (Current Session)
- ✅ Fixed deployment health check
- ✅ Created payments router with Stripe
- ✅ Optimized N+1 database queries
- ✅ Created seed script for gamification data (11 challenges, 21 badges, 16 rewards)
- ✅ Added `/api/gamification/profile` endpoint
- ✅ Added `/api/notifications` router
- ✅ **RENDER DEPLOYMENT PREPARATION:**
  - Created `server_render.py` (OpenAI standard SDK)
  - Created `requirements.render.txt` (lightweight deps)
  - Created `ai_openai.py` and `backtest_openai.py` routers
  - Created `render.yaml` blueprint
  - Created `DEPLOY_RENDER.md` documentation

### Previous Sessions
- ✅ JWT Authentication
- ✅ TradingView interactive chart with symbol selector
- ✅ AI-Assisted Backtesting (GPT-5.2/GPT-4o)
- ✅ Modular backend architecture
- ✅ Web Push Notifications scaffolding

---

## Deployment Options

### Option 1: Emergent (Current)
- Preview: https://trader-ai-hub.preview.emergentagent.com
- Production: https://trader-ai-hub.emergent.host
- Cost: ~50 credits/month

### Option 2: Render (External)
- Use files: `server_render.py`, `requirements.render.txt`
- Cost: ~$14-20/month (Starter plan x2 + MongoDB Atlas free)
- See: `/app/DEPLOY_RENDER.md`

---

## Files for Render Deployment

```
/app/
├── backend/
│   ├── server_render.py         # Entry point for Render
│   ├── requirements.render.txt  # Lightweight dependencies
│   ├── routers/
│   │   ├── ai_openai.py         # OpenAI SDK version
│   │   ├── backtest_openai.py   # OpenAI SDK version
│   │   └── ...
│   └── scripts/
│       └── seed_gamification.py # Initialize challenges/badges/rewards
├── frontend/
│   └── ...
├── render.yaml                  # Render Blueprint
└── DEPLOY_RENDER.md             # Deployment guide
```

---

## Environment Variables for Render

### Backend
```
MONGO_URL=mongodb+srv://...
DB_NAME=trading_ai_platform
JWT_SECRET=<secure-random-string>
OPENAI_API_KEY=sk-proj-...
STRIPE_API_KEY=sk_test_...
FRONTEND_URL=https://your-frontend.onrender.com
```

### Frontend
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

---

## Prioritized Backlog

### P0 (Completed)
- ~~Deployment health check~~ ✅
- ~~Gamification seed data~~ ✅
- ~~Render preparation~~ ✅

### P1 (High Priority)
- Complete Web Push trigger logic
- CSV/PDF export

### P2 (Medium)
- AI Educational System
- Admin Dashboard

### P3 (Lower)
- Trade calendar view
- Performance heatmap
