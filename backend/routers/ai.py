"""
AI Router - GPT-5.2 powered features: Setup Analysis, Coaching, Daily Briefing
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends

from utils.database import (
    users_collection, setups_collection, ai_conversations_collection,
    economic_events_collection, EMERGENT_LLM_KEY
)
from utils.auth import get_current_user
from utils.models import AIMessage, SetupAnalysis

router = APIRouter(prefix="/api/ai", tags=["AI"])

@router.post("/analyze-setup")
async def analyze_setup(data: SetupAnalysis, user: dict = Depends(get_current_user)):
    """Analyze a trading setup screenshot with AI"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    user_data = users_collection.find_one({"_id": user["id"]})
    
    context = f"""Tu es un expert en analyse technique de trading. Analyse ce setup de trading.
    
Informations sur le trader:
- Style: {user_data.get('trading_style', 'Non défini')}
- Niveau: {user_data.get('experience_level', 'Non défini')}
- Marchés: {', '.join(user_data.get('preferred_markets', []))}

Symbole: {data.symbol or 'Non spécifié'}
Timeframe: {data.timeframe or 'Non spécifié'}
Notes du trader: {data.notes or 'Aucune'}

Analyse le screenshot et fournis:
1. Identification du setup (BOS, FVG, support/résistance, etc.)
2. Points d'entrée potentiels
3. Placement du stop loss optimal
4. Targets / take profit
5. Ratio risque/récompense
6. Force du setup (1-10)
7. Recommandation (LONG, SHORT, ou ATTENDRE)

Réponds en français de manière concise et actionnable."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"setup_{user['id']}_{datetime.now().strftime('%Y%m%d%H%M%S')}",
        system_message=context
    ).with_model("openai", "gpt-5.2")
    
    try:
        response = await chat.send_image_message(
            prompt="Analyse ce setup de trading en détail.",
            image_data=data.screenshot_base64,
            image_media_type="image/png"
        )
        
        # Save setup analysis
        setup_id = str(uuid.uuid4())
        setups_collection.insert_one({
            "_id": setup_id,
            "user_id": user["id"],
            "symbol": data.symbol,
            "timeframe": data.timeframe,
            "notes": data.notes,
            "ai_analysis": response,
            "created_at": datetime.now(timezone.utc)
        })
        
        return {"analysis": response}
    except Exception as e:
        raise HTTPException(500, f"Erreur d'analyse: {str(e)}")

@router.post("/coaching")
async def get_ai_coaching(data: AIMessage, user: dict = Depends(get_current_user)):
    """Get personalized AI coaching"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    user_data = users_collection.find_one({"_id": user["id"]})
    
    context = f"""Tu es un coach de trading personnel expert. Tu aides les traders à améliorer leur performance.

Profil du trader:
- Nom: {user_data.get('name', 'Trader')}
- Style: {user_data.get('trading_style', 'Non défini')}
- Niveau: {user_data.get('experience_level', 'Non défini')}
- Objectifs: {', '.join(user_data.get('trading_goals', []))}
- Tolérance au risque: {user_data.get('risk_tolerance', 'Non défini')}

Type de coaching demandé: {data.context or 'général'}

Réponds de manière personnalisée, pratique et motivante. Donne des conseils concrets et applicables.
Réponds en français."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"coaching_{user['id']}",
        system_message=context
    ).with_model("openai", "gpt-5.2")
    
    try:
        response = await chat.send_message(UserMessage(text=data.message))
        
        # Save conversation
        ai_conversations_collection.insert_one({
            "user_id": user["id"],
            "type": "coaching",
            "message": data.message,
            "response": response,
            "created_at": datetime.now(timezone.utc)
        })
        
        return {"response": response}
    except Exception as e:
        raise HTTPException(500, f"Erreur coaching: {str(e)}")

@router.get("/daily-briefing")
async def get_daily_briefing(user: dict = Depends(get_current_user)):
    """Get personalized daily trading briefing"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    user_data = users_collection.find_one({"_id": user["id"]})
    
    # Get recent performance
    from utils.database import trades_collection
    recent_trades = list(trades_collection.find(
        {"user_id": user["id"], "status": "closed"}
    ).sort("created_at", -1).limit(10))
    
    recent_pnl = sum(t.get("pnl", 0) for t in recent_trades)
    recent_winrate = len([t for t in recent_trades if t.get("pnl", 0) > 0]) / len(recent_trades) * 100 if recent_trades else 0
    
    context = f"""Tu es un coach de trading personnel. Génère un briefing quotidien pour:

Trader: {user_data.get('name', 'Trader')}
Style: {user_data.get('trading_style', 'day trading')}
Niveau: {user_data.get('experience_level', 'intermédiaire')}
Marchés: {', '.join(user_data.get('preferred_markets', ['forex']))}

Performance récente (10 derniers trades):
- PnL: {recent_pnl:.2f}€
- Winrate: {recent_winrate:.1f}%

Le briefing doit inclure:
1. Rappel du plan de trading
2. Points de vigilance du jour
3. Motivation personnalisée
4. Conseil du jour

Sois concis, pratique et motivant. Réponds en français."""

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

@router.get("/economic-analysis/{event_id}")
async def analyze_economic_event(event_id: str, user: dict = Depends(get_current_user)):
    """AI analysis of an economic event's potential market impact"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    context = """Tu es un analyste économique expert. Analyse l'impact potentiel de cet événement économique sur les marchés.
    
Fournis:
1. Impact attendu sur les devises concernées
2. Volatilité prévue
3. Recommandations de trading
4. Paires à surveiller

Réponds en français de manière concise."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"economic_{user['id']}_{event_id}",
        system_message=context
    ).with_model("openai", "gpt-5.2")
    
    try:
        response = await chat.send_message(UserMessage(text="Analyse cet événement économique"))
        return {"analysis": response}
    except Exception as e:
        raise HTTPException(500, f"Erreur d'analyse: {str(e)}")

@router.get("/market-sentiment")
async def get_market_sentiment(user: dict = Depends(get_current_user)):
    """Get AI-powered market sentiment analysis"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    user_data = users_collection.find_one({"_id": user["id"]})
    markets = user_data.get('preferred_markets', ['forex'])
    
    context = f"""Tu es un analyste de marché expert. Fournis une analyse du sentiment actuel pour:
Marchés: {', '.join(markets)}

Inclus:
1. Sentiment général (bullish/bearish/neutre)
2. Facteurs clés influençant le marché
3. Opportunités potentielles
4. Risques à surveiller

Réponds en français de manière concise."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"sentiment_{user['id']}_{datetime.now().strftime('%Y%m%d')}",
        system_message=context
    ).with_model("openai", "gpt-5.2")
    
    try:
        response = await chat.send_message(UserMessage(text="Analyse le sentiment actuel du marché"))
        return {"sentiment": response}
    except Exception as e:
        raise HTTPException(500, f"Erreur: {str(e)}")
