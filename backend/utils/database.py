"""
Database configuration and shared utilities
"""
import os
from pymongo import MongoClient
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

# Environment variables
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "trading_ai_platform")
JWT_SECRET = os.environ.get("JWT_SECRET", "secret")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")

# JWT settings
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 1 week

# MongoDB setup
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Collections
users_collection = db["users"]
trades_collection = db["trades"]
setups_collection = db["setups"]
ai_conversations_collection = db["ai_conversations"]
payment_transactions_collection = db["payment_transactions"]
questionnaires_collection = db["questionnaires"]
tickets_collection = db["tickets"]
economic_events_collection = db["economic_events"]
community_posts_collection = db["community_posts"]
community_comments_collection = db["community_comments"]
community_likes_collection = db["community_likes"]
challenges_collection = db["challenges"]
user_challenges_collection = db["user_challenges"]
achievements_collection = db["achievements"]
user_achievements_collection = db["user_achievements"]
streaks_collection = db["streaks"]
notifications_collection = db["notifications"]
seasons_collection = db["seasons"]
rewards_collection = db["rewards"]
user_rewards_collection = db["user_rewards"]
backtests_collection = db["backtests"]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
