try:
    from google.cloud import secretmanager
    print("✅ Import bem-sucedido!")
except ImportError as e:
    print("❌ Erro:", str(e))