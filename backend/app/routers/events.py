from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db, User, Event
from app import schemas
from app.auth import get_current_user

router = APIRouter(
    tags=["events"]
)

@router.get("/", response_model=List[schemas.Event])
def get_events(
    user_id: int = None,
    event_type: schemas.EventType = None,
    status: schemas.EventStatus = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get events with optional filtering"""
    query = db.query(Event)
    
    # Handle caregiver-elder relationship
    if current_user.user_type == schemas.UserType.CAREGIVER:
        # Find corresponding elder account (elder_<caregiver_email>)
        elder_email = f"elder_{current_user.email}"
        elder_user = db.query(User).filter(User.email == elder_email).first()
        if elder_user:
            target_user_id = elder_user.id
        else:
            # Fallback to using provided user_id or caregiver's own id
            target_user_id = user_id if user_id else current_user.id
    else:
        # Elder user - show their own events
        target_user_id = current_user.id
    
    # Filter by the determined user_id
    query = query.filter(Event.user_id == target_user_id)
    
    # Filter by event type if provided
    if event_type:
        query = query.filter(Event.event_type == event_type)
    
    # Filter by status if provided
    if status:
        query = query.filter(Event.status == status)
    
    # Order by scheduled date
    query = query.order_by(Event.scheduled_date)
    
    events = query.offset(skip).limit(limit).all()
    return events

@router.post("/", response_model=schemas.Event)
def create_event(
    event: schemas.EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new event"""
    # Verify the current user has permission
    if current_user.user_type != schemas.UserType.CAREGIVER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only caregivers can create events"
        )
    
    # Determine target user ID (same logic as get_events)
    elder_email = f"elder_{current_user.email}"
    elder_user = db.query(User).filter(User.email == elder_email).first()
    if elder_user:
        target_user_id = elder_user.id
    else:
        # Fallback to provided user_id or current user
        target_user_id = event.user_id if event.user_id else current_user.id
    
    # Create the event data dict and override user_id
    event_data = event.dict(exclude={'related_family_members', 'related_photos'})
    event_data['user_id'] = target_user_id
    
    # Create the event
    db_event = Event(
        **event_data,
        created_by=current_user.id,
        status=schemas.EventStatus.SCHEDULED,
        created_at=datetime.utcnow()
    )
    
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    return db_event

@router.get("/{event_id}", response_model=schemas.Event)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific event by ID"""
    event = db.query(Event).filter(Event.id == event_id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Check permissions - caregivers can see all events, elders only their own
    if (current_user.user_type == schemas.UserType.ELDER and 
        event.user_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return event

@router.put("/{event_id}", response_model=schemas.Event)
def update_event(
    event_id: int,
    event_update: schemas.EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an event"""
    event = db.query(Event).filter(Event.id == event_id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Only caregivers can update events
    if current_user.user_type != schemas.UserType.CAREGIVER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only caregivers can update events"
        )
    
    # Update event fields
    update_data = event_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)
    
    event.updated_at = datetime.utcnow()
    
    # If marking as completed, set completion time
    if event_update.status == schemas.EventStatus.COMPLETED and not event.completed_at:
        event.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(event)
    
    return event

@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an event"""
    event = db.query(Event).filter(Event.id == event_id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Only caregivers can delete events
    if current_user.user_type != schemas.UserType.CAREGIVER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only caregivers can delete events"
        )
    
    db.delete(event)
    db.commit()
    
    return {"message": "Event deleted successfully"}
