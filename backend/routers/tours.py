# backend/routers/tours.py - VERSÃO FINAL COM FIREBASE CENTRALIZADO

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional, Dict, Any
from datetime import datetime
import sys

# ✅ INICIALIZAR ROUTER (ESSENCIAL!)
router = APIRouter()

# ✅ IMPORTAÇÕES FIRESTORE CENTRALIZADAS
try:
    from config.firestore_db import db as db_firestore, tours_collection
    FIRESTORE_CONNECTED = True
    print("✅ Firestore conectado no tours.py via config centralizado")
except ImportError as e:
    FIRESTORE_CONNECTED = False
    db_firestore = None
    tours_collection = None
    print(f"❌ Erro ao importar config Firestore no tours.py: {e}")

# ✅ FUNÇÕES HELPER
def tour_helper(doc) -> Dict[str, Any]:
    """Converter documento Firestore para dict"""
    if not FIRESTORE_CONNECTED or not doc:
        return {"id": "mock", "name": {"pt": "Tour Mock", "en": "Mock Tour"}}
    
    try:
        data = doc.to_dict()
        data["id"] = doc.id
        
        # ✅ GARANTIR QUE NAME É SEMPRE UM OBJETO MULTILINGUAL
        if 'name' in data and isinstance(data['name'], str):
            # Se name for string, converter para objeto
            data['name'] = {"pt": data['name'], "en": data['name']}
        elif 'name' not in data or not isinstance(data['name'], dict):
            # Se name não existir ou não for dict, criar padrão
            data['name'] = {"pt": "Tour sem nome", "en": "Unnamed Tour"}
        
        return data
    except Exception as e:
        print(f"Erro no tour_helper: {e}")
        return {"id": "error", "name": {"pt": "Erro", "en": "Error"}}

async def get_firestore_tours(filters: Dict = None) -> List[Dict]:
    """Buscar tours no Firestore com filtros"""
    if not FIRESTORE_CONNECTED or not tours_collection:
        return [
            {
                "id": "mock-tour-1",
                "name": {"pt": "Tour Mock 1", "en": "Mock Tour 1"},
                "description": {"pt": "Descrição do tour mock 1", "en": "Mock tour 1 description"},
                "active": True,
                "price": 50.0,
                "location": "Lisboa",
                "rating": 4.5,
                "images": [],
                "featured": False
            },
            {
                "id": "mock-tour-2", 
                "name": {"pt": "Tour Mock 2", "en": "Mock Tour 2"},
                "description": {"pt": "Descrição do tour mock 2", "en": "Mock tour 2 description"},
                "active": True,
                "price": 75.0,
                "location": "Porto",
                "rating": 4.7,
                "images": [],
                "featured": True
            }
        ]
    
    try:
        # ✅ USAR A COLEÇÃO IMPORTADA DIRETAMENTE
        query = tours_collection
        
        # Aplicar filtros se existirem
        if filters:
            if 'active' in filters:
                query = query.where('active', '==', filters['active'])
            if 'tour_type' in filters:
                query = query.where('tour_type', '==', filters['tour_type'])
            if 'featured' in filters:
                query = query.where('featured', '==', filters['featured'])
        
        docs = query.stream()
        tours = []
        
        for doc in docs:
            tour_data = tour_helper(doc)
            
            # Filtro de localização (client-side porque Firestore)
            if filters and 'location' in filters:
                tour_location = tour_data.get('location', '').lower()
                if filters['location'].lower() not in tour_location:
                    continue
            
            tours.append(tour_data)
        
        return tours
        
    except Exception as e:
        print(f"Erro ao buscar tours: {e}")
        return []

def debug_map_locations(data: Dict, context: str = ""):
    """Debug específico para map_locations"""
    if not isinstance(data, dict):
        return
        
    print(f"🔍 DEBUG MAP_LOCATIONS [{context}]:")
    print(f"  - Contém map_locations: {'map_locations' in data}")
    
    if 'map_locations' in data:
        map_data = data['map_locations']
        print(f"  - Tipo: {type(map_data)}")
        print(f"  - Valor: {map_data}")
        
        if isinstance(map_data, str) and map_data:
            lines = [line for line in map_data.split('\n') if line.strip()]
            print(f"  - Linhas válidas: {len(lines)}")

# ✅ ENDPOINTS DE TOURS
@router.get("/")
async def get_all_tours(
    active_only: bool = Query(False, description="Filtrar apenas tours ativos"),
    tour_type: Optional[str] = Query(None, description="Filtrar por tipo"),
    location: Optional[str] = Query(None, description="Filtrar por localização"),
    featured: bool = Query(False, description="Apenas tours em destaque")
):
    """🎯 Buscar todos os tours com filtros"""
    try:
        filters = {}
        
        if active_only:
            filters['active'] = True
        if tour_type:
            filters['tour_type'] = tour_type
        if location:
            filters['location'] = location
        if featured:
            filters['featured'] = True
        
        tours = await get_firestore_tours(filters)
        
        # Ordenar tours (featured primeiro, depois por ordem)
        tours.sort(key=lambda x: (
            not x.get('featured', False),
            x.get('order', 999),
            x.get('name', {}).get('pt', '')
        ))
        
        print(f"✅ Retornando {len(tours)} tours")
        return tours
        
    except Exception as e:
        print(f"❌ Erro ao buscar tours: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@router.get("/featured")
async def get_featured_tours(limit: int = Query(6, description="Limite de tours")):
    """⭐ Buscar tours em destaque"""
    try:
        # Buscar todos os tours ativos
        all_tours = await get_firestore_tours({'active': True})
        
        # Separar featured dos outros
        featured_tours = [t for t in all_tours if t.get('featured', False)]
        other_tours = [t for t in all_tours if not t.get('featured', False)]
        
        # Retornar featured primeiro, depois outros até o limite
        result = (featured_tours + other_tours)[:limit]
        
        print(f"✅ Retornando {len(result)} tours em destaque")
        return result
        
    except Exception as e:
        print(f"❌ Erro ao buscar tours em destaque: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{tour_id}")
async def get_tour_by_id(tour_id: str):
    """🎯 Buscar tour específico por ID"""
    try:
        if not FIRESTORE_CONNECTED or not tours_collection:
            return {
                "id": tour_id,
                "name": {"pt": f"Tour Mock {tour_id}", "en": f"Mock Tour {tour_id}"},
                "description": {"pt": "Descrição mock", "en": "Mock description"},
                "price": 50.0,
                "active": True,
                "rating": 4.5,
                "images": [],
                "location": "Portugal"
            }
        
        doc_ref = tours_collection.document(tour_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Tour não encontrado")
        
        tour_data = tour_helper(doc)
        debug_map_locations(tour_data, f"GET tour {tour_id}")
        
        print(f"✅ Tour encontrado: {tour_data.get('name', {}).get('pt', 'Sem nome')}")
        return tour_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro ao buscar tour {tour_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_tour(tour_data: dict):
    """🆕 Criar novo tour"""
    try:
        if not FIRESTORE_CONNECTED or not tours_collection:
            return {"id": "new_mock", "message": "Tour criado (modo mock)", **tour_data}
        
        debug_map_locations(tour_data, "CREATE - Input")
        
        # ✅ GARANTIR QUE NAME É UM OBJETO MULTILINGUAL
        if 'name' in tour_data:
            if isinstance(tour_data['name'], str):
                # Se name for string, converter para objeto
                tour_data['name'] = {"pt": tour_data['name'], "en": tour_data['name']}
            elif not isinstance(tour_data['name'], dict):
                # Se name não for dict, criar padrão
                tour_data['name'] = {"pt": "Novo Tour", "en": "New Tour"}
        else:
            tour_data['name'] = {"pt": "Novo Tour", "en": "New Tour"}
        
        # Garantir map_locations como string
        if 'map_locations' not in tour_data:
            tour_data['map_locations'] = ''
        elif tour_data['map_locations'] is None:
            tour_data['map_locations'] = ''
        elif not isinstance(tour_data['map_locations'], str):
            tour_data['map_locations'] = str(tour_data['map_locations'])
        
        # Timestamps
        now = datetime.utcnow().timestamp()
        tour_data["created_at"] = now
        tour_data["updated_at"] = now
        
        # Campos padrão
        if 'active' not in tour_data:
            tour_data['active'] = True
        if 'featured' not in tour_data:
            tour_data['featured'] = False
        
        # Salvar no Firestore
        doc_ref = tours_collection.document()
        doc_ref.set(tour_data)
        
        result = {**tour_data, "id": doc_ref.id}
        debug_map_locations(result, "CREATE - Final")
        
        print(f"✅ Tour criado: {result.get('name', {}).get('pt', 'Sem nome')}")
        return result
        
    except Exception as e:
        print(f"❌ Erro ao criar tour: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{tour_id}")
async def update_tour(tour_id: str, tour_update: dict):
    """✏️ Atualizar tour existente"""
    try:
        if not FIRESTORE_CONNECTED or not tours_collection:
            return {"id": tour_id, "message": "Tour atualizado (modo mock)", **tour_update}
        
        debug_map_locations(tour_update, f"UPDATE {tour_id} - Input")
        
        doc_ref = tours_collection.document(tour_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Tour não encontrado")
        
        existing_data = doc.to_dict()
        debug_map_locations(existing_data, f"UPDATE {tour_id} - Existente")
        
        # ✅ GARANTIR QUE NAME É UM OBJETO MULTILINGUAL
        if 'name' in tour_update:
            if isinstance(tour_update['name'], str):
                # Se name for string, converter para objeto
                tour_update['name'] = {"pt": tour_update['name'], "en": tour_update['name']}
            elif not isinstance(tour_update['name'], dict):
                # Se name não for dict, criar padrão
                tour_update['name'] = {"pt": "Tour Atualizado", "en": "Updated Tour"}
        
        # Processar map_locations
        if 'map_locations' in tour_update:
            map_value = tour_update['map_locations']
            if map_value is None:
                tour_update['map_locations'] = ''
            elif not isinstance(map_value, str):
                tour_update['map_locations'] = str(map_value)
        
        # Mesclar dados
        updated_data = {**existing_data, **tour_update}
        updated_data["updated_at"] = datetime.utcnow().timestamp()
        
        debug_map_locations(updated_data, f"UPDATE {tour_id} - Mesclado")
        
        # Usar SET para garantir persistência
        doc_ref.set(updated_data)
        
        result = {**updated_data, "id": tour_id}
        debug_map_locations(result, f"UPDATE {tour_id} - Final")
        
        print(f"✅ Tour atualizado: {result.get('name', {}).get('pt', 'Sem nome')}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro ao atualizar tour {tour_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{tour_id}")
async def delete_tour(tour_id: str):
    """🗑️ Deletar tour"""
    try:
        if not FIRESTORE_CONNECTED or not tours_collection:
            return {"message": "Tour deletado (modo mock)", "id": tour_id}
        
        doc_ref = tours_collection.document(tour_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Tour não encontrado")
        
        # Opcional: soft delete (marcar como inativo em vez de deletar)
        # doc_ref.update({"active": False, "deleted_at": datetime.utcnow().timestamp()})
        
        # Hard delete
        doc_ref.delete()
        
        print(f"✅ Tour deletado: {tour_id}")
        return {"message": "Tour deletado com sucesso", "id": tour_id}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro ao deletar tour {tour_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ✅ ENDPOINT DE STATUS
@router.get("/status")
async def tours_status():
    """📊 Status do sistema de tours"""
    try:
        if FIRESTORE_CONNECTED and tours_collection:
            # Contar tours
            docs = tours_collection.stream()
            total_tours = sum(1 for _ in docs)
            
            # Contar ativos
            active_docs = tours_collection.where('active', '==', True).stream()
            active_tours = sum(1 for _ in active_docs)
        else:
            total_tours = 0
            active_tours = 0
        
        return {
            "status": "healthy",
            "firestore_connected": FIRESTORE_CONNECTED,
            "total_tours": total_tours,
            "active_tours": active_tours,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "firestore_connected": False,
            "timestamp": datetime.utcnow().isoformat()
        }