from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dementia_care.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Association table for many-to-many relationship between users and family members
user_family_association = Table(
    'user_family_association',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('family_member_id', Integer, ForeignKey('family_members.id'), primary_key=True),
    Column('relationship_type', String(50)),  # e.g., 'primary_caregiver', 'secondary_caregiver'
    Column('created_at', DateTime, default=datetime.utcnow)
)

class User(Base):
    """
    User model designed for future knowledge graph integration.
    Will serve as nodes in the knowledge graph with relationships to:
    - Family members, medical history, preferences, interactions
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # User type: 'caregiver' or 'elder'
    user_type = Column(String(50), nullable=False)
    
    # Profile information
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=True)
    
    # Caregiver specific fields
    organization = Column(String(255), nullable=True)  # Hospital, care facility, etc.
    license_number = Column(String(100), nullable=True)
    
    # Elder specific fields (for future knowledge graph)
    date_of_birth = Column(DateTime, nullable=True)
    medical_conditions = Column(Text, nullable=True)  # JSON string for conditions
    medications = Column(Text, nullable=True)  # JSON string for medications
    emergency_contact = Column(String(255), nullable=True)
    
    # Knowledge graph preparation fields
    preferences = Column(Text, nullable=True)  # JSON string for user preferences
    cognitive_profile = Column(Text, nullable=True)  # JSON for cognitive assessment data
    
    # Metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    family_members = relationship("FamilyMember", back_populates="user")
    interactions = relationship("Interaction", back_populates="user")
    knowledge_entities = relationship("KnowledgeEntity", back_populates="user")
    photos = relationship("Photo", back_populates="user")
    events = relationship("Event", foreign_keys="Event.user_id", back_populates="user")
    created_events = relationship("Event", foreign_keys="Event.created_by", back_populates="creator")

class FamilyMember(Base):
    """
    Family member model for knowledge graph relationships.
    Will become nodes connected to User nodes with relationship types.
    """
    __tablename__ = "family_members"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    relationship_type = Column(String(100), nullable=False)  # son, daughter, spouse, etc.
    phone_number = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    is_emergency_contact = Column(Boolean, default=False)
    
    # Knowledge graph fields
    photo_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    last_contact_date = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="family_members")

class Interaction(Base):
    """
    Interaction model to store conversation history and user interactions.
    Will form the basis for knowledge graph relationship weights and patterns.
    """
    __tablename__ = "interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    interaction_type = Column(String(50), nullable=False)  # voice, text, emergency, reminder
    content = Column(Text, nullable=False)  # Conversation content or action taken
    response = Column(Text, nullable=True)  # AI response
    
    # Context for knowledge graph
    entities_mentioned = Column(Text, nullable=True)  # JSON list of entities (people, places, things)
    sentiment_score = Column(String(20), nullable=True)  # positive, negative, neutral
    confidence_score = Column(String(20), nullable=True)  # AI confidence in understanding
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="interactions")

class KnowledgeEntity(Base):
    """
    Knowledge entities for building the knowledge graph.
    Stores facts, relationships, and contextual information about users.
    """
    __tablename__ = "knowledge_entities"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Entity information
    entity_type = Column(String(100), nullable=False)  # person, place, memory, routine, etc.
    entity_name = Column(String(255), nullable=False)
    entity_description = Column(Text, nullable=True)
    
    # Relationship information
    related_entities = Column(Text, nullable=True)  # JSON list of related entity IDs
    relationship_type = Column(String(100), nullable=True)  # family, location, activity, etc.
    relationship_strength = Column(String(20), default="medium")  # weak, medium, strong
    
    # Context and metadata
    context = Column(Text, nullable=True)  # When/how this entity was learned
    last_mentioned = Column(DateTime, nullable=True)
    mention_count = Column(Integer, default=1)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="knowledge_entities")

class Photo(Base):
    """
    Photo model for storing family photos with tags and descriptions.
    Helps elders recognize family members and recall memories.
    """
    __tablename__ = "photos"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)
    
    # Photo metadata
    title = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)  # JSON array of tags
    people_in_photo = Column(Text, nullable=True)  # JSON array of people names
    location = Column(String(255), nullable=True)
    date_taken = Column(DateTime, nullable=True)
    
    # Knowledge graph fields
    memory_context = Column(Text, nullable=True)  # Context for memory assistance
    recognition_level = Column(String(50), default='unknown')  # high, medium, low, unknown
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="photos")

class Event(Base):
    """
    Event model for storing scheduled events, appointments, reminders, and activities.
    Forms the backbone of daily scheduling and memory assistance for elders.
    """
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Who the event is for (elder)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)  # Who created it (caregiver)
    
    # Event details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(String(50), nullable=False)  # reminder, appointment, medication, activity
    priority = Column(String(20), default='medium')  # low, medium, high
    
    # Scheduling
    scheduled_date = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=True)
    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(String(100), nullable=True)  # daily, weekly, monthly
    
    # Status tracking
    status = Column(String(50), default='scheduled')  # scheduled, completed, missed, cancelled
    completed_at = Column(DateTime, nullable=True)
    completion_notes = Column(Text, nullable=True)
    
    # Knowledge graph connections
    related_family_members = Column(Text, nullable=True)  # JSON array of family member IDs
    related_photos = Column(Text, nullable=True)  # JSON array of photo IDs
    location = Column(String(255), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="events")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_events")

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
