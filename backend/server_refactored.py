"""
Trading AI Platform - Backend API
FastAPI server with modular routers
"""
import os
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# Import routers
from routers import auth, trades, ai, community, gamification, backtest, tickets

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

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(trades.router)
app.include_router(ai.router)
app.include_router(community.router)
app.include_router(gamification.router)
app.include_router(backtest.router)
app.include_router(tickets.router)

# ============== HEALTH CHECK ==============

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# ============== MAIN ==============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
