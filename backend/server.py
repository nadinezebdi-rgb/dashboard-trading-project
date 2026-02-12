"""
Trading AI Platform - Backend API
FastAPI server with MongoDB, JWT Auth, GPT-5.2 AI, and Stripe payments
"""
import os
import uuid
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Header, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from pymongo import MongoClient
from passlib.context import CryptContext
from jose import jwt, JWTError
import base64

load_dotenv()

# Environment variables
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "trading_ai_platform")
JWT_SECRET = os.environ.get("JWT_SECRET", "secret")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")

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

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 1 week

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create indexes
    users_collection.create_index("email", unique=True)
    trades_collection.create_index("user_id")
    trades_collection.create_index("created_at")
    setups_collection.create_index("user_id")
    payment_transactions_collection.create_index("session_id")
    yield
    # Shutdown
    client.close()

app = FastAPI(title="Trading AI Platform", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== MODELS ==============

class UserRegister(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    name: str
    trading_style: Optional[str] = None
    experience_level: Optional[str] = None
    preferred_markets: Optional[List[str]] = None

class QuestionnaireData(BaseModel):
    questionnaire_type: str  # "assistant" or "educational"
    answers: Dict[str, Any]

class TradeEntry(BaseModel):
    symbol: str
    direction: str  # "LONG" or "SHORT"
    entry_price: float
    exit_price: Optional[float] = None
    quantity: float
    pnl: Optional[float] = None
    setup_type: Optional[str] = None
    notes: Optional[str] = None
    screenshot_base64: Optional[str] = None
    session: Optional[str] = None  # "London", "New York", "Asia"
    respected_plan: bool = True
    emotions: Optional[str] = None
    errors: Optional[List[str]] = None

class SetupAnalysis(BaseModel):
    screenshot_base64: str
    symbol: Optional[str] = None
    timeframe: Optional[str] = None
    notes: Optional[str] = None

class AIMessage(BaseModel):
    message: str
    context: Optional[str] = None  # "coaching", "analysis", "education"

class CheckoutRequest(BaseModel):
    plan: str  # "starter", "pro", "elite"
    origin_url: str

# ============== HELPERS ==============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(user_id: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {"sub": user_id, "email": email, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Token manquant")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = users_collection.find_one({"_id": payload["sub"]}, {"password": 0, "_id": 0})
        if not user:
            raise HTTPException(401, "Utilisateur non trouvé")
        user["id"] = payload["sub"]
        return user
    except JWTError:
        raise HTTPException(401, "Token invalide")

def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document to JSON-safe dict"""
    if doc is None:
        return None
    result = {}
    for key, value in doc.items():
        if key == "_id":
            result["id"] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        else:
            result[key] = value
    return result

# ============== AUTH ENDPOINTS ==============

@app.post("/api/auth/register")
async def register(data: UserRegister):
    if users_collection.find_one({"email": data.email}):
        raise HTTPException(400, "Email déjà utilisé")
    
    user_id = str(uuid.uuid4())
    user = {
        "_id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "name": data.name,
        "created_at": datetime.now(timezone.utc),
        "subscription": "free",
        "subscription_expires": None,
        "onboarding_completed": False,
        "trading_style": None,
        "experience_level": None,
        "preferred_markets": []
    }
    users_collection.insert_one(user)
    token = create_token(user_id, data.email)
    return {"token": token, "user": {"id": user_id, "email": data.email, "name": data.name}}

@app.post("/api/auth/login")
async def login(data: UserLogin):
    user = users_collection.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(401, "Email ou mot de passe incorrect")
    
    token = create_token(user["_id"], data.email)
    return {
        "token": token,
        "user": {
            "id": user["_id"],
            "email": user["email"],
            "name": user["name"],
            "subscription": user.get("subscription", "free"),
            "onboarding_completed": user.get("onboarding_completed", False)
        }
    }

@app.get("/api/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"user": user}

# ============== USER ENDPOINTS ==============

@app.put("/api/users/profile")
async def update_profile(data: UserProfile, user: dict = Depends(get_current_user)):
    update_data = data.model_dump(exclude_none=True)
    users_collection.update_one({"_id": user["id"]}, {"$set": update_data})
    return {"message": "Profil mis à jour"}

@app.post("/api/users/questionnaire")
async def save_questionnaire(data: QuestionnaireData, user: dict = Depends(get_current_user)):
    questionnaire = {
        "_id": str(uuid.uuid4()),
        "user_id": user["id"],
        "type": data.questionnaire_type,
        "answers": data.answers,
        "created_at": datetime.now(timezone.utc)
    }
    questionnaires_collection.insert_one(questionnaire)
    
    # Update user's onboarding status
    if data.questionnaire_type == "assistant":
        # Extract key info from questionnaire
        update_fields = {
            "trading_style": data.answers.get("trading_style"),
            "experience_level": data.answers.get("experience_level"),
            "preferred_markets": data.answers.get("markets", []),
            "difficulties": data.answers.get("difficulties", []),
            "daily_time": data.answers.get("daily_time"),
            "sessions": data.answers.get("sessions", [])
        }
        users_collection.update_one({"_id": user["id"]}, {"$set": update_fields})
    
    if data.questionnaire_type == "educational":
        users_collection.update_one(
            {"_id": user["id"]},
            {"$set": {
                "onboarding_completed": True,
                "learning_style": data.answers.get("learning_style"),
                "knowledge_level": data.answers.get("knowledge_level"),
                "known_approaches": data.answers.get("known_approaches", [])
            }}
        )
    
    return {"message": "Questionnaire enregistré"}

@app.get("/api/users/questionnaires")
async def get_questionnaires(user: dict = Depends(get_current_user)):
    questionnaires = list(questionnaires_collection.find(
        {"user_id": user["id"]},
        {"_id": 0, "user_id": 0}
    ))
    return {"questionnaires": questionnaires}

# ============== TRADES ENDPOINTS ==============

@app.post("/api/trades")
async def create_trade(data: TradeEntry, user: dict = Depends(get_current_user)):
    trade_id = str(uuid.uuid4())
    trade = {
        "_id": trade_id,
        "user_id": user["id"],
        "symbol": data.symbol,
        "direction": data.direction,
        "entry_price": data.entry_price,
        "exit_price": data.exit_price,
        "quantity": data.quantity,
        "pnl": data.pnl,
        "setup_type": data.setup_type,
        "notes": data.notes,
        "screenshot": data.screenshot_base64,
        "session": data.session,
        "respected_plan": data.respected_plan,
        "emotions": data.emotions,
        "errors": data.errors or [],
        "created_at": datetime.now(timezone.utc)
    }
    trades_collection.insert_one(trade)
    return {"id": trade_id, "message": "Trade enregistré"}

@app.get("/api/trades")
async def get_trades(
    limit: int = 50,
    skip: int = 0,
    user: dict = Depends(get_current_user)
):
    trades = list(trades_collection.find(
        {"user_id": user["id"]},
        {"_id": 0, "user_id": 0, "screenshot": 0}
    ).sort("created_at", -1).skip(skip).limit(limit))
    
    # Add id field and serialize dates
    for trade in trades:
        if "created_at" in trade:
            trade["created_at"] = trade["created_at"].isoformat()
    
    return {"trades": trades}

@app.get("/api/trades/stats")
async def get_trade_stats(user: dict = Depends(get_current_user)):
    trades = list(trades_collection.find({"user_id": user["id"]}, {"pnl": 1, "respected_plan": 1, "session": 1, "errors": 1, "direction": 1}))
    
    if not trades:
        return {
            "total_trades": 0,
            "winning_trades": 0,
            "losing_trades": 0,
            "winrate": 0,
            "total_pnl": 0,
            "average_pnl": 0,
            "plan_adherence": 0,
            "best_session": None,
            "common_errors": []
        }
    
    pnls = [t.get("pnl", 0) or 0 for t in trades]
    winning = [p for p in pnls if p > 0]
    losing = [p for p in pnls if p < 0]
    respected = [t for t in trades if t.get("respected_plan", True)]
    
    # Session performance
    sessions = {}
    for t in trades:
        session = t.get("session")
        if session:
            if session not in sessions:
                sessions[session] = {"pnl": 0, "count": 0}
            sessions[session]["pnl"] += t.get("pnl", 0) or 0
            sessions[session]["count"] += 1
    
    best_session = max(sessions.items(), key=lambda x: x[1]["pnl"])[0] if sessions else None
    
    # Common errors
    all_errors = []
    for t in trades:
        all_errors.extend(t.get("errors", []))
    error_counts = {}
    for e in all_errors:
        error_counts[e] = error_counts.get(e, 0) + 1
    common_errors = sorted(error_counts.items(), key=lambda x: -x[1])[:5]
    
    return {
        "total_trades": len(trades),
        "winning_trades": len(winning),
        "losing_trades": len(losing),
        "winrate": round(len(winning) / len(trades) * 100, 1) if trades else 0,
        "total_pnl": round(sum(pnls), 2),
        "average_pnl": round(sum(pnls) / len(trades), 2) if trades else 0,
        "plan_adherence": round(len(respected) / len(trades) * 100, 1) if trades else 0,
        "best_session": best_session,
        "common_errors": [{"error": e, "count": c} for e, c in common_errors],
        "sessions": sessions
    }

@app.get("/api/trades/heatmap")
async def get_trades_heatmap(user: dict = Depends(get_current_user)):
    """Get trade data for heatmap visualization"""
    trades = list(trades_collection.find(
        {"user_id": user["id"]},
        {"pnl": 1, "created_at": 1}
    ))
    return {"trades": [{"pnl": t.get("pnl", 0), "created_at": t["created_at"].isoformat()} for t in trades]}

# ============== AI ENDPOINTS ==============

@app.post("/api/ai/analyze-setup")
async def analyze_setup(data: SetupAnalysis, user: dict = Depends(get_current_user)):
    """Analyze a trading setup screenshot using GPT-5.2"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    # Get user's trading profile for context
    user_data = users_collection.find_one({"_id": user["id"]})
    questionnaire = questionnaires_collection.find_one({"user_id": user["id"], "type": "assistant"})
    
    context = f"""Tu es un coach de trading expert. L'utilisateur a les caractéristiques suivantes:
- Style de trading: {user_data.get('trading_style', 'Non défini')}
- Niveau d'expérience: {user_data.get('experience_level', 'Non défini')}
- Marchés préférés: {', '.join(user_data.get('preferred_markets', []))}
- Difficultés connues: {', '.join(user_data.get('difficulties', []))}

Analyse le setup présenté et fournis:
1. Type de setup identifié (BOS, CHOCH, FVG, Liquidité, etc.)
2. Points forts du setup
3. Points faibles ou risques
4. Recommandation d'action (ACHETER, VENDRE, ATTENDRE)
5. Niveau de confiance (1-10)
6. Conseils personnalisés basés sur le profil du trader

Réponds en français de manière professionnelle et concise."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"setup_{user['id']}_{uuid.uuid4().hex[:8]}",
        system_message=context
    ).with_model("openai", "gpt-5.2")
    
    message_text = f"Analyse ce setup de trading"
    if data.symbol:
        message_text += f" sur {data.symbol}"
    if data.timeframe:
        message_text += f" en {data.timeframe}"
    if data.notes:
        message_text += f". Notes: {data.notes}"
    
    user_message = UserMessage(text=message_text)
    
    # Add image if provided
    if data.screenshot_base64:
        user_message = UserMessage(
            text=message_text,
            image_url=f"data:image/jpeg;base64,{data.screenshot_base64}"
        )
    
    try:
        response = await chat.send_message(user_message)
        
        # Save setup analysis
        setup = {
            "_id": str(uuid.uuid4()),
            "user_id": user["id"],
            "symbol": data.symbol,
            "timeframe": data.timeframe,
            "notes": data.notes,
            "ai_analysis": response,
            "created_at": datetime.now(timezone.utc)
        }
        setups_collection.insert_one(setup)
        
        return {"analysis": response}
    except Exception as e:
        raise HTTPException(500, f"Erreur d'analyse: {str(e)}")

@app.post("/api/ai/coaching")
async def get_ai_coaching(data: AIMessage, user: dict = Depends(get_current_user)):
    """Get personalized AI coaching"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    # Get user context
    user_data = users_collection.find_one({"_id": user["id"]})
    stats = await get_trade_stats(user)
    recent_trades = list(trades_collection.find(
        {"user_id": user["id"]},
        {"pnl": 1, "errors": 1, "respected_plan": 1, "session": 1}
    ).sort("created_at", -1).limit(10))
    
    context = f"""Tu es un coach de trading personnel expert. Voici le profil du trader:
- Nom: {user_data.get('name', 'Trader')}
- Style: {user_data.get('trading_style', 'Non défini')}
- Niveau: {user_data.get('experience_level', 'Non défini')}
- Winrate actuel: {stats.get('winrate', 0)}%
- Respect du plan: {stats.get('plan_adherence', 0)}%
- Erreurs fréquentes: {', '.join([e['error'] for e in stats.get('common_errors', [])])}
- Meilleure session: {stats.get('best_session', 'Non définie')}
- PnL total: {stats.get('total_pnl', 0)}$

Type de coaching demandé: {data.context or 'général'}

Fournis des conseils personnalisés, constructifs et actionnables. Sois direct mais encourageant.
Réponds en français."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"coaching_{user['id']}",
        system_message=context
    ).with_model("openai", "gpt-5.2")
    
    user_message = UserMessage(text=data.message)
    
    try:
        response = await chat.send_message(user_message)
        
        # Save conversation
        ai_conversations_collection.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": user["id"],
            "type": "coaching",
            "user_message": data.message,
            "ai_response": response,
            "created_at": datetime.now(timezone.utc)
        })
        
        return {"response": response}
    except Exception as e:
        raise HTTPException(500, f"Erreur coaching: {str(e)}")

@app.get("/api/ai/daily-briefing")
async def get_daily_briefing(user: dict = Depends(get_current_user)):
    """Get personalized daily trading briefing"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    user_data = users_collection.find_one({"_id": user["id"]})
    stats = await get_trade_stats(user)
    
    # Get yesterday's trades
    yesterday = datetime.now(timezone.utc) - timedelta(days=1)
    yesterday_trades = list(trades_collection.find({
        "user_id": user["id"],
        "created_at": {"$gte": yesterday}
    }))
    
    context = f"""Tu es un coach de trading personnel. Génère un briefing quotidien pour:
- Trader: {user_data.get('name', 'Trader')}
- Style: {user_data.get('trading_style', 'Non défini')}
- Sessions préférées: {', '.join(user_data.get('sessions', []))}
- Winrate: {stats.get('winrate', 0)}%
- Erreurs fréquentes: {', '.join([e['error'] for e in stats.get('common_errors', [])])}
- Trades hier: {len(yesterday_trades)}

Le briefing doit inclure:
1. Rappel du plan de trading
2. Points d'attention basés sur les erreurs récentes
3. Objectifs du jour (max 3)
4. Message de motivation personnalisé

Format: court, punchy, actionnable. En français."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"briefing_{user['id']}_{datetime.now().strftime('%Y%m%d')}",
        system_message=context
    ).with_model("openai", "gpt-5.2")
    
    try:
        response = await chat.send_message(UserMessage(text="Génère mon briefing du jour"))
        return {"briefing": response}
    except Exception as e:
        raise HTTPException(500, f"Erreur briefing: {str(e)}")

# ============== PAYMENT ENDPOINTS ==============

SUBSCRIPTION_PLANS = {
    "starter": {"price": 29.00, "name": "Starter", "features": ["Dashboard", "Journal", "Stats de base"]},
    "pro": {"price": 79.00, "name": "Pro", "features": ["Tout Starter", "Analyse IA illimitée", "Coaching quotidien"]},
    "elite": {"price": 149.00, "name": "Elite", "features": ["Tout Pro", "Système éducatif", "Support prioritaire"]}
}

@app.post("/api/payments/checkout")
async def create_checkout(data: CheckoutRequest, user: dict = Depends(get_current_user)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    if data.plan not in SUBSCRIPTION_PLANS:
        raise HTTPException(400, "Plan invalide")
    
    plan = SUBSCRIPTION_PLANS[data.plan]
    
    webhook_url = f"{data.origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{data.origin_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{data.origin_url}/subscription"
    
    checkout_request = CheckoutSessionRequest(
        amount=plan["price"],
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["id"],
            "plan": data.plan,
            "user_email": user["email"]
        }
    )
    
    try:
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Save transaction
        payment_transactions_collection.insert_one({
            "_id": str(uuid.uuid4()),
            "session_id": session.session_id,
            "user_id": user["id"],
            "plan": data.plan,
            "amount": plan["price"],
            "currency": "eur",
            "status": "pending",
            "payment_status": "initiated",
            "created_at": datetime.now(timezone.utc)
        })
        
        return {"url": session.url, "session_id": session.session_id}
    except Exception as e:
        raise HTTPException(500, f"Erreur paiement: {str(e)}")

@app.get("/api/payments/status/{session_id}")
async def get_payment_status(session_id: str, user: dict = Depends(get_current_user)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    
    try:
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction
        transaction = payment_transactions_collection.find_one({"session_id": session_id})
        
        if transaction and transaction.get("payment_status") != "paid" and status.payment_status == "paid":
            # Update user subscription
            plan = transaction.get("plan", "starter")
            expires = datetime.now(timezone.utc) + timedelta(days=30)
            
            users_collection.update_one(
                {"_id": transaction["user_id"]},
                {"$set": {
                    "subscription": plan,
                    "subscription_expires": expires
                }}
            )
            
            payment_transactions_collection.update_one(
                {"session_id": session_id},
                {"$set": {
                    "status": status.status,
                    "payment_status": status.payment_status,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
    except Exception as e:
        raise HTTPException(500, f"Erreur statut: {str(e)}")

@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    
    try:
        event = await stripe_checkout.handle_webhook(body, signature)
        
        if event.payment_status == "paid":
            transaction = payment_transactions_collection.find_one({"session_id": event.session_id})
            if transaction:
                plan = event.metadata.get("plan", "starter")
                user_id = event.metadata.get("user_id")
                expires = datetime.now(timezone.utc) + timedelta(days=30)
                
                users_collection.update_one(
                    {"_id": user_id},
                    {"$set": {"subscription": plan, "subscription_expires": expires}}
                )
                
                payment_transactions_collection.update_one(
                    {"session_id": event.session_id},
                    {"$set": {"status": "complete", "payment_status": "paid"}}
                )
        
        return {"received": True}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/payments/plans")
async def get_plans():
    return {"plans": SUBSCRIPTION_PLANS}

# ============== HEALTH CHECK ==============

@app.get("/api/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
