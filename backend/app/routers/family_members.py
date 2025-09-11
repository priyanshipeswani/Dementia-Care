from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db, User, FamilyMember
from app import schemas
from app.auth import get_current_user

router = APIRouter(
    tags=["family-members"]
)

@router.get("/", response_model=List[schemas.FamilyMember])
def get_family_members(
    user_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get family members with optional filtering"""
    query = db.query(FamilyMember)
    
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
        # Elder user - show their own family members
        target_user_id = current_user.id
    
    # Filter by the determined user_id
    query = query.filter(FamilyMember.user_id == target_user_id)
    
    family_members = query.offset(skip).limit(limit).all()
    return family_members

@router.post("/", response_model=schemas.FamilyMember)
def create_family_member(
    family_member: schemas.FamilyMemberCreate,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new family member"""
    # Verify the user exists and the current user has permission
    if current_user.user_type != schemas.UserType.CAREGIVER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only caregivers can create family members"
        )
    
    # Check if the target user exists
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user not found"
        )
    
    # Create the family member
    db_family_member = FamilyMember(
        **family_member.dict(),
        user_id=user_id,
        created_at=datetime.utcnow()
    )
    
    db.add(db_family_member)
    db.commit()
    db.refresh(db_family_member)
    
    return db_family_member

@router.get("/{family_member_id}", response_model=schemas.FamilyMember)
def get_family_member(
    family_member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific family member by ID"""
    family_member = db.query(FamilyMember).filter(FamilyMember.id == family_member_id).first()
    
    if not family_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family member not found"
        )
    
    # Check permissions - caregivers can see all family members, elders only their own
    if (current_user.user_type == schemas.UserType.ELDER and 
        family_member.user_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return family_member

@router.put("/{family_member_id}", response_model=schemas.FamilyMember)
def update_family_member(
    family_member_id: int,
    family_member_update: schemas.FamilyMemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a family member"""
    family_member = db.query(FamilyMember).filter(FamilyMember.id == family_member_id).first()
    
    if not family_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family member not found"
        )
    
    # Only caregivers can update family members
    if current_user.user_type != schemas.UserType.CAREGIVER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only caregivers can update family members"
        )
    
    # Update family member fields
    update_data = family_member_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(family_member, field, value)
    
    family_member.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(family_member)
    
    return family_member

@router.delete("/{family_member_id}")
def delete_family_member(
    family_member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a family member"""
    family_member = db.query(FamilyMember).filter(FamilyMember.id == family_member_id).first()
    
    if not family_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family member not found"
        )
    
    # Only caregivers can delete family members
    if current_user.user_type != schemas.UserType.CAREGIVER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only caregivers can delete family members"
        )
    
    db.delete(family_member)
    db.commit()
    
    return {"message": "Family member deleted successfully"}
