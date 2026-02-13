import os
import certifi
from datetime import datetime, timezone

from pymongo import MongoClient
from passlib.context import CryptContext

# =========================
# ENV
# =========================
MONGO_URI = os.environ.get("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI environment variable is missing")

DB_NAME = os.environ.get("MONGO_DB_NAME", "trading_ai")

# JWT settings (used by utils/auth.py)
JWT_SECRET = os.environ.get("JWT_SECRET", "CHANGE_ME_IN_RENDER_ENV")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.environ.get("JWT_EXPIRATION_HOURS", "24"))

# =========================
# PASSWORD HASHING
# =========================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# =========================
# MONGO CLIENT (TLS FIX)
# =========================
client = MongoClient(
    MONGO_URI,
    tls=True,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=30000,
    connectTimeoutMS=20000,
    socketTimeoutMS=20000,
)

db = client[DB_NAME]

# Optional ping (useful in Render logs)
try:
    client.admin.command("ping")
    print("✅ MongoDB connected (ping ok)")
except Exception as e:
    print("⚠️ MongoDB ping failed:", repr(e))

# =========================
# COLLECTIONS (Core)
# =========================
users_collection = db["users"]
trades_collection = db["trades"]
setups_collection = db["setups"]
payment_transactions_collection = db["payment_transactions"]

# =========================
# COLLECTIONS (Community)
# =========================
community_posts_collection = db["community_posts"]
community_comments_collection = db["community_comments"]
community_likes_collection = db["community_likes"]

# =========================
# COLLECTIONS (Gamification)
# =========================
challenges_collection = db["challenges"]
user_challenges_collection = db["user_challenges"]

badges_collection = db["badges"]
user_badges_collection = db["user_badges"]

achievements_collection = db["achievements"]
user_achievements_collection = db["user_achievements"]
rewards_collection = db["rewards"]
xp_transactions_collection = db["xp_transactions"]
leaderboard_collection = db["leaderboard"]

# ✅ NEW: streaks (fix current error)
streaks_collection = db["streaks"]
seasons_collection = db["seasons"]
# =========================
# COLLECTIONS (Other / optional)
# (safe to declare even if not used yet)
# =========================
tickets_collection = db["tickets"]
push_subscriptions_collection = db["push_subscriptions"]
notifications_collection = db["notifications"]
payments_collection = db["payments"]

# =========================
# UTIL
# =========================
def now_utc():
    return datetime.now(timezone.utc)
