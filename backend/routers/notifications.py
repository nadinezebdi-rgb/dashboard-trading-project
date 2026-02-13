"""
Notifications Router - User notifications at /api/notifications
"""
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends

from utils.database import notifications_collection
from utils.auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("")
async def get_notifications(limit: int = 50, user: dict = Depends(get_current_user)):
    """Get user notifications"""
    notifications = list(notifications_collection.find(
        {"user_id": user["id"]}
    ).sort("created_at", -1).limit(limit))
    
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

@router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    """Mark a notification as read"""
    result = notifications_collection.update_one(
        {"_id": notification_id, "user_id": user["id"]},
        {"$set": {"read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(404, "Notification non trouvée")
    return {"message": "Notification marquée comme lue"}

@router.post("/read")
async def mark_notifications_read(user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    notifications_collection.update_many(
        {"user_id": user["id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "Toutes les notifications marquées comme lues"}

@router.get("/unread-count")
async def get_unread_count(user: dict = Depends(get_current_user)):
    """Get count of unread notifications"""
    count = notifications_collection.count_documents({
        "user_id": user["id"],
        "read": False
    })
    return {"count": count}
