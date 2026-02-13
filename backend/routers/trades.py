"""
Trades Router - Trading Journal CRUD operations
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends

from utils.database import trades_collection, users_collection
from utils.auth import get_current_user
from utils.models import TradeCreate, TradeUpdate

router = APIRouter(prefix="/api/trades", tags=["Trades"])

def calculate_pnl(entry_price: float, exit_price: float, direction: str, position_size: float) -> float:
    """Calculate P&L for a trade"""
    if direction.upper() == "LONG":
        return (exit_price - entry_price) * position_size
    else:
        return (entry_price - exit_price) * position_size

@router.post("")
async def create_trade(data: TradeCreate, user: dict = Depends(get_current_user)):
    """Create a new trade entry"""
    trade_id = str(uuid.uuid4())
    
    pnl = None
    pnl_percent = None
    status = "open"
    
    if data.exit_price is not None:
        pnl = calculate_pnl(data.entry_price, data.exit_price, data.direction, data.position_size)
        pnl_percent = ((data.exit_price - data.entry_price) / data.entry_price * 100) if data.direction.upper() == "LONG" else ((data.entry_price - data.exit_price) / data.entry_price * 100)
        status = "closed"
    
    trade = {
        "_id": trade_id,
        "user_id": user["id"],
        "symbol": data.symbol,
        "direction": data.direction.upper(),
        "entry_price": data.entry_price,
        "exit_price": data.exit_price,
        "stop_loss": data.stop_loss,
        "take_profit": data.take_profit,
        "position_size": data.position_size,
        "pnl": pnl,
        "pnl_percent": round(pnl_percent, 2) if pnl_percent else None,
        "status": status,
        "notes": data.notes,
        "screenshot_base64": data.screenshot_base64,
        "setup_type": data.setup_type,
        "emotions": data.emotions,
        "followed_plan": data.followed_plan,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    trades_collection.insert_one(trade)
    
    # Update user stats
    if status == "closed":
        _update_user_stats(user["id"])
    
    return {"id": trade_id, "message": "Trade créé avec succès"}

@router.get("")
async def get_trades(
    skip: int = 0,
    limit: int = 50,
    status: str = None,
    user: dict = Depends(get_current_user)
):
    """Get user's trades"""
    query = {"user_id": user["id"]}
    if status:
        query["status"] = status
    
    trades = list(trades_collection.find(
        query,
        {"screenshot_base64": 0}
    ).sort("created_at", -1).skip(skip).limit(limit))
    
    result = []
    for trade in trades:
        result.append({
            "id": str(trade["_id"]),
            "symbol": trade["symbol"],
            "direction": trade["direction"],
            "entry_price": trade["entry_price"],
            "exit_price": trade.get("exit_price"),
            "stop_loss": trade.get("stop_loss"),
            "take_profit": trade.get("take_profit"),
            "position_size": trade["position_size"],
            "pnl": trade.get("pnl"),
            "pnl_percent": trade.get("pnl_percent"),
            "status": trade["status"],
            "notes": trade.get("notes"),
            "setup_type": trade.get("setup_type"),
            "emotions": trade.get("emotions"),
            "followed_plan": trade.get("followed_plan"),
            "created_at": trade["created_at"].isoformat() if isinstance(trade["created_at"], datetime) else trade["created_at"]
        })
    
    return {"trades": result}

@router.get("/stats")
async def get_trade_stats(user: dict = Depends(get_current_user)):
    """Get trading statistics"""
    trades = list(trades_collection.find({"user_id": user["id"], "status": "closed"}))
    
    if not trades:
        return {
            "total_trades": 0,
            "winning_trades": 0,
            "losing_trades": 0,
            "winrate": 0,
            "total_pnl": 0,
            "avg_win": 0,
            "avg_loss": 0,
            "best_trade": 0,
            "worst_trade": 0,
            "profit_factor": 0
        }
    
    total = len(trades)
    winners = [t for t in trades if (t.get("pnl") or 0) > 0]
    losers = [t for t in trades if (t.get("pnl") or 0) < 0]
    
    total_pnl = sum(t.get("pnl") or 0 for t in trades)
    total_wins = sum(t.get("pnl") or 0 for t in winners)
    total_losses = abs(sum(t.get("pnl") or 0 for t in losers))
    
    return {
        "total_trades": total,
        "winning_trades": len(winners),
        "losing_trades": len(losers),
        "winrate": round(len(winners) / total * 100, 2) if total > 0 else 0,
        "total_pnl": round(total_pnl, 2),
        "avg_win": round(total_wins / len(winners), 2) if winners else 0,
        "avg_loss": round(total_losses / len(losers), 2) if losers else 0,
        "best_trade": max((t.get("pnl") or 0) for t in trades) if trades else 0,
        "worst_trade": min((t.get("pnl") or 0) for t in trades) if trades else 0,
        "profit_factor": round(total_wins / total_losses, 2) if total_losses > 0 else 0
    }

@router.get("/heatmap")
async def get_heatmap_data(user: dict = Depends(get_current_user)):
    """Get heatmap data for the last 365 days"""
    from datetime import timedelta
    
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=365)
    
    trades = list(trades_collection.find({
        "user_id": user["id"],
        "status": "closed",
        "created_at": {"$gte": start_date, "$lte": end_date}
    }))
    
    # Group by date
    daily_pnl = {}
    for trade in trades:
        date_str = trade["created_at"].strftime("%Y-%m-%d") if isinstance(trade["created_at"], datetime) else trade["created_at"][:10]
        if date_str not in daily_pnl:
            daily_pnl[date_str] = 0
        daily_pnl[date_str] += trade.get("pnl") or 0
    
    result = [{"date": date, "pnl": round(pnl, 2)} for date, pnl in sorted(daily_pnl.items())]
    return {"heatmap": result}

@router.get("/duration-stats")
async def get_duration_stats(user: dict = Depends(get_current_user)):
    """Get trade duration statistics"""
    trades = list(trades_collection.find({"user_id": user["id"], "status": "closed"}))
    
    # Placeholder - would need entry/exit timestamps for real duration
    return {
        "avg_duration_minutes": 45,
        "shortest_minutes": 5,
        "longest_minutes": 240,
        "by_duration": {
            "scalping": len([t for t in trades if t.get("setup_type") == "scalping"]),
            "day_trading": len([t for t in trades if t.get("setup_type") == "day_trading"]),
            "swing": len([t for t in trades if t.get("setup_type") == "swing"])
        }
    }

@router.get("/{trade_id}")
async def get_trade(trade_id: str, user: dict = Depends(get_current_user)):
    """Get a specific trade"""
    trade = trades_collection.find_one({"_id": trade_id, "user_id": user["id"]})
    if not trade:
        raise HTTPException(404, "Trade non trouvé")
    
    return {
        "id": str(trade["_id"]),
        "symbol": trade["symbol"],
        "direction": trade["direction"],
        "entry_price": trade["entry_price"],
        "exit_price": trade.get("exit_price"),
        "stop_loss": trade.get("stop_loss"),
        "take_profit": trade.get("take_profit"),
        "position_size": trade["position_size"],
        "pnl": trade.get("pnl"),
        "pnl_percent": trade.get("pnl_percent"),
        "status": trade["status"],
        "notes": trade.get("notes"),
        "screenshot_base64": trade.get("screenshot_base64"),
        "setup_type": trade.get("setup_type"),
        "emotions": trade.get("emotions"),
        "followed_plan": trade.get("followed_plan"),
        "created_at": trade["created_at"].isoformat() if isinstance(trade["created_at"], datetime) else trade["created_at"]
    }

@router.put("/{trade_id}")
async def update_trade(trade_id: str, data: TradeUpdate, user: dict = Depends(get_current_user)):
    """Update a trade"""
    trade = trades_collection.find_one({"_id": trade_id, "user_id": user["id"]})
    if not trade:
        raise HTTPException(404, "Trade non trouvé")
    
    update_data = {"updated_at": datetime.now(timezone.utc)}
    
    if data.exit_price is not None:
        update_data["exit_price"] = data.exit_price
        update_data["pnl"] = calculate_pnl(trade["entry_price"], data.exit_price, trade["direction"], trade["position_size"])
        update_data["pnl_percent"] = round(((data.exit_price - trade["entry_price"]) / trade["entry_price"] * 100) if trade["direction"] == "LONG" else ((trade["entry_price"] - data.exit_price) / trade["entry_price"] * 100), 2)
        update_data["status"] = "closed"
    
    if data.notes is not None:
        update_data["notes"] = data.notes
    if data.emotions is not None:
        update_data["emotions"] = data.emotions
    if data.followed_plan is not None:
        update_data["followed_plan"] = data.followed_plan
    
    trades_collection.update_one({"_id": trade_id}, {"$set": update_data})
    
    if "status" in update_data and update_data["status"] == "closed":
        _update_user_stats(user["id"])
    
    return {"message": "Trade mis à jour"}

@router.delete("/{trade_id}")
async def delete_trade(trade_id: str, user: dict = Depends(get_current_user)):
    """Delete a trade"""
    result = trades_collection.delete_one({"_id": trade_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(404, "Trade non trouvé")
    
    _update_user_stats(user["id"])
    return {"message": "Trade supprimé"}

def _update_user_stats(user_id: str):
    """Update user statistics after trade changes"""
    trades = list(trades_collection.find({"user_id": user_id, "status": "closed"}))
    total = len(trades)
    winners = len([t for t in trades if (t.get("pnl") or 0) > 0])
    winrate = round(winners / total * 100, 2) if total > 0 else 0
    
    users_collection.update_one(
        {"_id": user_id},
        {"$set": {
            "total_trades": total,
            "winrate": winrate,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
