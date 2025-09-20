"""
Script to create comprehensive synthetic Indian family data for dementia care application.
This creates realistic family relationships, events, and knowledge entities that can be queried
via natural language queries.
"""

import sqlite3
import json
from datetime import datetime, timedelta
import random
from werkzeug.security import generate_password_hash

# Indian family data templates
INDIAN_FAMILIES = [
    {
        "elder": {
            "name": "Sarita Sharma",
            "email": "sarita.sharma@email.com",
            "dob": "1945-03-15",
            "phone": "+91-9876543210",
            "medical_conditions": "Mild dementia, Diabetes type 2, Hypertension",
            "medications": "Donepezil 10mg daily, Metformin 500mg twice daily",
            "emergency_contact": "Meeta Sharma (daughter)"
        },
        "family_members": [
            {
                "name": "Meeta Sharma",
                "relationship": "daughter",
                "phone": "+91-9876543211",
                "email": "meeta.sharma@email.com",
                "birthday": "October 17",
                "profession": "Software Engineer",
                "address": "Mumbai, Maharashtra"
            },
            {
                "name": "Rajesh Sharma",
                "relationship": "son",
                "phone": "+91-9876543212",
                "email": "rajesh.sharma@email.com",
                "birthday": "June 22",
                "profession": "Doctor",
                "address": "Delhi, India"
            },
            {
                "name": "Anita Sharma",
                "relationship": "daughter-in-law",
                "phone": "+91-9876543213",
                "email": "anita.sharma@email.com",
                "birthday": "September 5",
                "profession": "Teacher",
                "address": "Delhi, India"
            },
            {
                "name": "Arjun Sharma",
                "relationship": "grandson",
                "phone": "+91-9876543214",
                "email": "arjun.sharma@email.com",
                "birthday": "December 12",
                "profession": "Student",
                "address": "Delhi, India",
                "age": 16
            },
            {
                "name": "Priya Sharma",
                "relationship": "granddaughter",
                "phone": "+91-9876543215",
                "birthday": "March 28",
                "profession": "Student",
                "address": "Mumbai, Maharashtra",
                "age": 14
            }
        ],
        "events": [
            {
                "title": "Meeta's Birthday",
                "date": "2024-10-17",
                "type": "birthday",
                "description": "Daughter Meeta's birthday celebration"
            },
            {
                "title": "Doctor Appointment",
                "date": "2024-09-25",
                "type": "appointment",
                "description": "Monthly checkup with Dr. Patel"
            },
            {
                "title": "Family Dinner",
                "date": "2024-09-22",
                "type": "activity",
                "description": "Sunday family dinner at Rajesh's house"
            }
        ]
    },
    {
        "elder": {
            "name": "Ramesh Patel",
            "email": "ramesh.patel@email.com",
            "dob": "1940-08-20",
            "phone": "+91-9876543220",
            "medical_conditions": "Early-stage Alzheimer's, Arthritis",
            "medications": "Aricept 10mg, Ibuprofen as needed",
            "emergency_contact": "Kavita Patel (daughter)"
        },
        "family_members": [
            {
                "name": "Kavita Patel",
                "relationship": "daughter",
                "phone": "+91-9876543221",
                "email": "kavita.patel@email.com",
                "birthday": "January 15",
                "profession": "Nurse",
                "address": "Pune, Maharashtra"
            },
            {
                "name": "Amit Patel",
                "relationship": "son",
                "phone": "+91-9876543222",
                "email": "amit.patel@email.com",
                "birthday": "August 30",
                "profession": "Business Owner",
                "address": "Ahmedabad, Gujarat"
            },
            {
                "name": "Sunita Patel",
                "relationship": "daughter-in-law",
                "phone": "+91-9876543223",
                "email": "sunita.patel@email.com",
                "birthday": "November 11",
                "profession": "Accountant",
                "address": "Ahmedabad, Gujarat"
            }
        ],
        "events": [
            {
                "title": "Kavita's Wedding Anniversary",
                "date": "2024-12-05",
                "type": "anniversary",
                "description": "Daughter Kavita's 10th wedding anniversary"
            },
            {
                "title": "Physiotherapy Session",
                "date": "2024-09-24",
                "type": "appointment",
                "description": "Weekly physiotherapy for arthritis"
            }
        ]
    },
    {
        "elder": {
            "name": "Lakshmi Krishnan",
            "email": "lakshmi.krishnan@email.com",
            "dob": "1948-12-10",
            "phone": "+91-9876543230",
            "medical_conditions": "Dementia, High blood pressure",
            "medications": "Memantine 10mg, Amlodipine 5mg",
            "emergency_contact": "Sanjay Krishnan (son)"
        },
        "family_members": [
            {
                "name": "Sanjay Krishnan",
                "relationship": "son",
                "phone": "+91-9876543231",
                "email": "sanjay.krishnan@email.com",
                "birthday": "April 25",
                "profession": "Engineer",
                "address": "Bangalore, Karnataka"
            },
            {
                "name": "Deepa Krishnan",
                "relationship": "daughter-in-law",
                "phone": "+91-9876543232",
                "email": "deepa.krishnan@email.com",
                "birthday": "July 18",
                "profession": "Designer",
                "address": "Bangalore, Karnataka"
            },
            {
                "name": "Ravi Krishnan",
                "relationship": "grandson",
                "phone": "+91-9876543233",
                "email": "ravi.krishnan@email.com",
                "birthday": "February 14",
                "profession": "College Student",
                "address": "Bangalore, Karnataka",
                "age": 20
            }
        ],
        "events": [
            {
                "title": "Sanjay's Promotion Celebration",
                "date": "2024-10-01",
                "type": "celebration",
                "description": "Celebrating son Sanjay's promotion at work"
            }
        ]
    }
]

# Knowledge relationships templates
KNOWLEDGE_TEMPLATES = [
    # Family relationships
    {
        "entity_type": "person",
        "relationship_templates": [
            "{person1} is the {relationship} of {person2}",
            "{person1}'s {relationship} is {person2}",
            "{person2} is {person1}'s {relationship}"
        ]
    },
    # Birthday/event information
    {
        "entity_type": "event",
        "relationship_templates": [
            "{person}'s birthday is on {date}",
            "{person} was born on {date}",
            "{event} is scheduled for {date}"
        ]
    },
    # Professional information
    {
        "entity_type": "profession",
        "relationship_templates": [
            "{person} works as a {profession}",
            "{person} is a {profession}",
            "{person}'s job is {profession}"
        ]
    }
]

def create_database_connection():
    """Create connection to SQLite database"""
    return sqlite3.connect("d:/Dementia-Care/backend/dementia_care.db")

def create_user(conn, family_data):
    """Create elder user in database"""
    elder = family_data["elder"]
    
    cursor = conn.cursor()
    
    # Insert user
    cursor.execute("""
        INSERT INTO users (
            email, hashed_password, user_type, full_name, phone_number,
            date_of_birth, medical_conditions, medications, emergency_contact,
            is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        elder["email"],
        generate_password_hash("password123"),  # Default password
        "elder",
        elder["name"],
        elder["phone"],
        elder["dob"],
        elder["medical_conditions"],
        elder["medications"],
        elder["emergency_contact"],
        True,
        datetime.now()
    ))
    
    user_id = cursor.lastrowid
    conn.commit()
    return user_id

def create_family_members(conn, user_id, family_members):
    """Create family members for a user"""
    cursor = conn.cursor()
    
    family_member_ids = []
    for member in family_members:
        cursor.execute("""
            INSERT INTO family_members (
                user_id, name, relationship_type, phone_number, email,
                address, is_emergency_contact, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            member["name"],
            member["relationship"],
            member["phone"],
            member.get("email"),
            member.get("address"),
            member.get("relationship") == "daughter",  # Make daughters emergency contacts
            json.dumps({
                "birthday": member.get("birthday"),
                "profession": member.get("profession"),
                "age": member.get("age")
            }),
            datetime.now()
        ))
        
        family_member_ids.append(cursor.lastrowid)
    
    conn.commit()
    return family_member_ids

def create_events(conn, user_id, events):
    """Create events for a user"""
    cursor = conn.cursor()
    
    for event in events:
        # Parse date
        event_date = datetime.strptime(event["date"], "%Y-%m-%d")
        
        cursor.execute("""
            INSERT INTO events (
                user_id, created_by, title, description, event_type,
                priority, scheduled_date, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            user_id,  # Self-created for this demo
            event["title"],
            event["description"],
            event["type"],
            "medium",
            event_date,
            "scheduled",
            datetime.now()
        ))
    
    conn.commit()

def create_knowledge_entities(conn, user_id, family_data):
    """Create knowledge entities for natural language querying"""
    cursor = conn.cursor()
    
    elder_name = family_data["elder"]["name"]
    
    # Create knowledge entities for family relationships
    for member in family_data["family_members"]:
        # Basic person entity
        cursor.execute("""
            INSERT INTO knowledge_entities (
                user_id, entity_type, entity_name, entity_description,
                relationship_type, context, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            "person",
            member["name"],
            f"{member['name']} is {elder_name}'s {member['relationship']}",
            member["relationship"],
            f"Family member: {member['relationship']}",
            datetime.now()
        ))
        
        # Birthday entity
        if member.get("birthday"):
            cursor.execute("""
                INSERT INTO knowledge_entities (
                    user_id, entity_type, entity_name, entity_description,
                    relationship_type, context, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                "date",
                f"{member['name']}_birthday",
                f"{member['name']}'s birthday is on {member['birthday']}",
                "birthday",
                f"Birthday information for {member['name']}",
                datetime.now()
            ))
        
        # Profession entity
        if member.get("profession"):
            cursor.execute("""
                INSERT INTO knowledge_entities (
                    user_id, entity_type, entity_name, entity_description,
                    relationship_type, context, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                "profession",
                f"{member['name']}_profession",
                f"{member['name']} works as a {member['profession']}",
                "profession",
                f"Professional information for {member['name']}",
                datetime.now()
            ))
    
    # Create reverse relationship entities (for natural querying)
    for member in family_data["family_members"]:
        if member["relationship"] == "daughter":
            cursor.execute("""
                INSERT INTO knowledge_entities (
                    user_id, entity_type, entity_name, entity_description,
                    relationship_type, context, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                "relationship",
                f"{elder_name}_daughters",
                f"{elder_name}'s daughter is {member['name']}",
                "parent-child",
                f"Daughter relationship: {member['name']}",
                datetime.now()
            ))
        elif member["relationship"] == "son":
            cursor.execute("""
                INSERT INTO knowledge_entities (
                    user_id, entity_type, entity_name, entity_description,
                    relationship_type, context, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                "relationship",
                f"{elder_name}_sons",
                f"{elder_name}'s son is {member['name']}",
                "parent-child",
                f"Son relationship: {member['name']}",
                datetime.now()
            ))
    
    conn.commit()

def main():
    """Main function to create all synthetic data"""
    print("Creating synthetic Indian family data for dementia care application...")
    
    conn = create_database_connection()
    
    try:
        for i, family_data in enumerate(INDIAN_FAMILIES):
            print(f"\nCreating family {i+1}: {family_data['elder']['name']}")
            
            # Create elder user
            user_id = create_user(conn, family_data)
            print(f"  ✓ Created elder user (ID: {user_id})")
            
            # Create family members
            family_member_ids = create_family_members(conn, user_id, family_data["family_members"])
            print(f"  ✓ Created {len(family_member_ids)} family members")
            
            # Create events
            create_events(conn, user_id, family_data["events"])
            print(f"  ✓ Created {len(family_data['events'])} events")
            
            # Create knowledge entities
            create_knowledge_entities(conn, user_id, family_data)
            print(f"  ✓ Created knowledge entities for natural language querying")
    
    except Exception as e:
        print(f"Error creating data: {e}")
        conn.rollback()
    finally:
        conn.close()
    
    print("\n✅ Synthetic Indian family data creation completed!")
    print("\nExample queries you can now test:")
    print("- 'What is the name of Sarita's daughter?'")
    print("- 'When is Meeta's birthday?'")
    print("- 'What does Rajesh do for work?'")
    print("- 'Who is Ramesh's son?'")
    print("- 'What is Kavita's profession?'")

if __name__ == "__main__":
    main()