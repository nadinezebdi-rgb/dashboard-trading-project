import os
import certifi
from datetime import datetime, timezone

from pymongo import MongoClient
from passlib.context import CryptContext

# =====================================================
# ENVIRONMENT VARIABLES
# =====================================================
MONGO_URI = os.environ.get("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI environment variable is missing")

DB_NAME = os.environ.get("MONGO_DB_NAME", "trading_ai")

JWT_SECRET = os.environ.get("JWT_SECRET", "CHANGE_ME_IN_RENDER_ENV")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.environ.get("JWT_EXPIRATION_HOURS", "24"))

# =====================================================
# PASSWORD HASHING
# =====================================================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# =====================================================
# MONGO CLIENT (TLS SAFE FOR RENDER)
# =====================================================
client = MongoClient(
    MONGO_URI,
    tls=True,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=30000,
    connectTimeoutMS=20000,
    socketTimeoutMS=20000,
)

db = client[DB_NAME]

try:
    client.admin.command("ping")
    print("✅ MongoDB connected (ping ok)")
except Exception as e:
    print("⚠️ MongoDB ping failed:", repr(e))

# =====================================================
# CORE COLLECTIONS
# =====================================================
users_collection = db["users"]
trades_collection = db["trades"]
setups_collection = db["setups"]
payment_transactions_collection = db["payment_transactions"]

# =====================================================
# COMMUNITY COLLECTIONS
# =====================================================
community_posts_collection = db["community_posts"]
community_comments_collection = db["community_comments"]
community_likes_collection = db["community_likes"]

# =====================================================
# GAMIFICATION COLLECTIONS
# =====================================================
challenges_collection = db["challenges"]
user_challenges_collection = db["user_challenges"]

badges_collection = db["badges"]
user_badges_collection = db["user_badges"]

achievements_collection = db["achievements"]
user_achievements_collection = db["user_achievements"]

rewards_collection = db["rewards"]
user_rewards_collection = db["user_rewards"]

xp_transactions_collection = db["xp_transactions"]
leaderboard_collection = db["leaderboard"]

streaks_collection = db["streaks"]
seasons_collection = db["seasons"]

# =====================================================
# AI COLLECTIONS
# =====================================================
ai_conversations_collection = db["ai_conversations"]
ai_messages_collection = db["ai_messages"]

# =====================================================
# TRADING / MARKET / DATA COLLECTIONS
# =====================================================
economic_events_collection = db["economic_events"]
market_news_collection = db["market_news"]
signals_collection = db["signals"]
alerts_collection = db["alerts"]
user_alerts_collection = db["user_alerts"]
watchlists_collection = db["watchlists"]
user_watchlists_collection = db["user_watchlists"]
backtests_collection = db["backtests"]
strategies_collection = db["strategies"]

# =====================================================
# SYSTEM / OTHER COLLECTIONS
# =====================================================
tickets_collection = db["tickets"]
push_subscriptions_collection = db["push_subscriptions"]
notifications_collection = db["notifications"]
payments_collection = db["payments"]

# =====================================================
# UTIL
# =====================================================
def now_utc():
    return datetime.now(timezone.utc)
