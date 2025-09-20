"""
User-Specific Knowledge Graph for kshitijsonje2002@gmail.com (User ID 8)
This creates a specialized knowledge graph for the Peswani family data.
"""

import sqlite3
import re
from typing import Dict, Any, Optional

class PeswaniKnowledgeGraph:
    """
    Specialized knowledge graph for User ID 8 (kshitijsonje2002@gmail.com)
    Handles queries about the Peswani family specifically.
    """
    
    def __init__(self, db_path: str = "dementia_care.db"):
        self.db_path = db_path
        self.user_id = 8  # kshitijsonje2002@gmail.com
        
        # Define relationship patterns specific to Peswani family
        self.patterns = {
            # Father questions
            "father": [
                r"who is (?:my )?father",
                r"tell me about (?:my )?father",
                r"who is rajesh",
                r"tell me about rajesh",
                r"what does (?:my )?father do",
                r"father's job",
                r"dad"
            ],
            
            # Mother questions  
            "mother": [
                r"who is (?:my )?mother",
                r"tell me about (?:my )?mother", 
                r"who is sunita",
                r"tell me about sunita",
                r"what does (?:my )?mother do",
                r"mother's job",
                r"mom"
            ],
            
            # Brother questions (both Arjun and Suryakant)
            "brother": [
                r"who is (?:my )?brother",
                r"tell me about (?:my )?brother",
                r"who is arjun",
                r"tell me about arjun",
                r"what does arjun do",
                r"arjun's job",
                r"who is suryakant",
                r"tell me about suryakant",
                r"what does suryakant do",
                r"suryakant's job"
            ],
            
            # Specific brother questions
            "arjun": [
                r"who is arjun",
                r"tell me about arjun",
                r"what does arjun do",
                r"arjun's job",
                r"arjun peswani"
            ],
            
            "suryakant": [
                r"who is suryakant",
                r"tell me about suryakant", 
                r"what does suryakant do",
                r"suryakant's job",
                r"suryakant kasare"
            ],
            
            # Sister-in-law questions
            "sister_in_law": [
                r"who is kavya",
                r"tell me about kavya", 
                r"what does kavya do",
                r"kavya's job",
                r"who is (?:my )?sister.?in.?law"
            ],
            
            # Niece questions
            "niece": [
                r"who is aadhya",
                r"tell me about aadhya",
                r"who is (?:my )?niece",
                r"tell me about (?:my )?niece"
            ],
            
            # General family questions
            "family": [
                r"tell me about (?:my )?family",
                r"who are (?:my )?family members",
                r"how many family members",
                r"list (?:my )?family"
            ],
            
            # Location questions
            "location": [
                r"who lives in pune",
                r"who lives in mumbai",
                r"who lives in nandeo",
                r"where does (.+?) live"
            ]
        }
        
        # Family data cache
        self.family_data = {}
        self._load_family_data()
    
    def _load_family_data(self):
        """Load and cache family data for quick access"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT name, relationship_type, phone_number, email, address, notes
            FROM family_members 
            WHERE user_id = ?
        """, (self.user_id,))
        
        members = cursor.fetchall()
        
        for member in members:
            name = member[0].lower()
            self.family_data[name] = {
                'name': member[0],
                'relationship': member[1], 
                'phone': member[2],
                'email': member[3],
                'address': member[4],
                'notes': member[5]
            }
        
        conn.close()
    
    def query(self, question: str) -> Dict[str, Any]:
        """
        Process a natural language query about the Peswani family
        """
        question = question.lower().strip()
        
        # Check each pattern type
        for category, patterns in self.patterns.items():
            for pattern in patterns:
                if re.search(pattern, question):
                    return self._handle_query(category, question)
        
        # If no pattern matches, try specific name-based search first
        if "suryakant" in question.lower():
            return self._get_person_info("suryakant kasare")
        elif "arjun" in question.lower():
            return self._get_person_info("arjun peswani")
        
        # Then try general name-based search
        for name in self.family_data.keys():
            if name in question:
                return self._get_person_info(name)
        
        return {
            "success": False,
            "message": "I couldn't understand your question about the Peswani family. Try asking about family members like Rajesh, Sunita, Arjun, Kavya, or Aadhya.",
            "answer": None,
            "suggestions": [
                "Who is my father?",
                "Tell me about Arjun", 
                "What does Kavya do?",
                "Who lives in Pune?",
                "Tell me about my family"
            ]
        }
    
    def _handle_query(self, category: str, question: str) -> Dict[str, Any]:
        """Handle specific category queries"""
        
        if category == "father":
            return self._get_person_info("rajesh peswani")
            
        elif category == "mother":
            return self._get_person_info("sunita peswani")
            
        elif category == "brother":
            # For general brother question, provide info about both brothers
            return self._get_brothers_info()
            
        elif category == "arjun":
            return self._get_person_info("arjun peswani")
            
        elif category == "suryakant":
            return self._get_person_info("suryakant kasare")
            
        elif category == "sister_in_law":
            return self._get_person_info("kavya peswani")
            
        elif category == "niece":
            return self._get_person_info("aadhya peswani")
            
        elif category == "family":
            return self._get_all_family_info()
            
        elif category == "location":
            return self._get_location_info(question)
        
        return {"success": False, "message": "Query type not implemented yet"}
    
    def _get_person_info(self, name: str) -> Dict[str, Any]:
        """Get detailed information about a specific family member"""
        name = name.lower()
        
        if name not in self.family_data:
            return {
                "success": False, 
                "message": f"I don't have information about {name} in the Peswani family.",
                "answer": None
            }
        
        person = self.family_data[name]
        
        # Extract age and profession from notes
        notes = person['notes']
        age_match = re.search(r'Age (\d+)', notes)
        age = age_match.group(1) if age_match else "unknown"
        
        profession_match = re.search(r'Age \d+, ([^,]+)', notes)
        profession = profession_match.group(1) if profession_match else "unknown"
        
        response = f"{person['name']} is your {person['relationship']}. "
        response += f"They are {age} years old and work as a {profession}. "
        response += f"They live in {person['address']}."
        
        return {
            "success": True,
            "message": response,
            "answer": person['name'],
            "details": {
                "name": person['name'],
                "relationship": person['relationship'],
                "age": age,
                "profession": profession,
                "address": person['address'],
                "phone": person['phone'],
                "email": person['email']
            }
        }
    
    def _get_brothers_info(self) -> Dict[str, Any]:
        """Get information about both brothers"""
        brothers = []
        
        # Get info for both brothers
        for name in ['arjun peswani', 'suryakant kasare']:
            if name in self.family_data:
                person = self.family_data[name]
                notes = person['notes']
                age_match = re.search(r'Age (\d+)', notes)
                age = age_match.group(1) if age_match else "unknown"
                
                profession_match = re.search(r'Age \d+, ([^,]+)', notes)
                profession = profession_match.group(1) if profession_match else "unknown"
                
                brothers.append({
                    'name': person['name'],
                    'age': age,
                    'profession': profession,
                    'location': person['address']
                })
        
        if len(brothers) == 2:
            response = f"You have two brothers: {brothers[0]['name']} (age {brothers[0]['age']}, {brothers[0]['profession']}) in {brothers[0]['location']}, and {brothers[1]['name']} (age {brothers[1]['age']}, {brothers[1]['profession']}) in {brothers[1]['location']}."
        elif len(brothers) == 1:
            response = f"Your brother is {brothers[0]['name']} (age {brothers[0]['age']}, {brothers[0]['profession']}) in {brothers[0]['location']}."
        else:
            response = "No brother information found."
        
        return {
            "success": True,
            "message": response,
            "answer": f"{len(brothers)} brothers",
            "details": {"brothers": brothers}
        }
    
    def _get_all_family_info(self) -> Dict[str, Any]:
        """Get information about all family members"""
        family_list = []
        
        for name, data in self.family_data.items():
            notes = data['notes']
            age_match = re.search(r'Age (\d+)', notes)
            age = age_match.group(1) if age_match else "unknown"
            
            family_list.append(f"{data['name']} ({data['relationship']}, age {age})")
        
        response = f"Your family includes: {', '.join(family_list)}. "
        response += "They are spread across Mumbai and Pune."
        
        return {
            "success": True,
            "message": response,
            "answer": f"{len(family_list)} family members",
            "details": {"family_count": len(family_list), "members": family_list}
        }
    
    def _get_location_info(self, question: str) -> Dict[str, Any]:
        """Handle location-based queries"""
        if "pune" in question:
            pune_members = [data['name'] for data in self.family_data.values() 
                          if 'Pune' in data['address']]
            response = f"In Pune, you have: {', '.join(pune_members)}"
            
        elif "mumbai" in question:
            mumbai_members = [data['name'] for data in self.family_data.values() 
                            if 'Mumbai' in data['address']]
            response = f"In Mumbai, you have: {', '.join(mumbai_members)}"
            
        elif "nandeo" in question:
            nandeo_members = [data['name'] for data in self.family_data.values() 
                            if 'Nandeo' in data['address']]
            response = f"In Nandeo, you have: {', '.join(nandeo_members)}"
            
        else:
            response = "Your family is spread across Mumbai (parents), Pune (Arjun's family), and Nandeo (Suryakant)."
        
        return {
            "success": True,
            "message": response,
            "answer": response
        }


def test_peswani_knowledge_graph():
    """Test function for the Peswani knowledge graph"""
    kg = PeswaniKnowledgeGraph()
    
    test_queries = [
        "Who is my father?",
        "Tell me about Arjun",
        "What does Kavya do?",
        "Who is Aadhya?", 
        "Tell me about my family",
        "Who lives in Pune?",
        "Who is Suryakant?",
        "Tell me about my brothers",
        "Who lives in Nandeo?"
    ]
    
    print("=== TESTING PESWANI KNOWLEDGE GRAPH ===")
    for query in test_queries:
        print(f"\nQ: {query}")
        result = kg.query(query)
        print(f"A: {result['message']}")


if __name__ == "__main__":
    test_peswani_knowledge_graph()