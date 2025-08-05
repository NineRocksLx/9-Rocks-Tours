from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import os
import time

# Importações absolutas para a nova estrutura
from config.firestore_db import db as db_firestore

router = APIRouter()

IS_DEV = os.getenv("ENVIRONMENT") == "development"

def tour_helper(tour_doc):
    """Helper para converter documento Firestore para dict"""
    data = tour_doc.to_dict()
    data["id"] = tour_doc.id
    return data

def debug_map_locations(data, context=""):
    if not IS_DEV:
        return
    print(f"🔍 DEBUG MAP_LOCATIONS [{context}]:")
    if isinstance(data, dict) and 'map_locations' in data:
        map_data = data['map_locations']
        print(f"  - Valor: {map_data}")
        print(f"  - Tipo: {type(map_data)}")
    else:
        print(f"  - ❌ Campo map_locations não encontrado!")

@router.get("/")
async def get_tours(active_only: bool = Query(False), featured: bool = Query(False)):
    """🎯 OBTER TODOS OS TOURS COM FILTROS"""
    try:
        if not db_firestore:
            raise HTTPException(status_code=500, detail="Firestore não disponível")
            
        query = db_firestore.collection('tours')
        
        # ✅ CORREÇÃO: Nova sintaxe do Firestore
        if active_only:
            query = query.where(filter=('active', '==', True))
        if featured:
            query = query.where(filter=('featured', '==', True))
            
        docs = list(query.stream())
        tours = []
        for doc in docs:
            tour_data = tour_helper(doc)
            tours.append(tour_data)
        
        print(f"✅ Retornando {len(tours)} tours (active_only={active_only}, featured={featured})")
        return tours
        
    except Exception as e:
        print(f"❌ ERRO CRÍTICO na rota GET /: {e}")
        print(f"❌ Tipo de erro: {type(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar tours: {str(e)}")

@router.get("/{tour_id}")
async def get_tour_by_id(tour_id: str):
    """🎯 BUSCAR TOUR POR ID COM DEBUG MELHORADO"""
    try:
        if not db_firestore:
            raise HTTPException(status_code=500, detail="Firestore não disponível")
            
        doc_ref = db_firestore.collection('tours').document(tour_id)
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

@router.get("/featured/list", summary="Obter tours em destaque")
async def get_featured_tours(limit: int = Query(6, description="Limite de tours")):
    """🎯 ENDPOINT ESPECÍFICO PARA TOURS EM DESTAQUE"""
    try:
        if not db_firestore:
            raise HTTPException(status_code=500, detail="Firestore não disponível")
            
        # ✅ CORREÇÃO: Nova sintaxe do Firestore
        query = db_firestore.collection('tours').where(filter=("active", "==", True)).where(filter=("featured", "==", True))
        docs = list(query.limit(limit).stream())
        
        tours = []
        for doc in docs:
            tour_data = tour_helper(doc)
            tours.append(tour_data)
        
        print(f"✅ Retornando {len(tours)} tours em destaque")
        return tours
        
    except Exception as e:
        print(f"❌ Erro ao buscar tours em destaque: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", summary="Criar um novo tour", status_code=201)
async def create_tour(tour_data: dict):
    """🎯 CRIAR NOVO TOUR COM DEBUG DE MAP_LOCATIONS"""
    try:
        if not db_firestore:
            raise HTTPException(status_code=500, detail="Firestore não disponível")
            
        debug_map_locations(tour_data, "CREATE - Input")
        
        if 'map_locations' not in tour_data or tour_data['map_locations'] is None:
            tour_data['map_locations'] = ''
        
        tour_data["created_at"] = time.time()
        tour_data["updated_at"] = time.time()
        
        doc_ref = db_firestore.collection('tours').document()
        doc_ref.set(tour_data)
        
        saved_doc = doc_ref.get()
        result = tour_helper(saved_doc)
        
        print(f"✅ Tour criado: {result.get('name', {}).get('pt', 'Sem nome')}")
        return result
        
    except Exception as e:
        print(f"❌ Erro ao criar tour: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{tour_id}", summary="Atualizar um tour existente")
async def update_tour(tour_id: str, tour_update: dict):
    """🎯 ATUALIZAR TOUR COM DEBUG COMPLETO DE MAP_LOCATIONS"""
    try:
        if not db_firestore:
            raise HTTPException(status_code=500, detail="Firestore não disponível")
            
        debug_map_locations(tour_update, f"UPDATE {tour_id} - Input")
        
        doc_ref = db_firestore.collection('tours').document(tour_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Tour não encontrado")
        
        if 'map_locations' in tour_update and tour_update['map_locations'] is None:
            tour_update['map_locations'] = ''
        
        tour_update["updated_at"] = time.time()
        
        doc_ref.update(tour_update)
        
        updated_doc = doc_ref.get()
        result = tour_helper(updated_doc)
        
        print(f"✅ Tour atualizado: {result.get('name', {}).get('pt', 'Sem nome')}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro ao atualizar tour {tour_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{tour_id}", summary="Apagar um tour")
async def delete_tour(tour_id: str):
    """🎯 DELETAR TOUR"""
    try:
        if not db_firestore:
            raise HTTPException(status_code=500, detail="Firestore não disponível")
            
        doc_ref = db_firestore.collection('tours').document(tour_id)
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

@router.get("/{tour_id}/occupied-dates")
async def get_occupied_dates(tour_id: str):
    """Retorna as datas ocupadas para um tour específico"""
    try:
        if not db_firestore:
            raise HTTPException(status_code=500, detail="Firestore não disponível")
            
        tour_doc = db_firestore.collection('tours').document(tour_id).get()
        if not tour_doc.exists:
            raise HTTPException(status_code=404, detail="Tour não encontrado")
        data = tour_doc.to_dict()
        occupied_dates = data.get('occupied_dates', [])
        
        print(f"✅ Retornando {len(occupied_dates)} datas ocupadas para o tour {tour_id}")
        return {"occupied_dates": occupied_dates}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro ao buscar datas ocupadas para o tour {tour_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar datas ocupadas: {str(e)}")