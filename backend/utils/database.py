import os
import certifi
from pymongo import MongoClient
from passlib.context import CryptContext

# -----------------------------
# JWT settings (required by utils/auth.py)
# -----------------------------
JWT_SECRET = os.environ.get("JWT_SECRET", "CHANGE_ME_IN_RENDER")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.environ.get("JWT_EXPIRATION_HOURS", "24"))

# -----------------------------
# Password hashing helpers
# -----------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# -----------------------------
# MongoDB connection (Atlas)
# -----------------------------
MONGO_URI = os.environ.get("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI environment variable is missing")

DB_NAME = os.environ.get("MONGO_DB_NAME", "trading_ai")

client = MongoClient(
    MONGO_URI,
    tls=True,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=30000,
    connectTimeoutMS=20000,
    socketTimeoutMS=20000,
)

try:
    client.admin.command("ping")
    print("✅ MongoDB connected (ping ok)")
except Exception as e:
    print("⚠️ MongoDB ping failed:", repr(e))

db = client[DB_NAME]

# Collections used by your app
users_collection = db["users"]
trades_collection = db["trades"]
setups_collection = db["setups"]
payment_transactions_collection = db["payment_transactions"]
