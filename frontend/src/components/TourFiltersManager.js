// frontend/src/components/TourFiltersManager.js
import React, { useState, useEffect } from 'react';
import { tourFiltersService } from '../services/tourFiltersService';

const TourFiltersManager = () => {
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingFilter, setEditingFilter] = useState(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    key: '',
    labels: { pt: '', en: '', es: '' },
    order: 1,
    active: true
  });

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      setLoading(true);
      const allFilters = await tourFiltersService.getAllFilters();
      setFilters(allFilters);
    } catch (err) {
      console.error('Erro ao carregar filtros:', err);
      setError('Erro ao carregar filtros do Firebase');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingFilter) {
        await tourFiltersService.updateFilter(editingFilter.id, formData);
        alert('✅ Filtro atualizado no Firebase!');
      } else {
        await tourFiltersService.createFilter(formData);
        alert('✅ Filtro criado no Firebase!');
      }

      resetForm();
      setShowModal(false);
      fetchFilters();
    } catch (err) {
      console.error('Erro ao salvar filtro:', err);
      setError(err.message || 'Erro ao salvar filtro');
      alert('❌ Erro ao salvar no Firebase: ' + err.message);
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
        fetchFilters();
      } catch (err) {
        console.error('Erro ao eliminar:', err);
        alert('❌ Erro ao eliminar do Firebase');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleStatus = async (filter) => {
    try {
      await tourFiltersService.updateFilter(filter.id, { active: !filter.active });
      fetchFilters();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      alert('❌ Erro ao alterar status no Firebase');
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
    if (window.confirm('🔥 Criar filtros padrão no Firebase?')) {
      try {
        setLoading(true);
        await tourFiltersService.createDefaultFilters();
        alert('✅ Filtros padrão criados no Firebase!');
        fetchFilters();
      } catch (err) {
        console.error('Erro ao criar filtros padrão:', err);
        alert('❌ Erro ao criar filtros padrão no Firebase');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Firebase */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-purple-900">
              🔥 Firebase Tour Filters Manager
            </h3>
            <div className="mt-2 text-sm text-purple-700">
              <p className="mb-2">
                <strong>🎯 Copy Persuasivo:</strong> Personalize filtros para maximizar conversão ("Gastronómico" → "Provas de Vinhos Exclusivas")
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>🔥 Filtros guardados no Firebase Firestore</li>
                <li>🌍 Traduções em 3 idiomas (PT/EN/ES)</li>
                <li>📊 Controle total da ordem de exibição</li>
                <li>🎯 Criação de filtros personalizados para nichos específicos</li>
                <li>⚡ Sincronização automática com a homepage</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">🔥 Firebase Tour Filters</h2>
        <div className="flex gap-2">
          <button
            onClick={createDefaultFilters}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
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

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">🚨 {error}</div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">🔥 A carregar filtros do Firebase...</p>
        </div>
      )}

      {/* Lista de Filtros */}
      <div className="grid gap-4">
        {filters.map((filter) => (
          <div key={filter.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-500">
                    🔥 Firebase ID: {filter.id}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    📊 Ordem: {filter.order}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
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
                
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {filter.labels?.pt || 'Sem título'}
                </h3>
                
                <div className="text-sm text-gray-500 space-y-1">
                  <p><strong>PT:</strong> {filter.labels?.pt}</p>
                  {filter.labels?.en && (
                    <p><strong>EN:</strong> {filter.labels.en}</p>
                  )}
                  {filter.labels?.es && (
                    <p><strong>ES:</strong> {filter.labels.es}</p>
                  )}
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

      {/* Modal Firebase */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                🔥 {editingFilter ? 'Editar Filtro no Firebase' : 'Novo Filtro no Firebase'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    🔑 Chave do Filtro * (ex: gastronomic, cultural)
                  </label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({...formData, key: e.target.value})}
                    required
                    className="w-full border rounded px-3 py-2"
                    placeholder="Ex: wine_tasting, adventure, historic"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Esta chave deve corresponder ao tour_type dos tours
                  </p>
                </div>