// frontend/src/components/TourFiltersManager.js - VERSÃO COM DIAGNÓSTICO
import React, { useState, useEffect } from 'react';
import { tourFiltersService } from '../services/tourFiltersService';

const TourFiltersManager = () => {
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingFilter, setEditingFilter] = useState(null);
  const [error, setError] = useState('');
  const [diagnostics, setDiagnostics] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const [formData, setFormData] = useState({
    key: '',
    labels: { pt: '', en: '', es: '' },
    order: 1,
    active: true
  });

  useEffect(() => {
    fetchFilters();
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    try {
      const result = await tourFiltersService.runDiagnostics();
      setDiagnostics(result);
      console.log('🔍 Diagnósticos:', result);
    } catch (error) {
      console.error('❌ Erro no diagnóstico:', error);
    }
  };

  const fetchFilters = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Primeiro, testar a conexão
      const connectionTest = await tourFiltersService.testFirebaseConnection();
      
      if (!connectionTest.success) {
        throw new Error(`Firebase Error: ${connectionTest.error}\n\nSolução: ${connectionTest.solution}`);
      }

      const allFilters = await tourFiltersService.getAllFilters();
      setFilters(allFilters);
      
    } catch (err) {
      console.error('❌ Erro ao carregar filtros:', err);
      setError(err.message);
      
      // Se falhou, mostrar filtros padrão
      const defaultFilters = tourFiltersService.getDefaultFilters();
      setFilters(defaultFilters);
      
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validações locais primeiro
      if (!formData.key.trim()) {
        throw new Error('Chave do filtro é obrigatória');
      }
      
      if (!formData.labels.pt.trim()) {
        throw new Error('Label em português é obrigatório');
      }

      // Verificar se a chave já existe (apenas para novos filtros)
      if (!editingFilter) {
        const existingFilter = filters.find(f => f.key === formData.key.toLowerCase());
        if (existingFilter) {
          throw new Error('Já existe um filtro com essa chave');
        }
      }

      const dataToSave = {
        ...formData,
        key: formData.key.toLowerCase().trim(),
        order: parseInt(formData.order) || 1
      };

      if (editingFilter) {
        await tourFiltersService.updateFilter(editingFilter.id, dataToSave);
        alert('✅ Filtro atualizado no Firebase!');
      } else {
        await tourFiltersService.createFilter(dataToSave);
        alert('✅ Filtro criado no Firebase!');
      }

      resetForm();
      setShowModal(false);
      await fetchFilters();
      await runDiagnostics();
      
    } catch (err) {
      console.error('❌ Erro ao salvar filtro:', err);
      setError(err.message);
      alert(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (filter) => {
    setEditingFilter(filter);
    setFormData({
      key: filter.key || '',
      labels: filter.labels || { pt: '', en: '', es: '' },
      order: filter.order || 1,
      active: filter.active !== undefined ? filter.active : true
    });
    setShowModal(true);
  };

  const handleDelete = async (filter) => {
    if (filter.isDefault) {
      alert('❌ Não é possível eliminar filtros padrão do sistema!');
      return;
    }

    if (window.confirm('🗑️ Eliminar este filtro do Firebase?')) {
      try {
        setLoading(true);
        await tourFiltersService.deleteFilter(filter.id);
        alert('✅ Filtro eliminado do Firebase!');
        await fetchFilters();
        await runDiagnostics();
      } catch (err) {
        console.error('❌ Erro ao eliminar:', err);
        alert(`❌ Erro ao eliminar: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleStatus = async (filter) => {
    try {
      await tourFiltersService.updateFilter(filter.id, { active: !filter.active });
      await fetchFilters();
      await runDiagnostics();
    } catch (err) {
      console.error('❌ Erro ao alterar status:', err);
      alert(`❌ Erro ao alterar status: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      key: '',
      labels: { pt: '', en: '', es: '' },
      order: 1,
      active: true
    });
    setEditingFilter(null);
    setError('');
  };

  const createDefaultFilters = async () => {
    if (window.confirm('🔥 Criar filtros padrão no Firebase?\n\nIsso irá adicionar filtros básicos (não substitui os existentes).')) {
      try {
        setLoading(true);
        await tourFiltersService.createDefaultFilters();
        alert('✅ Filtros padrão criados no Firebase!');
        await fetchFilters();
        await runDiagnostics();
      } catch (err) {
        console.error('❌ Erro ao criar filtros padrão:', err);
        alert(`❌ Erro: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const previewFilterKey = (key) => {
    return key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  };

  const getDiagnosticsColor = () => {
    if (!diagnostics) return 'gray';
    if (diagnostics.firebase?.success) return 'green';
    if (diagnostics.firebase?.code === 'permission-denied') return 'red';
    return 'yellow';
  };

  return (
    <div className="space-y-6">
      {/* Header Firebase com Diagnóstico */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-medium text-purple-900">
                🔥 Firebase Tour Filters Manager
              </h3>
              <div className="mt-2 text-sm text-purple-700">
                <p className="mb-2">
                  <strong>🎯 Copy Persuasivo:</strong> Personalize filtros para maximizar conversão
                </p>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    getDiagnosticsColor() === 'green' ? 'bg-green-100 text-green-800' :
                    getDiagnosticsColor() === 'red' ? 'bg-red-100 text-red-800' :
                    getDiagnosticsColor() === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {diagnostics?.firebase?.success ? '✅ Firebase Conectado' : '❌ Firebase Error'}
                  </span>
                  <button
                    onClick={() => setShowDiagnostics(!showDiagnostics)}
                    className="text-xs text-purple-600 hover:text-purple-800 underline"
                  >
                    {showDiagnostics ? 'Ocultar' : 'Ver'} Diagnósticos
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Painel de Diagnósticos */}
        {showDiagnostics && diagnostics && (
          <div className="mt-4 p-4 bg-white rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-3">🔍 Diagnóstico Firebase</h4>
            <div className="text-sm space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Firebase:</strong>
                  <div className={`ml-2 ${diagnostics.firebase?.success ? 'text-green-700' : 'text-red-700'}`}>
                    {diagnostics.firebase?.success ? '✅ Conectado' : `❌ ${diagnostics.firebase?.error}`}
                  </div>
                  {diagnostics.firebase?.solution && (
                    <div className="ml-2 text-blue-600 text-xs">
                      💡 {diagnostics.firebase.solution}
                    </div>
                  )}
                </div>
                <div>
                  <strong>Filtros:</strong>
                  <div className="ml-2 text-gray-700">
                    📊 {diagnostics.filters?.count || 0} total, {diagnostics.filters?.active || 0} ativos
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Última verificação: {new Date(diagnostics.timestamp).toLocaleString('pt-PT')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert Melhorado */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Erro Firebase</h3>
              <div className="mt-1 text-sm text-red-700">
                <pre className="whitespace-pre-wrap text-xs">{error}</pre>
              </div>
              <div className="mt-3">
                <button
                  onClick={runDiagnostics}
                  className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
                >
                  🔄 Verificar novamente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-semibold">🔥 Firebase Tour Filters</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={runDiagnostics}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
            disabled={loading}
          >
            🔍 Diagnosticar
          </button>
          <button
            onClick={createDefaultFilters}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            disabled={loading}
          >
            🔄 Restaurar Padrão
          </button>
          <button
            onClick={() => setShowModal(true)}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            + Adicionar ao Firebase
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">🔥 A processar...</p>
        </div>
      )}

      {/* Preview dos Filtros */}
      {filters.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            👀 Preview dos Filtros na Homepage
          </h3>
          <div className="flex flex-wrap gap-2">
            {filters
              .filter(f => f.active)
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((filter) => (
                <span
                  key={filter.id}
                  className="px-4 py-2 bg-white border-2 border-purple-300 rounded-full text-sm font-medium text-gray-700 shadow-sm"
                >
                  {filter.labels?.pt || filter.key}
                </span>
              ))}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Esta é a aparência dos filtros na página inicial para visitantes portugueses
          </p>
        </div>
      )}

      {/* Lista de Filtros */}
      <div className="grid gap-4">
        {filters.map((filter, index) => (
          <div key={filter.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-500">
                    🔥 ID: {filter.id || 'padrão'}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    📊 Ordem: {filter.order}
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    🔑 Key: {filter.key}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    filter.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {filter.active ? '✅ Ativo' : '❌ Inativo'}
                  </span>
                  {filter.isDefault && (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      🔒 Padrão
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {filter.labels?.pt || 'Sem título'}
                </h3>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <strong className="text-purple-700">🇵🇹 PT:</strong> {filter.labels?.pt || '—'}
                    </div>
                    <div>
                      <strong className="text-purple-700">🇬🇧 EN:</strong> {filter.labels?.en || '—'}
                    </div>
                    <div>
                      <strong className="text-purple-700">🇪🇸 ES:</strong> {filter.labels?.es || '—'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => toggleStatus(filter)}
                  className={`px-3 py-1 rounded text-sm ${
                    filter.active 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                  disabled={loading}
                >
                  {filter.active ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  onClick={() => handleEdit(filter)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                >
                  Editar
                </button>
                {!filter.isDefault && (
                  <button
                    onClick={() => handleDelete(filter)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    disabled={loading}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filters.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">🔥</div>
            <h3 className="text-lg font-medium text-gray-900">Firebase vazio</h3>
            <p className="text-gray-500">Comece criando os filtros padrão no Firebase</p>
          </div>
        )}
      </div>

      {/* Modal (mesmo código anterior...) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                🔥 {editingFilter ? 'Editar Filtro no Firebase' : 'Novo Filtro no Firebase'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    🔑 Chave do Filtro * (ex: wine_tasting, adventure, heritage)
                  </label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({...formData, key: e.target.value})}
                    required
                    disabled={editingFilter?.isDefault}
                    className="w-full border rounded px-3 py-2 disabled:bg-gray-100"
                    placeholder="Ex: wine_tasting, adventure, historic"
                  />
                  <div className="mt-2 text-xs space-y-1">
                    <p className="text-gray-600">
                      <strong>Preview:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{previewFilterKey(formData.key || 'exemplo')}</code>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    🏷️ Labels Traduzidos *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-500">🇵🇹 PORTUGUÊS *</label>
                      <input
                        type="text"
                        value={formData.labels.pt}
                        onChange={(e) => setFormData({
                          ...formData,
                          labels: { ...formData.labels, pt: e.target.value }
                        })}
                        required
                        className="w-full border rounded px-3 py-2"
                        placeholder="Ex: Experiências Gastronómicas"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">🇬🇧 ENGLISH</label>
                      <input
                        type="text"
                        value={formData.labels.en}
                        onChange={(e) => setFormData({
                          ...formData,
                          labels: { ...formData.labels, en: e.target.value }
                        })}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Ex: Gastronomic Experiences"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">🇪🇸 ESPAÑOL</label>
                      <input
                        type="text"
                        value={formData.labels.es}
                        onChange={(e) => setFormData({
                          ...formData,
                          labels: { ...formData.labels, es: e.target.value }
                        })}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Ex: Experiencias Gastronómicas"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">📊 Ordem</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 1})}
                      min="0"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">🔘 Status</label>
                    <select
                      value={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.value === 'true'})}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="true">✅ Ativo</option>
                      <option value="false">❌ Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    disabled={loading}
                    className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? 'A salvar...' : `🔥 ${editingFilter ? 'Atualizar' : 'Criar'}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourFiltersManager;