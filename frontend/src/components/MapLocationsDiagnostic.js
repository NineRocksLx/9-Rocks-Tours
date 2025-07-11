import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config/appConfig';

/**
 * 🔍 COMPONENTE DE DIAGNÓSTICO PARA MAP_LOCATIONS
 * 
 * Este componente ajuda a identificar onde está o problema na persistência
 * dos dados de map_locations entre frontend, backend e Firestore
 */
const MapLocationsDiagnostic = ({ tourId = null }) => {
  const [diagnosticResults, setDiagnosticResults] = useState({
    stage: 'idle',
    results: [],
    errors: [],
    summary: null
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [testData, setTestData] = useState({
    map_locations: `Palácio da Pena, 38.787586, -9.390625
Quinta da Regaleira, 38.796111, -9.396111
Sintra Centro, 38.802900, -9.381700
Cascais, 38.6967, -9.4206`
  });

  const addResult = (stage, status, message, data = null) => {
    const result = {
      timestamp: new Date().toISOString(),
      stage,
      status, // 'success', 'warning', 'error', 'info'
      message,
      data
    };
    
    setDiagnosticResults(prev => ({
      ...prev,
      results: [...prev.results, result]
    }));
    
    console.log(`🔍 DIAGNOSTIC [${stage}] ${status.toUpperCase()}: ${message}`, data);
  };

  const addError = (stage, error) => {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      stage,
      error: error.message,
      stack: error.stack,
      response: error.response?.data
    };
    
    setDiagnosticResults(prev => ({
      ...prev,
      errors: [...prev.errors, errorInfo]
    }));
    
    console.error(`❌ DIAGNOSTIC ERROR [${stage}]:`, error);
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setDiagnosticResults({
      stage: 'running',
      results: [],
      errors: [],
      summary: null
    });

    try {
      const token = localStorage.getItem('admin_token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      addResult('setup', 'info', 'Iniciando diagnóstico completo de map_locations');
      addResult('setup', 'info', `Dados de teste: ${testData.map_locations.split('\n').length} localizações`);

      // 📤 ETAPA 1: TESTAR CRIAÇÃO DE NOVO TOUR
      addResult('create', 'info', 'ETAPA 1: Testando criação de tour com map_locations');
      
      const createPayload = {
        name: { pt: 'Tour Diagnóstico MAP_LOCATIONS', en: 'MAP_LOCATIONS Diagnostic Tour', es: 'Tour Diagnóstico MAP_LOCATIONS' },
        description: { pt: 'Tour criado para diagnóstico', en: 'Tour created for diagnostic', es: 'Tour creado para diagnóstico' },
        short_description: { pt: 'Teste', en: 'Test', es: 'Prueba' },
        price: 1,
        duration_hours: 1,
        max_participants: 1,
        tour_type: 'cultural',
        location: 'Teste',
        map_locations: testData.map_locations,
        images: [],
        active: true,
        featured: false
      };

      addResult('create', 'info', 'Enviando payload para criação...', {
        map_locations_size: createPayload.map_locations.length,
        map_locations_lines: createPayload.map_locations.split('\n').length,
        map_locations_preview: createPayload.map_locations.substring(0, 100) + '...'
      });

      const createResponse = await axios.post(`${BACKEND_URL}/api/tours`, createPayload, { headers });
      
      if (createResponse.data) {
        const createdTour = createResponse.data;
        const createdMapLocations = createdTour.map_locations;
        
        addResult('create', createdMapLocations ? 'success' : 'error', 
          'Resposta da criação recebida', {
            has_map_locations: 'map_locations' in createdTour,
            map_locations_value: createdMapLocations,
            map_locations_type: typeof createdMapLocations,
            map_locations_size: createdMapLocations?.length || 0,
            data_matches: createdMapLocations === testData.map_locations
          });
        
        if (!createdMapLocations) {
          addResult('create', 'error', '❌ map_locations NÃO retornado na criação!');
        } else if (createdMapLocations !== testData.map_locations) {
          addResult('create', 'warning', '⚠️ map_locations retornado difere do enviado', {
            sent: testData.map_locations,
            received: createdMapLocations
          });
        } else {
          addResult('create', 'success', '✅ map_locations criado corretamente!');
        }

        // 📥 ETAPA 2: TESTAR BUSCA DO TOUR CRIADO
        addResult('get', 'info', 'ETAPA 2: Testando busca do tour criado');
        
        const getTourResponse = await axios.get(`${BACKEND_URL}/api/tours/${createdTour.id}`, { headers });
        
        if (getTourResponse.data) {
          const fetchedTour = getTourResponse.data;
          const fetchedMapLocations = fetchedTour.map_locations;
          
          addResult('get', fetchedMapLocations ? 'success' : 'error',
            'Tour buscado com sucesso', {
              has_map_locations: 'map_locations' in fetchedTour,
              map_locations_value: fetchedMapLocations,
              map_locations_type: typeof fetchedMapLocations,
              map_locations_size: fetchedMapLocations?.length || 0,
              matches_original: fetchedMapLocations === testData.map_locations
            });
          
          if (!fetchedMapLocations) {
            addResult('get', 'error', '❌ map_locations NÃO encontrado na busca!');
          } else if (fetchedMapLocations !== testData.map_locations) {
            addResult('get', 'warning', '⚠️ map_locations da busca difere do original');
          } else {
            addResult('get', 'success', '✅ map_locations buscado corretamente!');
          }
        }

        // 🔄 ETAPA 3: TESTAR ATUALIZAÇÃO
        addResult('update', 'info', 'ETAPA 3: Testando atualização do tour');
        
        const updatedMapLocations = testData.map_locations + '\nAveiro, 40.6443, -8.6455';
        const updatePayload = {
          map_locations: updatedMapLocations,
          updated_at: Date.now()
        };
        
        addResult('update', 'info', 'Enviando atualização...', {
          new_map_locations_size: updatedMapLocations.length,
          new_map_locations_lines: updatedMapLocations.split('\n').length
        });
        
        const updateResponse = await axios.put(`${BACKEND_URL}/api/tours/${createdTour.id}`, updatePayload, { headers });
        
        if (updateResponse.data) {
          const updatedTour = updateResponse.data;
          const updatedMapLocationsResponse = updatedTour.map_locations;
          
          addResult('update', updatedMapLocationsResponse ? 'success' : 'error',
            'Resposta da atualização recebida', {
              has_map_locations: 'map_locations' in updatedTour,
              map_locations_value: updatedMapLocationsResponse,
              map_locations_type: typeof updatedMapLocationsResponse,
              map_locations_size: updatedMapLocationsResponse?.length || 0,
              matches_sent: updatedMapLocationsResponse === updatedMapLocations
            });
          
          if (!updatedMapLocationsResponse) {
            addResult('update', 'error', '❌ map_locations NÃO retornado na atualização!');
          } else if (updatedMapLocationsResponse !== updatedMapLocations) {
            addResult('update', 'warning', '⚠️ map_locations da atualização difere do enviado');
          } else {
            addResult('update', 'success', '✅ map_locations atualizado corretamente!');
          }
        }

        // 🔄 ETAPA 4: VERIFICAÇÃO FINAL
        addResult('verify', 'info', 'ETAPA 4: Verificação final do estado');
        
        const finalGetResponse = await axios.get(`${BACKEND_URL}/api/tours/${createdTour.id}`, { headers });
        
        if (finalGetResponse.data) {
          const finalTour = finalGetResponse.data;
          const finalMapLocations = finalTour.map_locations;
          
          addResult('verify', finalMapLocations ? 'success' : 'error',
            'Estado final verificado', {
              has_map_locations: 'map_locations' in finalTour,
              map_locations_value: finalMapLocations,
              final_size: finalMapLocations?.length || 0,
              final_lines: finalMapLocations?.split('\n').length || 0
            });
        }

        // 🗑️ LIMPEZA: Remover tour de teste
        addResult('cleanup', 'info', 'ETAPA 5: Removendo tour de teste');
        
        await axios.delete(`${BACKEND_URL}/api/tours/${createdTour.id}`, { headers });
        addResult('cleanup', 'success', 'Tour de teste removido com sucesso');

      } else {
        addResult('create', 'error', 'Resposta vazia na criação do tour');
      }

      // 📊 GERAR RESUMO
      const results = diagnosticResults.results;
      const errors = diagnosticResults.errors;
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length + errors.length;
      const warningCount = results.filter(r => r.status === 'warning').length;

      const summary = {
        total_tests: results.length,
        successes: successCount,
        errors: errorCount,
        warnings: warningCount,
        overall_status: errorCount === 0 ? (warningCount === 0 ? 'excellent' : 'good') : 'problematic'
      };

      setDiagnosticResults(prev => ({
        ...prev,
        summary,
        stage: 'completed'
      }));

      addResult('summary', summary.overall_status === 'excellent' ? 'success' : 'warning', 
        'Diagnóstico concluído', summary);

    } catch (error) {
      addError('general', error);
      setDiagnosticResults(prev => ({
        ...prev,
        stage: 'error'
      }));
    } finally {
      setIsRunning(false);
    }
  };

  const renderResult = (result, index) => {
    const statusColors = {
      success: 'text-green-800 bg-green-50 border-green-200',
      error: 'text-red-800 bg-red-50 border-red-200',
      warning: 'text-yellow-800 bg-yellow-50 border-yellow-200',
      info: 'text-blue-800 bg-blue-50 border-blue-200'
    };

    const statusIcons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    return (
      <div key={index} className={`p-3 rounded-lg border ${statusColors[result.status]} mb-2`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2">
            <span className="text-lg">{statusIcons[result.status]}</span>
            <div>
              <div className="font-medium">
                [{result.stage.toUpperCase()}] {result.message}
              </div>
              <div className="text-xs opacity-75">
                {new Date(result.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
        
        {result.data && (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium opacity-75 hover:opacity-100">
              Ver dados detalhados
            </summary>
            <pre className="mt-1 text-xs bg-white bg-opacity-50 p-2 rounded overflow-x-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          🔍 Diagnóstico MAP_LOCATIONS
        </h2>
        <button
          onClick={runDiagnostic}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Executando...
            </>
          ) : (
            <>
              🚀 Executar Diagnóstico
            </>
          )}
        </button>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">💡 O que este teste faz:</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Cria um tour com dados de map_locations</li>
          <li>• Verifica se os dados são retornados na criação</li>
          <li>• Busca o tour e verifica persistência</li>
          <li>• Atualiza os dados e verifica novamente</li>
          <li>• Faz verificação final e limpa os dados de teste</li>
        </ul>
      </div>

      {/* Dados de teste */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🧪 Dados de teste (map_locations):
        </label>
        <textarea
          value={testData.map_locations}
          onChange={(e) => setTestData({ ...testData, map_locations: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="4"
          disabled={isRunning}
        />
        <div className="text-xs text-gray-500 mt-1">
          {testData.map_locations.split('\n').filter(l => l.trim()).length} localizações, {testData.map_locations.length} caracteres
        </div>
      </div>

      {/* Resumo */}
      {diagnosticResults.summary && (
        <div className={`mb-6 p-4 rounded-lg border ${
          diagnosticResults.summary.overall_status === 'excellent' ? 'bg-green-50 border-green-200' :
          diagnosticResults.summary.overall_status === 'good' ? 'bg-yellow-50 border-yellow-200' :
          'bg-red-50 border-red-200'
        }`}>
          <h3 className="font-semibold mb-2">📊 Resumo do Diagnóstico:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Total de testes:</span>
              <div className="text-lg">{diagnosticResults.summary.total_tests}</div>
            </div>
            <div>
              <span className="font-medium text-green-700">Sucessos:</span>
              <div className="text-lg text-green-800">{diagnosticResults.summary.successes}</div>
            </div>
            <div>
              <span className="font-medium text-yellow-700">Avisos:</span>
              <div className="text-lg text-yellow-800">{diagnosticResults.summary.warnings}</div>
            </div>
            <div>
              <span className="font-medium text-red-700">Erros:</span>
              <div className="text-lg text-red-800">{diagnosticResults.summary.errors}</div>
            </div>
          </div>
          
          <div className="mt-3 text-sm">
            <strong>Status geral:</strong> {
              diagnosticResults.summary.overall_status === 'excellent' ? '🎉 Excelente - Tudo funcionando!' :
              diagnosticResults.summary.overall_status === 'good' ? '✅ Bom - Pequenos problemas' :
              '❌ Problemático - Requer atenção'
            }
          </div>
        </div>
      )}

      {/* Resultados */}
      {diagnosticResults.results.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-800 mb-4">📋 Resultados detalhados:</h3>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {diagnosticResults.results.map(renderResult)}
          </div>
        </div>
      )}

      {/* Erros */}
      {diagnosticResults.errors.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-red-800 mb-4">❌ Erros encontrados:</h3>
          <div className="space-y-2">
            {diagnosticResults.errors.map((error, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="font-medium text-red-800">[{error.stage.toUpperCase()}] {error.error}</div>
                <div className="text-xs text-red-600 mt-1">{new Date(error.timestamp).toLocaleTimeString()}</div>
                {error.response && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-red-700">Ver resposta do servidor</summary>
                    <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(error.response, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {diagnosticResults.results.length === 0 && !isRunning && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">🔍</div>
          <p>Clique em "Executar Diagnóstico" para testar a persistência de map_locations</p>
        </div>
      )}
    </div>
  );
};

export default MapLocationsDiagnostic;