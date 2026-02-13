"""
Authentication utilities - JWT token handling
"""
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Header
from jose import jwt, JWTError
from utils.database import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS, users_collection

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Non authentifié")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide")
        
        user = users_collection.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        
        return {"id": user_id, "email": user.get("email"), "name": user.get("name")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expiré ou invalide")

def get_optional_user(authorization: str = Header(None)) -> dict:
    """Get user if authenticated, None otherwise"""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            return {"id": user_id}
    except JWTError:
        pass
    return None
