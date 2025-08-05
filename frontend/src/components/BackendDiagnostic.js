import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config/appConfig';

const BackendDiagnostic = () => {
    const [diagnostics, setDiagnostics] = useState({});
    const [loading, setLoading] = useState(false);

    const runDiagnostics = async () => {
        setLoading(true);
        const results = {};
        
        try {
            // Teste 1: Variável de ambiente
            results.envVar = {
                value: process.env.REACT_APP_BACKEND_URL,
                configured: !!process.env.REACT_APP_BACKEND_URL
            };
            
            // Teste 2: BACKEND_URL importado
            results.backendUrl = {
                value: BACKEND_URL,
                reachable: false,
                isHttps: BACKEND_URL.startsWith('https://'),
                protocol: BACKEND_URL.split('://')[0]
            };
            
            // ✅ ADICIONAR: Verificar se estamos em HTTPS
            results.siteProtocol = {
                current: window.location.protocol,
                isSecure: window.location.protocol === 'https:',
                mixedContent: window.location.protocol === 'https:' && !BACKEND_URL.startsWith('https://')
            };
            
            // Teste 3: Health check
            try {
                console.log('🔍 Testando health check:', `${BACKEND_URL}/health`);
                const healthResponse = await axios.get(`${BACKEND_URL}/health`, { 
                    timeout: 5000,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                results.health = {
                    status: 'OK',
                    data: healthResponse.data
                };
                results.backendUrl.reachable = true;
            } catch (err) {
                console.error('❌ Health check error:', err);
                results.health = {
                    status: 'ERROR',
                    error: err.message,
                    type: err.name,
                    code: err.code
                };
            }
            
            // Teste 4: Tours endpoint
            try {
                console.log('🔍 Testando tours endpoint:', `${BACKEND_URL}/api/tours`);
                const toursResponse = await axios.get(`${BACKEND_URL}/api/tours`, { 
                    timeout: 5000,
                    params: { active_only: true },
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                results.tours = {
                    status: 'OK',
                    count: toursResponse.data?.length || 0,
                    data: toursResponse.data
                };
            } catch (err) {
                console.error('❌ Tours endpoint error:', err);
                results.tours = {
                    status: 'ERROR',
                    error: err.message,
                    type: err.name,
                    code: err.code
                };
            }
            
        } catch (err) {
            console.error('❌ Diagnostic error:', err);
            results.error = err.message;
        }
        
        setDiagnostics(results);
        setLoading(false);
    };

    useEffect(() => {
        runDiagnostics();
    }, []);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto m-4">
            <h2 className="text-xl font-bold mb-4">🔍 Diagnóstico do Backend</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Coluna 1: Configuração */}
                <div className="space-y-4">
                    <h3 className="font-bold text-lg text-gray-800">⚙️ Configuração</h3>
                    
                    <div className="bg-gray-50 p-3 rounded">
                        <h4 className="font-semibold">Variável de Ambiente:</h4>
                        <p className={`text-sm ${diagnostics.envVar?.configured ? 'text-green-600' : 'text-red-600'}`}>
                            {diagnostics.envVar?.configured ? '✅' : '❌'} REACT_APP_BACKEND_URL
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{diagnostics.envVar?.value || 'NÃO DEFINIDA'}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded">
                        <h4 className="font-semibold">URL Final do Backend:</h4>
                        <p className={`text-sm ${diagnostics.backendUrl?.isHttps ? 'text-green-600' : 'text-red-600'}`}>
                            {diagnostics.backendUrl?.isHttps ? '✅' : '❌'} Protocolo: {diagnostics.backendUrl?.protocol?.toUpperCase()}
                        </p>
                        <p className="text-xs text-blue-600 mt-1 break-all">{diagnostics.backendUrl?.value}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded">
                        <h4 className="font-semibold">Segurança do Site:</h4>
                        <p className={`text-sm ${diagnostics.siteProtocol?.isSecure ? 'text-green-600' : 'text-yellow-600'}`}>
                            {diagnostics.siteProtocol?.isSecure ? '✅' : '⚠️'} Site: {diagnostics.siteProtocol?.current}
                        </p>
                        {diagnostics.siteProtocol?.mixedContent && (
                            <p className="text-sm text-red-600 font-semibold">
                                ❌ PROBLEMA: Mixed Content Detectado!
                            </p>
                        )}
                    </div>
                </div>
                
                {/* Coluna 2: Conectividade */}
                <div className="space-y-4">
                    <h3 className="font-bold text-lg text-gray-800">🌐 Conectividade</h3>
                    
                    <div className="bg-gray-50 p-3 rounded">
                        <h4 className="font-semibold">Health Check:</h4>
                        <p className={`text-sm ${diagnostics.health?.status === 'OK' ? 'text-green-600' : 'text-red-600'}`}>
                            {diagnostics.health?.status === 'OK' ? '✅' : '❌'} {diagnostics.health?.status}
                        </p>
                        {diagnostics.health?.error && (
                            <div className="mt-2 text-xs">
                                <p className="text-red-600">Erro: {diagnostics.health.error}</p>
                                {diagnostics.health.code && <p className="text-gray-500">Código: {diagnostics.health.code}</p>}
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded">
                        <h4 className="font-semibold">Tours Endpoint:</h4>
                        <p className={`text-sm ${diagnostics.tours?.status === 'OK' ? 'text-green-600' : 'text-red-600'}`}>
                            {diagnostics.tours?.status === 'OK' ? '✅' : '❌'} {diagnostics.tours?.status}
                        </p>
                        {diagnostics.tours?.count !== undefined && (
                            <p className="text-sm text-blue-600">{diagnostics.tours.count} tours encontrados</p>
                        )}
                        {diagnostics.tours?.error && (
                            <div className="mt-2 text-xs">
                                <p className="text-red-600">Erro: {diagnostics.tours.error}</p>
                                {diagnostics.tours.code && <p className="text-gray-500">Código: {diagnostics.tours.code}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Alertas e Soluções */}
            <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
                <h4 className="font-semibold text-yellow-800">💡 Diagnóstico e Soluções:</h4>
                <div className="mt-2 text-sm text-yellow-700 space-y-1">
                    {diagnostics.siteProtocol?.mixedContent && (
                        <p>• <strong>Mixed Content:</strong> Site HTTPS tentando carregar conteúdo HTTP. Corrigir URL do backend.</p>
                    )}
                    {diagnostics.health?.status === 'ERROR' && (
                        <p>• <strong>Backend Offline:</strong> Servidor não responde. Verificar se está em execução.</p>
                    )}
                    {diagnostics.tours?.status === 'ERROR' && diagnostics.health?.status === 'OK' && (
                        <p>• <strong>Endpoint Tours:</strong> Health OK mas tours falham. Problema no endpoint específico.</p>
                    )}
                </div>
            </div>
            
            <button 
                onClick={runDiagnostics}
                disabled={loading}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? 'Testando...' : 'Repetir Teste'}
            </button>
        </div>
    );
};

export default BackendDiagnostic;