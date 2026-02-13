"""
Pydantic models for the API
"""
from typing import Optional, List
from pydantic import BaseModel, Field

# Auth models
class UserRegister(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class QuestionnaireData(BaseModel):
    trading_style: str
    experience_level: str
    preferred_markets: List[str]
    trading_goals: List[str]
    risk_tolerance: str
    available_hours: str

# Trade models
class TradeCreate(BaseModel):
    symbol: str
    direction: str
    entry_price: float
    exit_price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    position_size: float
    notes: Optional[str] = None
    screenshot_base64: Optional[str] = None
    setup_type: Optional[str] = None
    emotions: Optional[str] = None
    followed_plan: Optional[bool] = None

class TradeUpdate(BaseModel):
    exit_price: Optional[float] = None
    notes: Optional[str] = None
    emotions: Optional[str] = None
    followed_plan: Optional[bool] = None

# AI models
class AIMessage(BaseModel):
    message: str
    context: Optional[str] = None

class SetupAnalysis(BaseModel):
    screenshot_base64: str
    symbol: Optional[str] = None
    timeframe: Optional[str] = None
    notes: Optional[str] = None

# Community models
class CommunityPostCreate(BaseModel):
    title: str
    content: str
    tags: List[str] = []
    screenshot_base64: Optional[str] = None

class CommunityComment(BaseModel):
    content: str

class ChallengeJoin(BaseModel):
    challenge_id: str

# Payment models
class CheckoutRequest(BaseModel):
    plan: str
    origin_url: str

# Ticket models
class TicketCreate(BaseModel):
    subject: str
    description: str
    priority: str = "medium"

class TicketReply(BaseModel):
    message: str

# Backtest models
class BacktestCreate(BaseModel):
    name: str
    strategy_description: str
    symbol: str
    timeframe: str
    start_date: str
    end_date: str
    initial_capital: float = 10000.0
    risk_per_trade: float = 1.0
    entry_rules: List[str]
    exit_rules: List[str]
    stop_loss_type: str = "fixed"
    stop_loss_value: float = 1.0
    take_profit_type: str = "fixed"
    take_profit_value: float = 2.0

class BacktestTrade(BaseModel):
    entry_date: str
    exit_date: str
    direction: str
    entry_price: float
    exit_price: float
    pnl: float
    pnl_percent: float
    notes: Optional[str] = None

class BacktestResults(BaseModel):
    backtest_id: str
    trades: List[BacktestTrade]
