# backend/routers/config_routes.py
# VERSÃO CORRIGIDA: Sem prefixo e com dados estáticos para garantir o funcionamento imediato.

from fastapi import APIRouter

# O prefixo foi REMOVIDO daqui. Ele será controlado pelo main.py.
router = APIRouter()

@router.get("/tour-filters")
async def get_tour_filters():
    """
    Retorna a lista de filtros de tour para o frontend.
    Esta lógica é idêntica à do server.py original.
    """
    return [
        {"key": "all", "labels": {"pt": "Todos os Tours", "en": "All Tours", "es": "Todos los Tours"}, "order": 0},
        {"key": "cultural", "labels": {"pt": "Cultural", "en": "Cultural", "es": "Cultural"}, "order": 1},
        {"key": "gastronomic", "labels": {"pt": "Gastronómico", "en": "Gastronomic", "es": "Gastronómico"}, "order": 2},
        {"key": "adventure", "labels": {"pt": "Aventura", "en": "Adventure", "es": "Aventura"}, "order": 3},
        {"key": "nature", "labels": {"pt": "Natureza", "en": "Nature", "es": "Naturaleza"}, "order": 4}
    ]

@router.get("/hero-images")
async def get_hero_images():
    """
    Retorna as imagens de destaque para o frontend.
    Esta lógica é idêntica à do server.py original.
    """
    return [
        {"id": "hero_1", "title": {"pt": "Sintra Mágica", "en": "Magical Sintra", "es": "Sintra Mágica"}, "subtitle": {"pt": "Descubra palácios encantados", "en": "Discover enchanted palaces", "es": "Descubre palacios encantados"}, "imageUrl": "https://media.timeout.com/images/105732838/1920/1080/image.webp"},
        {"id": "hero_2", "title": {"pt": "Lisboa Histórica", "en": "Historic Lisbon", "es": "Lisboa Histórica"}, "subtitle": {"pt": "Explore bairros típicos", "en": "Explore typical neighborhoods", "es": "Explora barrios típicos"}, "imageUrl": "https://images.unsplash.com/photo-1506744038136-46273834b3fb"},
        {"id": "hero_3", "title": {"pt": "Porto Autêntico", "en": "Authentic Porto", "es": "Oporto Autêntico"}, "subtitle": {"pt": "Sabores e tradições do Norte", "en": "Northern flavors and traditions", "es": "Sabores y tradiciones del Norte"}, "imageUrl": "https://images.unsplash.com/photo-1555881400-69e38bb0c85f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"}
    ]
