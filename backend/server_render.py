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
    # Startup: create indexes (do not crash the whole app if DB is temporarily unavailable)
    try:
        users_collection.create_index("email", unique=True)
        trades_collection.create_index("user_id")
        trades_collection.create_index("created_at")
        setups_collection.create_index("user_id")
        payment_transactions_collection.create_index("session_id")
        print("✅ Mongo indexes ensured")
    except Exception as e:
        print("⚠️ Mongo not ready at startup (indexes skipped):", repr(e))

    yield

    # Shutdown
    try:
        client.close()
        print("✅ Mongo client closed")
    except Exception as e:
        print("⚠️ Error closing Mongo client:", repr(e))


app = FastAPI(title="Trading AI Platform", lifespan=lifespan)
from fastapi.responses import RedirectResponse

@app.get("/")
def root():
    return RedirectResponse(url="/docs")

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

