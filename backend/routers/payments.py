"""
Payments Router - Stripe integration for subscriptions
"""
import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional

from utils.database import users_collection, payment_transactions_collection
from utils.auth import get_current_user

router = APIRouter(prefix="/api/payments", tags=["Payments"])

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")

# Subscription plans
PLANS = {
    "free": {
        "id": "free",
        "name": "Gratuit",
        "price": 0,
        "interval": "month",
        "features": [
            "Journal de trading basique",
            "5 trades par mois",
            "Statistiques de base",
            "Accès communauté"
        ]
    },
    "pro": {
        "id": "pro",
        "name": "Pro",
        "price": 29,
        "interval": "month",
        "stripe_price_id": os.environ.get("STRIPE_PRO_PRICE_ID"),
        "features": [
            "Trades illimités",
            "Analyse IA de setups",
            "Coaching IA personnalisé",
            "Briefing quotidien",
            "Backtesting assisté",
            "Statistiques avancées",
            "Export CSV/PDF",
            "Support prioritaire"
        ]
    },
    "elite": {
        "id": "elite",
        "name": "Elite",
        "price": 79,
        "interval": "month",
        "stripe_price_id": os.environ.get("STRIPE_ELITE_PRICE_ID"),
        "features": [
            "Tout Pro inclus",
            "Consultations experts",
            "Webinaires exclusifs",
            "Mentoring privé",
            "API access",
            "White-label reports"
        ]
    }
}

class CheckoutRequest(BaseModel):
    plan_id: str
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None

@router.get("/plans")
async def get_plans():
    """Get available subscription plans"""
    return {"plans": list(PLANS.values())}

@router.get("/current")
async def get_current_subscription(user: dict = Depends(get_current_user)):
    """Get user's current subscription"""
    user_data = users_collection.find_one({"_id": user["id"]})
    subscription = user_data.get("subscription", "free")
    
    return {
        "subscription": subscription,
        "plan": PLANS.get(subscription, PLANS["free"]),
        "stripe_customer_id": user_data.get("stripe_customer_id"),
        "subscription_end": user_data.get("subscription_end")
    }

@router.post("/checkout")
async def create_checkout_session(data: CheckoutRequest, user: dict = Depends(get_current_user)):
    """Create a Stripe checkout session"""
    if not STRIPE_API_KEY:
        raise HTTPException(500, "Stripe non configuré")
    
    plan = PLANS.get(data.plan_id)
    if not plan:
        raise HTTPException(400, "Plan invalide")
    
    if plan["price"] == 0:
        raise HTTPException(400, "Le plan gratuit ne nécessite pas de paiement")
    
    try:
        import stripe
        stripe.api_key = STRIPE_API_KEY
        
        user_data = users_collection.find_one({"_id": user["id"]})
        
        # Get or create Stripe customer
        customer_id = user_data.get("stripe_customer_id")
        if not customer_id:
            customer = stripe.Customer.create(
                email=user_data["email"],
                name=user_data.get("name", ""),
                metadata={"user_id": user["id"]}
            )
            customer_id = customer.id
            users_collection.update_one(
                {"_id": user["id"]},
                {"$set": {"stripe_customer_id": customer_id}}
            )
        
        # Create checkout session
        success_url = data.success_url or f"{os.environ.get('FRONTEND_URL', '')}/subscription?success=true"
        cancel_url = data.cancel_url or f"{os.environ.get('FRONTEND_URL', '')}/subscription?canceled=true"
        
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price": plan["stripe_price_id"],
                "quantity": 1
            }],
            mode="subscription",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"user_id": user["id"], "plan_id": data.plan_id}
        )
        
        # Save transaction
        payment_transactions_collection.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": user["id"],
            "session_id": session.id,
            "plan_id": data.plan_id,
            "status": "pending",
            "created_at": datetime.now(timezone.utc)
        })
        
        return {"checkout_url": session.url, "session_id": session.id}
    
    except Exception as e:
        raise HTTPException(500, f"Erreur Stripe: {str(e)}")

@router.get("/status/{session_id}")
async def get_payment_status(session_id: str, user: dict = Depends(get_current_user)):
    """Check payment status"""
    transaction = payment_transactions_collection.find_one({
        "session_id": session_id,
        "user_id": user["id"]
    })
    
    if not transaction:
        raise HTTPException(404, "Transaction non trouvée")
    
    if STRIPE_API_KEY and transaction["status"] == "pending":
        try:
            import stripe
            stripe.api_key = STRIPE_API_KEY
            session = stripe.checkout.Session.retrieve(session_id)
            
            if session.payment_status == "paid":
                # Update transaction and user subscription
                payment_transactions_collection.update_one(
                    {"session_id": session_id},
                    {"$set": {"status": "completed", "updated_at": datetime.now(timezone.utc)}}
                )
                users_collection.update_one(
                    {"_id": user["id"]},
                    {"$set": {
                        "subscription": transaction["plan_id"],
                        "subscription_updated_at": datetime.now(timezone.utc)
                    }}
                )
                return {"status": "completed", "plan": transaction["plan_id"]}
        except Exception:
            pass
    
    return {"status": transaction["status"], "plan": transaction.get("plan_id")}

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    if not STRIPE_API_KEY or not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(500, "Webhook non configuré")
    
    try:
        import stripe
        stripe.api_key = STRIPE_API_KEY
        
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")
        
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
        
        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            user_id = session["metadata"].get("user_id")
            plan_id = session["metadata"].get("plan_id")
            
            if user_id and plan_id:
                users_collection.update_one(
                    {"_id": user_id},
                    {"$set": {
                        "subscription": plan_id,
                        "stripe_subscription_id": session.get("subscription"),
                        "subscription_updated_at": datetime.now(timezone.utc)
                    }}
                )
                payment_transactions_collection.update_one(
                    {"session_id": session["id"]},
                    {"$set": {"status": "completed", "updated_at": datetime.now(timezone.utc)}}
                )
        
        elif event["type"] == "customer.subscription.deleted":
            subscription = event["data"]["object"]
            customer_id = subscription["customer"]
            
            user = users_collection.find_one({"stripe_customer_id": customer_id})
            if user:
                users_collection.update_one(
                    {"_id": user["_id"]},
                    {"$set": {
                        "subscription": "free",
                        "subscription_updated_at": datetime.now(timezone.utc)
                    }}
                )
        
        return {"status": "success"}
    
    except Exception as e:
        raise HTTPException(400, f"Webhook error: {str(e)}")

@router.post("/cancel")
async def cancel_subscription(user: dict = Depends(get_current_user)):
    """Cancel user's subscription"""
    if not STRIPE_API_KEY:
        raise HTTPException(500, "Stripe non configuré")
    
    user_data = users_collection.find_one({"_id": user["id"]})
    subscription_id = user_data.get("stripe_subscription_id")
    
    if not subscription_id:
        raise HTTPException(400, "Aucun abonnement actif")
    
    try:
        import stripe
        stripe.api_key = STRIPE_API_KEY
        
        stripe.Subscription.delete(subscription_id)
        
        users_collection.update_one(
            {"_id": user["id"]},
            {"$set": {
                "subscription": "free",
                "stripe_subscription_id": None,
                "subscription_updated_at": datetime.now(timezone.utc)
            }}
        )
        
        return {"message": "Abonnement annulé"}
    
    except Exception as e:
        raise HTTPException(500, f"Erreur: {str(e)}")
