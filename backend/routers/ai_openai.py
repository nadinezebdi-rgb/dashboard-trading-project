"""
AI Router - OpenAI powered features: Setup Analysis, Coaching, Daily Briefing
Compatible with standard OpenAI SDK for external deployment
"""
import os
import uuid
import base64
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from openai import OpenAI

from utils.database import (
    users_collection, setups_collection, ai_conversations_collection,
    economic_events_collection
)
from utils.auth import get_current_user
from utils.models import AIMessage, SetupAnalysis

router = APIRouter(prefix="/api/ai", tags=["AI"])

# OpenAI client - initialized lazily
_client = None

def get_openai_client():
    global _client
    if _client is None:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(500, "OpenAI API key not configured")
        _client = OpenAI(api_key=api_key)
    return _client

# Model to use (gpt-4o for vision capabilities, gpt-4o-mini for text-only)
VISION_MODEL = "gpt-4o"
TEXT_MODEL = "gpt-4o-mini"

@router.post("/analyze-setup")
async def analyze_setup(data: SetupAnalysis, user: dict = Depends(get_current_user)):
    """Analyze a trading setup screenshot with AI"""
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

    try:
        client = get_openai_client()
        # Prepare image for OpenAI Vision API
        image_data = data.screenshot_base64
        if not image_data.startswith("data:"):
            image_data = f"data:image/png;base64,{image_data}"
        
        response = client.chat.completions.create(
            model=VISION_MODEL,
            messages=[
                {"role": "system", "content": context},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Analyse ce setup de trading en détail."},
                        {"type": "image_url", "image_url": {"url": image_data}}
                    ]
                }
            ],
            max_tokens=1500
        )
        
        analysis = response.choices[0].message.content
        
        # Save setup analysis
        setup_id = str(uuid.uuid4())
        setups_collection.insert_one({
            "_id": setup_id,
            "user_id": user["id"],
            "symbol": data.symbol,
            "timeframe": data.timeframe,
            "notes": data.notes,
            "ai_analysis": analysis,
            "created_at": datetime.now(timezone.utc)
        })
        
        return {"analysis": analysis}
    except Exception as e:
        raise HTTPException(500, f"Erreur d'analyse: {str(e)}")

@router.post("/coaching")
async def get_ai_coaching(data: AIMessage, user: dict = Depends(get_current_user)):
    """Get personalized AI coaching"""
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

    try:
        client = get_openai_client()
        response = client.chat.completions.create(
            model=TEXT_MODEL,
            messages=[
                {"role": "system", "content": context},
                {"role": "user", "content": data.message}
            ],
            max_tokens=1000
        )
        
        coaching_response = response.choices[0].message.content
        
        # Save conversation
        ai_conversations_collection.insert_one({
            "user_id": user["id"],
            "type": "coaching",
            "message": data.message,
            "response": coaching_response,
            "created_at": datetime.now(timezone.utc)
        })
        
        return {"response": coaching_response}
    except Exception as e:
        raise HTTPException(500, f"Erreur coaching: {str(e)}")

@router.get("/daily-briefing")
async def get_daily_briefing(user: dict = Depends(get_current_user)):
    """Get personalized daily trading briefing"""
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

    try:
        client = get_openai_client()
        response = client.chat.completions.create(
            model=TEXT_MODEL,
            messages=[
                {"role": "system", "content": context},
                {"role": "user", "content": "Génère mon briefing du jour"}
            ],
            max_tokens=800
        )
        
        return {"briefing": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(500, f"Erreur briefing: {str(e)}")

@router.get("/economic-analysis/{event_id}")
async def analyze_economic_event(event_id: str, user: dict = Depends(get_current_user)):
    """AI analysis of an economic event's potential market impact"""
    context = """Tu es un analyste économique expert. Analyse l'impact potentiel de cet événement économique sur les marchés.
    
Fournis:
1. Impact attendu sur les devises concernées
2. Volatilité prévue
3. Recommandations de trading
4. Paires à surveiller

Réponds en français de manière concise."""

    try:
        response = client.chat.completions.create(
            model=TEXT_MODEL,
            messages=[
                {"role": "system", "content": context},
                {"role": "user", "content": "Analyse cet événement économique"}
            ],
            max_tokens=600
        )
        
        return {"analysis": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(500, f"Erreur d'analyse: {str(e)}")

@router.get("/market-sentiment")
async def get_market_sentiment(user: dict = Depends(get_current_user)):
    """Get AI-powered market sentiment analysis"""
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

    try:
        response = client.chat.completions.create(
            model=TEXT_MODEL,
            messages=[
                {"role": "system", "content": context},
                {"role": "user", "content": "Analyse le sentiment actuel du marché"}
            ],
            max_tokens=600
        )
        
        return {"sentiment": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(500, f"Erreur: {str(e)}")
