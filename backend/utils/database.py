import os
import certifi
from pymongo import MongoClient

# Read env var set on Render
MONGO_URI = os.environ.get("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI environment variable is missing")

# Create secure Mongo client for Atlas (fixes TLS handshake issues on many hosts)
client = MongoClient(
    MONGO_URI,
    tls=True,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=30000,
    connectTimeoutMS=20000,
    socketTimeoutMS=20000,
)

# Optional: force a connection test at import time (useful on Render logs)
try:
    client.admin.command("ping")
    print("✅ MongoDB connected (ping ok)")
except Exception as e:
    # Do not crash import hard if you prefer app to still start
    print("⚠️ MongoDB ping failed:", repr(e))

# Choose DB name
DB_NAME = os.environ.get("MONGO_DB_NAME", "trading_ai")

db = client[DB_NAME]

# Collections used by your app
users_collection = db["users"]
trades_collection = db["trades"]
setups_collection = db["setups"]
payment_transactions_collection = db["payment_transactions"]
