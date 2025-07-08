// ================================
// 🔍 TESTE DE ACESSO FIRESTORE
// Rode este script para verificar se as regras foram aplicadas
// ================================

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, serverTimestamp } = require('firebase/firestore');

// Configuração Firebase (substitua pelos seus valores do .env)
const firebaseConfig = {
  apiKey: "your_firebase_api_key_here",
  authDomain: "tours-81516-acfbc.firebaseapp.com", 
  projectId: "tours-81516",
  storageBucket: "tours-81516-acfbc.appspot.com",
  messagingSenderId: "your_sender_id_here",
  appId: "your_app_id_here"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirestoreAccess() {
  console.log('🔍 TESTANDO ACESSO AO FIRESTORE...\n');
  
  const tests = [
    {
      name: '🎢 Tours Collection - READ',
      test: async () => {
        const toursRef = collection(db, 'tours');
        const snapshot = await getDocs(toursRef);
        return { success: true, count: snapshot.size };
      }
    },
    {
      name: '📅 Bookings Collection - READ', 
      test: async () => {
        const bookingsRef = collection(db, 'bookings');
        const snapshot = await getDocs(bookingsRef);
        return { success: true, count: snapshot.size };
      }
    },
    {
      name: '🖼️ Hero Images Collection - READ',
      test: async () => {
        const imagesRef = collection(db, 'hero_images');
        const snapshot = await getDocs(imagesRef);
        return { success: true, count: snapshot.size };
      }
    },
    {
      name: '✏️ Test Collection - WRITE',
      test: async () => {
        const testRef = collection(db, 'test_access');
        const docRef = await addDoc(testRef, {
          message: 'Teste de acesso realizado com sucesso',
          timestamp: serverTimestamp(),
          test_id: Math.random().toString(36).substring(7)
        });
        return { success: true, docId: docRef.id };
      }
    }
  ];

  let allPassed = true;
  
  for (const test of tests) {
    try {
      console.log(`Executando: ${test.name}...`);
      const result = await test.test();
      
      if (result.success) {
        console.log(`✅ SUCESSO`);
        if (result.count !== undefined) {
          console.log(`   📊 Documentos encontrados: ${result.count}`);
        }
        if (result.docId) {
          console.log(`   📝 Documento criado: ${result.docId}`);
        }
      }
    } catch (error) {
      console.log(`❌ FALHOU`);
      console.log(`   🚨 Erro: ${error.message}`);
      allPassed = false;
    }
    console.log('');
  }
  
  console.log('================================');
  if (allPassed) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Firestore está configurado corretamente');
    console.log('🚀 Sua aplicação deve funcionar agora');
  } else {
    console.log('🚨 ALGUNS TESTES FALHARAM');
    console.log('❌ Verifique as regras do Firestore');
    console.log('📖 Consulte o guia de configuração');
  }
  console.log('================================');
}

// Executar testes
testFirestoreAccess()
  .then(() => {
    console.log('\n✅ Teste completo');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro geral:', error);
    process.exit(1);
  });

// ================================
// INSTRUÇÕES DE USO:
// ================================
// 
// 1. Instalar dependências:
//    npm install firebase
//
// 2. Configurar suas credenciais Firebase no objeto firebaseConfig
//
// 3. Executar o teste:
//    node test_firestore.js
//
// 4. Verificar se todos os testes passam ✅
//
// Se algum teste falhar ❌, significa que as regras
// do Firestore ainda estão restritivas demais.