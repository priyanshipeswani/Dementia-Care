from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import uuid
from datetime import datetime
import json
from PIL import Image

from app.database import get_db, Photo, User
from app.schemas import Photo as PhotoSchema, PhotoCreate, PhotoUpdate
from app.auth import get_current_active_user

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads/photos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Allowed image formats
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def validate_image(file: UploadFile) -> bool:
    """Validate uploaded image file"""
    # Check file extension
    file_ext = os.path.splitext(file.filename.lower())[1] if file.filename else ""
    if file_ext not in ALLOWED_EXTENSIONS:
        return False
    
    # Check file size
    if file.size and file.size > MAX_FILE_SIZE:
        return False
    
    return True

def save_uploaded_file(file: UploadFile, user_id: int) -> tuple[str, str]:
    """Save uploaded file and return filename and file path"""
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    
    # Create user-specific directory
    user_dir = os.path.join(UPLOAD_DIR, str(user_id))
    os.makedirs(user_dir, exist_ok=True)
    
    # Save file
    file_path = os.path.join(user_dir, unique_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Resize image if too large (optional optimization)
    try:
        with Image.open(file_path) as img:
            # Resize if width > 1920px
            if img.width > 1920:
                ratio = 1920 / img.width
                new_height = int(img.height * ratio)
                img = img.resize((1920, new_height), Image.Resampling.LANCZOS)
                img.save(file_path, optimize=True, quality=85)
    except Exception:
        pass  # Continue if image processing fails
    
    return unique_filename, file_path

@router.post("/upload", response_model=PhotoSchema)
async def upload_photo(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    people_in_photo: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    memory_context: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload a new photo with metadata"""
    
    # Validate file
    if not validate_image(file):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file. Please upload a valid image file (max 10MB)"
        )
    
    try:
        # Save file
        filename, file_path = save_uploaded_file(file, current_user.id)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Create photo record
        db_photo = Photo(
            user_id=current_user.id,
            filename=filename,
            original_filename=file.filename or "unknown",
            file_path=file_path,
            file_size=file_size,
            title=title,
            description=description,
            tags=tags,
            people_in_photo=people_in_photo,
            location=location,
            memory_context=memory_context,
            recognition_level="unknown"
        )
        
        db.add(db_photo)
        db.commit()
        db.refresh(db_photo)
        
        return db_photo
        
    except Exception as e:
        # Clean up file if database operation fails
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload photo: {str(e)}"
        )

@router.get("/", response_model=List[PhotoSchema])
async def get_photos(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all photos for the current user"""
    photos = db.query(Photo).filter(
        Photo.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return photos

@router.get("/{photo_id}", response_model=PhotoSchema)
async def get_photo(
    photo_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific photo"""
    photo = db.query(Photo).filter(
        Photo.id == photo_id,
        Photo.user_id == current_user.id
    ).first()
    
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )
    
    return photo

@router.put("/{photo_id}", response_model=PhotoSchema)
async def update_photo(
    photo_id: int,
    photo_update: PhotoUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update photo metadata"""
    photo = db.query(Photo).filter(
        Photo.id == photo_id,
        Photo.user_id == current_user.id
    ).first()
    
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )
    
    # Update fields
    update_data = photo_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(photo, field, value)
    
    db.commit()
    db.refresh(photo)
    
    return photo

@router.delete("/{photo_id}")
async def delete_photo(
    photo_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a photo"""
    photo = db.query(Photo).filter(
        Photo.id == photo_id,
        Photo.user_id == current_user.id
    ).first()
    
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )
    
    # Delete file from filesystem
    if os.path.exists(photo.file_path):
        os.remove(photo.file_path)
    
    # Delete from database
    db.delete(photo)
    db.commit()
    
    return {"message": "Photo deleted successfully"}

@router.get("/serve/{photo_id}")
async def serve_photo(
    photo_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Serve the actual image file"""
    from fastapi.responses import FileResponse
    
    photo = db.query(Photo).filter(
        Photo.id == photo_id,
        Photo.user_id == current_user.id
    ).first()
    
    if not photo or not os.path.exists(photo.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )
    
    return FileResponse(
        photo.file_path,
        media_type="image/jpeg",
        filename=photo.original_filename
    )
