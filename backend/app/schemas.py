from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class UserType(str, Enum):
    CAREGIVER = "caregiver"
    ELDER = "elder"

class InteractionType(str, Enum):
    VOICE = "voice"
    TEXT = "text"
    EMERGENCY = "emergency"
    REMINDER = "reminder"

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    user_type: UserType
    phone_number: Optional[str] = None

class UserCreate(UserBase):
    password: str
    # Caregiver specific
    organization: Optional[str] = None
    license_number: Optional[str] = None
    # Elder specific
    date_of_birth: Optional[datetime] = None
    medical_conditions: Optional[str] = None
    medications: Optional[str] = None
    emergency_contact: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    organization: Optional[str] = None
    license_number: Optional[str] = None
    medical_conditions: Optional[str] = None
    medications: Optional[str] = None
    emergency_contact: Optional[str] = None
    preferences: Optional[str] = None
    cognitive_profile: Optional[str] = None

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserProfile(User):
    organization: Optional[str] = None
    license_number: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    medical_conditions: Optional[str] = None
    medications: Optional[str] = None
    emergency_contact: Optional[str] = None
    preferences: Optional[str] = None
    cognitive_profile: Optional[str] = None

# Family Member Schemas
class FamilyMemberBase(BaseModel):
    name: str
    relationship_type: str
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    is_emergency_contact: bool = False

class FamilyMemberCreate(FamilyMemberBase):
    photo_url: Optional[str] = None
    notes: Optional[str] = None

class FamilyMemberUpdate(BaseModel):
    name: Optional[str] = None
    relationship_type: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    is_emergency_contact: Optional[bool] = None
    photo_url: Optional[str] = None
    notes: Optional[str] = None

class FamilyMember(FamilyMemberBase):
    id: int
    photo_url: Optional[str] = None
    notes: Optional[str] = None
    last_contact_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Interaction Schemas
class InteractionBase(BaseModel):
    interaction_type: InteractionType
    content: str
    response: Optional[str] = None

class InteractionCreate(InteractionBase):
    entities_mentioned: Optional[str] = None
    sentiment_score: Optional[str] = None
    confidence_score: Optional[str] = None

class Interaction(InteractionBase):
    id: int
    user_id: int
    entities_mentioned: Optional[str] = None
    sentiment_score: Optional[str] = None
    confidence_score: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Knowledge Entity Schemas
class KnowledgeEntityBase(BaseModel):
    entity_type: str
    entity_name: str
    entity_description: Optional[str] = None

class KnowledgeEntityCreate(KnowledgeEntityBase):
    related_entities: Optional[str] = None
    relationship_type: Optional[str] = None
    relationship_strength: Optional[str] = "medium"
    context: Optional[str] = None

class KnowledgeEntity(KnowledgeEntityBase):
    id: int
    user_id: int
    related_entities: Optional[str] = None
    relationship_type: Optional[str] = None
    relationship_strength: str = "medium"
    context: Optional[str] = None
    last_mentioned: Optional[datetime] = None
    mention_count: int = 1
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Authentication Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: UserType
    user_id: int

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: "UserProfile"

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    user_type: Optional[str] = None

class CaregiverRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone_number: Optional[str] = None
    organization: Optional[str] = None
    license_number: Optional[str] = None

class ElderRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone_number: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    emergency_contact: Optional[str] = None

# Response Schemas
class MessageResponse(BaseModel):
    message: str
    success: bool = True

class UserWithFamilyMembers(UserProfile):
    family_members: List[FamilyMember] = []

class DashboardData(BaseModel):
    user: UserProfile
    family_members: List[FamilyMember]
    recent_interactions: List[Interaction]
    knowledge_entities_count: int

# Photo Schemas
class PhotoBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None  # JSON string of tags
    people_in_photo: Optional[str] = None  # JSON string of people names
    location: Optional[str] = None
    date_taken: Optional[datetime] = None
    memory_context: Optional[str] = None

class PhotoCreate(PhotoBase):
    pass

class PhotoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    people_in_photo: Optional[str] = None
    location: Optional[str] = None
    date_taken: Optional[datetime] = None
    memory_context: Optional[str] = None

class Photo(PhotoBase):
    id: int
    user_id: int
    filename: str
    original_filename: str
    file_path: str
    file_size: Optional[int] = None
    recognition_level: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Event Schemas
class EventType(str, Enum):
    REMINDER = "reminder"
    APPOINTMENT = "appointment"
    MEDICATION = "medication"
    ACTIVITY = "activity"

class EventPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class EventStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    MISSED = "missed"
    CANCELLED = "cancelled"

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: EventType
    priority: EventPriority = EventPriority.MEDIUM
    scheduled_date: datetime
    duration_minutes: Optional[int] = None
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None
    location: Optional[str] = None

class EventCreate(EventBase):
    user_id: Optional[int] = None  # Optional - backend will determine automatically
    related_family_members: Optional[List[int]] = None
    related_photos: Optional[List[int]] = None

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[EventType] = None
    priority: Optional[EventPriority] = None
    scheduled_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    status: Optional[EventStatus] = None
    completion_notes: Optional[str] = None
    location: Optional[str] = None

class Event(EventBase):
    id: int
    user_id: int
    created_by: int
    status: EventStatus
    completed_at: Optional[datetime] = None
    completion_notes: Optional[str] = None
    related_family_members: Optional[List[int]] = None
    related_photos: Optional[List[int]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
