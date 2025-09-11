#!/usr/bin/env python3
"""
Script to create test users for development
"""

from app.database import get_db, User
from app.auth import get_password_hash
from sqlalchemy.orm import Session

def create_test_users():
    """Create test users for development"""
    db = next(get_db())
    
    # Check if test users already exist
    existing_caregiver = db.query(User).filter(User.email == "caregiver@test.com").first()
    existing_elder = db.query(User).filter(User.email == "elder@test.com").first()
    
    if not existing_caregiver:
        # Create test caregiver
        caregiver = User(
            email="caregiver@test.com",
            full_name="Test Caregiver",
            user_type="caregiver",
            phone_number="123-456-7890",
            emergency_contact="Emergency Contact - 987-654-3210",
            hashed_password=get_password_hash("password123")
        )
        db.add(caregiver)
        print("Created test caregiver: caregiver@test.com / password123")
    
    if not existing_elder:
        # Create test elder
        elder = User(
            email="elder@test.com",
            full_name="Test Elder",
            user_type="elder",
            phone_number="555-123-4567",
            emergency_contact="Family Contact - 111-222-3333",
            hashed_password=get_password_hash("password123")
        )
        db.add(elder)
        print("Created test elder: elder@test.com / password123")
    
    db.commit()
    db.close()
    print("Test users created successfully!")

if __name__ == "__main__":
    create_test_users()
