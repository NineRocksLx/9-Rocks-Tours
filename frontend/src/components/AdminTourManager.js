import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MapLocationPicker from './MapLocationPicker';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminTourManager = ({ isLoaded, loadError }) => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingTour, setEditingTour] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    name: { pt: '', en: '' },
    description: { pt: '', en: '' },
    price: '',
    duration: '',
    max_participants: 4,
    min_participants: 1,
    category: '',
    difficulty: 'easy',
    includes: { pt: [], en: [] },
    excludes: { pt: [], en: [] },
    requirements: { pt: [], en: [] },
    itinerary: { pt: [], en: [] },
    map_locations: '',
    active: true,
    featured: false,
    image_url: '',
    gallery: []
  });

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${BACKEND_URL}/api/tours?active_only=false`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTours(response.data);
    } catch (err) {
      console.error('Erro ao carregar tours:', err);
      setError('Erro ao carregar tours');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTour = (tour) => {
    setEditingTour(tour.id);
    setFormData({
      name: tour.name || { pt: '', en: '' },
      description: tour.description || { pt: '', en: '' },
      price: tour.price || '',
      duration: tour.duration || '',
      max_participants: tour.max_participants || 4,
      min_participants: tour.min_participants || 1,
      category: tour.category || '',
      difficulty: tour.difficulty || 'easy',
      includes: tour.includes || { pt: [], en: [] },
      excludes: tour.excludes || { pt: [], en: [] },
      requirements: tour.requirements || { pt: [], en: [] },
      itinerary: tour.itinerary || { pt: [], en: [] },
      map_locations: tour.map_locations || '',
      active: tour.active !== undefined ? tour.active : true,
      featured: tour.featured || false,
      image_url: tour.image_url || '',
      gallery: tour.gallery || []
    });
    setShowPreview(false);
  };

  const handleSaveTour = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      // Validação básica
      if (!formData.name.pt.trim()) {
        setError('Nome em português é obrigatório');
        return;
      }
      
      if (editingTour) {
        await axios.put(`${BACKEND_URL}/api/tours/${editingTour}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${BACKEND_URL}/api/tours`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setEditingTour(null);
      setFormData({
        name: { pt: '', en: '' },
        description: { pt: '', en: '' },
        price: '',
        duration: '',
        max_participants: 4,
        min_participants: 1,
        category: '',
        difficulty: 'easy',
        includes: { pt: [], en: [] },
        excludes: { pt: [], en: [] },
        requirements: { pt: [], en: [] },
        itinerary: { pt: [], en: [] },
        map_locations: '',
        active: true,
        featured: false,
        image_url: '',
        gallery: []
      });
      setShowPreview(false);
      setError('');
      fetchTours();
    } catch (err) {
      console.error('Erro ao salvar tour:', err);
      setError('Erro ao salvar tour: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTour(null);
    setFormData({
      name: { pt: '', en: '' },
      description: { pt: '', en: '' },
      price: '',
      duration: '',
      max_participants: 4,
      min_participants: 1,
      category: '',
      difficulty: 'easy',
      includes: { pt: [], en: [] },
      excludes: { pt: [], en: [] },
      requirements: { pt: [], en: [] },
      itinerary: { pt: [], en: [] },
      map_locations: '',
      active: true,
      featured: false,
      image_url: '',
      gallery: []
    });
    setShowPreview(false);
    setError('');
  };

  const handleDeleteTour = async (tourId) => {
    if (!window.confirm('Tem certeza que deseja excluir este tour?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${BACKEND_URL}/api/tours/${tourId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTours();
    } catch (err) {
      setError('Erro ao excluir tour: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleArrayChange = (field, lang, index, value) => {
    const newArray = [...formData[field][lang]];
    newArray[index] = value;
    setFormData({
      ...formData,
      [field]: {
        ...formData[field],
        [lang]: newArray
      }
    });
  };

  const addArrayItem = (field, lang) => {
    setFormData({
      ...formData,
      [field]: {
        ...formData[field],
        [lang]: [...formData[field][lang], '']
      }
    });
  };

  const removeArrayItem = (field, lang, index) => {
    const newArray = formData[field][lang].filter((_, i) => i !== index);
    setFormData({
      ...formData,
      [field]: {
        ...formData[field],
        [lang]: newArray
      }
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(price);
  };

  const renderTourPreview = () => {
    if (!showPreview) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">👁️ Preview do Tour</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Preview Content */}
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{formData.name.pt}</h1>
                {formData.name.en && (
                  <p className="text-xl text-gray-600 mb-4">{formData.name.en}</p>
                )}
                {formData.price && (
                  <div className="text-2xl font-bold text-indigo-600">
                    {formatPrice(formData.price)} <span className="text-sm font-normal">por tour</span>
                  </div>
                )}
              </div>

              {/* Tour Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">⏱️ Duração</h4>
                  <p className="text-gray-700">{formData.duration || 'A definir'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">👥 Participantes</h4>
                  <p className="text-gray-700">{formData.min_participants} - {formData.max_participants} pessoas</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">📊 Dificuldade</h4>
                  <p className="text-gray-700 capitalize">{formData.difficulty}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">🏷️ Categoria</h4>
                  <p className="text-gray-700">{formData.category || 'Não definida'}</p>
                </div>
              </div>

              {/* Description */}
              {formData.description.pt && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">📝 Descrição</h3>
                  <p className="text-gray-700 mb-4">{formData.description.pt}</p>
                  {formData.description.en && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-gray-900 mb-2">English Description</h4>
                      <p className="text-gray-700">{formData.description.en}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Itinerary */}
              {formData.itinerary.pt.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">🗺️ Itinerário</h3>
                  <div className="space-y-3">
                    {formData.itinerary.pt.map((item, index) => (
                      <div key={index} className="flex items-start">
                        <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-gray-700">{item}</p>
                          {formData.itinerary.en[index] && (
                            <p className="text-gray-500 text-sm mt-1 italic">{formData.itinerary.en[index]}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Includes */}
              {formData.includes.pt.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">✅ Incluído</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <ul className="space-y-2">
                        {formData.includes.pt.map((item, index) => (
                          <li key={index} className="flex items-center text-gray-700">
                            <span className="text-green-500 mr-2">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {formData.includes.en.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">English</h4>
                        <ul className="space-y-2">
                          {formData.includes.en.map((item, index) => (
                            <li key={index} className="flex items-center text-gray-700">
                              <span className="text-green-500 mr-2">✓</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Excludes */}
              {formData.excludes.pt.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">❌ Não Incluído</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <ul className="space-y-2">
                        {formData.excludes.pt.map((item, index) => (
                          <li key={index} className="flex items-center text-gray-700">
                            <span className="text-red-500 mr-2">✗</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {formData.excludes.en.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">English</h4>
                        <ul className="space-y-2">
                          {formData.excludes.en.map((item, index) => (
                            <li key={index} className="flex items-center text-gray-700">
                              <span className="text-red-500 mr-2">✗</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {formData.requirements.pt.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">📋 Requisitos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <ul className="space-y-2">
                        {formData.requirements.pt.map((item, index) => (
                          <li key={index} className="flex items-center text-gray-700">
                            <span className="text-blue-500 mr-2">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {formData.requirements.en.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">English</h4>
                        <ul className="space-y-2">
                          {formData.requirements.en.map((item, index) => (
                            <li key={index} className="flex items-center text-gray-700">
                              <span className="text-blue-500 mr-2">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">🗂️ Gestão de Tours</h2>
        
        {/* Status da API Google Maps */}
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-500">Google Maps:</span>
          {loadError ? (
            <span className="text-red-600 font-medium">❌ Erro na API</span>
          ) : isLoaded ? (
            <span className="text-green-600 font-medium">✅ Carregado</span>
          ) : (
            <span className="text-yellow-600 font-medium">⏳ Carregando</span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-red-800">{error}</div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {editingTour ? 'Salvando tour...' : 'A carregar tours...'}
          </p>
        </div>
      )}

      {!loading && !editingTour && (
        <div>
          <button
            onClick={() => setEditingTour('new')}
            className="mb-6 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-200 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Criar Novo Tour
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-4xl mb-4">🗂️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum tour encontrado</h3>
                <p className="text-gray-500">Crie o primeiro tour para começar</p>
              </div>
            ) : (
              tours.map((tour) => (
                <div key={tour.id} className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex-1">{tour.name.pt}</h3>
                    <div className="flex items-center space-x-2 ml-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        tour.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tour.active ? 'Ativo' : 'Inativo'}
                      </span>
                      {tour.featured && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          ⭐ Destaque
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {tour.description.pt || 'Sem descrição'}
                  </p>
                  
                  <div className="text-xs text-gray-500 mb-4 space-y-1">
                    {tour.price && (
                      <div>💰 {formatPrice(tour.price)}</div>
                    )}
                    {tour.duration && (
                      <div>⏱️ {tour.duration}</div>
                    )}
                    {tour.map_locations && (
                      <div>📍 {tour.map_locations.split('\n').length} localização(ões)</div>
                    )}
                    {tour.itinerary && tour.itinerary.pt && tour.itinerary.pt.length > 0 && (
                      <div>🗺️ {tour.itinerary.pt.length} pontos no itinerário</div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditTour(tour)}
                      className="flex-1 bg-blue-100 text-blue-800 px-3 py-2 rounded-md hover:bg-blue-200 transition-colors duration-200 text-sm flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteTour(tour.id)}
                      className="flex-1 bg-red-100 text-red-800 px-3 py-2 rounded-md hover:bg-red-200 transition-colors duration-200 text-sm flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Excluir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {(editingTour || editingTour === 'new') && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {editingTour === 'new' ? '➕ Criar Novo Tour' : '✏️ Editar Tour'}
            </h3>
            <button
              onClick={() => setShowPreview(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors duration-200 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              👁️ Preview
            </button>
          </div>
          
          <div className="space-y-8">
            {/* Informações Básicas */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">📝 Informações Básicas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome (Português) *
                  </label>
                  <input
                    type="text"
                    value={formData.name.pt}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      name: { ...formData.name, pt: e.target.value } 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: Tour ao Vale do Douro"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome (Inglês)
                  </label>
                  <input
                    type="text"
                    value={formData.name.en}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      name: { ...formData.name, en: e.target.value } 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: Douro Valley Tour"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço (€)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: 150"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duração
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: 8 horas"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: Cultura, Natureza, Gastronomia"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dificuldade
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="easy">Fácil</option>
                    <option value="moderate">Moderada</option>
                    <option value="hard">Difícil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Participantes Mínimos
                  </label>
                  <input
                    type="number"
                    value={formData.min_participants}
                    onChange={(e) => setFormData({ ...formData, min_participants: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Participantes Máximos
                  </label>
                  <input
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">📋 Descrição</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição (Português)
                  </label>
                  <textarea
                    value={formData.description.pt}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      description: { ...formData.description, pt: e.target.value } 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                    placeholder="Descreva o tour em português..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição (Inglês)
                  </label>
                  <textarea
                    value={formData.description.en}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      description: { ...formData.description, en: e.target.value } 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                    placeholder="Describe the tour in English..."
                  />
                </div>
              </div>
            </div>

            {/* Itinerário */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">🗺️ Itinerário</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Itinerário (Português)
                    </label>
                    <button
                      onClick={() => addArrayItem('itinerary', 'pt')}
                      className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 text-sm"
                    >
                      + Adicionar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.itinerary.pt.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleArrayChange('itinerary', 'pt', index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Ex: Chegada ao Porto e check-in"
                        />
                        <button
                          onClick={() => removeArrayItem('itinerary', 'pt', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Itinerário (Inglês)
                    </label>
                    <button
                      onClick={() => addArrayItem('itinerary', 'en')}
                      className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 text-sm"
                    >
                      + Adicionar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.itinerary.en.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleArrayChange('itinerary', 'en', index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Ex: Arrival in Porto and check-in"
                        />
                        <button
                          onClick={() => removeArrayItem('itinerary', 'en', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Incluído/Não Incluído */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Incluído */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">✅ Incluído</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Português</label>
                      <button
                        onClick={() => addArrayItem('includes', 'pt')}
                        className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
                      >
                        + Adicionar
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.includes.pt.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-green-500">✓</span>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleArrayChange('includes', 'pt', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Ex: Transporte em veículo confortável"
                          />
                          <button
                            onClick={() => removeArrayItem('includes', 'pt', index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Inglês</label>
                      <button
                        onClick={() => addArrayItem('includes', 'en')}
                        className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
                      >
                        + Adicionar
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.includes.en.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-green-500">✓</span>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleArrayChange('includes', 'en', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Ex: Transportation in comfortable vehicle"
                          />
                          <button
                            onClick={() => removeArrayItem('includes', 'en', index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Não Incluído */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">❌ Não Incluído</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Português</label>
                      <button
                        onClick={() => addArrayItem('excludes', 'pt')}
                        className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
                      >
                        + Adicionar
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.excludes.pt.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-red-500">✗</span>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleArrayChange('excludes', 'pt', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="Ex: Refeições não mencionadas"
                          />
                          <button
                            onClick={() => removeArrayItem('excludes', 'pt', index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Inglês</label>
                      <button
                        onClick={() => addArrayItem('excludes', 'en')}
                        className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
                      >
                        + Adicionar
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.excludes.en.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-red-500">✗</span>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleArrayChange('excludes', 'en', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="Ex: Meals not mentioned"
                          />
                          <button
                            onClick={() => removeArrayItem('excludes', 'en', index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Requisitos */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">📋 Requisitos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Português</label>
                    <button
                      onClick={() => addArrayItem('requirements', 'pt')}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
                    >
                      + Adicionar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.requirements.pt.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-blue-500">•</span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleArrayChange('requirements', 'pt', index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ex: Sapatos confortáveis"
                        />
                        <button
                          onClick={() => removeArrayItem('requirements', 'pt', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Inglês</label>
                    <button
                      onClick={() => addArrayItem('requirements', 'en')}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
                    >
                      + Adicionar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.requirements.en.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-blue-500">•</span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleArrayChange('requirements', 'en', index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ex: Comfortable shoes"
                        />
                        <button
                          onClick={() => removeArrayItem('requirements', 'en', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Localizações no Mapa */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">📍 Localizações no Mapa</h4>
              <p className="text-sm text-gray-500 mb-4">
                Adicione pontos de interesse que serão exibidos no mapa do tour. 
                {loadError && ' (Modo manual disponível devido a problemas com a API do Google Maps)'}
              </p>
              
              <MapLocationPicker
                value={formData.map_locations}
                onChange={(value) => setFormData({ ...formData, map_locations: value })}
                isLoaded={isLoaded}
                loadError={loadError}
              />
            </div>

            {/* Configurações */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">⚙️ Configurações</h4>
              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Tour Ativo</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">⭐ Tour em Destaque</span>
                </label>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex space-x-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleSaveTour}
                disabled={loading || !formData.name.pt.trim()}
                className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {editingTour === 'new' ? 'Criar Tour' : 'Salvar Alterações'}
                  </>
                )}
              </button>
              
              <button
                onClick={handleCancelEdit}
                disabled={loading}
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors duration-200 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Preview */}
      {renderTourPreview()}
    </div>
  );
};

export default AdminTourManager;