#!/usr/bin/env python3
"""
Add new family member: Suryakant Kasare for user ID 8
"""

import sqlite3
from datetime import datetime

def add_suryakant_kasare():
    # Connect to database
    conn = sqlite3.connect('dementia_care.db')
    cursor = conn.cursor()
    
    user_id = 8  # kshitijsonje2002@gmail.com
    
    # Check if Suryakant already exists
    cursor.execute("SELECT COUNT(*) FROM family_members WHERE user_id = ? AND name = ?", 
                   (user_id, 'Suryakant Kasare'))
    
    if cursor.fetchone()[0] > 0:
        print("Suryakant Kasare already exists in the database.")
        conn.close()
        return
    
    # Add Suryakant Kasare
    new_member = {
        'name': 'Suryakant Kasare',
        'relationship_type': 'brother',
        'phone_number': '+91 98765 43214',
        'email': 'suryakant.kasare@email.com',
        'address': 'Nandeo, Maharashtra',
        'notes': 'Age 35, Farmer, grows organic vegetables and rice, loves traditional farming methods. Born: March 12, 1989'
    }
    
    cursor.execute("""
        INSERT INTO family_members (
            user_id, name, relationship_type, phone_number, 
            email, address, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        new_member['name'],
        new_member['relationship_type'],
        new_member['phone_number'],
        new_member['email'],
        new_member['address'],
        new_member['notes'],
        datetime.now().isoformat()
    ))
    
    conn.commit()
    conn.close()
    
    print(f"✅ Added: {new_member['name']} ({new_member['relationship_type']})")
    print("Suryakant Kasare has been added to the Peswani family!")

if __name__ == "__main__":
    add_suryakant_kasare()