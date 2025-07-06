// frontend/src/components/TestFirebase.js
import React from 'react';

// ✅ TESTA IMPORTS CORRETOS
try {
  // Teste do config do Firebase
  const firebaseConfig = require('../config/firebase');
  console.log('✅ Firebase config importado com sucesso');
} catch (error) {
  console.error('❌ Erro no firebase config:', error);
}

try {
  // Teste dos serviços
  const heroService = require('../services/heroImagesService');
  console.log('✅ Hero service importado com sucesso');
} catch (error) {
  console.error('❌ Erro no hero service:', error);
}

try {
  // Teste dos filtros
  const filterService = require('../services/tourFiltersService');
  console.log('✅ Filter service importado com sucesso');
} catch (error) {
  console.error('❌ Erro no filter service:', error);
}

const TestFirebase = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', margin: '20px' }}>
      <h3>🔥 Firebase Test Component</h3>
      <p>Verifica o console para ver os resultados dos imports</p>
      <div>
        <p>✅ Se todos os imports funcionarem, o Firebase está configurado corretamente</p>
        <p>❌ Se houver erros, verificar os caminhos dos imports</p>
      </div>
    </div>
  );
};

export default TestFirebase;