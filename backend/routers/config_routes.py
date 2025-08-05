# backend/routers/config_routes.py - VERSÃO COM AS CORREÇÕES DO CLAUDE

from fastapi import APIRouter
from config.firestore_db import db as db_firestore

router = APIRouter()

@router.get("/tour-filters")
async def get_tour_filters():
    # ... (esta função pode ser mantida como está)
    return [
        {"key": "all", "labels": {"pt": "Todos os Tours", "en": "All Tours", "es": "Todos los Tours"}, "order": 0},
        {"key": "cultural", "labels": {"pt": "Cultural", "en": "Cultural", "es": "Cultural"}, "order": 1},
        {"key": "gastronomic", "labels": {"pt": "Gastronómico", "en": "Gastronomic", "es": "Gastronómico"}, "order": 2},
        {"key": "adventure", "labels": {"pt": "Aventura", "en": "Adventure", "es": "Aventura"}, "order": 3},
        {"key": "nature", "labels": {"pt": "Natureza", "en": "Nature", "es": "Naturaleza"}, "order": 4}
    ]

# ✅ FUNÇÃO CORRIGIDA SEGUINDO A SUGESTÃO DO CLAUDE
@router.get("/hero-images")
async def get_hero_images():
    """
    Retorna as imagens de destaque ATIVAS do Firestore para a HomePage.
    """
    try:
        # ✅ CORREÇÃO 1: Usar o nome da coleção correto 'heroImages' (camelCase)
        query = db_firestore.collection('heroImages')
        
        # Filtrar apenas as imagens que estão marcadas como ativas
        query = query.where('active', '==', True)
        
        # A ordenação por 'order' foi removida da query para evitar erros de índice composto
        docs = query.stream()
        
        images = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            images.append(data)
            
        # ✅ CORREÇÃO 2: Ordenar os resultados aqui no código, o que é mais seguro
        images.sort(key=lambda x: x.get('order', 999))
            
        print(f"✅ Retornando {len(images)} hero images ativas para a HomePage.")
        return images
        
    except Exception as e:
        print(f"❌ Erro ao buscar hero images para a HomePage: {e}. A devolver lista de fallback.")
        return []

# Endpoint de teste que usámos. Mantenha-o por agora para o passo seguinte.
@router.get("/version")
async def get_version():
    return {"version": "3.0-claude-fix", "file": "config_routes.py"}