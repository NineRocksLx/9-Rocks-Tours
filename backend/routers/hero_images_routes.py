
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header, Body
from firebase_admin import firestore, storage, auth
from config.firestore_db import db as db_firestore
import uuid
import json
from PIL import Image
import io

router = APIRouter(tags=["Hero Images"])

# Função de autenticação admin via header Authorization
async def get_current_admin(authorization: str = Header(None)):
    try:
        if not authorization:
            raise HTTPException(401, "Token de autenticação não fornecido")
        token = authorization.split("Bearer ")[1] if "Bearer " in authorization else authorization
        decoded_token = auth.verify_id_token(token)
        if not decoded_token.get('admin', False):
            raise HTTPException(403, "Permissão de administrador necessária")
        return decoded_token
    except Exception as e:
        raise HTTPException(401, f"Token inválido: {str(e)}")

@router.get("/")
async def get_hero_images(active_only: bool = False):
    try:
        query = db_firestore.collection('hero_images')
        if active_only:
            query = query.where('active', '==', True)
        query = query.order_by('order')
        docs = query.stream()
        images = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            images.append(data)
        if not images and active_only:
            print("⚠️ Nenhuma hero image ativa encontrada.")
        else:
            print(f"✅ Retornando {len(images)} hero images (active_only={active_only})")
        return images
    except Exception as e:
        print(f"❌ Erro ao buscar hero images: {e}")
        raise HTTPException(500, f"Erro ao buscar hero images: {str(e)}")

@router.post("/")
async def create_hero_image(
    file: UploadFile = File(...),
    imageData: str = Form(...),
    admin: dict = Depends(get_current_admin)
):
    try:
        # Parsear dados do formulário
        data = json.loads(imageData)

        # Validar tipo de arquivo
        valid_types = ['image/jpeg', 'image/png', 'image/webp']
        if file.content_type not in valid_types:
            raise HTTPException(400, "Tipo de arquivo não suportado. Use JPG, PNG ou WebP.")

        # Validar tamanho do arquivo (máx 5MB)
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(400, "Arquivo muito grande. Máximo 5MB.")

        # Comprimir imagem
        img = Image.open(io.BytesIO(content))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=85, optimize=True)
        compressed_content = output.getvalue()

        # Gerar nome único para o arquivo
        filename = f"hero_{uuid.uuid4()}.jpg"
        storage_path = f"hero-images/{filename}"

        # Upload para Firebase Storage
        bucket = storage.bucket()
        blob = bucket.blob(storage_path)
        blob.upload_from_string(compressed_content, content_type='image/jpeg')
        blob.make_public()
        image_url = blob.public_url

        # Salvar metadados no Firestore
        doc_ref = db_firestore.collection('hero_images').document()
        doc_data = {
            'id': doc_ref.id,
            'imageUrl': image_url,
            'fileName': filename,
            'fileSize': len(compressed_content),
            'fileType': 'image/jpeg',
            'originalName': file.filename,
            'title': data.get('title', {'pt': '', 'en': '', 'es': ''}),
            'subtitle': data.get('subtitle', {'pt': '', 'en': '', 'es': ''}),
            'order': data.get('order', 1),
            'active': data.get('active', True),
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        }
        doc_ref.set(doc_data)

        print(f"✅ Hero image criada: {doc_ref.id}")
        return {"message": "Hero image criada", "data": doc_data}
    except Exception as e:
        print(f"❌ Erro ao criar hero image: {e}")
        raise HTTPException(500, f"Erro ao criar hero image: {str(e)}")

@router.put("/{image_id}")
async def update_hero_image(
    image_id: str,
    data: dict = Body(...),
    admin: dict = Depends(get_current_admin)
):
    try:
        doc_ref = db_firestore.collection('hero_images').document(image_id)
        if not doc_ref.get().exists:
            raise HTTPException(404, "Hero image não encontrada")
        
        update_data = {
            **data,
            'updatedAt': firestore.SERVER_TIMESTAMP
        }
        doc_ref.update(update_data)
        print(f"✅ Hero image atualizada: {image_id}")
        return {"message": "Hero image atualizada"}
    except Exception as e:
        print(f"❌ Erro ao atualizar hero image: {e}")
        raise HTTPException(500, f"Erro ao atualizar hero image: {str(e)}")

@router.delete("/{image_id}")
async def delete_hero_image(
    image_id: str,
    admin: dict = Depends(get_current_admin)
):
    try:
        doc_ref = db_firestore.collection('hero_images').document(image_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(404, "Hero image não encontrada")
        
        # Deletar imagem do Storage
        data = doc.to_dict()
        if 'fileName' in data:
            try:
                bucket = storage.bucket()
                blob = bucket.blob(f"hero-images/{data['fileName']}")
                blob.delete()
                print(f"✅ Arquivo removido do Storage: {data['fileName']}")
            except Exception as storage_error:
                print(f"⚠️ Aviso: Não foi possível deletar do Storage: {storage_error}")

        # Deletar documento do Firestore
        doc_ref.delete()
        print(f"✅ Hero image deletada: {image_id}")
        return {"message": "Hero image deletada"}
    except Exception as e:
        print(f"❌ Erro ao deletar hero image: {e}")
        raise HTTPException(500, f"Erro ao deletar hero image: {str(e)}")
