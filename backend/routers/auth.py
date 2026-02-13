"""
Authentication Router - Register, Login, User Profile
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends

from utils.database import users_collection, hash_password, verify_password
from utils.auth import create_access_token, get_current_user
from utils.models import UserRegister, UserLogin, QuestionnaireData

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register")
async def register(data: UserRegister):
    """Register a new user"""
    existing = users_collection.find_one({"email": data.email})
    if existing:
        raise HTTPException(400, "Email déjà utilisé")
    
    user_id = str(uuid.uuid4())
    user = {
        "_id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "name": data.name,
        "subscription": "free",
        "onboarding_completed": False,
        "level": 1,
        "xp": 0,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    users_collection.insert_one(user)
    
    token = create_access_token({"sub": user_id, "email": data.email})
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": data.email,
            "name": data.name,
            "subscription": "free",
            "onboarding_completed": False
        }
    }

@router.post("/login")
async def login(data: UserLogin):
    """Login user"""
    user = users_collection.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(401, "Email ou mot de passe incorrect")
    
    token = create_access_token({"sub": user["_id"], "email": user["email"]})
    return {
        "token": token,
        "user": {
            "id": user["_id"],
            "email": user["email"],
            "name": user.get("name", ""),
            "subscription": user.get("subscription", "free"),
            "onboarding_completed": user.get("onboarding_completed", False)
        }
    }

@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user profile"""
    user_data = users_collection.find_one({"_id": user["id"]})
    if not user_data:
        raise HTTPException(404, "Utilisateur non trouvé")
    
    return {
        "id": user_data["_id"],
        "email": user_data["email"],
        "name": user_data.get("name", ""),
        "subscription": user_data.get("subscription", "free"),
        "onboarding_completed": user_data.get("onboarding_completed", False),
        "level": user_data.get("level", 1),
        "xp": user_data.get("xp", 0),
        "trading_style": user_data.get("trading_style"),
        "experience_level": user_data.get("experience_level"),
        "preferred_markets": user_data.get("preferred_markets", []),
        "trading_goals": user_data.get("trading_goals", []),
        "created_at": user_data.get("created_at")
    }

@router.post("/questionnaire")
async def save_questionnaire(data: QuestionnaireData, user: dict = Depends(get_current_user)):
    """Save onboarding questionnaire"""
    users_collection.update_one(
        {"_id": user["id"]},
        {"$set": {
            "trading_style": data.trading_style,
            "experience_level": data.experience_level,
            "preferred_markets": data.preferred_markets,
            "trading_goals": data.trading_goals,
            "risk_tolerance": data.risk_tolerance,
            "available_hours": data.available_hours,
            "onboarding_completed": True,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    return {"message": "Questionnaire enregistré"}
