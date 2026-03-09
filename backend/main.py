from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from config import FRONTEND_URL
from routers import auth_router, agents_router, tasks_router, chat_router, calendar_router

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Workforce API",
    description="Backend API for the AI Workforce virtual office platform.",
    version="1.0.0",
)

# CORS — allow frontend origins
allowed_origins = [
    FRONTEND_URL,
    "https://nk-z.github.io",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router.router)
app.include_router(agents_router.router)
app.include_router(tasks_router.router)
app.include_router(chat_router.router)
app.include_router(calendar_router.router)


@app.get("/")
def root():
    return {
        "service": "AI Workforce API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
