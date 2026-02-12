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

class TicketCreate(BaseModel):
    subject: str
    category: str  # "strategy", "psychology", "technical", "other"
    message: str
    priority: str = "normal"  # "low", "normal", "high"

class TicketReply(BaseModel):
    message: str

class EconomicEventQuery(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    impact: Optional[str] = None  # "high", "medium", "low"

class CommunityPost(BaseModel):
    title: str
    content: str
    category: str  # "setup", "experience", "win", "loss", "question", "education"
    screenshot_base64: Optional[str] = None
    tags: Optional[List[str]] = None

class CommunityComment(BaseModel):
    content: str

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

# ============== CALENDAR & ANALYTICS ENDPOINTS ==============

@app.get("/api/trades/calendar/{year}/{month}")
async def get_trades_calendar(year: int, month: int, user: dict = Depends(get_current_user)):
    """Get trades organized by day for calendar view"""
    start_date = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end_date = datetime(year, month + 1, 1, tzinfo=timezone.utc)
    
    trades = list(trades_collection.find({
        "user_id": user["id"],
        "created_at": {"$gte": start_date, "$lt": end_date}
    }))
    
    # Group by day
    calendar_data = {}
    for trade in trades:
        day = trade["created_at"].day
        if day not in calendar_data:
            calendar_data[day] = {"trades": 0, "pnl": 0, "wins": 0, "losses": 0}
        calendar_data[day]["trades"] += 1
        pnl = trade.get("pnl", 0) or 0
        calendar_data[day]["pnl"] += pnl
        if pnl > 0:
            calendar_data[day]["wins"] += 1
        elif pnl < 0:
            calendar_data[day]["losses"] += 1
    
    return {"year": year, "month": month, "data": calendar_data}

@app.get("/api/trades/duration-stats")
async def get_trade_duration_stats(user: dict = Depends(get_current_user)):
    """Get trade duration statistics for charts"""
    trades = list(trades_collection.find(
        {"user_id": user["id"], "entry_time": {"$exists": True}, "exit_time": {"$exists": True}},
        {"entry_time": 1, "exit_time": 1, "pnl": 1, "symbol": 1}
    ))
    
    # For demo, generate sample duration data based on existing trades
    all_trades = list(trades_collection.find({"user_id": user["id"]}, {"pnl": 1, "created_at": 1, "symbol": 1}))
    
    duration_buckets = {
        "0-5min": {"count": 0, "total_pnl": 0, "wins": 0},
        "5-15min": {"count": 0, "total_pnl": 0, "wins": 0},
        "15-30min": {"count": 0, "total_pnl": 0, "wins": 0},
        "30min-1h": {"count": 0, "total_pnl": 0, "wins": 0},
        "1h-4h": {"count": 0, "total_pnl": 0, "wins": 0},
        "4h+": {"count": 0, "total_pnl": 0, "wins": 0}
    }
    
    # Simulate duration distribution
    import random
    buckets = list(duration_buckets.keys())
    for trade in all_trades:
        bucket = random.choice(buckets)
        pnl = trade.get("pnl", 0) or 0
        duration_buckets[bucket]["count"] += 1
        duration_buckets[bucket]["total_pnl"] += pnl
        if pnl > 0:
            duration_buckets[bucket]["wins"] += 1
    
    return {"duration_stats": duration_buckets}

# ============== ECONOMIC JOURNAL ENDPOINTS ==============

@app.get("/api/economic/events")
async def get_economic_events(user: dict = Depends(get_current_user)):
    """Get upcoming economic events"""
    # Return sample economic events for demo
    events = [
        {"id": "1", "date": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(), "time": "08:30", "currency": "USD", "event": "Non-Farm Payrolls", "impact": "high", "forecast": "180K", "previous": "175K"},
        {"id": "2", "date": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(), "time": "10:00", "currency": "USD", "event": "ISM Manufacturing PMI", "impact": "high", "forecast": "49.5", "previous": "49.2"},
        {"id": "3", "date": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(), "time": "14:00", "currency": "USD", "event": "FOMC Meeting Minutes", "impact": "high", "forecast": "-", "previous": "-"},
        {"id": "4", "date": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(), "time": "08:30", "currency": "EUR", "event": "ECB Interest Rate Decision", "impact": "high", "forecast": "4.50%", "previous": "4.50%"},
        {"id": "5", "date": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(), "time": "09:30", "currency": "GBP", "event": "UK GDP m/m", "impact": "medium", "forecast": "0.2%", "previous": "0.1%"},
        {"id": "6", "date": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(), "time": "13:30", "currency": "USD", "event": "Initial Jobless Claims", "impact": "medium", "forecast": "215K", "previous": "211K"},
        {"id": "7", "date": (datetime.now(timezone.utc) + timedelta(days=4)).isoformat(), "time": "08:30", "currency": "USD", "event": "Core CPI m/m", "impact": "high", "forecast": "0.3%", "previous": "0.3%"},
        {"id": "8", "date": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(), "time": "10:00", "currency": "EUR", "event": "German ZEW Economic Sentiment", "impact": "medium", "forecast": "15.0", "previous": "12.5"},
    ]
    return {"events": events}

@app.post("/api/economic/analyze")
async def analyze_economic_event(event_id: str, user: dict = Depends(get_current_user)):
    """AI analysis of an economic event's potential market impact"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    # Get user context
    user_data = users_collection.find_one({"_id": user["id"]})
    
    context = f"""Tu es un analyste économique expert. L'utilisateur trade principalement sur:
- Marchés: {', '.join(user_data.get('preferred_markets', ['Forex', 'Indices']))}
- Style: {user_data.get('trading_style', 'Day Trading')}

Analyse l'événement économique et fournis:
1. Impact attendu sur les marchés concernés
2. Paires/actifs les plus impactés
3. Scénarios possibles (bullish/bearish)
4. Recommandations de positionnement
5. Niveaux clés à surveiller
6. Timing optimal pour trader

Sois précis, professionnel et donne des conseils actionnables. Réponds en français."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"economic_{user['id']}_{event_id}",
        system_message=context
    ).with_model("openai", "gpt-5.2")
    
    # Sample event data for analysis
    event_info = f"Analyse l'impact du prochain rapport économique sur les marchés. Quels sont les scénarios possibles et comment se positionner?"
    
    try:
        response = await chat.send_message(UserMessage(text=event_info))
        return {"analysis": response}
    except Exception as e:
        raise HTTPException(500, f"Erreur analyse: {str(e)}")

@app.get("/api/economic/market-sentiment")
async def get_market_sentiment(user: dict = Depends(get_current_user)):
    """Get AI-powered market sentiment analysis"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    context = """Tu es un analyste de marché expert. Génère une analyse du sentiment actuel du marché basée sur:
- Tendances macro-économiques
- Sentiment risk-on/risk-off
- Flux institutionnels
- Volatilité attendue

Format de réponse:
- Sentiment global (Bullish/Bearish/Neutre)
- Score de confiance (1-10)
- Principaux drivers
- Marchés à surveiller
- Risques majeurs

Réponds en français de manière concise et professionnelle."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"sentiment_{user['id']}_{datetime.now().strftime('%Y%m%d')}",
        system_message=context
    ).with_model("openai", "gpt-5.2")
    
    try:
        response = await chat.send_message(UserMessage(text="Analyse le sentiment actuel des marchés financiers"))
        return {"sentiment": response}
    except Exception as e:
        raise HTTPException(500, f"Erreur sentiment: {str(e)}")

# ============== TICKET SYSTEM ENDPOINTS ==============

@app.post("/api/tickets")
async def create_ticket(data: TicketCreate, user: dict = Depends(get_current_user)):
    """Create a new support ticket for expert consultation"""
    ticket_id = str(uuid.uuid4())
    ticket = {
        "_id": ticket_id,
        "user_id": user["id"],
        "user_name": user.get("name", "Utilisateur"),
        "user_email": user.get("email"),
        "subject": data.subject,
        "category": data.category,
        "priority": data.priority,
        "status": "open",
        "messages": [{
            "id": str(uuid.uuid4()),
            "sender": "user",
            "sender_name": user.get("name", "Utilisateur"),
            "content": data.message,
            "created_at": datetime.now(timezone.utc).isoformat()
        }],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    tickets_collection.insert_one(ticket)
    return {"id": ticket_id, "message": "Ticket créé avec succès"}

@app.get("/api/tickets")
async def get_user_tickets(user: dict = Depends(get_current_user)):
    """Get all tickets for the current user"""
    tickets = list(tickets_collection.find(
        {"user_id": user["id"]},
        {"_id": 1, "subject": 1, "category": 1, "priority": 1, "status": 1, "created_at": 1, "updated_at": 1}
    ).sort("updated_at", -1))
    
    result = []
    for t in tickets:
        result.append({
            "id": str(t["_id"]),
            "subject": t["subject"],
            "category": t["category"],
            "priority": t["priority"],
            "status": t["status"],
            "created_at": t["created_at"].isoformat() if isinstance(t["created_at"], datetime) else t["created_at"],
            "updated_at": t["updated_at"].isoformat() if isinstance(t["updated_at"], datetime) else t["updated_at"]
        })
    return {"tickets": result}

@app.get("/api/tickets/{ticket_id}")
async def get_ticket(ticket_id: str, user: dict = Depends(get_current_user)):
    """Get a specific ticket with all messages"""
    ticket = tickets_collection.find_one({"_id": ticket_id, "user_id": user["id"]})
    if not ticket:
        raise HTTPException(404, "Ticket non trouvé")
    
    return {
        "id": str(ticket["_id"]),
        "subject": ticket["subject"],
        "category": ticket["category"],
        "priority": ticket["priority"],
        "status": ticket["status"],
        "messages": ticket.get("messages", []),
        "created_at": ticket["created_at"].isoformat() if isinstance(ticket["created_at"], datetime) else ticket["created_at"],
        "updated_at": ticket["updated_at"].isoformat() if isinstance(ticket["updated_at"], datetime) else ticket["updated_at"]
    }

@app.post("/api/tickets/{ticket_id}/reply")
async def reply_to_ticket(ticket_id: str, data: TicketReply, user: dict = Depends(get_current_user)):
    """Add a reply to a ticket"""
    ticket = tickets_collection.find_one({"_id": ticket_id, "user_id": user["id"]})
    if not ticket:
        raise HTTPException(404, "Ticket non trouvé")
    
    new_message = {
        "id": str(uuid.uuid4()),
        "sender": "user",
        "sender_name": user.get("name", "Utilisateur"),
        "content": data.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    tickets_collection.update_one(
        {"_id": ticket_id},
        {
            "$push": {"messages": new_message},
            "$set": {"updated_at": datetime.now(timezone.utc), "status": "open"}
        }
    )
    return {"message": "Réponse ajoutée"}

@app.put("/api/tickets/{ticket_id}/close")
async def close_ticket(ticket_id: str, user: dict = Depends(get_current_user)):
    """Close a ticket"""
    result = tickets_collection.update_one(
        {"_id": ticket_id, "user_id": user["id"]},
        {"$set": {"status": "closed", "updated_at": datetime.now(timezone.utc)}}
    )
    if result.modified_count == 0:
        raise HTTPException(404, "Ticket non trouvé")
    return {"message": "Ticket fermé"}

# ============== COMMUNITY ENDPOINTS ==============

@app.post("/api/community/posts")
async def create_post(data: CommunityPost, user: dict = Depends(get_current_user)):
    """Create a new community post"""
    post_id = str(uuid.uuid4())
    post = {
        "_id": post_id,
        "author_id": user["id"],
        "author_name": user.get("name", "Trader"),
        "author_level": user.get("experience_level", "beginner"),
        "title": data.title,
        "content": data.content,
        "category": data.category,
        "screenshot": data.screenshot_base64,
        "tags": data.tags or [],
        "likes_count": 0,
        "comments_count": 0,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    community_posts_collection.insert_one(post)
    return {"id": post_id, "message": "Post créé avec succès"}

@app.get("/api/community/posts")
async def get_community_posts(
    category: Optional[str] = None,
    limit: int = 20,
    skip: int = 0,
    user: dict = Depends(get_current_user)
):
    """Get community posts with optional category filter"""
    query = {}
    if category and category != "all":
        query["category"] = category
    
    posts = list(community_posts_collection.find(query)
                 .sort("created_at", -1)
                 .skip(skip)
                 .limit(limit))
    
    # Get user's likes
    user_likes = set()
    likes = community_likes_collection.find({"user_id": user["id"], "type": "post"})
    for like in likes:
        user_likes.add(like["target_id"])
    
    result = []
    for post in posts:
        result.append({
            "id": str(post["_id"]),
            "author_id": post["author_id"],
            "author_name": post["author_name"],
            "author_level": post.get("author_level", "beginner"),
            "title": post["title"],
            "content": post["content"],
            "category": post["category"],
            "has_screenshot": post.get("screenshot") is not None,
            "tags": post.get("tags", []),
            "likes_count": post.get("likes_count", 0),
            "comments_count": post.get("comments_count", 0),
            "is_liked": str(post["_id"]) in user_likes,
            "created_at": post["created_at"].isoformat() if isinstance(post["created_at"], datetime) else post["created_at"]
        })
    
    return {"posts": result}

@app.get("/api/community/posts/{post_id}")
async def get_post_detail(post_id: str, user: dict = Depends(get_current_user)):
    """Get a specific post with comments"""
    post = community_posts_collection.find_one({"_id": post_id})
    if not post:
        raise HTTPException(404, "Post non trouvé")
    
    # Get comments
    comments = list(community_comments_collection.find({"post_id": post_id}).sort("created_at", 1))
    
    # Check if user liked this post
    user_like = community_likes_collection.find_one({"user_id": user["id"], "target_id": post_id, "type": "post"})
    
    # Get user's comment likes
    comment_likes = set()
    c_likes = community_likes_collection.find({"user_id": user["id"], "type": "comment"})
    for cl in c_likes:
        comment_likes.add(cl["target_id"])
    
    formatted_comments = []
    for c in comments:
        formatted_comments.append({
            "id": str(c["_id"]),
            "author_id": c["author_id"],
            "author_name": c["author_name"],
            "content": c["content"],
            "likes_count": c.get("likes_count", 0),
            "is_liked": str(c["_id"]) in comment_likes,
            "created_at": c["created_at"].isoformat() if isinstance(c["created_at"], datetime) else c["created_at"]
        })
    
    return {
        "id": str(post["_id"]),
        "author_id": post["author_id"],
        "author_name": post["author_name"],
        "author_level": post.get("author_level", "beginner"),
        "title": post["title"],
        "content": post["content"],
        "category": post["category"],
        "screenshot": post.get("screenshot"),
        "tags": post.get("tags", []),
        "likes_count": post.get("likes_count", 0),
        "comments_count": post.get("comments_count", 0),
        "is_liked": user_like is not None,
        "comments": formatted_comments,
        "created_at": post["created_at"].isoformat() if isinstance(post["created_at"], datetime) else post["created_at"]
    }

@app.post("/api/community/posts/{post_id}/comments")
async def add_comment(post_id: str, data: CommunityComment, user: dict = Depends(get_current_user)):
    """Add a comment to a post"""
    post = community_posts_collection.find_one({"_id": post_id})
    if not post:
        raise HTTPException(404, "Post non trouvé")
    
    comment_id = str(uuid.uuid4())
    comment = {
        "_id": comment_id,
        "post_id": post_id,
        "author_id": user["id"],
        "author_name": user.get("name", "Trader"),
        "content": data.content,
        "likes_count": 0,
        "created_at": datetime.now(timezone.utc)
    }
    community_comments_collection.insert_one(comment)
    
    # Update post comments count
    community_posts_collection.update_one(
        {"_id": post_id},
        {"$inc": {"comments_count": 1}, "$set": {"updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"id": comment_id, "message": "Commentaire ajouté"}

@app.post("/api/community/posts/{post_id}/like")
async def toggle_post_like(post_id: str, user: dict = Depends(get_current_user)):
    """Toggle like on a post"""
    post = community_posts_collection.find_one({"_id": post_id})
    if not post:
        raise HTTPException(404, "Post non trouvé")
    
    existing_like = community_likes_collection.find_one({
        "user_id": user["id"],
        "target_id": post_id,
        "type": "post"
    })
    
    if existing_like:
        # Unlike
        community_likes_collection.delete_one({"_id": existing_like["_id"]})
        community_posts_collection.update_one({"_id": post_id}, {"$inc": {"likes_count": -1}})
        return {"liked": False, "message": "Like retiré"}
    else:
        # Like
        community_likes_collection.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": user["id"],
            "target_id": post_id,
            "type": "post",
            "created_at": datetime.now(timezone.utc)
        })
        community_posts_collection.update_one({"_id": post_id}, {"$inc": {"likes_count": 1}})
        return {"liked": True, "message": "Post liké"}

@app.post("/api/community/comments/{comment_id}/like")
async def toggle_comment_like(comment_id: str, user: dict = Depends(get_current_user)):
    """Toggle like on a comment"""
    comment = community_comments_collection.find_one({"_id": comment_id})
    if not comment:
        raise HTTPException(404, "Commentaire non trouvé")
    
    existing_like = community_likes_collection.find_one({
        "user_id": user["id"],
        "target_id": comment_id,
        "type": "comment"
    })
    
    if existing_like:
        community_likes_collection.delete_one({"_id": existing_like["_id"]})
        community_comments_collection.update_one({"_id": comment_id}, {"$inc": {"likes_count": -1}})
        return {"liked": False}
    else:
        community_likes_collection.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": user["id"],
            "target_id": comment_id,
            "type": "comment",
            "created_at": datetime.now(timezone.utc)
        })
        community_comments_collection.update_one({"_id": comment_id}, {"$inc": {"likes_count": 1}})
        return {"liked": True}

@app.delete("/api/community/posts/{post_id}")
async def delete_post(post_id: str, user: dict = Depends(get_current_user)):
    """Delete own post"""
    post = community_posts_collection.find_one({"_id": post_id, "author_id": user["id"]})
    if not post:
        raise HTTPException(404, "Post non trouvé ou non autorisé")
    
    # Delete post, comments and likes
    community_posts_collection.delete_one({"_id": post_id})
    community_comments_collection.delete_many({"post_id": post_id})
    community_likes_collection.delete_many({"target_id": post_id})
    
    return {"message": "Post supprimé"}

@app.get("/api/community/user/{user_id}")
async def get_user_profile(user_id: str, user: dict = Depends(get_current_user)):
    """Get public user profile and their posts"""
    target_user = users_collection.find_one({"_id": user_id}, {"password": 0})
    if not target_user:
        raise HTTPException(404, "Utilisateur non trouvé")
    
    # Get user's posts
    posts = list(community_posts_collection.find({"author_id": user_id})
                 .sort("created_at", -1)
                 .limit(10))
    
    # Get user's trade stats
    trades = list(trades_collection.find({"user_id": user_id}, {"pnl": 1}))
    total_trades = len(trades)
    winning_trades = len([t for t in trades if (t.get("pnl") or 0) > 0])
    winrate = round((winning_trades / total_trades * 100) if total_trades > 0 else 0, 1)
    
    formatted_posts = []
    for post in posts:
        formatted_posts.append({
            "id": str(post["_id"]),
            "title": post["title"],
            "category": post["category"],
            "likes_count": post.get("likes_count", 0),
            "comments_count": post.get("comments_count", 0),
            "created_at": post["created_at"].isoformat() if isinstance(post["created_at"], datetime) else post["created_at"]
        })
    
    return {
        "id": user_id,
        "name": target_user.get("name", "Trader"),
        "trading_style": target_user.get("trading_style"),
        "experience_level": target_user.get("experience_level"),
        "preferred_markets": target_user.get("preferred_markets", []),
        "total_trades": total_trades,
        "winrate": winrate,
        "posts_count": len(formatted_posts),
        "posts": formatted_posts,
        "member_since": target_user["created_at"].isoformat() if isinstance(target_user.get("created_at"), datetime) else None
    }

# ============== HEALTH CHECK ==============

@app.get("/api/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
