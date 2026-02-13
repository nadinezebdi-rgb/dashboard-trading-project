"""
Push Notifications Router - Web Push API with VAPID
"""
import os
import json
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from pywebpush import webpush, WebPushException

from utils.database import users_collection, notifications_collection
from utils.auth import get_current_user

router = APIRouter(prefix="/api/push", tags=["Push Notifications"])

# VAPID configuration
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY")
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY")
VAPID_SUBJECT = os.environ.get("VAPID_SUBJECT", "mailto:contact@trading-ai.com")

class PushSubscription(BaseModel):
    endpoint: str
    keys: dict

class PushMessage(BaseModel):
    title: str
    body: str
    url: Optional[str] = "/"
    icon: Optional[str] = "/icon-192x192.png"

@router.get("/vapid-key")
async def get_vapid_key():
    """Get the VAPID public key for push subscription"""
    if not VAPID_PUBLIC_KEY:
        raise HTTPException(500, "VAPID key not configured")
    return {"publicKey": VAPID_PUBLIC_KEY}

@router.post("/subscribe")
async def subscribe_push(subscription: PushSubscription, user: dict = Depends(get_current_user)):
    """Save user's push subscription"""
    users_collection.update_one(
        {"_id": user["id"]},
        {"$set": {
            "push_subscription": {
                "endpoint": subscription.endpoint,
                "keys": subscription.keys
            },
            "push_enabled": True,
            "push_updated_at": datetime.now(timezone.utc)
        }}
    )
    return {"message": "Notifications activées"}

@router.delete("/subscribe")
async def unsubscribe_push(user: dict = Depends(get_current_user)):
    """Remove user's push subscription"""
    users_collection.update_one(
        {"_id": user["id"]},
        {"$set": {
            "push_subscription": None,
            "push_enabled": False,
            "push_updated_at": datetime.now(timezone.utc)
        }}
    )
    return {"message": "Notifications désactivées"}

@router.get("/status")
async def get_push_status(user: dict = Depends(get_current_user)):
    """Check if user has push notifications enabled"""
    user_data = users_collection.find_one({"_id": user["id"]})
    return {
        "enabled": user_data.get("push_enabled", False),
        "subscription_exists": user_data.get("push_subscription") is not None
    }

async def send_push_notification(user_id: str, title: str, body: str, url: str = "/", notification_type: str = "general"):
    """
    Send a push notification to a specific user.
    Also saves to notifications collection for in-app display.
    """
    # Save to notifications collection
    notifications_collection.insert_one({
        "user_id": user_id,
        "type": notification_type,
        "title": title,
        "message": body,
        "url": url,
        "read": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Get user's push subscription
    user = users_collection.find_one({"_id": user_id})
    if not user or not user.get("push_subscription"):
        return False
    
    subscription = user["push_subscription"]
    
    try:
        webpush(
            subscription_info={
                "endpoint": subscription["endpoint"],
                "keys": subscription["keys"]
            },
            data=json.dumps({
                "title": title,
                "body": body,
                "url": url
            }),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": VAPID_SUBJECT}
        )
        return True
    except WebPushException as e:
        # Subscription might be expired
        if e.response and e.response.status_code in [404, 410]:
            users_collection.update_one(
                {"_id": user_id},
                {"$set": {"push_subscription": None, "push_enabled": False}}
            )
        return False

# Helper functions for specific notification types
async def notify_level_up(user_id: str, new_level: int):
    """Send level up notification"""
    await send_push_notification(
        user_id=user_id,
        title=f"Level Up! Niveau {new_level}",
        body=f"Félicitations ! Tu as atteint le niveau {new_level}. Continue comme ça !",
        url="/dashboard",
        notification_type="level_up"
    )

async def notify_achievement_unlocked(user_id: str, achievement_title: str):
    """Send achievement unlock notification"""
    await send_push_notification(
        user_id=user_id,
        title="Badge Débloqué !",
        body=f"Tu as obtenu le badge '{achievement_title}'",
        url="/challenges",
        notification_type="achievement"
    )

async def notify_challenge_completed(user_id: str, challenge_title: str, xp_earned: int):
    """Send challenge completed notification"""
    await send_push_notification(
        user_id=user_id,
        title="Challenge Complété !",
        body=f"'{challenge_title}' terminé ! +{xp_earned} XP",
        url="/challenges",
        notification_type="challenge"
    )

async def notify_ticket_reply(user_id: str, ticket_subject: str):
    """Send notification when expert replies to ticket"""
    await send_push_notification(
        user_id=user_id,
        title="Réponse d'Expert",
        body=f"Nouvelle réponse sur '{ticket_subject}'",
        url="/tickets",
        notification_type="ticket_reply"
    )
