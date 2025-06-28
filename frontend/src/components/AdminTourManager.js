import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { uploadImageToStorage } from '../config/firebase';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminTourManager = () => {
  const [tours, setTours] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTour, setEditingTour] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: { pt: '', en: '', es: '' },
    short_description: { pt: '', en: '', es: '' },
    description: { pt: '', en: '', es: '' },
    location: '',
    duration_hours: 4,
    price: 0,
    max_participants: 10,
    tour_type: 'cultural',
    route_description: { pt: '', en: '', es: '' },
    includes: { pt: '', en: '', es: '' },
    excludes: { pt: '', en: '', es: '' },
    active: true,
    images: [],
    thumbnail_image: '', // Imagem pequena para homepage
    gallery_images: [], // Imagens grandes para detalhes
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

  const handleImageUpload = async (file, imageType) => {
    if (!file) return;

    setUploadingImage(true);
    try {
      // Validar tipo de arquivo
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Por favor, envie apenas imagens JPG, PNG ou WebP');
        return;
      }

      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter menos de 5MB');
        return;
      }

      // Criar path único para a imagem
      const timestamp = Date.now();
      const fileName = `tours/${timestamp}_${file.name}`;
      
      // Upload para Firebase Storage
      const downloadURL = await uploadImageToStorage(file, fileName);
      
      // Atualizar form data
      if (imageType === 'thumbnail') {
        setFormData(prev => ({ ...prev, thumbnail_image: downloadURL }));
      } else if (imageType === 'gallery') {
        setFormData(prev => ({ 
          ...prev, 
          gallery_images: [...prev.gallery_images, downloadURL] 
        }));
      }
      
      alert('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      alert('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeGalleryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combinar todas as imagens
      const allImages = [formData.thumbnail_image, ...formData.gallery_images].filter(Boolean);
      
      const tourData = {
        ...formData,
        images: allImages,
        availability_dates: [] // Será preenchido pela integração com Google Calendar
      };

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
      alert('Erro ao salvar tour. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tour) => {
    setEditingTour(tour);
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
      const response = await axios.put(`${BACKEND_URL}/api/tours/${tourId}/availability`, {
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      alert('Disponibilidade sincronizada com Google Calendar!');
      fetchTours();
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      alert('Erro ao sincronizar com Google Calendar');
    }
  };

  const resetForm = () => {
    setFormData({
      name: { pt: '', en: '', es: '' },
      short_description: { pt: '', en: '', es: '' },
      description: { pt: '', en: '', es: '' },
      location: '',
      duration_hours: 4,
      price: 0,
      max_participants: 10,
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
    setEditingTour(null);
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
      {/* Navegação adicionada aqui */}
      <div className="mb-8 -mx-6 px-6 border-b">
        <nav className="flex space-x-8 pb-4">
          <button
            onClick={() => window.location.href = '/admin'}
            className="py-2 px-1 border-b-2 border-indigo-500 text-indigo-600 font-medium text-sm"
          >
            Tours
          </button>
          <button
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.set('view', 'bookings');
              window.location.href = `/admin?${params.toString()}`;
            }}
            className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
          >
            Reservas
          </button>
          <button
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.set('view', 'stats');
              window.location.href = `/admin?${params.toString()}`;
            }}
            className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
          >
            Estatísticas
          </button>
        </nav>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestão de Tours</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
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
                >
                  Sincronizar Calendar
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
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
                    <label className="block text-sm font-medium mb-1">Preço (€)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                      min="0"
                      step="0.01"
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Máx. Participantes</label>
                    <input
                      type="number"
                      value={formData.max_participants}
                      onChange={(e) => setFormData({...formData, max_participants: parseInt(e.target.value)})}
                      min="1"
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>

                {/* Campos Multilingues */}
                {['name', 'short_description', 'description', 'route_description', 'includes', 'excludes'].map(field => (
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

                {/* Upload de Imagens */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Imagem de Capa (Thumbnail - Homepage)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], 'thumbnail')}
                      className="w-full"
                      disabled={uploadingImage}
                    />
                    {formData.thumbnail_image && (
                      <img 
                        src={formData.thumbnail_image} 
                        alt="Thumbnail" 
                        className="mt-2 w-40 h-24 object-cover rounded"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Galeria de Imagens (Página de Detalhes)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], 'gallery')}
                      className="w-full"
                      disabled={uploadingImage}
                    />
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {formData.gallery_images.map((img, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={img} 
                            alt={`Gallery ${index + 1}`} 
                            className="w-full h-24 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Horários de Disponibilidade */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Horários de Disponibilidade
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

                {/* Botões */}
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploadingImage}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'A guardar...' : (editingTour ? 'Atualizar' : 'Criar')} Tour
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