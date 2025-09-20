"""
Knowledge Graph Query Engine for Dementia Care Application

This module provides natural language querying capabilities over the family relationship
data stored in the database. It can answer questions like:
- "What is the name of Sarita's daughter?"
- "When is Meeta's birthday?"
- "What does Rajesh do for work?"
"""

import sqlite3
import re
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
import difflib

class KnowledgeGraphQueryEngine:
    """
    A natural language query engine for family relationship data.
    Uses pattern matching and semantic search to answer questions about family members.
    """
    
    def __init__(self, db_path: str = "dementia_care.db"):
        self.db_path = db_path
        
        # Define query patterns for different types of questions
        self.query_patterns = {
            "daughter_name": [
                r"what is (?:the )?name of (.+?)(?:'s|s) daughter",
                r"who is (.+?)(?:'s|s) daughter",
                r"(.+?)(?:'s|s) daughter(?:'s)? name",
                r"name (?:of )?(.+?)(?:'s|s) daughter"
            ],
            "son_name": [
                r"what is (?:the )?name of (.+?)(?:'s|s) son",
                r"who is (.+?)(?:'s|s) son",
                r"(.+?)(?:'s|s) son(?:'s)? name",
                r"name (?:of )?(.+?)(?:'s|s) son"
            ],
            "birthday": [
                r"when is (.+?)(?:'s|s) birthday",
                r"(.+?)(?:'s|s) birthday",
                r"birthday of (.+)",
                r"when was (.+) born"
            ],
            "profession": [
                r"what does (.+?) do for work",
                r"what is (.+?)(?:'s|s) job",
                r"what is (.+?)(?:'s|s) profession",
                r"(.+?)(?:'s|s) profession",
                r"where does (.+?) work"
            ],
            "family_members": [
                r"who (?:are|is) (.+?)(?:'s|s) (?:children|kids|family)",
                r"(?:list|tell me) (.+?)(?:'s|s) family members",
                r"(.+?)(?:'s|s) (?:sons|daughters|children)"
            ],
            "relationship": [
                r"how is (.+) related to (.+)",
                r"what is the relationship between (.+) and (.+)",
                r"who is (.+) to (.+)"
            ]
        }
        
        # Common name variations and nicknames
        self.name_variations = {
            "sarita": ["sarita sharma", "sarita", "mrs. sharma"],
            "meeta": ["meeta sharma", "meeta", "ms. meeta"],
            "rajesh": ["rajesh sharma", "rajesh", "mr. rajesh"],
            "ramesh": ["ramesh patel", "ramesh", "mr. patel"],
            "kavita": ["kavita patel", "kavita", "ms. kavita"]
        }
    
    def _get_connection(self) -> sqlite3.Connection:
        """Create database connection"""
        return sqlite3.connect(self.db_path)
    
    def _normalize_name(self, name: str) -> str:
        """Normalize name for better matching"""
        name = name.lower().strip()
        # Remove common titles
        name = re.sub(r'\b(mr|mrs|ms|dr|prof)\.?\s*', '', name)
        return name
    
    def _find_person_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Find a person in database by name (fuzzy matching)"""
        normalized_name = self._normalize_name(name)
        
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # First try exact match on users (elders)
            cursor.execute("SELECT id, full_name, user_type FROM users WHERE LOWER(full_name) LIKE ?", 
                         (f"%{normalized_name}%",))
            result = cursor.fetchone()
            
            if result:
                return {
                    "id": result[0],
                    "name": result[1],
                    "type": "elder",
                    "user_id": result[0]
                }
            
            # Then try family members
            cursor.execute("""
                SELECT fm.id, fm.name, fm.relationship_type, fm.user_id, u.full_name as elder_name
                FROM family_members fm
                JOIN users u ON fm.user_id = u.id
                WHERE LOWER(fm.name) LIKE ?
            """, (f"%{normalized_name}%",))
            
            result = cursor.fetchone()
            if result:
                return {
                    "id": result[0],
                    "name": result[1],
                    "relationship": result[2],
                    "type": "family_member",
                    "user_id": result[3],
                    "elder_name": result[4]
                }
            
            # Fuzzy matching if no exact match
            cursor.execute("SELECT id, full_name FROM users")
            users = cursor.fetchall()
            
            cursor.execute("SELECT id, name FROM family_members")
            family_members = cursor.fetchall()
            
            # Find closest match
            all_names = [(u[0], u[1], "elder") for u in users] + [(f[0], f[1], "family") for f in family_members]
            
            best_match = None
            best_ratio = 0
            
            for person_id, person_name, person_type in all_names:
                ratio = difflib.SequenceMatcher(None, normalized_name, person_name.lower()).ratio()
                if ratio > best_ratio and ratio > 0.6:  # 60% similarity threshold
                    best_ratio = ratio
                    best_match = (person_id, person_name, person_type)
            
            if best_match:
                if best_match[2] == "elder":
                    cursor.execute("SELECT id, full_name, user_type FROM users WHERE id = ?", (best_match[0],))
                    result = cursor.fetchone()
                    return {
                        "id": result[0],
                        "name": result[1],
                        "type": "elder",
                        "user_id": result[0]
                    }
                else:
                    cursor.execute("""
                        SELECT fm.id, fm.name, fm.relationship_type, fm.user_id, u.full_name as elder_name
                        FROM family_members fm
                        JOIN users u ON fm.user_id = u.id
                        WHERE fm.id = ?
                    """, (best_match[0],))
                    result = cursor.fetchone()
                    return {
                        "id": result[0],
                        "name": result[1],
                        "relationship": result[2],
                        "type": "family_member",
                        "user_id": result[3],
                        "elder_name": result[4]
                    }
        
        finally:
            conn.close()
        
        return None
    
    def _get_family_members(self, user_id: int, relationship: str = None) -> List[Dict[str, Any]]:
        """Get family members for a user, optionally filtered by relationship"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            if relationship:
                cursor.execute("""
                    SELECT id, name, relationship_type, phone_number, email, notes
                    FROM family_members
                    WHERE user_id = ? AND LOWER(relationship_type) = LOWER(?)
                """, (user_id, relationship))
            else:
                cursor.execute("""
                    SELECT id, name, relationship_type, phone_number, email, notes
                    FROM family_members
                    WHERE user_id = ?
                """, (user_id,))
            
            results = cursor.fetchall()
            family_members = []
            
            for result in results:
                notes = json.loads(result[5]) if result[5] else {}
                family_members.append({
                    "id": result[0],
                    "name": result[1],
                    "relationship": result[2],
                    "phone": result[3],
                    "email": result[4],
                    "birthday": notes.get("birthday"),
                    "profession": notes.get("profession"),
                    "age": notes.get("age")
                })
            
            return family_members
        
        finally:
            conn.close()
    
    def _parse_query(self, query: str) -> Dict[str, Any]:
        """Parse natural language query to extract intent and entities"""
        query = query.lower().strip()
        
        for intent, patterns in self.query_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, query, re.IGNORECASE)
                if match:
                    return {
                        "intent": intent,
                        "entities": match.groups(),
                        "raw_query": query
                    }
        
        return {
            "intent": "unknown",
            "entities": [],
            "raw_query": query
        }
    
    def query(self, question: str) -> Dict[str, Any]:
        """
        Main query method that processes natural language questions
        """
        parsed = self._parse_query(question)
        intent = parsed["intent"]
        entities = parsed["entities"]
        
        if intent == "unknown":
            return {
                "success": False,
                "message": "I couldn't understand your question. Try asking about family members, birthdays, or professions.",
                "suggestions": [
                    "What is the name of Sarita's daughter?",
                    "When is Meeta's birthday?",
                    "What does Rajesh do for work?"
                ]
            }
        
        try:
            if intent in ["daughter_name", "son_name"]:
                return self._handle_child_query(entities[0], intent)
            
            elif intent == "birthday":
                return self._handle_birthday_query(entities[0])
            
            elif intent == "profession":
                return self._handle_profession_query(entities[0])
            
            elif intent == "family_members":
                return self._handle_family_members_query(entities[0])
            
            elif intent == "relationship":
                return self._handle_relationship_query(entities[0], entities[1])
            
            else:
                return {
                    "success": False,
                    "message": f"I understand you're asking about '{intent}' but I need more information.",
                    "intent": intent
                }
        
        except Exception as e:
            return {
                "success": False,
                "message": f"Sorry, I encountered an error processing your question: {str(e)}",
                "error": str(e)
            }
    
    def _handle_child_query(self, parent_name: str, intent: str) -> Dict[str, Any]:
        """Handle queries about children (daughter/son)"""
        person = self._find_person_by_name(parent_name)
        
        if not person:
            return {
                "success": False,
                "message": f"I couldn't find anyone named '{parent_name}' in the family database."
            }
        
        if person["type"] != "elder":
            return {
                "success": False,
                "message": f"{person['name']} is not listed as a primary family member. I can only find children of elders."
            }
        
        relationship = "daughter" if intent == "daughter_name" else "son"
        children = self._get_family_members(person["user_id"], relationship)
        
        if not children:
            return {
                "success": True,
                "message": f"{person['name']} doesn't have any {relationship}s in the database.",
                "answer": None
            }
        
        if len(children) == 1:
            child = children[0]
            return {
                "success": True,
                "message": f"{person['name']}'s {relationship} is {child['name']}.",
                "answer": child['name'],
                "details": child
            }
        else:
            names = [child['name'] for child in children]
            return {
                "success": True,
                "message": f"{person['name']} has {len(children)} {relationship}s: {', '.join(names)}.",
                "answer": names,
                "details": children
            }
    
    def _handle_birthday_query(self, person_name: str) -> Dict[str, Any]:
        """Handle birthday queries"""
        person = self._find_person_by_name(person_name)
        
        if not person:
            return {
                "success": False,
                "message": f"I couldn't find anyone named '{person_name}' in the family database."
            }
        
        if person["type"] == "elder":
            # Check user table for date of birth
            conn = self._get_connection()
            cursor = conn.cursor()
            try:
                cursor.execute("SELECT date_of_birth FROM users WHERE id = ?", (person["user_id"],))
                result = cursor.fetchone()
                if result and result[0]:
                    dob = datetime.fromisoformat(result[0].replace('Z', '+00:00'))
                    return {
                        "success": True,
                        "message": f"{person['name']}'s birthday is on {dob.strftime('%B %d, %Y')}.",
                        "answer": dob.strftime('%B %d'),
                        "full_date": dob.strftime('%Y-%m-%d')
                    }
            finally:
                conn.close()
        
        elif person["type"] == "family_member":
            # Check family member notes for birthday
            family_members = self._get_family_members(person["user_id"])
            for member in family_members:
                if member["name"].lower() == person["name"].lower():
                    if member["birthday"]:
                        return {
                            "success": True,
                            "message": f"{person['name']}'s birthday is on {member['birthday']}.",
                            "answer": member["birthday"]
                        }
                    break
        
        return {
            "success": False,
            "message": f"I don't have birthday information for {person['name']}."
        }
    
    def _handle_profession_query(self, person_name: str) -> Dict[str, Any]:
        """Handle profession/job queries"""
        person = self._find_person_by_name(person_name)
        
        if not person:
            return {
                "success": False,
                "message": f"I couldn't find anyone named '{person_name}' in the family database."
            }
        
        if person["type"] == "family_member":
            family_members = self._get_family_members(person["user_id"])
            for member in family_members:
                if member["name"].lower() == person["name"].lower():
                    if member["profession"]:
                        return {
                            "success": True,
                            "message": f"{person['name']} works as a {member['profession']}.",
                            "answer": member["profession"]
                        }
                    break
        
        return {
            "success": False,
            "message": f"I don't have profession information for {person['name']}."
        }
    
    def _handle_family_members_query(self, person_name: str) -> Dict[str, Any]:
        """Handle queries about all family members"""
        person = self._find_person_by_name(person_name)
        
        if not person:
            return {
                "success": False,
                "message": f"I couldn't find anyone named '{person_name}' in the family database."
            }
        
        if person["type"] != "elder":
            return {
                "success": False,
                "message": f"I can only list family members for elders in the system."
            }
        
        family_members = self._get_family_members(person["user_id"])
        
        if not family_members:
            return {
                "success": True,
                "message": f"{person['name']} doesn't have any family members in the database.",
                "answer": []
            }
        
        member_list = []
        for member in family_members:
            member_list.append(f"{member['name']} ({member['relationship']})")
        
        return {
            "success": True,
            "message": f"{person['name']}'s family members are: {', '.join(member_list)}.",
            "answer": member_list,
            "details": family_members
        }
    
    def _handle_relationship_query(self, person1: str, person2: str) -> Dict[str, Any]:
        """Handle relationship queries between two people"""
        p1 = self._find_person_by_name(person1)
        p2 = self._find_person_by_name(person2)
        
        if not p1:
            return {"success": False, "message": f"I couldn't find anyone named '{person1}'."}
        
        if not p2:
            return {"success": False, "message": f"I couldn't find anyone named '{person2}'."}
        
        # Check if they're in the same family
        if p1["user_id"] == p2["user_id"]:
            if p1["type"] == "elder" and p2["type"] == "family_member":
                return {
                    "success": True,
                    "message": f"{p2['name']} is {p1['name']}'s {p2['relationship']}.",
                    "answer": p2['relationship']
                }
            elif p2["type"] == "elder" and p1["type"] == "family_member":
                return {
                    "success": True,
                    "message": f"{p1['name']} is {p2['name']}'s {p1['relationship']}.",
                    "answer": p1['relationship']
                }
        
        return {
            "success": False,
            "message": f"I couldn't determine the relationship between {person1} and {person2}."
        }

# Test function
def test_knowledge_graph():
    """Test the knowledge graph with sample queries"""
    kg = KnowledgeGraphQueryEngine("d:/Dementia-Care/backend/dementia_care.db")
    
    test_queries = [
        "What is the name of Sarita's daughter?",
        "When is Meeta's birthday?",
        "What does Rajesh do for work?",
        "Who is Ramesh's son?",
        "What is Kavita's profession?",
        "Who are Sarita's family members?",
        "When is Lakshmi's birthday?"
    ]
    
    print("Testing Knowledge Graph Query Engine...")
    print("=" * 50)
    
    for query in test_queries:
        print(f"\nQuery: {query}")
        result = kg.query(query)
        print(f"Response: {result['message']}")
        if result['success'] and 'answer' in result:
            print(f"Answer: {result['answer']}")

if __name__ == "__main__":
    test_knowledge_graph()