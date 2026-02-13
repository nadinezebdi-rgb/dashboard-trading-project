"""
Tickets Router - Support tickets for expert consultations
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends

from utils.database import tickets_collection, users_collection
from utils.auth import get_current_user
from utils.models import TicketCreate, TicketReply

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])

@router.get("")
async def get_tickets(user: dict = Depends(get_current_user)):
    """Get user's tickets"""
    tickets = list(tickets_collection.find({"user_id": user["id"]}).sort("created_at", -1))
    
    result = []
    for t in tickets:
        result.append({
            "id": str(t["_id"]),
            "subject": t["subject"],
            "description": t["description"],
            "status": t.get("status", "open"),
            "priority": t.get("priority", "medium"),
            "replies_count": len(t.get("replies", [])),
            "created_at": t["created_at"].isoformat() if isinstance(t["created_at"], datetime) else t["created_at"]
        })
    
    return {"tickets": result}

@router.post("")
async def create_ticket(data: TicketCreate, user: dict = Depends(get_current_user)):
    """Create a new support ticket"""
    ticket_id = str(uuid.uuid4())
    
    ticket = {
        "_id": ticket_id,
        "user_id": user["id"],
        "subject": data.subject,
        "description": data.description,
        "priority": data.priority,
        "status": "open",
        "replies": [],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    tickets_collection.insert_one(ticket)
    
    return {"id": ticket_id, "message": "Ticket créé avec succès"}

@router.get("/{ticket_id}")
async def get_ticket(ticket_id: str, user: dict = Depends(get_current_user)):
    """Get a specific ticket with replies"""
    ticket = tickets_collection.find_one({"_id": ticket_id, "user_id": user["id"]})
    if not ticket:
        raise HTTPException(404, "Ticket non trouvé")
    
    return {
        "id": str(ticket["_id"]),
        "subject": ticket["subject"],
        "description": ticket["description"],
        "status": ticket.get("status", "open"),
        "priority": ticket.get("priority", "medium"),
        "replies": ticket.get("replies", []),
        "created_at": ticket["created_at"].isoformat() if isinstance(ticket["created_at"], datetime) else ticket["created_at"]
    }

@router.post("/{ticket_id}/reply")
async def reply_to_ticket(ticket_id: str, data: TicketReply, user: dict = Depends(get_current_user)):
    """Add a reply to a ticket"""
    ticket = tickets_collection.find_one({"_id": ticket_id, "user_id": user["id"]})
    if not ticket:
        raise HTTPException(404, "Ticket non trouvé")
    
    reply = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "message": data.message,
        "is_expert": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    tickets_collection.update_one(
        {"_id": ticket_id},
        {
            "$push": {"replies": reply},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    return {"message": "Réponse ajoutée"}

@router.put("/{ticket_id}/close")
async def close_ticket(ticket_id: str, user: dict = Depends(get_current_user)):
    """Close a ticket"""
    result = tickets_collection.update_one(
        {"_id": ticket_id, "user_id": user["id"]},
        {"$set": {"status": "closed", "updated_at": datetime.now(timezone.utc)}}
    )
    if result.modified_count == 0:
        raise HTTPException(404, "Ticket non trouvé")
    return {"message": "Ticket fermé"}
