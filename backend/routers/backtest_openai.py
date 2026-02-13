"""
Backtest Router - OpenAI powered strategy backtesting
Compatible with standard OpenAI SDK for external deployment
"""
import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from openai import OpenAI

from utils.database import users_collection, backtests_collection
from utils.auth import get_current_user
from utils.models import BacktestCreate, BacktestTrade

router = APIRouter(prefix="/api/backtest", tags=["Backtesting"])

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

TEXT_MODEL = "gpt-4o-mini"

@router.post("")
async def create_backtest(data: BacktestCreate, user: dict = Depends(get_current_user)):
    """Create a new backtest and get AI analysis of the strategy"""
    backtest_id = str(uuid.uuid4())
    user_data = users_collection.find_one({"_id": user["id"]})
    
    strategy_context = f"""Tu es un expert en backtesting et analyse de stratégies de trading. 
    
Profil du trader:
- Style: {user_data.get('trading_style', 'Non défini')}
- Niveau: {user_data.get('experience_level', 'Non défini')}
- Marchés préférés: {', '.join(user_data.get('preferred_markets', []))}

Stratégie à analyser:
- Nom: {data.name}
- Description: {data.strategy_description}
- Symbole: {data.symbol}
- Timeframe: {data.timeframe}
- Période: {data.start_date} à {data.end_date}
- Capital initial: {data.initial_capital}€
- Risque par trade: {data.risk_per_trade}%

Règles d'entrée:
{chr(10).join(f'- {rule}' for rule in data.entry_rules)}

Règles de sortie:
{chr(10).join(f'- {rule}' for rule in data.exit_rules)}

Stop Loss: {data.stop_loss_type} ({data.stop_loss_value})
Take Profit: {data.take_profit_type} ({data.take_profit_value})

Analyse cette stratégie et fournis:
1. **Évaluation globale** (1-10) avec justification
2. **Points forts** de la stratégie
3. **Points faibles** et risques identifiés
4. **Suggestions d'amélioration** spécifiques
5. **Conditions de marché** où cette stratégie performerait le mieux
6. **Pièges à éviter** lors du backtesting
7. **Estimation** du winrate attendu et du ratio R/R réaliste

Réponds en français de manière professionnelle et détaillée."""

    try:
        response = client.chat.completions.create(
            model=TEXT_MODEL,
            messages=[
                {"role": "system", "content": strategy_context},
                {"role": "user", "content": "Analyse cette stratégie de trading pour le backtesting."}
            ],
            max_tokens=1500
        )
        
        analysis = response.choices[0].message.content
        
        backtest = {
            "_id": backtest_id,
            "user_id": user["id"],
            "name": data.name,
            "strategy_description": data.strategy_description,
            "symbol": data.symbol,
            "timeframe": data.timeframe,
            "start_date": data.start_date,
            "end_date": data.end_date,
            "initial_capital": data.initial_capital,
            "risk_per_trade": data.risk_per_trade,
            "entry_rules": data.entry_rules,
            "exit_rules": data.exit_rules,
            "stop_loss_type": data.stop_loss_type,
            "stop_loss_value": data.stop_loss_value,
            "take_profit_type": data.take_profit_type,
            "take_profit_value": data.take_profit_value,
            "ai_analysis": analysis,
            "status": "pending",
            "trades": [],
            "results": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        backtests_collection.insert_one(backtest)
        
        return {
            "id": backtest_id,
            "ai_analysis": analysis,
            "message": "Backtest créé avec succès. Ajoutez vos trades pour obtenir les résultats."
        }
    except Exception as e:
        raise HTTPException(500, f"Erreur d'analyse: {str(e)}")

@router.get("")
async def get_backtests(user: dict = Depends(get_current_user)):
    """Get all backtests for the current user"""
    backtests = list(backtests_collection.find(
        {"user_id": user["id"]},
        {"ai_analysis": 0}
    ).sort("created_at", -1))
    
    result = []
    for bt in backtests:
        result.append({
            "id": str(bt["_id"]),
            "name": bt["name"],
            "symbol": bt["symbol"],
            "timeframe": bt["timeframe"],
            "start_date": bt["start_date"],
            "end_date": bt["end_date"],
            "status": bt.get("status", "pending"),
            "trades_count": len(bt.get("trades", [])),
            "results": bt.get("results"),
            "created_at": bt["created_at"].isoformat() if isinstance(bt["created_at"], datetime) else bt["created_at"]
        })
    
    return {"backtests": result}

@router.get("/{backtest_id}")
async def get_backtest(backtest_id: str, user: dict = Depends(get_current_user)):
    """Get a specific backtest with full details"""
    backtest = backtests_collection.find_one({"_id": backtest_id, "user_id": user["id"]})
    if not backtest:
        raise HTTPException(404, "Backtest non trouvé")
    
    return {
        "id": str(backtest["_id"]),
        "name": backtest["name"],
        "strategy_description": backtest["strategy_description"],
        "symbol": backtest["symbol"],
        "timeframe": backtest["timeframe"],
        "start_date": backtest["start_date"],
        "end_date": backtest["end_date"],
        "initial_capital": backtest["initial_capital"],
        "risk_per_trade": backtest["risk_per_trade"],
        "entry_rules": backtest["entry_rules"],
        "exit_rules": backtest["exit_rules"],
        "stop_loss_type": backtest["stop_loss_type"],
        "stop_loss_value": backtest["stop_loss_value"],
        "take_profit_type": backtest["take_profit_type"],
        "take_profit_value": backtest["take_profit_value"],
        "ai_analysis": backtest.get("ai_analysis"),
        "status": backtest.get("status", "pending"),
        "trades": backtest.get("trades", []),
        "results": backtest.get("results"),
        "created_at": backtest["created_at"].isoformat() if isinstance(backtest["created_at"], datetime) else backtest["created_at"]
    }

@router.post("/{backtest_id}/trades")
async def add_backtest_trade(backtest_id: str, trade: BacktestTrade, user: dict = Depends(get_current_user)):
    """Add a trade to a backtest"""
    backtest = backtests_collection.find_one({"_id": backtest_id, "user_id": user["id"]})
    if not backtest:
        raise HTTPException(404, "Backtest non trouvé")
    
    trade_data = {
        "id": str(uuid.uuid4()),
        **trade.model_dump(),
        "added_at": datetime.now(timezone.utc).isoformat()
    }
    
    backtests_collection.update_one(
        {"_id": backtest_id},
        {
            "$push": {"trades": trade_data},
            "$set": {"status": "in_progress", "updated_at": datetime.now(timezone.utc)}
        }
    )
    
    return {"message": "Trade ajouté", "trade_id": trade_data["id"]}

@router.post("/{backtest_id}/calculate")
async def calculate_backtest_results(backtest_id: str, user: dict = Depends(get_current_user)):
    """Calculate backtest results and get AI performance analysis"""
    backtest = backtests_collection.find_one({"_id": backtest_id, "user_id": user["id"]})
    if not backtest:
        raise HTTPException(404, "Backtest non trouvé")
    
    trades = backtest.get("trades", [])
    if len(trades) < 1:
        raise HTTPException(400, "Ajoutez au moins un trade pour calculer les résultats")
    
    # Calculate statistics
    initial_capital = backtest["initial_capital"]
    total_trades = len(trades)
    winning_trades = [t for t in trades if t["pnl"] > 0]
    losing_trades = [t for t in trades if t["pnl"] < 0]
    
    total_pnl = sum(t["pnl"] for t in trades)
    total_pnl_percent = sum(t["pnl_percent"] for t in trades)
    
    winrate = (len(winning_trades) / total_trades * 100) if total_trades > 0 else 0
    avg_win = sum(t["pnl"] for t in winning_trades) / len(winning_trades) if winning_trades else 0
    avg_loss = abs(sum(t["pnl"] for t in losing_trades) / len(losing_trades)) if losing_trades else 0
    profit_factor = (sum(t["pnl"] for t in winning_trades) / abs(sum(t["pnl"] for t in losing_trades))) if losing_trades and sum(t["pnl"] for t in losing_trades) != 0 else 0
    
    # Calculate max drawdown
    equity_curve = [initial_capital]
    for t in trades:
        equity_curve.append(equity_curve[-1] + t["pnl"])
    
    peak = initial_capital
    max_drawdown = 0
    max_drawdown_percent = 0
    for eq in equity_curve:
        if eq > peak:
            peak = eq
        drawdown = peak - eq
        drawdown_percent = (drawdown / peak * 100) if peak > 0 else 0
        if drawdown > max_drawdown:
            max_drawdown = drawdown
            max_drawdown_percent = drawdown_percent
    
    final_capital = equity_curve[-1]
    roi = ((final_capital - initial_capital) / initial_capital * 100) if initial_capital > 0 else 0
    
    results = {
        "total_trades": total_trades,
        "winning_trades": len(winning_trades),
        "losing_trades": len(losing_trades),
        "winrate": round(winrate, 2),
        "total_pnl": round(total_pnl, 2),
        "total_pnl_percent": round(total_pnl_percent, 2),
        "avg_win": round(avg_win, 2),
        "avg_loss": round(avg_loss, 2),
        "profit_factor": round(profit_factor, 2),
        "max_drawdown": round(max_drawdown, 2),
        "max_drawdown_percent": round(max_drawdown_percent, 2),
        "initial_capital": initial_capital,
        "final_capital": round(final_capital, 2),
        "roi": round(roi, 2),
        "equity_curve": [round(e, 2) for e in equity_curve]
    }
    
    # Get AI analysis
    user_data = users_collection.find_one({"_id": user["id"]})
    
    analysis_context = f"""Tu es un expert en analyse de performance de trading. Analyse ces résultats de backtest:

Stratégie: {backtest['name']}
Description: {backtest['strategy_description']}
Symbole: {backtest['symbol']} | Timeframe: {backtest['timeframe']}

RÉSULTATS:
- Trades: {results['total_trades']} ({results['winning_trades']} gagnants / {results['losing_trades']} perdants)
- Winrate: {results['winrate']}%
- PnL Total: {results['total_pnl']}€ ({results['total_pnl_percent']}%)
- Gain moyen: {results['avg_win']}€ | Perte moyenne: {results['avg_loss']}€
- Profit Factor: {results['profit_factor']}
- Drawdown Max: {results['max_drawdown']}€ ({results['max_drawdown_percent']}%)
- ROI: {results['roi']}%

Profil trader: {user_data.get('trading_style', 'N/A')} | Niveau: {user_data.get('experience_level', 'N/A')}

Fournis une analyse détaillée incluant:
1. **Verdict global** - Cette stratégie est-elle viable ?
2. **Points positifs**
3. **Points d'alerte**
4. **Recommandations** pour améliorer

Réponds en français."""

    try:
        response = client.chat.completions.create(
            model=TEXT_MODEL,
            messages=[
                {"role": "system", "content": analysis_context},
                {"role": "user", "content": "Analyse ces résultats de backtest."}
            ],
            max_tokens=1000
        )
        results["ai_performance_analysis"] = response.choices[0].message.content
    except Exception as e:
        results["ai_performance_analysis"] = f"Analyse IA non disponible: {str(e)}"
    
    # Update backtest
    backtests_collection.update_one(
        {"_id": backtest_id},
        {"$set": {
            "results": results,
            "status": "completed",
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    return results

@router.delete("/{backtest_id}")
async def delete_backtest(backtest_id: str, user: dict = Depends(get_current_user)):
    """Delete a backtest"""
    result = backtests_collection.delete_one({"_id": backtest_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(404, "Backtest non trouvé")
    return {"message": "Backtest supprimé"}

@router.delete("/{backtest_id}/trades/{trade_id}")
async def delete_backtest_trade(backtest_id: str, trade_id: str, user: dict = Depends(get_current_user)):
    """Delete a trade from a backtest"""
    result = backtests_collection.update_one(
        {"_id": backtest_id, "user_id": user["id"]},
        {
            "$pull": {"trades": {"id": trade_id}},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    if result.modified_count == 0:
        raise HTTPException(404, "Trade non trouvé")
    return {"message": "Trade supprimé"}
