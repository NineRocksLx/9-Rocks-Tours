// frontend/src/components/SimpleTest.js
// Componente para testar se o problema é com Firebase ou outra coisa

import React, { useState, useEffect } from 'react';

const SimpleTest = () => {
  const [backendStatus, setBackendStatus] = useState('Testando...');
  const [firebaseStatus, setFirebaseStatus] = useState('Testando...');

  useEffect(() => {
    // Testa conexão com backend
    testBackend();
    
    // Testa Firebase (sem imports por agora)
    testFirebaseConfig();
  }, []);

  const testBackend = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/health');
      if (response.ok) {
        const data = await response.json();
        setBackendStatus(`✅ Backend OK: ${data.status}`);
      } else {
        setBackendStatus('❌ Backend não responde');
      }
    } catch (error) {
      setBackendStatus(`❌ Erro backend: ${error.message}`);
    }
  };

  const testFirebaseConfig = () => {
    try {
      // Testa se as variáveis de ambiente estão corretas
      const hasBackendUrl = process.env.REACT_APP_BACKEND_URL;
      setFirebaseStatus(hasBackendUrl ? '✅ Config OK' : '❌ Falta REACT_APP_BACKEND_URL');
    } catch (error) {
      setFirebaseStatus(`❌ Erro config: ${error.message}`);
    }
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f0f8ff',
      margin: '20px',
      borderRadius: '8px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2>🧪 9 Rocks Tours - Teste de Conexões</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <h3>Backend Status:</h3>
        <p style={{ 
          padding: '10px', 
          backgroundColor: backendStatus.includes('✅') ? '#d4edda' : '#f8d7da',
          borderRadius: '4px' 
        }}>
          {backendStatus}
        </p>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h3>Frontend Config:</h3>
        <p style={{ 
          padding: '10px', 
          backgroundColor: firebaseStatus.includes('✅') ? '#d4edda' : '#f8d7da',
          borderRadius: '4px' 
        }}>
          {firebaseStatus}
        </p>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h3>Environment Variables:</h3>
        <ul style={{ fontSize: '12px', fontFamily: 'monospace' }}>
          <li>REACT_APP_BACKEND_URL: {process.env.REACT_APP_BACKEND_URL || '❌ Não definida'}</li>
          <li>NODE_ENV: {process.env.NODE_ENV}</li>
        </ul>
      </div>

      <div>
        <h3>Próximos Passos:</h3>
        <ol>
          <li>Se o backend estiver OK, o problema é no frontend</li>
          <li>Se a config estiver OK, o problema são os imports</li>
          <li>Verifica os imports do Firebase nos componentes</li>
        </ol>
      </div>
    </div>
  );
};

export default SimpleTest;