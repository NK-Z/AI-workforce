import threading
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Task, Agent, User, gen_uuid
from schemas import TaskCreate, TaskUpdate, TaskResponse
from auth import get_current_user

router = APIRouter(prefix="/tasks", tags=["tasks"])


def task_to_response(task: Task, db: Session) -> dict:
    agent = None
    if task.agent_id:
        agent = db.query(Agent).filter(Agent.id == task.agent_id).first()
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description or "",
        "agent_id": task.agent_id,
        "priority": task.priority,
        "status": task.status,
        "deadline": task.deadline.isoformat() if task.deadline else None,
        "result": task.result or "",
        "progress_note": task.progress_note or "",
        "started_at": task.started_at.isoformat() if task.started_at else None,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
        "created_at": task.created_at.isoformat(),
        "agent_name": agent.name if agent else None,
        "agent_color": agent.color if agent else None,
    }


def maybe_auto_execute(task: Task, user_name: str):
    """If task has an agent assigned, launch background execution."""
    if task.agent_id and task.status == "todo":
        from services.task_executor import execute_task_background
        t = threading.Thread(
            target=execute_task_background,
            args=(task.id, user_name),
            daemon=True,
        )
        t.start()


@router.get("/", response_model=list)
def list_tasks(
    status: str = None,
    agent_id: str = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Task).filter(Task.user_id == user.id)
    if status:
        q = q.filter(Task.status == status)
    if agent_id:
        q = q.filter(Task.agent_id == agent_id)
    tasks = q.order_by(Task.created_at.desc()).all()
    return [task_to_response(t, db) for t in tasks]


@router.post("/", response_model=dict)
def create_task(
    req: TaskCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.agent_id:
        agent = db.query(Agent).filter(Agent.id == req.agent_id, Agent.user_id == user.id).first()
        if not agent:
            raise HTTPException(status_code=400, detail="Agent not found")

    task = Task(
        id=gen_uuid(),
        user_id=user.id,
        title=req.title,
        description=req.description,
        agent_id=req.agent_id,
        priority=req.priority,
        deadline=req.deadline,
        status="todo",
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # Auto-execute if agent assigned
    maybe_auto_execute(task, user.display_name or user.email)
    return task_to_response(task, db)


@router.get("/{task_id}", response_model=dict)
def get_task(
    task_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_to_response(task, db)


@router.patch("/{task_id}", response_model=dict)
def update_task(
    task_id: str,
    req: TaskUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    old_agent_id = task.agent_id
    for field, value in req.dict(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)

    # If agent was just assigned (or changed) and task is still todo, auto-execute
    agent_changed = req.agent_id and req.agent_id != old_agent_id
    if agent_changed and task.status == "todo":
        maybe_auto_execute(task, user.display_name or user.email)

    return task_to_response(task, db)


@router.delete("/{task_id}")
def delete_task(
    task_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"ok": True}
