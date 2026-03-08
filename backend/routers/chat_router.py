import time
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import ChatMessage, Agent, Task, User, gen_uuid
from schemas import ChatSendRequest, ChatMessageResponse
from auth import get_current_user
from services.claude_service import get_agent_response
from config import CHAT_RATE_LIMIT

router = APIRouter(prefix="/chat", tags=["chat"])

# Simple in-memory rate limiter: {user_id: [timestamps]}
_rate_limits = defaultdict(list)


def check_rate_limit(user_id: str):
    now = time.time()
    window = 60  # 1 minute
    # Clean old entries
    _rate_limits[user_id] = [t for t in _rate_limits[user_id] if now - t < window]
    if len(_rate_limits[user_id]) >= CHAT_RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Max {CHAT_RATE_LIMIT} messages per minute.",
        )
    _rate_limits[user_id].append(now)


@router.get("/{agent_id}/history", response_model=list)
def get_chat_history(
    agent_id: str,
    limit: int = 50,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify agent belongs to user
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.agent_id == agent_id, ChatMessage.user_id == user.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
        .all()
    )
    return [
        ChatMessageResponse(
            id=m.id, role=m.role, content=m.content, created_at=m.created_at
        )
        for m in messages
    ]


@router.post("/{agent_id}/send", response_model=ChatMessageResponse)
def send_message(
    agent_id: str,
    req: ChatSendRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    check_rate_limit(user.id)

    # Verify agent belongs to user
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Save user message
    user_msg = ChatMessage(
        id=gen_uuid(),
        user_id=user.id,
        agent_id=agent_id,
        role="user",
        content=req.message,
    )
    db.add(user_msg)
    db.commit()

    # Get chat history for context
    history = (
        db.query(ChatMessage)
        .filter(ChatMessage.agent_id == agent_id, ChatMessage.user_id == user.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    # Get agent's current tasks
    tasks = (
        db.query(Task)
        .filter(Task.agent_id == agent_id, Task.user_id == user.id)
        .all()
    )

    # Call Claude API
    response_text = get_agent_response(
        agent=agent,
        user_message=req.message,
        chat_history=history,
        tasks=tasks,
        user_name=user.display_name or user.email,
    )

    # Save assistant message
    assistant_msg = ChatMessage(
        id=gen_uuid(),
        user_id=user.id,
        agent_id=agent_id,
        role="assistant",
        content=response_text,
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return ChatMessageResponse(
        id=assistant_msg.id,
        role=assistant_msg.role,
        content=assistant_msg.content,
        created_at=assistant_msg.created_at,
    )
