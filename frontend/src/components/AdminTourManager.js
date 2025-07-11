import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MapLocationPicker from './MapLocationPicker';
import CalendarDatePicker from './CalendarDatePicker';
import { useJsApiLoader } from '@react-google-maps/api';
import { BACKEND_URL } from '../config/appConfig';

const Maps_API_KEY = process.env.REACT_APP_Maps_API_KEY;
const Maps_LIBRARIES = ['places'];

const AdminTourManager = ({ tourToEdit, onFormClose }) => {
  const [formData, setFormData] = useState({
    name: { pt: '', en: '', es: '' },
    description: { pt: '', en: '', es: '' },
    short_description: { pt: '', en: '', es: '' },
    highlights: { pt: '', en: '', es: '' },
    route_description: { pt: '', en: '', es: '' },
    includes: { pt: '', en: '', es: '' },
    excludes: { pt: '', en: '', es: '' },
    price: '',
    duration_hours: '',
    max_participants: 4, // 🔧 CORRIGIDO: Padrão 4 (não 8)
    min_participants: 1,
    tour_type: 'cultural',
    location: '',
    map_locations: '',
    images: [],
    active: true,
    featured: false,
    difficulty_level: 'easy',
    meeting_point: { pt: '', en: '', es: '' },
    what_to_bring: { pt: '', en: '', es: '' },
    age_restrictions: '',
    accessibility_info: { pt: '', en: '', es: '' },
    available_dates: [] // 🔧 NOVO: Campo para datas disponíveis
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageInput, setImageInput] = useState('');
  
  // 🔧 NOVO: Estados para gestão de datas
  const [availableDates, setAvailableDates] = useState([]);
  const [newDate, setNewDate] = useState('');
  
  const { isLoaded: isMapLoaded, loadError: mapLoadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: Maps_API_KEY,
    libraries: Maps_LIBRARIES
  });

  const parseItineraryPreview = (text) => {
    if (!text) return [];
    
    const timeRegex = /(\d{1,2}[:h]\d{2}|\d{1,2}h)/gi;
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    const timeBlocks = [];
    let currentBlock = null;
    
    lines.forEach((line) => {
      const timeMatch = line.match(timeRegex);
      
      if (timeMatch) {
        if (currentBlock) {
          timeBlocks.push(currentBlock);
        }
        
        const time = timeMatch[0].replace('h', ':');
        const cleanText = line.replace(timeRegex, '').replace(':', '').trim();
        
        currentBlock = {
          time: time,
          title: cleanText || `Atividade às ${time}`
        };
      }
    });
    
    if (currentBlock) {
      timeBlocks.push(currentBlock);
    }
    
    return timeBlocks;
  };

  // Inicializar dados quando tourToEdit muda
  useEffect(() => {
    if (tourToEdit && tourToEdit.id) {
      const initialData = {
        name: tourToEdit.name || { pt: '', en: '', es: '' },
        description: tourToEdit.description || { pt: '', en: '', es: '' },
        short_description: tourToEdit.short_description || { pt: '', en: '', es: '' },
        highlights: tourToEdit.highlights || { pt: '', en: '', es: '' },
        route_description: tourToEdit.route_description || { pt: '', en: '', es: '' },
        includes: tourToEdit.includes || { pt: '', en: '', es: '' },
        excludes: tourToEdit.excludes || { pt: '', en: '', es: '' },
        price: tourToEdit.price || '',
        duration_hours: tourToEdit.duration_hours || '',
        max_participants: tourToEdit.max_participants || 4,
        min_participants: tourToEdit.min_participants || 1,
        tour_type: tourToEdit.tour_type || 'cultural',
        location: tourToEdit.location || '',
        map_locations: tourToEdit.map_locations || '',
        images: tourToEdit.images || [],
        active: tourToEdit.active !== undefined ? tourToEdit.active : true,
        featured: tourToEdit.featured || false,
        difficulty_level: tourToEdit.difficulty_level || 'easy',
        meeting_point: tourToEdit.meeting_point || { pt: '', en: '', es: '' },
        what_to_bring: tourToEdit.what_to_bring || { pt: '', en: '', es: '' },
        age_restrictions: tourToEdit.age_restrictions || '',
        accessibility_info: tourToEdit.accessibility_info || { pt: '', en: '', es: '' },
        available_dates: tourToEdit.available_dates || [] // 🔧 CARREGAR DATAS EXISTENTES
      };
      
      setFormData(initialData);
      setAvailableDates(tourToEdit.available_dates || []); // 🔧 ESTADO SEPARADO PARA O CALENDÁRIO
    } else {
      // Reset para novo tour
      const initialData = {
        name: { pt: '', en: '', es: '' },
        description: { pt: '', en: '', es: '' },
        short_description: { pt: '', en: '', es: '' },
        highlights: { pt: '', en: '', es: '' },
        route_description: { pt: '', en: '', es: '' },
        includes: { pt: '', en: '', es: '' },
        excludes: { pt: '', en: '', es: '' },
        price: '',
        duration_hours: '',
        max_participants: 4,
        min_participants: 1,
        tour_type: 'cultural',
        location: '',
        map_locations: '',
        images: [],
        active: true,
        featured: false,
        difficulty_level: 'easy',
        meeting_point: { pt: '', en: '', es: '' },
        what_to_bring: { pt: '', en: '', es: '' },
        age_restrictions: '',
        accessibility_info: { pt: '', en: '', es: '' },
        available_dates: []
      };
      
      setFormData(initialData);
      setAvailableDates([]);
    }
  }, [tourToEdit?.id]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMultilingualChange = (field, lang, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [lang]: value
      }
    }));
  };

  const addImage = () => {
    if (imageInput.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageInput.trim()]
      }));
      setImageInput('');
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleMapLocationsChange = (value) => {
    setFormData(prev => ({
      ...prev,
      map_locations: value || ''
    }));
  };

  // 🔧 NOVO: Funções para gestão de datas
  const handleDatesChange = (dates) => {
    setAvailableDates(dates);
    setFormData(prev => ({
      ...prev,
      available_dates: dates
    }));
  };

  const addManualDate = () => {
    if (newDate && !availableDates.includes(newDate)) {
      const updatedDates = [...availableDates, newDate].sort();
      handleDatesChange(updatedDates);
      setNewDate('');
    }
  };

  const removeManualDate = (dateToRemove) => {
    const updatedDates = availableDates.filter(date => date !== dateToRemove);
    handleDatesChange(updatedDates);
  };

  const clearAllDates = () => {
    handleDatesChange([]);
  };

  const handleSaveTour = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      if (!formData.name.pt || !formData.description.pt || !formData.price) {
        setError('Preencha pelo menos os campos obrigatórios (nome, descrição e preço em português)');
        setLoading(false);
        return;
      }

      // 🔧 VALIDAÇÃO DE PARTICIPANTES
      if (formData.max_participants < 1 || formData.max_participants > 4) {
        setError('O número máximo de participantes deve ser entre 1 e 4');
        setLoading(false);
        return;
      }

      // Preparar payload - incluir datas disponíveis
      const payload = {
        ...formData,
        map_locations: String(formData.map_locations || ''),
        available_dates: availableDates // 🔧 INCLUIR DATAS NO PAYLOAD
      };

      console.log('💾 Saving tour with available_dates:', payload.available_dates); // Debug

      let response;
      if (tourToEdit && tourToEdit.id) {
        response = await axios.put(`${BACKEND_URL}/api/tours/${tourToEdit.id}`, payload, { headers });
      } else {
        response = await axios.post(`${BACKEND_URL}/api/tours`, payload, { headers });
      }
      
      setTimeout(() => {
        onFormClose();
      }, 1000);
      
    } catch (err) {
      let errorMessage = 'Erro ao salvar o tour';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Sem permissão para salvar tour.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {tourToEdit?.id ? 'Editar Tour' : 'Adicionar Novo Tour'}
        </h2>
        <button
          onClick={onFormClose}
          className="text-gray-500 hover:text-gray-700 p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-red-800 whitespace-pre-line">{error}</div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <section>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Informações Básicas</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome (PT) *</label>
              <input
                type="text"
                value={formData.name.pt}
                onChange={(e) => handleMultilingualChange('name', 'pt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome do tour em português"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome (EN)</label>
              <input
                type="text"
                value={formData.name.en}
                onChange={(e) => handleMultilingualChange('name', 'en', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tour name in English"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome (ES)</label>
              <input
                type="text"
                value={formData.name.es}
                onChange={(e) => handleMultilingualChange('name', 'es', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del tour en español"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Curta (PT)</label>
              <textarea
                value={formData.short_description.pt}
                onChange={(e) => handleMultilingualChange('short_description', 'pt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Descrição resumida em português"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Curta (EN)</label>
              <textarea
                value={formData.short_description.en}
                onChange={(e) => handleMultilingualChange('short_description', 'en', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Short description in English"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Curta (ES)</label>
              <textarea
                value={formData.short_description.es}
                onChange={(e) => handleMultilingualChange('short_description', 'es', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Descripción corta en español"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço Total (€) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 200"
                min="0"
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Preço total do tour (não por pessoa)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duração (horas)</label>
              <input
                type="number"
                value={formData.duration_hours}
                onChange={(e) => handleInputChange('duration_hours', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 8"
                min="1"
                max="24"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Participantes (máx) *</label>
              <input
                type="number"
                value={formData.max_participants}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 1 && value <= 4) {
                    handleInputChange('max_participants', value);
                  } else if (e.target.value === '') {
                    handleInputChange('max_participants', '');
                  }
                }}
                onBlur={(e) => {
                  const value = parseInt(e.target.value);
                  if (isNaN(value) || value < 1 || value > 4) {
                    handleInputChange('max_participants', 4);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 4"
                min="1"
                max="4"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Máximo 4 pessoas (para grupos maiores, contacte diretamente)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Tour</label>
              <select
                value={formData.tour_type}
                onChange={(e) => handleInputChange('tour_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cultural">Cultural</option>
                <option value="gastronomic">Gastronômico</option>
                <option value="mixed">Misto</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Localização Principal
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Lisboa, Portugal"
            />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Descrição Completa</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (PT) *</label>
              <textarea
                value={formData.description.pt}
                onChange={(e) => handleMultilingualChange('description', 'pt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="6"
                placeholder="Descrição detalhada do tour em português"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (EN)</label>
              <textarea
                value={formData.description.en}
                onChange={(e) => handleMultilingualChange('description', 'en', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="6"
                placeholder="Detailed tour description in English"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (ES)</label>
              <textarea
                value={formData.description.es}
                onChange={(e) => handleMultilingualChange('description', 'es', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="6"
                placeholder="Descripción detallada del tour en español"
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Itinerário por Horários</h3>
          
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3">Como criar o itinerário:</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>Formato:</strong> Hora + Descrição da atividade</p>
              <p><strong>Exemplo:</strong></p>
              <div className="bg-white p-3 rounded border mt-2 font-mono text-xs">
                <div className="text-gray-700">
                  <strong>10:00</strong> Manhã: Encontro no centro histórico<br/>
                  <strong>12:30</strong> Almoço: Restaurante tradicional<br/>
                  <strong>14:30</strong> Tarde: Visita aos monumentos
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center justify-between mb-2">
                <span>PORTUGUÊS</span>
                <span className="text-xs text-blue-600">Use horários (10:00, 12:30, etc.)</span>
              </label>
              <textarea
                value={formData.route_description.pt}
                onChange={(e) => handleMultilingualChange('route_description', 'pt', e.target.value)}
                rows="10"
                placeholder="10:00 Início do tour&#10;12:30 Almoço tradicional&#10;14:30 Visitas culturais"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center justify-between mb-2">
                <span>ENGLISH</span>
                <span className="text-xs text-blue-600">Use times (10:00, 12:30, etc.)</span>
              </label>
              <textarea
                value={formData.route_description.en}
                onChange={(e) => handleMultilingualChange('route_description', 'en', e.target.value)}
                rows="10"
                placeholder="10:00 Tour start&#10;12:30 Traditional lunch&#10;14:30 Cultural visits"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center justify-between mb-2">
                <span>ESPAÑOL</span>
                <span className="text-xs text-blue-600">Use horarios (10:00, 12:30, etc.)</span>
              </label>
              <textarea
                value={formData.route_description.es}
                onChange={(e) => handleMultilingualChange('route_description', 'es', e.target.value)}
                rows="10"
                placeholder="10:00 Inicio del tour&#10;12:30 Almuerzo tradicional&#10;14:30 Visitas culturales"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
              />
            </div>
          </div>
          
          {formData.route_description.pt && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-3">Preview do Itinerário:</h4>
              <div className="text-sm text-green-800">
                {parseItineraryPreview(formData.route_description.pt).map((block, index) => (
                  <div key={index} className="mb-3 flex items-start">
                    <span className="font-bold text-indigo-600 mr-3 min-w-[60px] text-base">{block.time}</span>
                    <span className="flex-1 text-gray-700">{block.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Pontos de Destaque</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Highlights (PT)</label>
              <textarea
                value={formData.highlights.pt}
                onChange={(e) => handleMultilingualChange('highlights', 'pt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="5"
                placeholder="Ex:&#10;Visita ao Palácio da Pena&#10;Degustação de vinhos locais&#10;Passeio pelo centro histórico"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Highlights (EN)</label>
              <textarea
                value={formData.highlights.en}
                onChange={(e) => handleMultilingualChange('highlights', 'en', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="5"
                placeholder="Ex:&#10;Visit to Pena Palace&#10;Local wine tasting&#10;Historic center walk"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Highlights (ES)</label>
              <textarea
                value={formData.highlights.es}
                onChange={(e) => handleMultilingualChange('highlights', 'es', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="5"
                placeholder="Ex:&#10;Visita al Palacio da Pena&#10;Degustación de vinos locales&#10;Paseo por el centro histórico"
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">O que inclui e exclui</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-md font-medium text-green-700 mb-3">Inclui</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Português</label>
                  <textarea
                    value={formData.includes.pt}
                    onChange={(e) => handleMultilingualChange('includes', 'pt', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="3"
                    placeholder="Ex: Guia turístico, Transporte, Almoço"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">English</label>
                  <textarea
                    value={formData.includes.en}
                    onChange={(e) => handleMultilingualChange('includes', 'en', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="3"
                    placeholder="Ex: Tour guide, Transportation, Lunch"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Español</label>
                  <textarea
                    value={formData.includes.es}
                    onChange={(e) => handleMultilingualChange('includes', 'es', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="3"
                    placeholder="Ex: Guía turístico, Transporte, Almuerzo"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-md font-medium text-red-700 mb-3">Não inclui</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Português</label>
                  <textarea
                    value={formData.excludes.pt}
                    onChange={(e) => handleMultilingualChange('excludes', 'pt', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows="3"
                    placeholder="Ex: Despesas pessoais, Gorjetas, Bebidas extras"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">English</label>
                  <textarea
                    value={formData.excludes.en}
                    onChange={(e) => handleMultilingualChange('excludes', 'en', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows="3"
                    placeholder="Ex: Personal expenses, Tips, Extra drinks"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Español</label>
                  <textarea
                    value={formData.excludes.es}
                    onChange={(e) => handleMultilingualChange('excludes', 'es', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows="3"
                    placeholder="Ex: Gastos personales, Propinas, Bebidas extra"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🔧 NOVA SECÇÃO: GESTÃO DE DATAS DISPONÍVEIS */}
        <section>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">📅 Datas Disponíveis para Reserva</h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-3">Sistema de Disponibilidade:</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>📋 Como funciona:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Selecione as datas específicas em que este tour estará disponível</li>
                <li>Apenas essas datas aparecerão no formulário de reserva</li>
                <li>Se não selecionar nenhuma data, o tour aceita qualquer data futura</li>
                <li>Fins de semana são permitidos (pode desativar individualmente se necessário)</li>
              </ul>
            </div>
          </div>

          {/* Adicionar data manual rápida */}
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">➕ Adicionar Data Rápida</h4>
            <div className="flex gap-3">
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addManualDate}
                disabled={!newDate || availableDates.includes(newDate)}
                className={`px-4 py-2 rounded-md font-medium ${
                  newDate && !availableDates.includes(newDate)
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Adicionar
              </button>
            </div>
          </div>

          {/* Calendário Visual */}
          <CalendarDatePicker
            selectedDates={availableDates}
            onDatesChange={handleDatesChange}
            className="mb-6"
          />
          
          {/* Resumo das datas selecionadas */}
          {availableDates.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  📅 Datas Selecionadas ({availableDates.length})
                </h4>
                <button
                  type="button"
                  onClick={clearAllDates}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  🗑️ Limpar Todas
                </button>
              </div>
              
              <div className="max-h-40 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {availableDates.map(date => (
                    <div key={date} className="flex items-center justify-between bg-white p-2 rounded border">
                      <span className="font-medium">
                        {new Date(date + 'T00:00:00').toLocaleDateString('pt-PT')}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeManualDate(date)}
                        className="text-red-600 hover:text-red-800 font-bold ml-2"
                        title="Remover data"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-3 text-xs text-gray-600">
                <p><strong>✅ Estas datas estarão disponíveis para reserva no website</strong></p>
                <p>🗓️ Se não houver datas selecionadas, qualquer data futura será aceite</p>
              </div>
            </div>
          )}
          
          {availableDates.length === 0 && (
            <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <h4 className="font-medium text-amber-900">Nenhuma data específica selecionada</h4>
                  <p className="text-sm text-amber-800">
                    O tour aceitará reservas para qualquer data futura. 
                    Selecione datas específicas para restringir a disponibilidade.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Localizações do Itinerário</h3>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-4">
              <strong>Selecione os pontos específicos que fazem parte do itinerário do tour.</strong><br/>
              Estas localizações serão mostradas no mapa da página de detalhes.
            </p>
            
            {isMapLoaded ? (
              <MapLocationPicker
                value={formData.map_locations}
                onChange={handleMapLocationsChange}
                isMapLoaded={isMapLoaded}
                mapLoadError={mapLoadError}
              />
            ) : mapLoadError ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-red-800">
                    Erro ao carregar Google Maps. Verifique a configuração da API.
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <p className="text-gray-600">A carregar Google Maps...</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Galeria de Imagens</h3>
          
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="url"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://exemplo.com/imagem.jpg"
              />
              <button
                type="button"
                onClick={addImage}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Adicionar
              </button>
            </div>
          </div>

          {formData.images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Imagem ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    {index === 0 ? 'Principal' : `Imagem ${index + 1}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Configurações</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => handleInputChange('active', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Tour ativo (visível no site)
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => handleInputChange('featured', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                Tour em destaque
              </label>
            </div>
          </div>
        </section>

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onFormClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveTour}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </div>
            ) : (
              <>
                {tourToEdit?.id ? 'Atualizar Tour' : 'Criar Tour'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminTourManager;