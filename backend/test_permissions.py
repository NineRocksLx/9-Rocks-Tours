import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

def test_firestore_permissions():
    """Teste específico para verificar permissões Firestore"""
    
    print("🔍 TESTE DE PERMISSÕES FIRESTORE")
    print("=" * 50)
    
    try:
        # Limpar inicializações anteriores
        for app in firebase_admin._apps.values():
            firebase_admin.delete_app(app)
        print("🧹 Apps anteriores limpos")
        
        # Carregar credenciais
        cred_path = "google-calendar-key.json"
        print(f"📁 Carregando credenciais de: {cred_path}")
        
        # Verificar service account
        with open(cred_path, 'r') as f:
            cred_data = json.load(f)
        
        print(f"📧 Service Account: {cred_data['client_email']}")
        print(f"🆔 Project ID: {cred_data['project_id']}")
        
        # Inicializar Firebase
        cred = credentials.Certificate(cred_path)
        app = firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin SDK inicializado")
        
        # Testar Firestore
        db = firestore.client()
        print("✅ Cliente Firestore criado")
        
        # TESTE 1: Listar coleções (requer permissão de leitura)
        print("\n📚 TESTE 1: Listar coleções...")
        try:
            collections = list(db.collections())
            collection_names = [col.id for col in collections]
            print(f"✅ Coleções encontradas: {collection_names}")
        except Exception as e:
            print(f"❌ Erro ao listar coleções: {e}")
            return False
        
        # TESTE 2: Ler documento (se existir tours)
        print("\n📖 TESTE 2: Tentar ler tours...")
        try:
            tours_ref = db.collection('tours')
            docs = list(tours_ref.limit(1).stream())
            
            if docs:
                doc = docs[0]
                print(f"✅ Tour lido: {doc.id}")
                print(f"   Dados: {list(doc.to_dict().keys())}")
            else:
                print("⚠️ Coleção 'tours' vazia ou não existe")
        except Exception as e:
            print(f"❌ Erro ao ler tours: {e}")
            print(f"   Tipo do erro: {type(e).__name__}")
            if "PERMISSION_DENIED" in str(e):
                print("🚨 PROBLEMA: Permissões insuficientes!")
                return False
        
        # TESTE 3: Criar documento de teste
        print("\n✍️ TESTE 3: Tentar escrever documento teste...")
        try:
            test_ref = db.collection('test_connection').document('permission_test')
            test_ref.set({
                'timestamp': firestore.SERVER_TIMESTAMP,
                'status': 'testing_permissions',
                'service_account': cred_data['client_email']
            })
            print("✅ Documento de teste criado")
            
            # Ler o documento criado
            doc = test_ref.get()
            if doc.exists:
                print("✅ Documento de teste lido com sucesso")
                
                # Limpar teste
                test_ref.delete()
                print("✅ Documento de teste removido")
            else:
                print("❌ Documento não foi criado corretamente")
                
        except Exception as e:
            print(f"❌ Erro ao escrever: {e}")
            if "PERMISSION_DENIED" in str(e):
                print("🚨 PROBLEMA: Sem permissões de escrita!")
                return False
        
        print("\n🎉 TODOS OS TESTES PASSARAM!")
        return True
        
    except Exception as e:
        print(f"❌ Erro geral: {e}")
        print(f"   Tipo: {type(e).__name__}")
        return False

def check_service_account_roles():
    """Mostra instruções para verificar roles"""
    print("\n" + "=" * 50)
    print("🔧 VERIFICAR PERMISSÕES NO GOOGLE CLOUD CONSOLE")
    print("=" * 50)
    print("1. Vai a: https://console.cloud.google.com/iam-admin/iam")
    print("2. Projeto: tours-81516-acfbc")
    print("3. Procura: backend-firestore-access@tours-81516-acfbc.iam.gserviceaccount.com")
    print("4. Verifica se tem estas ROLES:")
    print("   ✅ Cloud Firestore Service Agent")
    print("   ✅ Firebase Admin SDK Administrator Service Agent")
    print("   ✅ Firebase Develop Admin (opcional)")
    print("\nSe não tiver, adiciona essas roles!")

if __name__ == "__main__":
    success = test_firestore_permissions()
    
    if not success:
        check_service_account_roles()
        print("\n💡 PRÓXIMOS PASSOS:")
        print("1. Adicionar roles em falta no Google Cloud Console")
        print("2. Aguardar 5-10 minutos para propagação")
        print("3. Executar teste novamente")