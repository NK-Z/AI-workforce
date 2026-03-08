from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from database import get_db
from models import CalendarToken, User, gen_uuid
from auth import get_current_user
from services.calendar_service import get_authorization_url, exchange_code, get_upcoming_events
from config import FRONTEND_URL, GOOGLE_CLIENT_ID

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("/auth-url")
def calendar_auth_url(user: User = Depends(get_current_user)):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=501,
            detail="Google Calendar integration is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
        )
    url = get_authorization_url()
    if not url:
        raise HTTPException(status_code=500, detail="Failed to generate auth URL")
    return {"url": url}


@router.get("/callback")
def calendar_callback(
    code: str,
    state: str = None,
    db: Session = Depends(get_db),
):
    """OAuth callback from Google. Stores tokens and redirects to frontend."""
    access_token, refresh_token, expires_at = exchange_code(code)
    if not access_token:
        return RedirectResponse(f"{FRONTEND_URL}?calendar=error")

    # We need user context here. For the callback flow, we use 'state' param
    # to pass user_id. If not available, redirect with a temp token.
    # In production, state should contain an encrypted user_id.
    # For now, store with state as user_id.
    if state:
        existing = db.query(CalendarToken).filter(CalendarToken.user_id == state).first()
        if existing:
            existing.access_token = access_token
            existing.refresh_token = refresh_token or existing.refresh_token
            existing.expires_at = expires_at
        else:
            token_entry = CalendarToken(
                id=gen_uuid(),
                user_id=state,
                access_token=access_token,
                refresh_token=refresh_token or "",
                expires_at=expires_at,
            )
            db.add(token_entry)
        db.commit()

    return RedirectResponse(f"{FRONTEND_URL}?calendar=connected")


@router.get("/events")
def get_events(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    token_entry = db.query(CalendarToken).filter(CalendarToken.user_id == user.id).first()
    if not token_entry:
        raise HTTPException(status_code=404, detail="Calendar not connected")

    try:
        events, new_access_token = get_upcoming_events(
            token_entry.access_token,
            token_entry.refresh_token,
            token_entry.expires_at,
        )
        # Update access token if refreshed
        if new_access_token != token_entry.access_token:
            token_entry.access_token = new_access_token
            db.commit()
        return {"events": events}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calendar error: {str(e)[:100]}")


@router.get("/status")
def calendar_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    token_entry = db.query(CalendarToken).filter(CalendarToken.user_id == user.id).first()
    return {"connected": token_entry is not None}


@router.delete("/disconnect")
def disconnect_calendar(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    token_entry = db.query(CalendarToken).filter(CalendarToken.user_id == user.id).first()
    if token_entry:
        db.delete(token_entry)
        db.commit()
    return {"ok": True}
