from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db, User, KnowledgeEntity, Interaction
from app.schemas import (
    KnowledgeEntity as KnowledgeEntitySchema,
    KnowledgeEntityCreate, InteractionCreate,
    Interaction as InteractionSchema, MessageResponse
)
from app.auth import get_current_active_user

router = APIRouter()

@router.get("/entities", response_model=List[KnowledgeEntitySchema])
async def get_knowledge_entities(
    current_user: User = Depends(get_current_active_user),
    entity_type: str = None,
    db: Session = Depends(get_db)
):
    """Get knowledge entities for current user"""
    query = db.query(KnowledgeEntity).filter(
        KnowledgeEntity.user_id == current_user.id
    )
    
    if entity_type:
        query = query.filter(KnowledgeEntity.entity_type == entity_type)
    
    return query.order_by(KnowledgeEntity.mention_count.desc()).all()

@router.post("/entities", response_model=KnowledgeEntitySchema)
async def create_knowledge_entity(
    entity: KnowledgeEntityCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new knowledge entity"""
    db_entity = KnowledgeEntity(
        **entity.dict(),
        user_id=current_user.id
    )
    
    db.add(db_entity)
    db.commit()
    db.refresh(db_entity)
    return db_entity

@router.post("/interactions", response_model=InteractionSchema)
async def create_interaction(
    interaction: InteractionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new interaction record"""
    db_interaction = Interaction(
        **interaction.dict(),
        user_id=current_user.id
    )
    
    db.add(db_interaction)
    db.commit()
    db.refresh(db_interaction)
    return db_interaction

@router.get("/interactions", response_model=List[InteractionSchema])
async def get_interactions(
    current_user: User = Depends(get_current_active_user),
    interaction_type: str = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get interaction history for current user"""
    query = db.query(Interaction).filter(
        Interaction.user_id == current_user.id
    )
    
    if interaction_type:
        query = query.filter(Interaction.interaction_type == interaction_type)
    
    return query.order_by(Interaction.created_at.desc()).limit(limit).all()

@router.get("/graph-data")
async def get_knowledge_graph_data(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get knowledge graph data for visualization
    Returns nodes and edges for graph representation
    """
    entities = db.query(KnowledgeEntity).filter(
        KnowledgeEntity.user_id == current_user.id
    ).all()
    
    # Build nodes
    nodes = []
    edges = []
    
    # Add user as central node
    nodes.append({
        "id": f"user_{current_user.id}",
        "label": current_user.full_name,
        "type": "user",
        "size": 30
    })
    
    # Add family members as nodes
    for family_member in current_user.family_members:
        nodes.append({
            "id": f"family_{family_member.id}",
            "label": family_member.name,
            "type": "family",
            "relationship": family_member.relationship,
            "size": 20
        })
        
        # Add edge between user and family member
        edges.append({
            "from": f"user_{current_user.id}",
            "to": f"family_{family_member.id}",
            "label": family_member.relationship,
            "type": "family_relationship"
        })
    
    # Add knowledge entities as nodes
    for entity in entities:
        nodes.append({
            "id": f"entity_{entity.id}",
            "label": entity.entity_name,
            "type": entity.entity_type,
            "description": entity.entity_description,
            "mentions": entity.mention_count,
            "size": min(10 + entity.mention_count * 2, 25)
        })
        
        # Add edge between user and entity
        edges.append({
            "from": f"user_{current_user.id}",
            "to": f"entity_{entity.id}",
            "label": entity.relationship_type or "knows",
            "type": "knowledge_relationship",
            "strength": entity.relationship_strength
        })
    
    return {
        "nodes": nodes,
        "edges": edges,
        "stats": {
            "total_entities": len(entities),
            "family_members": len(current_user.family_members),
            "total_interactions": len(current_user.interactions)
        }
    }

@router.get("/entity-types")
async def get_entity_types(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get available entity types for current user"""
    entity_types = db.query(KnowledgeEntity.entity_type).filter(
        KnowledgeEntity.user_id == current_user.id
    ).distinct().all()
    
    return [et[0] for et in entity_types]
