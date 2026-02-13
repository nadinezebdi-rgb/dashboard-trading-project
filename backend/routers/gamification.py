"""
Gamification Router - Challenges, Leaderboard, Achievements, Rewards, Seasons
"""
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends

from utils.database import (
    users_collection, trades_collection,
    challenges_collection, user_challenges_collection,
    achievements_collection, user_achievements_collection,
    streaks_collection, notifications_collection,
    seasons_collection, rewards_collection, user_rewards_collection
)
from utils.auth import get_current_user
from utils.models import ChallengeJoin

router = APIRouter(prefix="/api/gamification", tags=["Gamification"])

# ============== CHALLENGES ==============

@router.get("/challenges")
async def get_challenges(user: dict = Depends(get_current_user)):
    """Get available challenges"""
    challenges = list(challenges_collection.find({"active": True}))
    
    result = []
    for ch in challenges:
        user_challenge = user_challenges_collection.find_one({
            "user_id": user["id"],
            "challenge_id": ch["_id"]
        })
        
        result.append({
            "id": str(ch["_id"]),
            "title": ch["title"],
            "description": ch["description"],
            "type": ch["type"],
            "target": ch["target"],
            "xp_reward": ch["xp_reward"],
            "duration_days": ch.get("duration_days", 7),
            "difficulty": ch.get("difficulty", "medium"),
            "joined": user_challenge is not None,
            "progress": user_challenge.get("progress", 0) if user_challenge else 0,
            "completed": user_challenge.get("completed", False) if user_challenge else False
        })
    
    return {"challenges": result}

@router.post("/challenges/join")
async def join_challenge(data: ChallengeJoin, user: dict = Depends(get_current_user)):
    """Join a challenge"""
    challenge = challenges_collection.find_one({"_id": data.challenge_id})
    if not challenge:
        raise HTTPException(404, "Challenge non trouvé")
    
    existing = user_challenges_collection.find_one({
        "user_id": user["id"],
        "challenge_id": data.challenge_id
    })
    if existing:
        raise HTTPException(400, "Déjà inscrit à ce challenge")
    
    user_challenges_collection.insert_one({
        "_id": str(uuid.uuid4()),
        "user_id": user["id"],
        "challenge_id": data.challenge_id,
        "progress": 0,
        "completed": False,
        "joined_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Inscrit au challenge avec succès"}

# ============== LEADERBOARD ==============

@router.get("/leaderboard")
async def get_leaderboard(period: str = "weekly"):
    """Get leaderboard"""
    # Calculate date range
    now = datetime.now(timezone.utc)
    if period == "daily":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "weekly":
        start_date = now - timedelta(days=now.weekday())
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "monthly":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:  # all-time
        start_date = datetime(2020, 1, 1, tzinfo=timezone.utc)
    
    # Aggregate user performance
    pipeline = [
        {"$match": {"status": "closed", "created_at": {"$gte": start_date}}},
        {"$group": {
            "_id": "$user_id",
            "total_pnl": {"$sum": {"$ifNull": ["$pnl", 0]}},
            "trades_count": {"$sum": 1},
            "wins": {"$sum": {"$cond": [{"$gt": [{"$ifNull": ["$pnl", 0]}, 0]}, 1, 0]}}
        }},
        {"$sort": {"total_pnl": -1}},
        {"$limit": 50}
    ]
    
    results = list(trades_collection.aggregate(pipeline))
    
    leaderboard = []
    for i, entry in enumerate(results):
        user = users_collection.find_one({"_id": entry["_id"]})
        if user:
            winrate = round(entry["wins"] / entry["trades_count"] * 100, 1) if entry["trades_count"] > 0 else 0
            leaderboard.append({
                "rank": i + 1,
                "user_id": entry["_id"],
                "name": user.get("name", "Anonyme"),
                "level": user.get("level", 1),
                "total_pnl": round(entry["total_pnl"], 2),
                "trades_count": entry["trades_count"],
                "winrate": winrate
            })
    
    return {"leaderboard": leaderboard, "period": period}

# ============== ACHIEVEMENTS ==============

@router.get("/achievements")
async def get_achievements(user: dict = Depends(get_current_user)):
    """Get all achievements and user progress"""
    achievements = list(achievements_collection.find())
    user_achievements = list(user_achievements_collection.find({"user_id": user["id"]}))
    unlocked_ids = {ua["achievement_id"] for ua in user_achievements}
    
    result = []
    for ach in achievements:
        result.append({
            "id": str(ach["_id"]),
            "title": ach["title"],
            "description": ach["description"],
            "icon": ach.get("icon", "trophy"),
            "xp_reward": ach.get("xp_reward", 100),
            "rarity": ach.get("rarity", "common"),
            "unlocked": ach["_id"] in unlocked_ids,
            "unlocked_at": next((ua["unlocked_at"] for ua in user_achievements if ua["achievement_id"] == ach["_id"]), None)
        })
    
    return {"achievements": result}

# ============== STREAKS ==============

@router.get("/streaks")
async def get_streaks(user: dict = Depends(get_current_user)):
    """Get user streaks"""
    streak = streaks_collection.find_one({"user_id": user["id"]})
    
    if not streak:
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "last_activity": None
        }
    
    return {
        "current_streak": streak.get("current_streak", 0),
        "longest_streak": streak.get("longest_streak", 0),
        "last_activity": streak.get("last_activity")
    }

# ============== NOTIFICATIONS ==============

@router.get("/notifications")
async def get_notifications(user: dict = Depends(get_current_user)):
    """Get user notifications"""
    notifications = list(notifications_collection.find(
        {"user_id": user["id"]}
    ).sort("created_at", -1).limit(50))
    
    result = []
    for n in notifications:
        result.append({
            "id": str(n["_id"]),
            "type": n["type"],
            "title": n["title"],
            "message": n["message"],
            "read": n.get("read", False),
            "created_at": n["created_at"].isoformat() if isinstance(n["created_at"], datetime) else n["created_at"]
        })
    
    return {"notifications": result}

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    """Mark a notification as read"""
    result = notifications_collection.update_one(
        {"_id": notification_id, "user_id": user["id"]},
        {"$set": {"read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(404, "Notification non trouvée")
    return {"message": "Notification marquée comme lue"}

@router.put("/notifications/read-all")
async def mark_all_notifications_read(user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    notifications_collection.update_many(
        {"user_id": user["id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "Toutes les notifications marquées comme lues"}

# ============== SEASONS ==============

@router.get("/seasons/current")
async def get_current_season():
    """Get current active season"""
    season = seasons_collection.find_one({"active": True})
    
    if not season:
        return {"season": None}
    
    return {
        "season": {
            "id": str(season["_id"]),
            "name": season["name"],
            "start_date": season["start_date"],
            "end_date": season["end_date"],
            "rewards": season.get("rewards", [])
        }
    }

# ============== REWARDS ==============

@router.get("/rewards")
async def get_rewards(user: dict = Depends(get_current_user)):
    """Get available rewards"""
    user_data = users_collection.find_one({"_id": user["id"]})
    user_level = user_data.get("level", 1)
    
    rewards = list(rewards_collection.find())
    user_rewards = list(user_rewards_collection.find({"user_id": user["id"]}))
    claimed_ids = {ur["reward_id"] for ur in user_rewards}
    
    result = []
    for r in rewards:
        result.append({
            "id": str(r["_id"]),
            "title": r["title"],
            "description": r["description"],
            "type": r["type"],
            "required_level": r.get("required_level", 1),
            "unlocked": user_level >= r.get("required_level", 1),
            "claimed": r["_id"] in claimed_ids
        })
    
    return {"rewards": result, "user_level": user_level}

@router.post("/rewards/{reward_id}/claim")
async def claim_reward(reward_id: str, user: dict = Depends(get_current_user)):
    """Claim a reward"""
    reward = rewards_collection.find_one({"_id": reward_id})
    if not reward:
        raise HTTPException(404, "Récompense non trouvée")
    
    user_data = users_collection.find_one({"_id": user["id"]})
    if user_data.get("level", 1) < reward.get("required_level", 1):
        raise HTTPException(400, "Niveau insuffisant pour cette récompense")
    
    existing = user_rewards_collection.find_one({"user_id": user["id"], "reward_id": reward_id})
    if existing:
        raise HTTPException(400, "Récompense déjà réclamée")
    
    user_rewards_collection.insert_one({
        "_id": str(uuid.uuid4()),
        "user_id": user["id"],
        "reward_id": reward_id,
        "claimed_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Récompense réclamée avec succès"}

# ============== USER PROGRESS ==============

@router.get("/profile")
async def get_gamification_profile(user: dict = Depends(get_current_user)):
    """Get user gamification profile (alias for progress)"""
    user_data = users_collection.find_one({"_id": user["id"]})
    
    current_level = user_data.get("level", 1)
    current_xp = user_data.get("xp", 0)
    xp_for_next = current_level * 1000
    xp_progress = (current_xp % 1000) / 10
    
    achievements_count = user_achievements_collection.count_documents({"user_id": user["id"]})
    active_challenges = user_challenges_collection.count_documents({
        "user_id": user["id"],
        "completed": False
    })
    streak = streaks_collection.find_one({"user_id": user["id"]})
    
    return {
        "level": current_level,
        "xp": current_xp,
        "xp_for_next_level": xp_for_next,
        "xp_progress_percent": round(xp_progress, 1),
        "achievements_unlocked": achievements_count,
        "active_challenges": active_challenges,
        "current_streak": streak.get("current_streak", 0) if streak else 0,
        "name": user_data.get("name", "Trader"),
        "title": user_data.get("title", "Apprenti Trader")
    }

@router.get("/progress")
async def get_user_progress(user: dict = Depends(get_current_user)):
    """Get comprehensive user progress"""
    user_data = users_collection.find_one({"_id": user["id"]})
    
    # Calculate XP for next level
    current_level = user_data.get("level", 1)
    current_xp = user_data.get("xp", 0)
    xp_for_next = current_level * 1000  # Simple formula
    xp_progress = (current_xp % 1000) / 10  # Percentage to next level
    
    # Count achievements
    achievements_count = user_achievements_collection.count_documents({"user_id": user["id"]})
    
    # Count active challenges
    active_challenges = user_challenges_collection.count_documents({
        "user_id": user["id"],
        "completed": False
    })
    
    # Get streak
    streak = streaks_collection.find_one({"user_id": user["id"]})
    
    return {
        "level": current_level,
        "xp": current_xp,
        "xp_for_next_level": xp_for_next,
        "xp_progress_percent": round(xp_progress, 1),
        "achievements_unlocked": achievements_count,
        "active_challenges": active_challenges,
        "current_streak": streak.get("current_streak", 0) if streak else 0
    }

@router.get("/hall-of-fame")
async def get_hall_of_fame():
    """Get top performers of all time"""
    pipeline = [
        {"$match": {"status": "closed"}},
        {"$group": {
            "_id": "$user_id",
            "total_pnl": {"$sum": {"$ifNull": ["$pnl", 0]}},
            "total_trades": {"$sum": 1}
        }},
        {"$match": {"total_trades": {"$gte": 50}}},  # Minimum 50 trades
        {"$sort": {"total_pnl": -1}},
        {"$limit": 10}
    ]
    
    results = list(trades_collection.aggregate(pipeline))
    
    hall_of_fame = []
    for entry in results:
        user = users_collection.find_one({"_id": entry["_id"]})
        if user:
            hall_of_fame.append({
                "user_id": entry["_id"],
                "name": user.get("name", "Anonyme"),
                "level": user.get("level", 1),
                "total_pnl": round(entry["total_pnl"], 2),
                "total_trades": entry["total_trades"]
            })
    
    return {"hall_of_fame": hall_of_fame}
