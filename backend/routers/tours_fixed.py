# backend/routers/tours_fixed.py - VERSÃO CORRIGIDA PARA MAP_LOCATIONS
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from config.firestore_db import tours_collection, get_async_query
import asyncio
import json

router = APIRouter()

async def tour_helper(tour_doc):
    """Helper para converter documento Firestore em dict"""
    data = tour_doc.to_dict()
    data["id"] = tour_doc.id
    return data

def debug_map_locations(data, context=""):
    """🔍 Função específica para debugar map_locations"""
    print(f"🔍 DEBUG MAP_LOCATIONS [{context}]:")
    print(f"  - Dados recebidos: {type(data)}")
    print(f"  - Contém map_locations: {'map_locations' in data if isinstance(data, dict) else 'N/A'}")
    if isinstance(data, dict) and 'map_locations' in data:
        map_data = data['map_locations']
        print(f"  - Valor: {map_data}")
        print(f"  - Tipo: {type(map_data)}")
        print(f"  - Tamanho: {len(map_data) if map_data else 'N/A'}")
        if isinstance(map_data, str):
            lines = map_data.split('\n') if map_data else []
            valid_lines = [line for line in lines if line.strip()]
            print(f"  - Linhas válidas: {len(valid_lines)}")
            for i, line in enumerate(valid_lines[:3]):  # Mostrar só 3 primeiras
                print(f"    Linha {i+1}: {line}")
            if len(valid_lines) > 3:
                print(f"    ... e mais {len(valid_lines) - 3} linhas")
    else:
        print(f"  - ❌ Campo map_locations não encontrado!")

@router.get("/")
@router.get("")
async def get_all_tours(
    active_only: bool = Query(False, description="Filtrar apenas tours ativos"),
    tour_type: Optional[str] = Query(None, description="Filtrar por tipo de tour"),
    location: Optional[str] = Query(None, description="Filtrar por localização"),
    featured: bool = Query(False, description="Apenas tours em destaque")
):
    """🎯 BUSCAR TODOS OS TOURS COM FILTROS OTIMIZADOS"""
    try:
        query = tours_collection
        
        if active_only:
            query = query.where("active", "==", True)
        
        if tour_type:
            query = query.where("tour_type", "==", tour_type)
        
        if featured:
            query = query.where("featured", "==", True)
        
        docs = await get_async_query(query)
        tours = []
        
        for doc in docs:
            tour_data = await tour_helper(doc)
            
            if location and location.lower() not in tour_data.get('location', '').lower():
                continue
                
            tours.append(tour_data)
        
        tours.sort(key=lambda x: (
            not x.get('featured', False),
            x.get('order', 999),
            x.get('created_at', '')
        ))
        
        print(f"✅ Retornando {len(tours)} tours")
        return tours
        
    except Exception as e:
        print(f"❌ Erro ao buscar tours: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar tours: {str(e)}")

@router.get("/{tour_id}")
async def get_tour_by_id(tour_id: str):
    """🎯 BUSCAR TOUR POR ID COM DEBUG MELHORADO"""
    try:
        doc_ref = tours_collection.document(tour_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Tour não encontrado")
        
        tour_data = await tour_helper(doc)
        
        # 🔍 DEBUG ESPECÍFICO PARA GET
        debug_map_locations(tour_data, f"GET tour {tour_id}")
        
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
        query = tours_collection.where("active", "==", True)
        docs = await get_async_query(query)
        
        tours = []
        for doc in docs:
            tour_data = await tour_helper(doc)
            tours.append(tour_data)
        
        featured_tours = [t for t in tours if t.get('featured', False)]
        other_tours = [t for t in tours if not t.get('featured', False)]
        
        result = (featured_tours + other_tours)[:limit]
        
        print(f"✅ Retornando {len(result)} tours em destaque")
        return result
        
    except Exception as e:
        print(f"❌ Erro ao buscar tours em destaque: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_tour(tour_data: dict):
    """🎯 CRIAR NOVO TOUR COM DEBUG DE MAP_LOCATIONS"""
    try:
        # 🔍 DEBUG INPUT
        debug_map_locations(tour_data, "CREATE - Input")
        
        # Garantir que map_locations existe e é uma string
        if 'map_locations' not in tour_data:
            tour_data['map_locations'] = ''
            print("⚠️ Campo map_locations não estava presente, adicionado como string vazia")
        elif tour_data['map_locations'] is None:
            tour_data['map_locations'] = ''
            print("⚠️ Campo map_locations era None, convertido para string vazia")
        elif not isinstance(tour_data['map_locations'], str):
            print(f"⚠️ Campo map_locations não era string: {type(tour_data['map_locations'])}")
            tour_data['map_locations'] = str(tour_data['map_locations'])
        
        tour_data["created_at"] = asyncio.get_event_loop().time()
        tour_data["updated_at"] = asyncio.get_event_loop().time()
        
        # 🔍 DEBUG ANTES DE SALVAR
        debug_map_locations(tour_data, "CREATE - Antes de salvar")
        
        doc_ref = tours_collection.document()
        doc_ref.set(tour_data)
        
        # 🔍 VERIFICAR APÓS SALVAR
        saved_doc = doc_ref.get()
        if saved_doc.exists:
            saved_data = saved_doc.to_dict()
            debug_map_locations(saved_data, "CREATE - Após salvar (verificação)")
        
        result = {**tour_data, "id": doc_ref.id}
        
        # 🔍 DEBUG FINAL
        debug_map_locations(result, "CREATE - Resultado final")
        
        print(f"✅ Tour criado: {result.get('name', {}).get('pt', 'Sem nome')}")
        return result
        
    except Exception as e:
        print(f"❌ Erro ao criar tour: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{tour_id}")
async def update_tour(tour_id: str, tour_update: dict):
    """🎯 ATUALIZAR TOUR COM DEBUG COMPLETO DE MAP_LOCATIONS"""
    try:
        # 🔍 DEBUG INPUT
        debug_map_locations(tour_update, f"UPDATE {tour_id} - Input")
        
        doc_ref = tours_collection.document(tour_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Tour não encontrado")
        
        existing_data = doc.to_dict()
        debug_map_locations(existing_data, f"UPDATE {tour_id} - Dados existentes")
        
        # 🔧 GARANTIR QUE MAP_LOCATIONS É PROCESSADO CORRETAMENTE
        if 'map_locations' in tour_update:
            map_locations_value = tour_update['map_locations']
            
            if map_locations_value is None:
                print("⚠️ map_locations é None, convertendo para string vazia")
                tour_update['map_locations'] = ''
            elif not isinstance(map_locations_value, str):
                print(f"⚠️ map_locations não é string: {type(map_locations_value)}, convertendo")
                tour_update['map_locations'] = str(map_locations_value)
            else:
                print(f"✅ map_locations é string válida com {len(map_locations_value)} caracteres")
        else:
            print("ℹ️ map_locations não presente na atualização, mantendo valor existente")
        
        # Mesclar dados
        updated_data = {**existing_data, **tour_update}
        updated_data["updated_at"] = asyncio.get_event_loop().time()
        
        # 🔍 DEBUG DADOS MESCLADOS
        debug_map_locations(updated_data, f"UPDATE {tour_id} - Dados mesclados")
        
        # 🔧 USAR SET COMPLETO PARA GARANTIR PERSISTÊNCIA
        doc_ref.set(updated_data)
        print(f"✅ Dados salvos no Firestore usando .set()")
        
        # 🔍 VERIFICAÇÃO IMEDIATA APÓS SALVAR
        verification_doc = doc_ref.get()
        if verification_doc.exists:
            verification_data = verification_doc.to_dict()
            debug_map_locations(verification_data, f"UPDATE {tour_id} - Verificação pós-save")
            
            # Verificar se o campo foi realmente salvo
            if 'map_locations' in verification_data:
                saved_map_locations = verification_data['map_locations']
                if saved_map_locations == updated_data.get('map_locations'):
                    print("✅ map_locations confirmado como salvo corretamente")
                else:
                    print("❌ map_locations salvo difere do enviado!")
                    print(f"   Enviado: {updated_data.get('map_locations')}")
                    print(f"   Salvo: {saved_map_locations}")
            else:
                print("❌ map_locations não encontrado na verificação!")
        
        result = {**updated_data, "id": tour_id}
        
        # 🔍 DEBUG RESULTADO FINAL
        debug_map_locations(result, f"UPDATE {tour_id} - Resultado final")
        
        print(f"✅ Tour atualizado: {result.get('name', {}).get('pt', 'Sem nome')}")
        
        # 🔧 RESPOSTA COM GARANTIA DE map_locations
        if 'map_locations' not in result:
            print("⚠️ Adicionando map_locations ao resultado como fallback")
            result['map_locations'] = updated_data.get('map_locations', '')
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro ao atualizar tour {tour_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{tour_id}")
async def delete_tour(tour_id: str):
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
