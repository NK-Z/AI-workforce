from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


# ===== Auth =====
class RegisterRequest(BaseModel):
    email: str
    password: str
    display_name: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str
    created_at: datetime


# ===== Agent =====
class AgentCreate(BaseModel):
    name: str
    role: str
    personality: str = "professional"
    skills: List[str] = []
    color: str = "#6366f1"
    system_prompt: str = ""


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    personality: Optional[str] = None
    skills: Optional[List[str]] = None
    color: Optional[str] = None
    system_prompt: Optional[str] = None


class AgentResponse(BaseModel):
    id: str
    name: str
    role: str
    personality: str
    skills: list
    color: str
    status: str
    efficiency: int
    system_prompt: str
    hired_at: datetime
    tasks_completed: int = 0
    tasks_active: int = 0


# ===== Task =====
class TaskCreate(BaseModel):
    title: str
    description: str = ""
    agent_id: Optional[str] = None
    priority: str = "medium"
    deadline: Optional[date] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    agent_id: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[date] = None


class TaskResponse(BaseModel):
    id: str
    title: str
    description: str
    agent_id: Optional[str]
    priority: str
    status: str
    deadline: Optional[date]
    created_at: datetime
    agent_name: Optional[str] = None
    agent_color: Optional[str] = None


# ===== Chat =====
class ChatSendRequest(BaseModel):
    message: str


class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime


# ===== Calendar =====
class CalendarEventResponse(BaseModel):
    id: str
    summary: str
    start: str
    end: str
    location: Optional[str] = None
