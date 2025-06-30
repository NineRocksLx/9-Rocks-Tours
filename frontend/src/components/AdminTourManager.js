import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { uploadImageToStorage } from '../config/firebase';
import CalendarDatePicker from './CalendarDatePicker';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminTourManager = () => {
  const [tours, setTours] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTour, setEditingTour] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Estados de upload separados
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadErrors, setUploadErrors] = useState({});
  
  // Estados para gestão manual de datas
  const [manualDates, setManualDates] = useState([]);
  const [newDate, setNewDate] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: { pt: '', en: '', es: '' },
    short_description: { pt: '', en: '', es: '' },
    description: { pt: '', en: '', es: '' },
    location: '',
    duration_hours: 4,
    price: 0,
    max_participants: 1,
    tour_type: 'cultural',
    route_description: { pt: '', en: '', es: '' },
    includes: { pt: '', en: '', es: '' },
    excludes: { pt: '', en: '', es: '' },
    active: true,
    images: [],
    thumbnail_image: '',
    gallery_images: [],
    availability_schedule: {
      monday: { active: false, start: '09:00', end: '18:00' },
      tuesday: { active: false, start: '09:00', end: '18:00' },
      wednesday: { active: false, start: '09:00', end: '18:00' },
      thursday: { active: false, start: '09:00', end: '18:00' },
      friday: { active: false, start: '09:00', end: '18:00' },
      saturday: { active: false, start: '09:00', end: '18:00' },
      sunday: { active: false, start: '09:00', end: '18:00' }
    }
  });

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/tours?active_only=false`);
      setTours(response.data);
    } catch (error) {
      console.error('Erro ao buscar tours:', error);
    }
  };

  // Função helper para preview do itinerário
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

  // Upload com estados separados
  const handleImageUpload = async (file, imageType) => {
    if (!file) return;

    const setUploading = imageType === 'thumbnail' ? setUploadingThumbnail : setUploadingGallery;
    
    setUploading(true);
    setUploadErrors(prev => ({...prev, [imageType]: null}));
    
    try {
      console.log(`Iniciando upload de ${imageType}:`, file.name);
      
      // Criar path único para a imagem
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `tours/${timestamp}_${randomId}_${cleanFileName}`;
      
      // Upload para Firebase Storage
      const downloadURL = await uploadImageToStorage(file, fileName);
      console.log(`Upload de ${imageType} concluído:`, downloadURL);
      
      // Atualizar form data
      if (imageType === 'thumbnail') {
        setFormData(prev => ({ ...prev, thumbnail_image: downloadURL }));
        alert('Imagem de capa adicionada com sucesso!');
      } else if (imageType === 'gallery') {
        setFormData(prev => ({ 
          ...prev, 
          gallery_images: [...prev.gallery_images, downloadURL] 
        }));
      }
      
    } catch (error) {
      console.error(`Erro no upload de ${imageType}:`, error);
      const errorMessage = error.message || `Erro ao enviar ${imageType}. Tente novamente.`;
      
      setUploadErrors(prev => ({...prev, [imageType]: errorMessage}));
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Remover thumbnail
  const removeThumbnailImage = () => {
    setFormData(prev => ({ ...prev, thumbnail_image: '' }));
    setUploadErrors(prev => ({...prev, thumbnail: null}));
  };

  const removeGalleryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index)
    }));
    setUploadErrors(prev => ({...prev, gallery: null}));
  };

  // Funções para gestão manual de datas
  const addManualDate = () => {
    if (newDate && !manualDates.includes(newDate)) {
      const updatedDates = [...manualDates, newDate].sort();
      setManualDates(updatedDates);
      setNewDate('');
    }
  };

  const removeManualDate = (dateToRemove) => {
    setManualDates(manualDates.filter(date => date !== dateToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.max_participants < 1 || formData.max_participants > 4) {
      alert('O número máximo de participantes deve ser entre 1 e 4');
      return;
    }
    
    setLoading(true);
    setIsCreating(true);

    try {
      const allImages = [formData.thumbnail_image, ...formData.gallery_images].filter(Boolean);
      
      const tourData = {
        ...formData,
        images: allImages,
        availability_dates: manualDates.length > 0 ? manualDates : []
      };

      console.log('Enviando tour:', tourData);

      if (editingTour) {
        await axios.put(`${BACKEND_URL}/api/tours/${editingTour.id}`, tourData);
        alert('Tour atualizado com sucesso!');
      } else {
        await axios.post(`${BACKEND_URL}/api/tours`, tourData);
        alert('Tour criado com sucesso!');
      }

      resetForm();
      setShowModal(false);
      fetchTours();
    } catch (error) {
      console.error('Erro ao salvar tour:', error);
      alert(`Erro ao salvar tour: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
      setIsCreating(false);
    }
  };

  const handleEdit = (tour) => {
    setEditingTour(tour);
    setManualDates(tour.availability_dates || []);
    
    setFormData({
      ...tour,
      thumbnail_image: tour.images?.[0] || '',
      gallery_images: tour.images?.slice(1) || [],
      availability_schedule: tour.availability_schedule || {
        monday: { active: false, start: '09:00', end: '18:00' },
        tuesday: { active: false, start: '09:00', end: '18:00' },
        wednesday: { active: false, start: '09:00', end: '18:00' },
        thursday: { active: false, start: '09:00', end: '18:00' },
        friday: { active: false, start: '09:00', end: '18:00' },
        saturday: { active: false, start: '09:00', end: '18:00' },
        sunday: { active: false, start: '09:00', end: '18:00' }
      }
    });
    setShowModal(true);
  };

  const handleDelete = async (tourId) => {
    if (window.confirm('Tem certeza que deseja eliminar este tour?')) {
      try {
        await axios.delete(`${BACKEND_URL}/api/tours/${tourId}`);
        alert('Tour eliminado com sucesso!');
        fetchTours();
      } catch (error) {
        console.error('Erro ao eliminar tour:', error);
        alert('Erro ao eliminar tour.');
      }
    }
  };

  const toggleTourStatus = async (tour) => {
    try {
      await axios.put(`${BACKEND_URL}/api/tours/${tour.id}`, { active: !tour.active });
      fetchTours();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const syncWithGoogleCalendar = async (tourId) => {
    try {
      setLoading(true);
      
      const response = await axios.put(`${BACKEND_URL}/api/tours/${tourId}/availability`, {
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      
      console.log('Resposta da sincronização:', response.data);
      alert('Disponibilidade sincronizada com Google Calendar!');
      fetchTours();
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      alert(`Erro ao sincronizar: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset completo
  const resetForm = () => {
    setFormData({
      name: { pt: '', en: '', es: '' },
      short_description: { pt: '', en: '', es: '' },
      description: { pt: '', en: '', es: '' },
      location: '',
      duration_hours: 4,
      price: 0,
      max_participants: 1,
      tour_type: 'cultural',
      route_description: { pt: '', en: '', es: '' },
      includes: { pt: '', en: '', es: '' },
      excludes: { pt: '', en: '', es: '' },
      active: true,
      images: [],
      thumbnail_image: '',
      gallery_images: [],
      availability_schedule: {
        monday: { active: false, start: '09:00', end: '18:00' },
        tuesday: { active: false, start: '09:00', end: '18:00' },
        wednesday: { active: false, start: '09:00', end: '18:00' },
        thursday: { active: false, start: '09:00', end: '18:00' },
        friday: { active: false, start: '09:00', end: '18:00' },
        saturday: { active: false, start: '09:00', end: '18:00' },
        sunday: { active: false, start: '09:00', end: '18:00' }
      }
    });
    
    setManualDates([]);
    setNewDate('');
    setEditingTour(null);
    setUploadErrors({});
    setUploadingThumbnail(false);
    setUploadingGallery(false);
  };

  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const weekDaysPT = {
    monday: 'Segunda',
    tuesday: 'Terça',
    wednesday: 'Quarta',
    thursday: 'Quinta',
    friday: 'Sexta',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestão de Tours</h2>
        <button
          onClick={() => setShowModal(true)}
          disabled={isCreating || uploadingThumbnail || uploadingGallery}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Adicionar Tour
        </button>
      </div>

      {/* Lista de Tours */}
      <div className="grid gap-4">
        {tours.map((tour) => (
          <div key={tour.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  {tour.images?.[0] && (
                    <img 
                      src={tour.images[0]} 
                      alt={tour.name.pt}
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{tour.name.pt}</h3>
                    <p className="text-gray-600">{tour.location} • {tour.duration_hours}h • €{tour.price}</p>
                    <p className="text-sm text-gray-500">
                      Datas disponíveis: {tour.availability_dates?.length || 0} | 
                      Participantes: 1-{tour.max_participants}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs rounded ${
                      tour.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {tour.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => toggleTourStatus(tour)}
                  className={`px-3 py-1 rounded text-sm ${
                    tour.active 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {tour.active ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  onClick={() => syncWithGoogleCalendar(tour.id)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                  disabled={loading}
                >
                  {loading ? 'Sincronizando...' : 'Sincronizar Calendar'}
                </button>
                <button
                  onClick={() => handleEdit(tour)}
                  className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(tour.id)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                {editingTour ? 'Editar Tour' : 'Adicionar Novo Tour'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Localização</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo de Tour</label>
                    <select
                      value={formData.tour_type}
                      onChange={(e) => setFormData({...formData, tour_type: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="cultural">Cultural</option>
                      <option value="gastronomic">Gastronômico</option>
                      <option value="mixed">Misto</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Duração (horas)</label>
                    <input
                      type="number"
                      value={formData.duration_hours}
                      onChange={(e) => setFormData({...formData, duration_hours: parseFloat(e.target.value)})}
                      min="1"
                      step="0.5"
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Preço Total (€)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                      min="0"
                      step="0.01"
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Preço total do tour (não por pessoa)
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Máx. Participantes (1-4)</label>
                    <input
                      type="number"
                      value={formData.max_participants}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value >= 1 && value <= 4) {
                          setFormData({...formData, max_participants: value});
                        } else if (e.target.value === '') {
                          setFormData({...formData, max_participants: ''});
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseInt(e.target.value);
                        if (isNaN(value) || value < 1 || value > 4) {
                          setFormData({...formData, max_participants: 1});
                        }
                      }}
                      min="1"
                      max="4"
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Para grupos maiores, contacte diretamente
                    </p>
                  </div>
                </div>

                {/* Campos Multilingues (Nome, Descrição Curta, Descrição) */}
                {['name', 'short_description', 'description'].map(field => (
                  <div key={field} className="space-y-2">
                    <label className="block text-sm font-medium capitalize">
                      {field.replace('_', ' ')}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {['pt', 'en', 'es'].map(lang => (
                        <div key={lang}>
                          <label className="text-xs text-gray-500">{lang.toUpperCase()}</label>
                          {field === 'description' ? (
                            <textarea
                              value={formData[field][lang]}
                              onChange={(e) => setFormData({
                                ...formData,
                                [field]: { ...formData[field], [lang]: e.target.value }
                              })}
                              required
                              rows="3"
                              className="w-full border rounded px-3 py-2"
                            />
                          ) : (
                            <input
                              type="text"
                              value={formData[field][lang]}
                              onChange={(e) => setFormData({
                                ...formData,
                                [field]: { ...formData[field], [lang]: e.target.value }
                              })}
                              required
                              className="w-full border rounded px-3 py-2"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* NOVO: Campo Route Description Melhorado */}
                <div>
                  <label className="block text-sm font-medium capitalize mb-2">
                    Itinerário por Horários (Route Description)
                  </label>
                  
                  {/* Instruções claras */}
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">📋 Como criar o itinerário:</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>Formato:</strong> Hora + Descrição da atividade</p>
                      <p><strong>Exemplo:</strong></p>
                      <div className="bg-white p-2 rounded border mt-2 font-mono text-xs">
                        10:00 Manhã: Encontro no centro histórico<br/>
                        Visita guiada pelos pontos principais<br/>
                        Introdução à história local<br/>
                        <br/>
                        12:30 Almoço: Restaurante tradicional<br/>
                        Pratos típicos da região<br/>
                        Degustação de vinhos locais<br/>
                        <br/>
                        14:30 Tarde: Visita aos monumentos<br/>
                        Fotografias nos miradouros<br/>
                        Tempo livre para compras
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {['pt', 'en', 'es'].map(lang => (
                      <div key={lang}>
                        <label className="text-xs text-gray-500 flex items-center justify-between">
                          <span>{lang.toUpperCase()}</span>
                          <span className="text-xs text-blue-600">Use horários (10:00, 12:30, etc.)</span>
                        </label>
                        <textarea
                          value={formData.route_description[lang]}
                          onChange={(e) => setFormData({
                            ...formData,
                            route_description: { ...formData.route_description, [lang]: e.target.value }
                          })}
                          required
                          rows="8"
                          placeholder={`10:00 Início do tour
Encontro no ponto central
Apresentação do guia

12:30 Almoço tradicional
Restaurante local
Pratos típicos

14:30 Visitas culturais
Monumentos históricos
Tempo para fotos`}
                          className="w-full border rounded px-3 py-2 text-sm font-mono"
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* Preview do itinerário */}
                  {formData.route_description.pt && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">✅ Preview do Itinerário:</h4>
                      <div className="text-sm text-green-800">
                        {parseItineraryPreview(formData.route_description.pt).map((block, index) => (
                          <div key={index} className="mb-2 flex items-start">
                            <span className="font-bold text-indigo-600 mr-2 min-w-[50px]">{block.time}</span>
                            <span>{block.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Campos Includes e Excludes */}
                {['includes', 'excludes'].map(field => (
                  <div key={field} className="space-y-2">
                    <label className="block text-sm font-medium capitalize">
                      {field.replace('_', ' ')}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {['pt', 'en', 'es'].map(lang => (
                        <div key={lang}>
                          <label className="text-xs text-gray-500">{lang.toUpperCase()}</label>
                          <input
                            type="text"
                            value={formData[field][lang]}
                            onChange={(e) => setFormData({
                              ...formData,
                              [field]: { ...formData[field], [lang]: e.target.value }
                            })}
                            required
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Upload de Imagens */}
                <div className="space-y-4">
                  {/* Thumbnail */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Imagem de Capa (Thumbnail - Homepage)
                    </label>
                    
                    {uploadErrors.thumbnail && (
                      <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        {uploadErrors.thumbnail}
                      </div>
                    )}
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], 'thumbnail')}
                      className="w-full mb-2"
                      disabled={uploadingThumbnail || uploadingGallery || loading}
                    />
                    
                    {uploadingThumbnail && (
                      <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          A enviar imagem de capa...
                        </div>
                      </div>
                    )}
                    
                    {formData.thumbnail_image && (
                      <div className="relative inline-block">
                        <img 
                          src={formData.thumbnail_image} 
                          alt="Thumbnail" 
                          className="w-40 h-24 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={removeThumbnailImage}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          title="Remover imagem de capa"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Galeria */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Galeria de Imagens (Página de Detalhes)
                    </label>
                    
                    {uploadErrors.gallery && (
                      <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        {uploadErrors.gallery}
                      </div>
                    )}
                    
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          Array.from(e.target.files).forEach((file, index) => {
                            setTimeout(() => {
                              handleImageUpload(file, 'gallery');
                            }, index * 500);
                          });
                        }
                      }}
                      className="w-full mb-2"
                      disabled={uploadingThumbnail || uploadingGallery || loading}
                    />
                    
                    {uploadingGallery && (
                      <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          A enviar imagem para galeria...
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mb-2">
                      Pode selecionar múltiplas imagens (máx. 5MB cada). Uploads são processados sequencialmente.
                    </p>
                    
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {formData.gallery_images.map((img, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={img} 
                            alt={`Gallery ${index + 1}`} 
                            className="w-full h-24 object-cover rounded border"
                            onError={(e) => {
                              console.error('Erro ao carregar imagem:', img);
                              e.target.style.display = 'none';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remover imagem"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {formData.gallery_images.length > 0 && (
                      <p className="text-xs text-gray-600 mt-2">
                        {formData.gallery_images.length} {formData.gallery_images.length === 1 ? 'imagem' : 'imagens'} na galeria
                      </p>
                    )}
                  </div>
                </div>

                {/* Horários de Disponibilidade */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Horários de Disponibilidade (Para Google Calendar)
                  </label>
                  <div className="space-y-2">
                    {weekDays.map(day => (
                      <div key={day} className="flex items-center gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.availability_schedule[day].active}
                            onChange={(e) => setFormData({
                              ...formData,
                              availability_schedule: {
                                ...formData.availability_schedule,
                                [day]: { ...formData.availability_schedule[day], active: e.target.checked }
                              }
                            })}
                            className="mr-2"
                          />
                          <span className="w-20">{weekDaysPT[day]}</span>
                        </label>
                        {formData.availability_schedule[day].active && (
                          <>
                            <input
                              type="time"
                              value={formData.availability_schedule[day].start}
                              onChange={(e) => setFormData({
                                ...formData,
                                availability_schedule: {
                                  ...formData.availability_schedule,
                                  [day]: { ...formData.availability_schedule[day], start: e.target.value }
                                }
                              })}
                              className="border rounded px-2 py-1"
                            />
                            <span>até</span>
                            <input
                              type="time"
                              value={formData.availability_schedule[day].end}
                              onChange={(e) => setFormData({
                                ...formData,
                                availability_schedule: {
                                  ...formData.availability_schedule,
                                  [day]: { ...formData.availability_schedule[day], end: e.target.value }
                                }
                              })}
                              className="border rounded px-2 py-1"
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gestão de Datas Disponíveis com Calendário */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Datas Disponíveis
                  </label>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-blue-900 mb-2">Sistema de Disponibilidade:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>Calendário Manual:</strong> Selecione datas específicas nos próximos 6 meses</li>
                      <li>• <strong>Google Calendar:</strong> Marque dias como "Indisponível" (evento de dia inteiro) no seu Google Calendar</li>
                      <li>• <strong>Sincronização:</strong> Use "Sincronizar Calendar" para aplicar restrições do Google Calendar</li>
                      <li>• <strong>Fins de semana:</strong> Desabilitados por defeito (pode ser alterado nos horários acima)</li>
                    </ul>
                  </div>

                  {/* Método rápido para adicionar uma data */}
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <h5 className="font-medium mb-2">Adicionar Data Rápida:</h5>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="flex-1 border rounded px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={addManualDate}
                        disabled={!newDate}
                        className={`px-4 py-2 rounded font-medium ${
                          newDate 
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
                    selectedDates={manualDates}
                    onDatesChange={setManualDates}
                    className="mb-4"
                  />
                  
                  {/* Lista compacta das datas selecionadas */}
                  {manualDates.length > 0 && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">
                          Datas Selecionadas ({manualDates.length})
                        </h5>
                        <button
                          type="button"
                          onClick={() => setManualDates([])}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Limpar Todas
                        </button>
                      </div>
                      
                      <div className="max-h-32 overflow-y-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          {manualDates.map(date => (
                            <div key={date} className="flex items-center justify-between bg-white p-2 rounded border">
                              <span>{new Date(date + 'T00:00:00').toLocaleDateString('pt-PT')}</span>
                              <button
                                type="button"
                                onClick={() => removeManualDate(date)}
                                className="text-red-600 hover:text-red-800 font-medium ml-1"
                                title="Remover data"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    disabled={uploadingThumbnail || uploadingGallery}
                    className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading || uploadingThumbnail || uploadingGallery || isCreating}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {(loading || isCreating) ? 'A guardar...' : 
                     (uploadingThumbnail || uploadingGallery) ? 'A enviar imagens...' : 
                     (editingTour ? 'Atualizar' : 'Criar')} Tour
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

export default AdminTourManager;