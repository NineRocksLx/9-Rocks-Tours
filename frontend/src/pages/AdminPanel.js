};

// =============================================
// TOUR FILTERS MANAGER COMPONENT
// =============================================
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
      setError('Erro ao carregar filtros');
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
        alert('Filtro atualizado com sucesso!');
      } else {
        await tourFiltersService.createFilter(formData);
        alert('Filtro criado com sucesso!');
      }

      resetForm();
      setShowModal(false);
      fetchFilters();
    } catch (err) {
      console.error('Erro ao salvar filtro:', err);
      setError(err.message || 'Erro ao salvar filtro');
      alert('Erro ao salvar filtro: ' + err.message);
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
      alert('Não é possível eliminar filtros padrão do sistema!');
      return;
    }

    if (window.confirm('Tem certeza que deseja eliminar este filtro?')) {
      try {
        setLoading(true);
        await tourFiltersService.deleteFilter(filter.id);
        alert('Filtro eliminado com sucesso!');
        fetchFilters();
      } catch (err) {
        console.error('Erro ao eliminar:', err);
        alert('Erro ao eliminar filtro');
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
      alert('Erro ao alterar status');
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
    if (window.confirm('Isto irá criar os filtros padrão do sistema. Continuar?')) {
      try {
        setLoading(true);
        await tourFiltersService.createDefaultFilters();
        alert('Filtros padrão criados com sucesso!');
        fetchFilters();
      } catch (err) {
        console.error('Erro ao criar filtros padrão:', err);
        alert('Erro ao criar filtros padrão');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-purple-900">
              🏷️ Gestão de Filtros da Homepage
            </h3>
            <div className="mt-2 text-sm text-purple-700">
              <p className="mb-2">
                <strong>Personalização Total:</strong> Edite os filtros que aparecem na homepage (ex: "Gastronómico" → "Provas de Vinhos").
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Altere os nomes dos filtros em 3 idiomas (PT/EN/ES)</li>
                <li>Controle a ordem de exibição</li>
                <li>Ative/desative filtros conforme necessário</li>
                <li>Crie novos tipos de filtros personalizados</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Filtros dos Tours</h2>
        <div className="flex gap-2">
          <button
            onClick={createDefaultFilters}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Restaurar Padrão
          </button>
          <button
            onClick={() => setShowModal(true)}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            + Adicionar Filtro
          </button>
        </div>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">A carregar filtros...</p>
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
                    Ordem: {filter.order}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    Key: {filter.key}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    filter.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {filter.active ? 'Ativo' : 'Inativo'}
                  </span>
                  {filter.isDefault && (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      Padrão
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {filter.labels?.pt || 'Sem título'}
                </h3>
                
                {/* Traduções */}
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

              {/* Ações */}
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
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum filtro</h3>
            <p className="mt-1 text-sm text-gray-500">Comece criando os filtros padrão.</p>
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                {editingFilter ? 'Editar Filtro' : 'Novo Filtro'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Key do Filtro */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Chave do Filtro * (ex: gastronomic, cultural)
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

                {/* Labels em múltiplos idiomas */}
                <div>
                  <label className="block text-sm font-medium mb-2">Etiquetas dos Filtros *</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {['pt', 'en', 'es'].map(lang => (
                      <div key={lang}>
                        <label className="text-xs text-gray-500">{lang.toUpperCase()}</label>
                        <input
                          type="text"
                          value={formData.labels[lang]}
                          onChange={(e) => setFormData({
                            ...formData,
                            labels: { ...formData.labels, [lang]: e.target.value }
                          })}
                          required={lang === 'pt'}
                          className="w-full border rounded px-3 py-2"
                          placeholder={
                            lang === 'pt' ? 'Ex: Provas de Vinhos' :
                            lang === 'en' ? 'Ex: Wine Tasting' :
                            'Ex: Cata de Vinos'
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ordem e Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Ordem de Exibição</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                      min="0"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select
                      value={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.value === 'true'})}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="true">Ativo</option>
                      <option value="false">Inativo</option>
                    </select>
                  </div>
                </div>

                {/* Botões */}
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
                    {loading ? 'A guardar...' : (editingFilter ? 'Atualizar' : 'Criar')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// TOUR FILTERS MANAGER COMPONENT
// =============================================
const TourFiltersManager = () => {
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminTourManager from '../components/AdminTourManager';
import { heroImagesService } from '../services/heroImagesService';
import { tourFiltersService } from '../services/tourFiltersService';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// =============================================
// HERO IMAGES MANAGER COMPONENT - COMPLETO E CORRIGIDO
// =============================================
const HeroImagesManager = () => {
  const [heroImages, setHeroImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: { pt: '', en: '', es: '' },
    subtitle: { pt: '', en: '', es: '' },
    order: 1,
    active: true
  });

  useEffect(() => {
    fetchHeroImages();
  }, []);

  const fetchHeroImages = async () => {
    try {
      setLoading(true);
      const images = await heroImagesService.getAllHeroImages();
      setHeroImages(images);
    } catch (err) {
      console.error('Erro ao carregar hero images:', err);
      setError('Erro ao carregar imagens');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    // Validações
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Tipo de arquivo não suportado. Use JPG, PNG ou WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 5MB.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      if (editingImage) {
        // Atualizar imagem existente
        await heroImagesService.updateHeroImage(editingImage.id, formData);
        alert('Imagem atualizada com sucesso!');
      } else {
        // Nova imagem
        await heroImagesService.uploadHeroImage(file, formData);
        alert('Imagem adicionada com sucesso!');
      }

      resetForm();
      setShowModal(false);
      fetchHeroImages();
    } catch (err) {
      console.error('Erro:', err);
      const errorMessage = err.message || 'Erro ao processar imagem';
      setError(errorMessage);
      alert('Erro ao processar imagem: ' + errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (image) => {
    setEditingImage(image);
    setFormData({
      title: image.title || { pt: '', en: '', es: '' },
      subtitle: image.subtitle || { pt: '', en: '', es: '' },
      order: image.order || 1,
      active: image.active !== undefined ? image.active : true
    });
    setShowModal(true);
  };

  const handleDelete = async (image) => {
    if (window.confirm('Tem certeza que deseja eliminar esta imagem?')) {
      try {
        setLoading(true);
        await heroImagesService.deleteHeroImage(image.id, image.imageUrl, image.fileName);
        alert('Imagem eliminada com sucesso!');
        fetchHeroImages();
      } catch (err) {
        console.error('Erro ao eliminar:', err);
        alert('Erro ao eliminar imagem');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleStatus = async (image) => {
    try {
      await heroImagesService.updateHeroImage(image.id, { active: !image.active });
      fetchHeroImages();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      alert('Erro ao alterar status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: { pt: '', en: '', es: '' },
      subtitle: { pt: '', en: '', es: '' },
      order: 1,
      active: true
    });
    setEditingImage(null);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('heroImageFile');
    const file = fileInput?.files[0];

    if (!editingImage && !file) {
      alert('Por favor, selecione uma imagem');
      return;
    }

    if (!formData.title.pt.trim()) {
      alert('Por favor, preencha pelo menos o título em português');
      return;
    }

    handleImageUpload(file);
  };

  return (
    <div className="space-y-6">
      {/* Header com informação */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-blue-900">
              🏠 Gestão de Imagens da Homepage
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2">
                <strong>Funcionalidade Exclusiva:</strong> Apenas você tem acesso a esta seção para gerir as imagens 
                que aparecem no carousel da página inicial do site.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>As imagens são exibidas em rotação automática na homepage</li>
                <li>Cada imagem pode ter título e subtítulo traduzidos</li>
                <li>Use a ordem para controlar a sequência de exibição</li>
                <li>Apenas imagens ativas são mostradas aos visitantes</li>
                <li>Tamanho recomendado: 1920x1080px (16:9) para melhor qualidade</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Botão Adicionar */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Imagens do Carousel Principal</h2>
        <button
          onClick={() => setShowModal(true)}
          disabled={uploading || loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          + Adicionar Imagem
        </button>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">A carregar imagens...</p>
        </div>
      )}

      {/* Lista de Imagens */}
      <div className="grid gap-4">
        {heroImages.map((image) => (
          <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="md:flex">
              {/* Imagem */}
              <div className="md:w-1/3">
                <img 
                  src={image.imageUrl} 
                  alt={image.title?.pt || 'Hero Image'}
                  className="h-48 w-full object-cover md:h-full"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f3f4f6"/><text x="200" y="150" text-anchor="middle" fill="%23666">Erro ao carregar</text></svg>';
                  }}
                />
              </div>

              {/* Conteúdo */}
              <div className="md:w-2/3 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-500">Ordem: {image.order}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        image.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {image.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {image.title?.pt || 'Sem título'}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      {image.subtitle?.pt || 'Sem subtítulo'}
                    </p>
                    
                    {/* Traduções */}
                    <div className="text-sm text-gray-500 space-y-1">
                      {image.title?.en && (
                        <p><strong>EN:</strong> {image.title.en} • {image.subtitle?.en}</p>
                      )}
                      {image.title?.es && (
                        <p><strong>ES:</strong> {image.title.es} • {image.subtitle?.es}</p>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleStatus(image)}
                      className={`px-3 py-1 rounded text-sm ${
                        image.active 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      disabled={loading}
                    >
                      {image.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => handleEdit(image)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(image)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                      disabled={loading}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {heroImages.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma imagem</h3>
            <p className="mt-1 text-sm text-gray-500">Comece adicionando a primeira imagem do carousel.</p>
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                {editingImage ? 'Editar Imagem' : 'Nova Imagem do Carousel'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Upload de Imagem */}
                {!editingImage && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Selecionar Imagem *
                    </label>
                    <input
                      id="heroImageFile"
                      type="file"
                      accept="image/*"
                      required
                      className="w-full border rounded px-3 py-2"
                      disabled={uploading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Formatos: JPG, PNG, WebP • Tamanho máximo: 5MB • Recomendado: 1920x1080px
                    </p>
                  </div>
                )}

                {/* Títulos */}
                <div>
                  <label className="block text-sm font-medium mb-2">Título *</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {['pt', 'en', 'es'].map(lang => (
                      <div key={lang}>
                        <label className="text-xs text-gray-500">{lang.toUpperCase()}</label>
                        <input
                          type="text"
                          value={formData.title[lang]}
                          onChange={(e) => setFormData({
                            ...formData,
                            title: { ...formData.title, [lang]: e.target.value }
                          })}
                          required={lang === 'pt'}
                          className="w-full border rounded px-3 py-2"
                          placeholder={lang === 'pt' ? 'Obrigatório' : 'Opcional'}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtítulos */}
                <div>
                  <label className="block text-sm font-medium mb-2">Subtítulo</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {['pt', 'en', 'es'].map(lang => (
                      <div key={lang}>
                        <label className="text-xs text-gray-500">{lang.toUpperCase()}</label>
                        <input
                          type="text"
                          value={formData.subtitle[lang]}
                          onChange={(e) => setFormData({
                            ...formData,
                            subtitle: { ...formData.subtitle, [lang]: e.target.value }
                          })}
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ordem e Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Ordem de Exibição</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                      min="1"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select
                      value={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.value === 'true'})}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="true">Ativa</option>
                      <option value="false">Inativa</option>
                    </select>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    disabled={uploading}
                    className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        A processar...
                      </div>
                    ) : (
                      editingImage ? 'Atualizar' : 'Adicionar'
                    )}
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

// =============================================
// ADMIN PANEL MAIN COMPONENT - COMPLETO
// =============================================
const AdminPanel = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('tours');
  const [tours, setTours] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login state
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsLoggedIn(true);
      if (currentView !== 'tours' && currentView !== 'hero_images') {
        fetchData();
      }
    }
  }, [currentView]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${BACKEND_URL}/api/admin/login`, credentials);
      
      if (response.data.token) {
        localStorage.setItem('admin_token', response.data.token);
        setIsLoggedIn(true);
        if (currentView !== 'tours' && currentView !== 'hero_images') {
          fetchData();
        }
      }
    } catch (err) {
      setError('Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsLoggedIn(false);
    setCredentials({ username: '', password: '' });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (currentView === 'bookings') {
        const response = await axios.get(`${BACKEND_URL}/api/bookings`);
        setBookings(response.data);
      } else if (currentView === 'stats') {
        const [statsResponse, toursResponse] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/admin/stats`),
          axios.get(`${BACKEND_URL}/api/tours?active_only=false`)
        ]);
        setStats(statsResponse.data);
        setTours(toursResponse.data);
      }
    } catch (err) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-PT');
  };

  const exportBookings = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/export/bookings`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reservas.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Erro ao exportar dados');
    }
  };

  // Encontrar nome do tour pelo ID
  const getTourName = (tourId) => {
    const tour = tours.find(t => t.id === tourId);
    return tour ? tour.name.pt : tourId;
  };

  // =============================================
  // LOGIN SCREEN
  // =============================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">9 Rocks Tours</h1>
            <p className="text-gray-600 mt-2">Painel de Administração</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Utilizador
              </label>
              <input
                type="text"
                id="username"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Palavra-passe
              </label>
              <input
                type="password"
                id="password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-4 text-sm text-gray-500 text-center">
            <p>Credenciais de teste:</p>
            <p><strong>Utilizador:</strong> admin</p>
            <p><strong>Palavra-passe:</strong> 9rocks2025</p>
          </div>
        </div>
      </div>
    );
  }

  // =============================================
  // ADMIN DASHBOARD
  // =============================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              9 Rocks Tours - Admin
            </h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setCurrentView('tours')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                currentView === 'tours'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tours
            </button>
            <button
              onClick={() => setCurrentView('hero_images')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                currentView === 'hero_images'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Imagens Homepage
            </button>
            <button
              onClick={() => setCurrentView('tour_filters')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                currentView === 'tour_filters'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Filtros Tours
            </button>
            <button
              onClick={() => setCurrentView('bookings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                currentView === 'bookings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reservas
            </button>
            <button
              onClick={() => setCurrentView('stats')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                currentView === 'stats'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Estatísticas
            </button>
          </nav>
        </div>

        {error && currentView !== 'tours' && currentView !== 'hero_images' && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {loading && currentView !== 'tours' && currentView !== 'hero_images' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        )}

        {/* Tours View - Usa o AdminTourManager */}
        {currentView === 'tours' && (
          <AdminTourManager />
        )}

        {/* Hero Images View - NOVA SEÇÃO */}
        {currentView === 'hero_images' && (
          <HeroImagesManager />
        )}

        {/* Tour Filters View - NOVA SEÇÃO */}
        {currentView === 'tour_filters' && (
          <TourFiltersManager />
        )}

        {/* Bookings View */}
        {currentView === 'bookings' && !loading && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Reservas</h2>
              <button
                onClick={exportBookings}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Exportar CSV
              </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tour
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Participantes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pagamento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Criação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                          Nenhuma reserva encontrada
                        </td>
                      </tr>
                    ) : (
                      bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <div className="text-sm font-medium text-gray-900">
                                {booking.customer_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {booking.customer_email}
                              </div>
                              <div className="text-sm text-gray-500">
                                {booking.customer_phone}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {getTourName(booking.tour_id)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(booking.selected_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {booking.participants}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatPrice(booking.total_amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status === 'confirmed' ? 'Confirmada' :
                               booking.status === 'pending' ? 'Pendente' :
                               booking.status === 'cancelled' ? 'Cancelada' :
                               booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                              booking.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.payment_status === 'refunded' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.payment_status === 'paid' ? 'Pago' :
                               booking.payment_status === 'pending' ? 'Pendente' :
                               booking.payment_status === 'refunded' ? 'Reembolsado' :
                               booking.payment_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(booking.created_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Statistics View */}
        {currentView === 'stats' && !loading && stats && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Estatísticas</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total de Reservas
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.total_bookings}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Receita Total
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {formatPrice(stats.total_revenue)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Tours Ativos
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {tours.filter(tour => tour.active).length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Receita Média
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.total_bookings > 0 ? formatPrice(stats.total_revenue / stats.total_bookings) : formatPrice(0)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Reservas por Tour */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Reservas por Tour</h3>
                <div className="space-y-3">
                  {Object.entries(stats.bookings_by_tour).map(([tourId, count]) => (
                    <div key={tourId} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 truncate">
                        {getTourName(tourId)}
                      </span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full" 
                            style={{ width: `${(count / Math.max(...Object.values(stats.bookings_by_tour))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 min-w-[2rem]">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reservas por Status */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Reservas por Status</h3>
                <div className="space-y-3">
                  {Object.entries(stats.bookings_by_status).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">
                        {status === 'confirmed' ? 'Confirmadas' :
                         status === 'pending' ? 'Pendentes' :
                         status === 'cancelled' ? 'Canceladas' :
                         status}
                      </span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className={`h-2 rounded-full ${
                              status === 'confirmed' ? 'bg-green-600' :
                              status === 'pending' ? 'bg-yellow-600' :
                              status === 'cancelled' ? 'bg-red-600' :
                              'bg-gray-600'
                            }`}
                            style={{ width: `${(count / Math.max(...Object.values(stats.bookings_by_status))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 min-w-[2rem]">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="mt-8 bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Reservas Recentes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tour
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.slice(0, 5).map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(booking.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.customer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getTourName(booking.tour_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatPrice(booking.total_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status === 'confirmed' ? 'Confirmada' :
                             booking.status === 'pending' ? 'Pendente' :
                             booking.status === 'cancelled' ? 'Cancelada' :
                             booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;