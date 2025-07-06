// migrateToursToFirestore.js
const admin = require("firebase-admin");
const fs = require("fs");

// Inicializar o Firebase Admin com as tuas credenciais de serviço
admin.initializeApp({
  credential: admin.credential.cert(require("./backend/google-calendar-key.json")), // ✅ CORRETO
  projectId: "tours-81516-acfbc"
});
const db = admin.firestore();
// Adicionar ao migrateToursToFirestore.js antes da migração:

// ✅ ADICIONAR ESTA FUNÇÃO:
async function clearAllTours() {
  try {
    console.log("🧹 Limpando todos os tours existentes...");
    
    const toursRef = db.collection("tours");
    const snapshot = await toursRef.get();
    
    if (snapshot.empty) {
      console.log("📂 Nenhum tour para limpar.");
      return;
    }
    
    console.log(`🗑️ Encontrados ${snapshot.size} tours para remover.`);
    
    // Remover em batches (Firestore permite max 500 por batch)
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log("✅ Todos os tours foram removidos.");
    
  } catch (error) {
    console.error("❌ Erro ao limpar tours:", error);
  }
}

async function migrateTours() {
  try {
    // 🧹 LIMPAR PRIMEIRO
    await clearAllTours();
    
    // ⏳ Aguardar um pouco para garantir que limpeza terminou
    console.log("⏳ Aguardando 2 segundos...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 📊 MIGRAR DADOS LIMPOS
    console.log("🚀 Iniciando migração de dados limpos...");
    
    const data = JSON.parse(fs.readFileSync("ninerocks.tours.json", "utf-8"));
    
    for (const tour of data) {
      const {
        id,
        name,
        short_description,
        description,
        location,
        duration_hours,
        max_participants,
        tour_type,
        route_description,
        includes,
        excludes,
        price,
        active,
        images,
        availability_dates,
        created_at,
        updated_at
      } = tour;

      const docData = {
        id,
        name,
        short_description,
        description,
        location,
        duration_hours,
        max_participants,
        tour_type,
        route_description,
        includes,
        excludes,
        price,
        active,
        images: images || [],
        availability_dates: availability_dates || [],
        created_at: new Date(created_at["$date"]),
        updated_at: new Date(updated_at["$date"])
      };

      await db.collection("tours").doc(id).set(docData);
      console.log(`✅ Tour ${id} migrado: ${name.pt || name.en || 'Sem nome'}`);
    }
    
    console.log("🎉 Migração completa! Todos os tours limpos e remigrados.");
    
  } catch (error) {
    console.error("❌ Erro na migração:", error);
  }
}

// ✅ EXECUTAR LIMPEZA + MIGRAÇÃO
migrateTours();