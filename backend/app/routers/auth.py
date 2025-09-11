from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

from app.database import get_db, User
from app.schemas import (
    LoginRequest, Token, AuthResponse, CaregiverRegisterRequest, ElderRegisterRequest,
    UserCreate, UserProfile, MessageResponse, UserType
)
from app.auth import (
    authenticate_user, create_access_token, get_password_hash,
    get_current_active_user, ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter()
security = HTTPBearer()

@router.post("/login", response_model=Token)
async def login(login_request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user and return access token
    user_type: from request body to specify 'elder' or 'caregiver' interface
    """
    user = authenticate_user(db, login_request.email, login_request.password, login_request.user_type)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_type": user.user_type, "user_id": user.id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": user.user_type,
        "user_id": user.id
    }

@router.post("/register/caregiver", response_model=AuthResponse)
async def register_caregiver(
    caregiver_data: CaregiverRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new caregiver
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == caregiver_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new caregiver user
    hashed_password = get_password_hash(caregiver_data.password)
    
    # Create caregiver account
    db_caregiver = User(
        email=caregiver_data.email,
        hashed_password=hashed_password,
        full_name=caregiver_data.full_name,
        user_type="caregiver",
        phone_number=caregiver_data.phone_number,
        organization=caregiver_data.organization,
        license_number=caregiver_data.license_number,
        is_active=True
    )
    
    db.add(db_caregiver)
    db.commit()
    db.refresh(db_caregiver)
    
    # Create corresponding elder account with same credentials
    db_elder = User(
        email=f"elder_{caregiver_data.email}",  # Temporary different email to avoid constraint
        hashed_password=hashed_password,  # Same password
        full_name=f"{caregiver_data.full_name} (Elder)",
        user_type="elder",
        phone_number=caregiver_data.phone_number,
        emergency_contact=caregiver_data.full_name,  # Caregiver as emergency contact
        is_active=True
    )
    
    db.add(db_elder)
    db.commit()
    db.refresh(db_elder)
    
    # Update elder email to match caregiver (for shared login)
    # We'll handle this in the auth logic instead to avoid unique constraint issues
    
    # Create access token for immediate login (default to caregiver account)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_caregiver.email, "user_type": db_caregiver.user_type, "user_id": db_caregiver.id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserProfile.model_validate(db_caregiver)
    }

@router.post("/register/elder", response_model=AuthResponse)
async def register_elder(
    elder_data: ElderRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new elder user
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == elder_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new elder user
    hashed_password = get_password_hash(elder_data.password)
    
    db_user = User(
        email=elder_data.email,
        hashed_password=hashed_password,
        full_name=elder_data.full_name,
        user_type="elder",
        phone_number=elder_data.phone_number,
        date_of_birth=elder_data.date_of_birth,
        emergency_contact=elder_data.emergency_contact,
        is_active=True
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create access token for immediate login
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email, "user_type": db_user.user_type, "user_id": db_user.id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserProfile.model_validate(db_user)
    }

@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user's profile information
    """
    return current_user

@router.post("/logout", response_model=MessageResponse)
async def logout():
    """
    Logout endpoint (client should remove token)
    """
    return MessageResponse(
        message="Successfully logged out",
        success=True
    )

@router.get("/verify", response_model=UserProfile)
async def verify_token(
    current_user: User = Depends(get_current_active_user)
):
    """
    Verify if the current token is valid and return user info
    """
    return current_user
