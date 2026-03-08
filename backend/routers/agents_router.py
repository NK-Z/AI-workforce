from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Agent, Task, User, gen_uuid
from schemas import AgentCreate, AgentUpdate, AgentResponse
from auth import get_current_user

router = APIRouter(prefix="/agents", tags=["agents"])


def agent_to_response(agent: Agent, db: Session) -> AgentResponse:
    completed = db.query(Task).filter(
        Task.agent_id == agent.id, Task.status == "completed"
    ).count()
    active = db.query(Task).filter(
        Task.agent_id == agent.id, Task.status != "completed"
    ).count()
    return AgentResponse(
        id=agent.id,
        name=agent.name,
        role=agent.role,
        personality=agent.personality,
        skills=agent.skills or [],
        color=agent.color,
        status=agent.status,
        efficiency=agent.efficiency,
        system_prompt=agent.system_prompt or "",
        hired_at=agent.hired_at,
        tasks_completed=completed,
        tasks_active=active,
    )


@router.get("/", response_model=list)
def list_agents(
    status: str = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Agent).filter(Agent.user_id == user.id)
    if status:
        q = q.filter(Agent.status == status)
    agents = q.order_by(Agent.hired_at.desc()).all()
    return [agent_to_response(a, db) for a in agents]


@router.post("/", response_model=AgentResponse)
def create_agent(
    req: AgentCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    import random
    agent = Agent(
        id=gen_uuid(),
        user_id=user.id,
        name=req.name,
        role=req.role,
        personality=req.personality,
        skills=req.skills,
        color=req.color,
        system_prompt=req.system_prompt,
        status="active",
        efficiency=85 + random.randint(0, 14),
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent_to_response(agent, db)


@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(
    agent_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent_to_response(agent, db)


@router.patch("/{agent_id}", response_model=AgentResponse)
def update_agent(
    agent_id: str,
    req: AgentUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    for field, value in req.dict(exclude_unset=True).items():
        setattr(agent, field, value)
    db.commit()
    db.refresh(agent)
    return agent_to_response(agent, db)


@router.delete("/{agent_id}")
def delete_agent(
    agent_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    # Unassign tasks
    db.query(Task).filter(Task.agent_id == agent_id).update({"agent_id": None})
    db.delete(agent)
    db.commit()
    return {"ok": True}
