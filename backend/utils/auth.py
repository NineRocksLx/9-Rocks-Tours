# backend/utils/auth.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth as firebase_auth

security = HTTPBearer()

def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Token não fornecido")
    
    token = credentials.credentials
    
    # Suporte ao token temporário (do teu server.py, para dev)
    if token.startswith("temp_admin_token_"):
        return {"uid": "admin", "email": "admin@9rockstours.com"}
    
    try:
        # Verificação real com Firebase Admin
        decoded_token = firebase_auth.verify_id_token(token)
        # Verifique claims se necessário (ex.: if decoded_token.get('admin') is True)
        return decoded_token
    except firebase_admin.exceptions.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")
    except firebase_admin.exceptions.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Erro na verificação do token: {str(e)}")