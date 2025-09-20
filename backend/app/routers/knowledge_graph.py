"""
Knowledge Graph Router for Dementia Care Application

This router provides endpoints for natural language querying and voice interaction
with the family relationship knowledge graph.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv
import google.generativeai as genai

from app.knowledge_graph_engine import KnowledgeGraphQueryEngine
from app.peswani_knowledge_graph import PeswaniKnowledgeGraph

# Load environment variables
load_dotenv()

router = APIRouter(prefix="/knowledge", tags=["knowledge"])

# Configure Gemini 2.0 Flash
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class VoiceQueryRequest(BaseModel):
    """Request model for voice queries"""
    query: str
    user_id: Optional[int] = None
    context: Optional[str] = None

class VoiceQueryResponse(BaseModel):
    """Response model for voice queries"""
    success: bool
    message: str
    answer: Optional[str] = None
    humanized_response: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    suggestions: Optional[list] = None

class KnowledgeGraphService:
    """Service class for knowledge graph operations"""
    
    def __init__(self):
        self.kg_engine = KnowledgeGraphQueryEngine("./dementia_care.db")
        self.peswani_kg = PeswaniKnowledgeGraph("./dementia_care.db")
    
    def process_natural_language_query(self, query: str, user_context: Optional[str] = None) -> Dict[str, Any]:
        """
        Process a natural language query through the knowledge graph
        """
        # For now, always use the Peswani knowledge graph (user 8)
        # In a real app, you'd determine the user ID from authentication
        kg_result = self.peswani_kg.query(query)
        
        if not kg_result["success"]:
            return kg_result
        
        # Humanize the response using Gemini if available
        if GEMINI_API_KEY:
            try:
                humanized = self._humanize_response_with_gemini(
                    query, kg_result, user_context
                )
                kg_result["humanized_response"] = humanized
            except Exception as e:
                # Fallback to basic response if Gemini fails
                kg_result["humanized_response"] = kg_result["message"]
        else:
            kg_result["humanized_response"] = kg_result["message"]
        
        return kg_result
    
    def _humanize_response_with_gemini(self, query: str, kg_result: Dict[str, Any], context: Optional[str] = None) -> str:
        """
        Use Gemini 2.0 Flash to humanize the knowledge graph response
        """
        # Prepare context for Gemini
        system_prompt = """
        You are a caring assistant helping elderly people with dementia remember information about their family.
        Your responses should be:
        1. Warm, gentle, and reassuring
        2. Clear and simple to understand
        3. Conversational and natural
        4. Include the factual information from the knowledge graph
        5. Keep responses concise but warm
        
        The user asked: "{query}"
        The knowledge graph found: {kg_message}
        The specific answer is: {kg_answer}
        
        Please provide a warm, conversational response that includes this information.
        """.format(
            query=query,
            kg_message=kg_result.get("message", ""),
            kg_answer=kg_result.get("answer", "")
        )
        
        if context:
            system_prompt += f"\n\nAdditional context: {context}"
        
        try:
            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            response = model.generate_content(system_prompt)
            return response.text.strip()
        except Exception as e:
            # Fallback to original message if Gemini fails
            return kg_result["message"]

# Initialize service
kg_service = KnowledgeGraphService()

@router.post("/knowledge/query", response_model=VoiceQueryResponse)
async def process_voice_query(request: VoiceQueryRequest):
    """
    Process a natural language query about family relationships and information.
    
    This endpoint:
    1. Takes a natural language query (from speech-to-text)
    2. Queries the knowledge graph for relevant information
    3. Humanizes the response using Gemini 2.0 Flash
    4. Returns a conversational response (ready for text-to-speech)
    """
    try:
        if not request.query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        # Process the query through knowledge graph
        result = kg_service.process_natural_language_query(
            query=request.query,
            user_context=request.context
        )
        
        return VoiceQueryResponse(
            success=result["success"],
            message=result["message"],
            answer=result.get("answer"),
            humanized_response=result.get("humanized_response"),
            details=result.get("details"),
            suggestions=result.get("suggestions")
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

@router.post("/query", response_model=VoiceQueryResponse)
async def process_voice_query_legacy(request: VoiceQueryRequest):
    """
    Legacy endpoint - redirects to the new knowledge/query endpoint
    """
    return await process_voice_query(request)

@router.get("/test")
async def test_knowledge_graph():
    """
    Test endpoint to verify knowledge graph functionality
    """
    test_queries = [
        "What is the name of Sarita's daughter?",
        "When is Meeta's birthday?",
        "What does Rajesh do for work?"
    ]
    
    results = []
    for query in test_queries:
        try:
            result = kg_service.process_natural_language_query(query)
            results.append({
                "query": query,
                "success": result["success"],
                "response": result.get("humanized_response", result["message"])
            })
        except Exception as e:
            results.append({
                "query": query,
                "success": False,
                "response": f"Error: {str(e)}"
            })
    
    return {"test_results": results}

@router.get("/families")
async def get_all_families():
    """
    Get a list of all families in the knowledge graph
    """
    try:
        kg_engine = KnowledgeGraphQueryEngine("./dementia_care.db")
        
        # Get all elders from database
        import sqlite3
        conn = sqlite3.connect("./dementia_care.db")
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT u.id, u.full_name, 
                   COUNT(fm.id) as family_member_count
            FROM users u
            LEFT JOIN family_members fm ON u.id = fm.user_id
            WHERE u.user_type = 'elder'
            GROUP BY u.id, u.full_name
        """)
        
        families = []
        for row in cursor.fetchall():
            families.append({
                "user_id": row[0],
                "elder_name": row[1],
                "family_member_count": row[2]
            })
        
        conn.close()
        return {"families": families}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving families: {str(e)}")

@router.get("/demo/family-members/{user_id}")
async def get_demo_family_members(user_id: int):
    """
    Get family members for demo purposes (no authentication required)
    """
    try:
        import sqlite3
        conn = sqlite3.connect("./dementia_care.db")
        cursor = conn.cursor()
        
        # Get family members
        cursor.execute("""
            SELECT id, name, relationship_type, phone_number, email, notes
            FROM family_members
            WHERE user_id = ?
        """, (user_id,))
        
        family_members = []
        for row in cursor.fetchall():
            import json
            notes = json.loads(row[5]) if row[5] else {}
            family_members.append({
                "id": row[0],
                "name": row[1],
                "relationship_type": row[2],
                "phone_number": row[3],
                "email": row[4],
                "photo_url": None,  # Add default photo URL if needed
                "notes": notes.get("profession", ""),
                "last_contact_date": None,
                "created_at": "2024-01-01T00:00:00",
                "updated_at": None
            })
        
        conn.close()
        return {"success": True, "data": family_members}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving family members: {str(e)}")

@router.get("/demo/events/{user_id}")
async def get_demo_events(user_id: int):
    """
    Get events for demo purposes (no authentication required)
    """
    try:
        import sqlite3
        from datetime import datetime
        
        conn = sqlite3.connect("./dementia_care.db")
        cursor = conn.cursor()
        
        # Get events
        cursor.execute("""
            SELECT id, title, description, event_type, scheduled_date, status, location
            FROM events
            WHERE user_id = ?
        """, (user_id,))
        
        events = []
        for row in cursor.fetchall():
            events.append({
                "id": row[0],
                "title": row[1],
                "description": row[2],
                "event_type": row[3],
                "scheduled_date": row[4],
                "status": row[5],
                "location": row[6],
                "priority": "medium",
                "duration_minutes": 60,
                "created_at": "2024-01-01T00:00:00"
            })
        
        conn.close()
        return {"success": True, "data": events}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving events: {str(e)}")

@router.get("/families/list")
async def get_all_families_list():
    """
    Get a list of all families in the knowledge graph
    """
    try:
        kg_engine = KnowledgeGraphQueryEngine("./dementia_care.db")
        
        # Get all elders from database
        import sqlite3
        conn = sqlite3.connect("./dementia_care.db")
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT u.id, u.full_name, 
                   COUNT(fm.id) as family_member_count
            FROM users u
            LEFT JOIN family_members fm ON u.id = fm.user_id
            WHERE u.user_type = 'elder'
            GROUP BY u.id, u.full_name
        """)
        
        families = []
        for row in cursor.fetchall():
            families.append({
                "user_id": row[0],
                "elder_name": row[1],
                "family_member_count": row[2]
            })
        
        conn.close()
        return {"families": families}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving families: {str(e)}")

@router.get("/family/{user_id}")
async def get_family_details(user_id: int):
    """
    Get detailed information about a specific family
    """
    try:
        kg_engine = KnowledgeGraphQueryEngine("./dementia_care.db")
        
        import sqlite3
        conn = sqlite3.connect("./dementia_care.db")
        cursor = conn.cursor()
        
        # Get elder info
        cursor.execute("SELECT id, full_name, phone_number, date_of_birth FROM users WHERE id = ? AND user_type = 'elder'", (user_id,))
        elder_result = cursor.fetchone()
        
        if not elder_result:
            raise HTTPException(status_code=404, detail="Elder not found")
        
        # Get family members
        cursor.execute("""
            SELECT id, name, relationship_type, phone_number, email, notes
            FROM family_members
            WHERE user_id = ?
        """, (user_id,))
        
        family_members = []
        for row in cursor.fetchall():
            import json
            notes = json.loads(row[5]) if row[5] else {}
            family_members.append({
                "id": row[0],
                "name": row[1],
                "relationship": row[2],
                "phone": row[3],
                "email": row[4],
                "birthday": notes.get("birthday"),
                "profession": notes.get("profession"),
                "age": notes.get("age")
            })
        
        conn.close()
        
        return {
            "elder": {
                "id": elder_result[0],
                "name": elder_result[1],
                "phone": elder_result[2],
                "date_of_birth": elder_result[3]
            },
            "family_members": family_members
        }
    
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error retrieving family details: {str(e)}")