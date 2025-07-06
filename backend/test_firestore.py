import firebase_admin
from firebase_admin import credentials, firestore

def test_firestore_connection():
    try:
        # Inicializar Firebase
        cred = credentials.Certificate("firebase-service-account.json")
        firebase_admin.initialize_app(cred)
        
        # Testar conexão
        db = firestore.client()
        
        # Criar documento de teste
        doc_ref = db.collection('test').document('test_doc')
        doc_ref.set({'message': 'Hello Firestore!'})
        
        # Ler documento
        doc = doc_ref.get()
        print(f"Teste bem-sucedido: {doc.to_dict()}")
        
        # Limpar teste
        doc_ref.delete()
        
    except Exception as e:
        print(f"Erro de conexão: {e}")

if __name__ == "__main__":
    test_firestore_connection()