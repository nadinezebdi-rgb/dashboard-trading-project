"""
Trading AI Platform - Backend Server for Render Deployment
Uses standard OpenAI SDK instead of emergentintegrations
"""
import os
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# Import routers (using OpenAI versions for AI features)
from routers import auth, trades, community, gamification, tickets, push, payments, notifications
from routers.ai_openai import router as ai_router
from routers.backtest_openai import router as backtest_router

# Import database for startup tasks
from utils.database import (
    client, users_collection, trades_collection, 
    setups_collection, payment_transactions_collection
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create indexes
    users_collection.create_index("email", unique=True)
    trades_collection.create_index("user_id")
    trades_collection.create_index("created_at")
    setups_collection.create_index("user_id")
    payment_transactions_collection.create_index("session_id")
    yield
    # Shutdown
    client.close()

app = FastAPI(title="Trading AI Platform", lifespan=lifespan)

# CORS - Allow frontend origin
FRONTEND_URL = os.environ.get("FRONTEND_URL", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL] if FRONTEND_URL != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(trades.router)
app.include_router(ai_router)  # OpenAI version
app.include_router(community.router)
app.include_router(gamification.router)
app.include_router(backtest_router)  # OpenAI version
app.include_router(tickets.router)
app.include_router(push.router)
app.include_router(payments.router)
app.include_router(notifications.router)

# ============== HEALTH CHECK ==============

@app.get("/health")
async def health_check_root():
    """Health check endpoint for Render"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint with /api prefix"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# ============== MAIN ==============

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
