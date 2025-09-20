#!/usr/bin/env python3
"""
Add Indian family data for user ID 8 (kshitijsonje2002@gmail.com)
This will create family members for testing the knowledge graph voice interface.
"""

import sqlite3
from datetime import datetime, date

def add_family_data_for_user_8():
    # Connect to database
    conn = sqlite3.connect('dementia_care.db')
    cursor = conn.cursor()
    
    user_id = 8  # kshitijsonje2002@gmail.com
    
    print(f"Adding Indian family data for User ID: {user_id}")
    
    # Family data for User 8 - Indian family
    family_members = [
        {
            'name': 'Rajesh Peswani',
            'relationship_type': 'father',
            'phone_number': '+91 98765 43210',
            'email': 'rajesh.peswani@email.com',
            'address': 'Mumbai, Maharashtra',
            'notes': 'Age 68, Retired Teacher, Former English teacher, loves reading newspapers. Born: August 15, 1955'
        },
        {
            'name': 'Sunita Peswani', 
            'relationship_type': 'mother',
            'phone_number': '+91 98765 43211',
            'email': 'sunita.peswani@email.com',
            'address': 'Mumbai, Maharashtra', 
            'notes': 'Age 65, Homemaker, Excellent cook, enjoys watching TV serials. Born: December 3, 1958'
        },
        {
            'name': 'Arjun Peswani',
            'relationship_type': 'brother',
            'phone_number': '+91 98765 43212',
            'email': 'arjun.peswani@email.com',
            'address': 'Pune, Maharashtra',
            'notes': 'Age 31, Software Engineer at Tech Mahindra, married to Kavya, father of Aadhya. Born: June 20, 1992'
        },
        {
            'name': 'Kavya Peswani',
            'relationship_type': 'sister-in-law',
            'phone_number': '+91 98765 43213',
            'email': 'kavya.peswani@email.com',
            'address': 'Pune, Maharashtra',
            'notes': 'Age 28, Doctor (Pediatrician at KEM Hospital), married to Arjun, mother of Aadhya. Born: April 10, 1995'
        },
        {
            'name': 'Aadhya Peswani',
            'relationship_type': 'niece',
            'phone_number': '',
            'email': '',
            'address': 'Pune, Maharashtra',
            'notes': 'Age 3, Preschool student, Arjun and Kavya\'s daughter, loves cartoons. Born: November 25, 2020'
        },
        {
            'name': 'Suryakant Kasare',
            'relationship_type': 'brother',
            'phone_number': '+91 98765 43214',
            'email': 'suryakant.kasare@email.com',
            'address': 'Nandeo, Maharashtra',
            'notes': 'Age 35, Farmer, grows organic vegetables and rice, loves traditional farming methods. Born: March 12, 1989'
        }
    ]
    
    # Add family members
    for member in family_members:
        cursor.execute("""
            INSERT INTO family_members (
                user_id, name, relationship_type, phone_number, 
                email, address, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            member['name'],
            member['relationship_type'],
            member['phone_number'],
            member['email'],
            member['address'],
            member['notes'],
            datetime.now().isoformat()
        ))
        
        print(f"✅ Added: {member['name']} ({member['relationship_type']})")
    
    # Add some events/reminders
    events = [
        {
            'title': 'Dad\'s Doctor Appointment',
            'description': 'Regular checkup for Rajesh Peswani with Dr. Sharma',
            'event_type': 'appointment',
            'priority': 'high',
            'scheduled_date': '2024-10-15 10:00:00',
            'location': 'Apollo Hospital, Mumbai'
        },
        {
            'title': 'Mom\'s Birthday',
            'description': 'Sunita Peswani\'s birthday celebration',
            'event_type': 'reminder', 
            'priority': 'high',
            'scheduled_date': '2024-12-03 00:00:00',
            'location': 'Home'
        },
        {
            'title': 'Aadhya\'s Birthday',
            'description': 'Niece Aadhya\'s 4th birthday party',
            'event_type': 'reminder',
            'priority': 'medium', 
            'scheduled_date': '2024-11-25 16:00:00',
            'location': 'Pune'
        }
    ]
    
    for event in events:
        cursor.execute("""
            INSERT INTO events (
                title, description, event_type, priority, scheduled_date,
                location, user_id, created_by, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            event['title'],
            event['description'],
            event['event_type'],
            event['priority'], 
            event['scheduled_date'],
            event['location'],
            user_id,
            user_id,  # created_by same as user_id
            'scheduled',
            datetime.now().isoformat()
        ))
        
        print(f"📅 Added event: {event['title']}")
    
    # Commit and close
    conn.commit()
    conn.close()
    
    print(f"\n🎉 Successfully added Indian family data for User ID {user_id}")
    print("You can now test voice queries about the Peswani family!")

if __name__ == "__main__":
    add_family_data_for_user_8()