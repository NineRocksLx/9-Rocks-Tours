from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import asyncio
import os
import json

# Importações absolutas para a nova estrutura
from config.firestore_db import db as db_firestore
from models.tour import Tour

router = APIRouter()

IS_DEV = os.getenv("ENVIRONMENT") == "development"

async def tour_helper(tour_doc):
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

# ✅ CORREÇÃO: O caminho agora é "/" para corresponder a /api/tours/
@router.get("/")
async def get_tours(active_only: bool = False, featured: bool = False):
    """🎯 OBTER TODOS OS TOURS COM FILTROS"""
    try:
        query = db_firestore.collection('tours')
        
        if active_only:
            query = query.where('active', '==', True)
        if featured:
            query = query.where('featured', '==', True)
            
        docs = query.stream()
        tours = [await tour_helper(doc) for doc in docs]
        
        print(f"✅ Retornando {len(tours)} tours (active_only={active_only}, featured={featured})")
        return tours
        
    except Exception as e:
        print(f"❌ ERRO CRÍTICO na rota GET /: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar tours: {str(e)}")

# ✅ CORREÇÃO: O caminho agora é "/{tour_id}" para corresponder a /api/tours/{tour_id}
@router.get("/{tour_id}")
async def get_tour_by_id(tour_id: str):
    """🎯 BUSCAR TOUR POR ID COM DEBUG MELHORADO"""
    try:
        doc_ref = db_firestore.collection('tours').document(tour_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Tour não encontrado")
        
        tour_data = await tour_helper(doc)
        debug_map_locations(tour_data, f"GET tour {tour_id}")
        
        print(f"✅ Tour encontrado: {tour_data.get('name', {}).get('pt', 'Sem nome')}")
        return tour_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro ao buscar tour {tour_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ✅ CORREÇÃO: O caminho agora é "/featured/list"
@router.get("/featured/list", summary="Obter tours em destaque")
async def get_featured_tours(limit: int = Query(6, description="Limite de tours")):
    """🎯 ENDPOINT ESPECÍFICO PARA TOURS EM DESTAQUE"""
    try:
        query = db_firestore.collection('tours').where("active", "==", True).where("featured", "==", True)
        docs = query.limit(limit).stream()
        
        tours = [await tour_helper(doc) for doc in docs]
        
        print(f"✅ Retornando {len(tours)} tours em destaque")
        return tours
        
    except Exception as e:
        print(f"❌ Erro ao buscar tours em destaque: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ✅ CORREÇÃO: O caminho agora é "/"
@router.post("/", summary="Criar um novo tour", status_code=201)
async def create_tour(tour_data: dict):
    """🎯 CRIAR NOVO TOUR COM DEBUG DE MAP_LOCATIONS"""
    try:
        debug_map_locations(tour_data, "CREATE - Input")
        
        if 'map_locations' not in tour_data or tour_data['map_locations'] is None:
            tour_data['map_locations'] = ''
        
        tour_data["created_at"] = asyncio.get_event_loop().time()
        tour_data["updated_at"] = asyncio.get_event_loop().time()
        
        doc_ref = db_firestore.collection('tours').document()
        doc_ref.set(tour_data)
        
        saved_doc = doc_ref.get()
        result = await tour_helper(saved_doc)
        
        print(f"✅ Tour criado: {result.get('name', {}).get('pt', 'Sem nome')}")
        return result
        
    except Exception as e:
        print(f"❌ Erro ao criar tour: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ✅ CORREÇÃO: O caminho agora é "/{tour_id}"
@router.put("/{tour_id}", summary="Atualizar um tour existente")
async def update_tour(tour_id: str, tour_update: dict):
    """🎯 ATUALIZAR TOUR COM DEBUG COMPLETO DE MAP_LOCATIONS"""
    try:
        debug_map_locations(tour_update, f"UPDATE {tour_id} - Input")
        
        doc_ref = db_firestore.collection('tours').document(tour_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Tour não encontrado")
        
        if 'map_locations' in tour_update and tour_update['map_locations'] is None:
            tour_update['map_locations'] = ''
        
        tour_update["updated_at"] = asyncio.get_event_loop().time()
        
        doc_ref.update(tour_update)
        
        updated_doc = doc_ref.get()
        result = await tour_helper(updated_doc)
        
        print(f"✅ Tour atualizado: {result.get('name', {}).get('pt', 'Sem nome')}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro ao atualizar tour {tour_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ✅ CORREÇÃO: O caminho agora é "/{tour_id}"
@router.delete("/{tour_id}", summary="Apagar um tour")
async def delete_tour(tour_id: str):
    """🎯 DELETAR TOUR"""
    try:
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

# Este endpoint parece ser relativo ao tour_id, pelo que o caminho está correto
@router.get("/{tour_id}/occupied-dates")
async def get_occupied_dates(tour_id: str):
    """Retorna as datas ocupadas para um tour específico"""
    try:
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
