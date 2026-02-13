"""
Community Router - Posts, Comments, Likes, Profiles
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends

from utils.database import (
    users_collection, community_posts_collection, 
    community_comments_collection, community_likes_collection
)
from utils.auth import get_current_user, get_optional_user
from utils.models import CommunityPostCreate, CommunityComment

router = APIRouter(prefix="/api/community", tags=["Community"])

@router.get("/posts")
async def get_posts(skip: int = 0, limit: int = 20, user: dict = Depends(get_optional_user)):
    """Get community posts with optimized aggregation"""
    # Use aggregation pipeline to avoid N+1 queries
    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "_id",
            "as": "author_data"
        }},
        {"$lookup": {
            "from": "community_likes",
            "localField": "_id",
            "foreignField": "post_id",
            "as": "likes"
        }},
        {"$lookup": {
            "from": "community_comments",
            "localField": "_id",
            "foreignField": "post_id",
            "as": "comments"
        }},
        {"$addFields": {
            "likes_count": {"$size": "$likes"},
            "comments_count": {"$size": "$comments"},
            "author_info": {"$arrayElemAt": ["$author_data", 0]}
        }},
        {"$project": {
            "_id": 1,
            "title": 1,
            "content": 1,
            "tags": 1,
            "user_id": 1,
            "screenshot_base64": 1,
            "created_at": 1,
            "likes_count": 1,
            "comments_count": 1,
            "author_info.name": 1,
            "author_info.level": 1,
            "likes.user_id": 1
        }}
    ]
    
    posts = list(community_posts_collection.aggregate(pipeline))
    
    result = []
    for post in posts:
        is_liked = False
        if user:
            is_liked = any(like.get("user_id") == user["id"] for like in post.get("likes", []))
        
        author_info = post.get("author_info", {})
        result.append({
            "id": str(post["_id"]),
            "title": post["title"],
            "content": post["content"],
            "tags": post.get("tags", []),
            "has_screenshot": bool(post.get("screenshot_base64")),
            "author": {
                "id": post["user_id"],
                "name": author_info.get("name", "Anonyme") if author_info else "Anonyme",
                "level": author_info.get("level", 1) if author_info else 1
            },
            "likes_count": post.get("likes_count", 0),
            "comments_count": post.get("comments_count", 0),
            "is_liked": is_liked,
            "created_at": post["created_at"].isoformat() if isinstance(post["created_at"], datetime) else post["created_at"]
        })
    
    return {"posts": result}

@router.post("/posts")
async def create_post(data: CommunityPostCreate, user: dict = Depends(get_current_user)):
    """Create a new community post"""
    post_id = str(uuid.uuid4())
    
    post = {
        "_id": post_id,
        "user_id": user["id"],
        "title": data.title,
        "content": data.content,
        "tags": data.tags,
        "screenshot_base64": data.screenshot_base64,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    community_posts_collection.insert_one(post)
    
    return {"id": post_id, "message": "Post créé avec succès"}

@router.get("/posts/{post_id}")
async def get_post(post_id: str, user: dict = Depends(get_optional_user)):
    """Get a specific post with comments"""
    post = community_posts_collection.find_one({"_id": post_id})
    if not post:
        raise HTTPException(404, "Post non trouvé")
    
    author = users_collection.find_one({"_id": post["user_id"]})
    likes_count = community_likes_collection.count_documents({"post_id": post_id})
    
    is_liked = False
    if user:
        is_liked = community_likes_collection.find_one({"post_id": post_id, "user_id": user["id"]}) is not None
    
    # Get comments
    comments = list(community_comments_collection.find({"post_id": post_id}).sort("created_at", 1))
    comments_list = []
    for comment in comments:
        comment_author = users_collection.find_one({"_id": comment["user_id"]})
        comments_list.append({
            "id": str(comment["_id"]),
            "content": comment["content"],
            "author": {
                "id": comment["user_id"],
                "name": comment_author.get("name", "Anonyme") if comment_author else "Anonyme",
                "level": comment_author.get("level", 1) if comment_author else 1
            },
            "created_at": comment["created_at"].isoformat() if isinstance(comment["created_at"], datetime) else comment["created_at"]
        })
    
    return {
        "id": str(post["_id"]),
        "title": post["title"],
        "content": post["content"],
        "tags": post.get("tags", []),
        "screenshot_base64": post.get("screenshot_base64"),
        "author": {
            "id": post["user_id"],
            "name": author.get("name", "Anonyme") if author else "Anonyme",
            "level": author.get("level", 1) if author else 1
        },
        "likes_count": likes_count,
        "is_liked": is_liked,
        "comments": comments_list,
        "created_at": post["created_at"].isoformat() if isinstance(post["created_at"], datetime) else post["created_at"]
    }

@router.post("/posts/{post_id}/like")
async def toggle_like(post_id: str, user: dict = Depends(get_current_user)):
    """Toggle like on a post"""
    post = community_posts_collection.find_one({"_id": post_id})
    if not post:
        raise HTTPException(404, "Post non trouvé")
    
    existing_like = community_likes_collection.find_one({"post_id": post_id, "user_id": user["id"]})
    
    if existing_like:
        community_likes_collection.delete_one({"_id": existing_like["_id"]})
        return {"liked": False, "message": "Like retiré"}
    else:
        community_likes_collection.insert_one({
            "_id": str(uuid.uuid4()),
            "post_id": post_id,
            "user_id": user["id"],
            "created_at": datetime.now(timezone.utc)
        })
        return {"liked": True, "message": "Post liké"}

@router.post("/posts/{post_id}/comments")
async def add_comment(post_id: str, data: CommunityComment, user: dict = Depends(get_current_user)):
    """Add a comment to a post"""
    post = community_posts_collection.find_one({"_id": post_id})
    if not post:
        raise HTTPException(404, "Post non trouvé")
    
    comment_id = str(uuid.uuid4())
    community_comments_collection.insert_one({
        "_id": comment_id,
        "post_id": post_id,
        "user_id": user["id"],
        "content": data.content,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"id": comment_id, "message": "Commentaire ajouté"}

@router.delete("/posts/{post_id}")
async def delete_post(post_id: str, user: dict = Depends(get_current_user)):
    """Delete a post"""
    post = community_posts_collection.find_one({"_id": post_id, "user_id": user["id"]})
    if not post:
        raise HTTPException(404, "Post non trouvé ou non autorisé")
    
    community_posts_collection.delete_one({"_id": post_id})
    community_comments_collection.delete_many({"post_id": post_id})
    community_likes_collection.delete_many({"post_id": post_id})
    
    return {"message": "Post supprimé"}

@router.get("/profile/{user_id}")
async def get_user_profile(user_id: str):
    """Get a user's public profile"""
    user = users_collection.find_one({"_id": user_id})
    if not user:
        raise HTTPException(404, "Utilisateur non trouvé")
    
    posts_count = community_posts_collection.count_documents({"user_id": user_id})
    
    return {
        "id": user_id,
        "name": user.get("name", "Anonyme"),
        "level": user.get("level", 1),
        "xp": user.get("xp", 0),
        "trading_style": user.get("trading_style"),
        "experience_level": user.get("experience_level"),
        "posts_count": posts_count,
        "created_at": user.get("created_at").isoformat() if isinstance(user.get("created_at"), datetime) else user.get("created_at")
    }
