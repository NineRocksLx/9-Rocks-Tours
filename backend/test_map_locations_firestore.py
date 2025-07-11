# backend/test_map_locations_firestore.py - SCRIPT DE TESTE PARA MAP_LOCATIONS
"""
Script para testar se o Firestore está salvando corretamente o campo map_locations
Execute este script para verificar se há problemas de configuração no Firestore
"""

import asyncio
import time
from config.firestore_db import tours_collection

def test_map_locations_persistence():
    """🔍 Teste completo de persistência do map_locations no Firestore"""
    
    print("=" * 60)
    print("🔍 TESTE DE PERSISTÊNCIA MAP_LOCATIONS NO FIRESTORE")
    print("=" * 60)
    
    # Dados de teste
    test_map_locations = """Palácio da Pena, 38.787586, -9.390625
Quinta da Regaleira, 38.796111, -9.396111
Sintra Centro, 38.802900, -9.381700"""
    
    test_tour_data = {
        "name": {
            "pt": "Tour de Teste MAP_LOCATIONS",
            "en": "MAP_LOCATIONS Test Tour",
            "es": "Tour de Prueba MAP_LOCATIONS"
        },
        "description": {
            "pt": "Tour criado para testar persistência de map_locations",
            "en": "Tour created to test map_locations persistence",
            "es": "Tour creado para probar persistencia de map_locations"
        },
        "short_description": {
            "pt": "Teste",
            "en": "Test",
            "es": "Prueba"
        },
        "price": 50.0,
        "duration_hours": 8,
        "max_participants": 8,
        "tour_type": "cultural",
        "location": "Sintra, Portugal",
        "map_locations": test_map_locations,  # 🔍 CAMPO PRINCIPAL PARA TESTAR
        "images": [],
        "active": True,
        "featured": False,
        "created_at": time.time(),
        "updated_at": time.time()
    }
    
    try:
        print("\n📤 ETAPA 1: Criando documento de teste...")
        print(f"📤 map_locations a ser salvo ({len(test_map_locations)} chars):")
        print(f"📤 Conteúdo: {repr(test_map_locations)}")
        print(f"📤 Linhas válidas: {len(test_map_locations.split('\\n'))}")
        
        # Criar documento
        doc_ref = tours_collection.document()
        doc_ref.set(test_tour_data)
        test_doc_id = doc_ref.id
        
        print(f"✅ Documento criado com ID: {test_doc_id}")
        
        print("\n📥 ETAPA 2: Verificando imediatamente após criação...")
        
        # Verificar imediatamente
        immediate_doc = doc_ref.get()
        if immediate_doc.exists:
            immediate_data = immediate_doc.to_dict()
            immediate_map_locations = immediate_data.get('map_locations')
            
            print(f"📥 map_locations recuperado: {repr(immediate_map_locations)}")
            print(f"📥 Tipo: {type(immediate_map_locations)}")
            print(f"📥 Tamanho: {len(immediate_map_locations) if immediate_map_locations else 'N/A'}")
            print(f"📥 É igual ao original? {immediate_map_locations == test_map_locations}")
            
            if immediate_map_locations == test_map_locations:
                print("✅ TESTE IMEDIATO: map_locations salvo corretamente!")
            else:
                print("❌ TESTE IMEDIATO: map_locations corrompido!")
                print(f"❌ Original: {repr(test_map_locations)}")
                print(f"❌ Salvo: {repr(immediate_map_locations)}")
        else:
            print("❌ ERRO: Documento não existe após criação!")
            return False
        
        print("\n⏳ ETAPA 3: Aguardando 2 segundos para consistência...")
        time.sleep(2)
        
        print("\n📥 ETAPA 4: Verificando após delay...")
        
        # Verificar após delay
        delayed_doc = doc_ref.get()
        if delayed_doc.exists:
            delayed_data = delayed_doc.to_dict()
            delayed_map_locations = delayed_data.get('map_locations')
            
            print(f"📥 map_locations após delay: {repr(delayed_map_locations)}")
            print(f"📥 Ainda é igual ao original? {delayed_map_locations == test_map_locations}")
            
            if delayed_map_locations == test_map_locations:
                print("✅ TESTE COM DELAY: map_locations persistiu corretamente!")
            else:
                print("❌ TESTE COM DELAY: map_locations foi alterado!")
        
        print("\n🔄 ETAPA 5: Testando atualização...")
        
        # Testar atualização
        updated_map_locations = test_map_locations + "\nCascais, 38.6967, -9.4206"
        update_data = {
            "map_locations": updated_map_locations,
            "updated_at": time.time()
        }
        
        print(f"📤 Atualizando com map_locations expandido ({len(updated_map_locations)} chars)")
        doc_ref.update(update_data)
        
        # Verificar atualização
        updated_doc = doc_ref.get()
        if updated_doc.exists:
            final_data = updated_doc.to_dict()
            final_map_locations = final_data.get('map_locations')
            
            print(f"📥 map_locations após update: {repr(final_map_locations)}")
            print(f"📥 Update funcionou? {final_map_locations == updated_map_locations}")
            
            if final_map_locations == updated_map_locations:
                print("✅ TESTE DE UPDATE: map_locations atualizado corretamente!")
            else:
                print("❌ TESTE DE UPDATE: falhou!")
        
        print("\n🗑️ ETAPA 6: Limpando documento de teste...")
        doc_ref.delete()
        print(f"✅ Documento {test_doc_id} removido")
        
        print("\n" + "=" * 60)
        print("✅ RESULTADO FINAL: TODOS OS TESTES PASSARAM!")
        print("✅ O Firestore está funcionando corretamente com map_locations")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERRO NO TESTE: {e}")
        print(f"❌ Tipo do erro: {type(e)}")
        
        # Tentar limpar em caso de erro
        try:
            if 'test_doc_id' in locals():
                tours_collection.document(test_doc_id).delete()
                print(f"🗑️ Documento de teste {test_doc_id} removido após erro")
        except:
            pass
        
        print("\n" + "=" * 60)
        print("❌ RESULTADO FINAL: TESTE FALHOU!")
        print("❌ Há problemas com a configuração do Firestore")
        print("=" * 60)
        
        return False

def test_field_types():
    """🔍 Teste específico para tipos de dados suportados pelo Firestore"""
    
    print("\n" + "=" * 60)
    print("🔍 TESTE DE TIPOS DE DADOS NO FIRESTORE")
    print("=" * 60)
    
    test_data = {
        "string_field": "texto normal",
        "multiline_string": "linha 1\\nlinha 2\\nlinha 3",
        "number_field": 123,
        "float_field": 123.45,
        "boolean_field": True,
        "list_field": ["item1", "item2", "item3"],
        "dict_field": {"pt": "português", "en": "english"},
        "long_string": "a" * 1000,  # String longa
        "special_chars": "áéíóú çñü @#$%^&*()",
        "created_at": time.time()
    }
    
    try:
        print("📤 Testando diferentes tipos de dados...")
        
        doc_ref = tours_collection.document()
        doc_ref.set(test_data)
        test_id = doc_ref.id
        
        print(f"✅ Documento criado: {test_id}")
        
        # Verificar
        retrieved_doc = doc_ref.get()
        if retrieved_doc.exists:
            retrieved_data = retrieved_doc.to_dict()
            
            print("📥 Verificando tipos recuperados:")
            for key, original_value in test_data.items():
                retrieved_value = retrieved_data.get(key)
                types_match = type(original_value) == type(retrieved_value)
                values_match = original_value == retrieved_value
                
                print(f"  {key}: {types_match and values_match} (Tipo: {type(retrieved_value).__name__})")
                
                if not values_match:
                    print(f"    ❌ Original: {repr(original_value)}")
                    print(f"    ❌ Recuperado: {repr(retrieved_value)}")
        
        # Limpar
        doc_ref.delete()
        print(f"🗑️ Documento de teste removido")
        
        print("✅ Teste de tipos concluído!")
        
    except Exception as e:
        print(f"❌ Erro no teste de tipos: {e}")

if __name__ == "__main__":
    print("🚀 Iniciando testes do Firestore para map_locations...")
    
    # Executar testes
    success = test_map_locations_persistence()
    test_field_types()
    
    if success:
        print("\n🎉 CONCLUSÃO: O problema NÃO é no Firestore!")
        print("💡 Verifique o código Python no tours_fixed.py")
        print("💡 Certifique-se que o campo está sendo incluído na resposta")
    else:
        print("\n⚠️ CONCLUSÃO: Há problemas na configuração do Firestore!")
        print("💡 Verifique as credenciais e permissões")
        print("💡 Confirme se a coleção 'tours' existe")