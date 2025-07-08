# backend/routers/tours_fixed.py - NOVO ARQUIVO CORRIGIDO
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from config.firestore_db import tours_collection, get_async_query
import asyncio

router = APIRouter()

async def tour_helper(tour_doc):
    """Helper para converter documento Firestore em dict"""
    data = tour_doc.to_dict()
    data["id"] = tour_doc.id
    return data

@router.get("/")
async def get_all_tours(
    active_only: bool = Query(False, description="Filtrar apenas tours ativos"),
    tour_type: Optional[str] = Query(None, description="Filtrar por tipo de tour"),
    location: Optional[str] = Query(None, description="Filtrar por localização"),
    featured: bool = Query(False, description="Apenas tours em destaque")
):
    """🎯 BUSCAR TODOS OS TOURS COM FILTROS OTIMIZADOS"""
    try:
        # Construir query
        query = tours_collection
        
        # Aplicar filtros
        if active_only:
            query = query.where("active", "==", True)
        
        if tour_type:
            query = query.where("tour_type", "==", tour_type)
        
        if featured:
            query = query.where("featured", "==", True)
        
        # Executar query
        docs = await get_async_query(query)
        tours = []
        
        for doc in docs:
            tour_data = await tour_helper(doc)
            
            # Filtro adicional por localização (no client-side)
            if location and location.lower() not in tour_data.get('location', '').lower():
                continue
                
            tours.append(tour_data)
        
        # Ordenar por featured primeiro, depois por order/created_at
        tours.sort(key=lambda x: (
            not x.get('featured', False),  # Featured first
            x.get('order', 999),           # Then by order
            x.get('created_at', '')        # Then by creation date
        ))
        
        print(f"✅ Retornando {len(tours)} tours")
        return tours
        
    except Exception as e:
        print(f"❌ Erro ao buscar tours: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar tours: {str(e)}")

@router.get("/{tour_id}")
async def get_tour_by_id(tour_id: str):
    """🎯 BUSCAR TOUR POR ID"""
    try:
        doc_ref = tours_collection.document(tour_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Tour não encontrado")
        
        tour_data = await tour_helper(doc)
        print(f"✅ Tour encontrado: {tour_data.get('name', {}).get('pt', 'Sem nome')}")
        return tour_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro ao buscar tour {tour_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/featured/list")
async def get_featured_tours(limit: int = Query(6, description="Limite de tours")):
    """🎯 ENDPOINT ESPECÍFICO PARA TOURS EM DESTAQUE"""
    try:
        # Buscar tours featured ou ativos
        query = tours_collection.where("active", "==", True)
        docs = await get_async_query(query)
        
        tours = []
        for doc in docs:
            tour_data = await tour_helper(doc)
            tours.append(tour_data)
        
        # Priorizar featured, depois limitar
        featured_tours = [t for t in tours if t.get('featured', False)]
        other_tours = [t for t in tours if not t.get('featured', False)]
        
        result = (featured_tours + other_tours)[:limit]
        
        print(f"✅ Retornando {len(result)} tours em destaque")
        return result
        
    except Exception as e:
        print(f"❌ Erro ao buscar tours em destaque: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_tour(tour_data: dict, user = None):
    """🎯 CRIAR NOVO TOUR"""
    try:
        # Adicionar timestamps
        tour_data["created_at"] = asyncio.get_event_loop().time()
        tour_data["updated_at"] = asyncio.get_event_loop().time()
        
        # Adicionar ao Firestore
        doc_ref = tours_collection.document()
        doc_ref.set(tour_data)
        
        # Retornar tour criado
        result = {**tour_data, "id": doc_ref.id}
        print(f"✅ Tour criado: {result.get('name', {}).get('pt', 'Sem nome')}")
        return result
        
    except Exception as e:
        print(f"❌ Erro ao criar tour: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{tour_id}")
async def update_tour(tour_id: str, tour_update: dict, user = None):
    """🎯 ATUALIZAR TOUR"""
    try:
        doc_ref = tours_collection.document(tour_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Tour não encontrado")
        
        # Adicionar timestamp de atualização
        tour_update["updated_at"] = asyncio.get_event_loop().time()
        
        # Atualizar no Firestore
        doc_ref.update(tour_update)
        
        # Retornar tour atualizado
        updated_doc = doc_ref.get()
        result = await tour_helper(updated_doc)
        
        print(f"✅ Tour atualizado: {result.get('name', {}).get('pt', 'Sem nome')}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro ao atualizar tour {tour_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{tour_id}")
async def delete_tour(tour_id: str, user = None):
    """🎯 DELETAR TOUR"""
    try:
        doc_ref = tours_collection.document(tour_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Tour não encontrado")
        
        doc_ref.delete()
        
        print(f"✅ Tour deletado: {tour_id}")
        return {"message": "Tour deletado com sucesso", "id": tour_id}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro ao deletar tour {tour_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))