from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db, User, FamilyMember, user_family_association
from app.schemas import (
    UserProfile, UserUpdate, FamilyMember as FamilyMemberSchema,
    FamilyMemberCreate, FamilyMemberUpdate, DashboardData,
    MessageResponse, UserWithFamilyMembers
)
from app.auth import get_current_active_user, get_current_caregiver

router = APIRouter()

@router.get("/profile", response_model=UserProfile)
async def get_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's profile"""
    return current_user

@router.put("/profile", response_model=UserProfile)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    update_data = user_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/family-members", response_model=List[FamilyMemberSchema])
async def get_family_members(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all family members for current user"""
    return current_user.family_members

@router.post("/family-members", response_model=FamilyMemberSchema)
async def create_family_member(
    family_member: FamilyMemberCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new family member"""
    db_family_member = FamilyMember(**family_member.dict())
    db.add(db_family_member)
    db.flush()  # Get the ID without committing
    
    # Associate with current user
    current_user.family_members.append(db_family_member)
    
    db.commit()
    db.refresh(db_family_member)
    return db_family_member

@router.put("/family-members/{member_id}", response_model=FamilyMemberSchema)
async def update_family_member(
    member_id: int,
    family_member_update: FamilyMemberUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a family member"""
    # Check if family member belongs to current user
    family_member = db.query(FamilyMember).filter(
        FamilyMember.id == member_id
    ).first()
    
    if not family_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family member not found"
        )
    
    # Check if user has access to this family member
    if family_member not in current_user.family_members:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    update_data = family_member_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(family_member, field, value)
    
    db.commit()
    db.refresh(family_member)
    return family_member

@router.delete("/family-members/{member_id}", response_model=MessageResponse)
async def delete_family_member(
    member_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a family member"""
    family_member = db.query(FamilyMember).filter(
        FamilyMember.id == member_id
    ).first()
    
    if not family_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family member not found"
        )
    
    # Check if user has access to this family member
    if family_member not in current_user.family_members:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Remove association and delete
    current_user.family_members.remove(family_member)
    db.delete(family_member)
    db.commit()
    
    return MessageResponse(
        message="Family member deleted successfully",
        success=True
    )

@router.get("/dashboard", response_model=DashboardData)
async def get_dashboard_data(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get dashboard data for current user"""
    # Get recent interactions (last 10)
    recent_interactions = db.query(current_user.interactions).order_by(
        current_user.interactions.created_at.desc()
    ).limit(10).all()
    
    # Count knowledge entities
    knowledge_entities_count = len(current_user.knowledge_entities)
    
    return DashboardData(
        user=current_user,
        family_members=current_user.family_members,
        recent_interactions=recent_interactions,
        knowledge_entities_count=knowledge_entities_count
    )
