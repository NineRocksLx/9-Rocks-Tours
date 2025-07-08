import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { uploadImageToStorage } from '../config/firebase';
import CalendarDatePicker from './CalendarDatePicker';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminTourManager = () => {
    // 1. CHAMADA DE TODOS OS HOOKS (useState, useEffect) NO TOPO
    const [tours, setTours] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingTour, setEditingTour] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [uploadErrors, setUploadErrors] = useState({});
    const [manualDates, setManualDates] = useState([]);
    const [newDate, setNewDate] = useState('');

    const initialFormData = {
        name: { pt: '', en: '', es: '' },
        short_description: { pt: '', en: '', es: '' },
        description: { pt: '', en: '', es: '' },
        highlights: { pt: '', en: '', es: '' },
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
        map_locations: '',
        availability_schedule: {
            monday: { active: false, start: '09:00', end: '18:00' },
            tuesday: { active: false, start: '09:00', end: '18:00' },
            wednesday: { active: false, start: '09:00', end: '18:00' },
            thursday: { active: false, start: '09:00', end: '18:00' },
            friday: { active: false, start: '09:00', end: '18:00' },
            saturday: { active: false, start: '09:00', end: '18:00' },
            sunday: { active: false, start: '09:00', end: '18:00' },
        },
    };

    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        fetchTours();
    }, []);

    // 2. DECLARAÇÃO DE TODAS AS FUNÇÕES AUXILIARES DEPOIS DOS HOOKS
    const fetchTours = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/tours?active_only=false`);
            setTours(response.data);
        } catch (error) {
            console.error('Erro ao buscar tours:', error);
        }
    };

    const parseItineraryPreview = (text) => {
        if (!text) return [];
        const timeRegex = /(\d{1,2}[:h]\d{2}|\d{1,2}h)/gi;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const timeBlocks = [];
        let currentBlock = null;
        lines.forEach((line) => {
            const timeMatch = line.match(timeRegex);
            if (timeMatch) {
                if (currentBlock) timeBlocks.push(currentBlock);
                const time = timeMatch[0].replace('h', ':');
                const cleanText = line.replace(timeRegex, '').replace(':', '').trim();
                currentBlock = { time, title: cleanText || `Atividade às ${time}` };
            }
        });
        if (currentBlock) timeBlocks.push(currentBlock);
        return timeBlocks;
    };

    const handleImageUpload = async (file, imageType) => {
        if (!file) return;
        const setUploading = imageType === 'thumbnail' ? setUploadingThumbnail : setUploadingGallery;
        setUploading(true);
        setUploadErrors(prev => ({ ...prev, [imageType]: null }));
        try {
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(2, 8);
            const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `tours/${timestamp}_${randomId}_${cleanFileName}`;
            const downloadURL = await uploadImageToStorage(file, fileName);
            if (imageType === 'thumbnail') {
                setFormData(prev => ({ ...prev, thumbnail_image: downloadURL }));
            } else {
                setFormData(prev => ({ ...prev, gallery_images: [...prev.gallery_images, downloadURL] }));
            }
        } catch (error) {
            setUploadErrors(prev => ({ ...prev, [imageType]: error.message }));
        } finally {
            setUploading(false);
        }
    };
    
    const handleScheduleChange = (day, field, value) => {
        setFormData(prev => ({
            ...prev,
            availability_schedule: {
                ...prev.availability_schedule,
                [day]: {
                    ...prev.availability_schedule[day],
                    [field]: value
                }
            }
        }));
    };

    const removeThumbnailImage = () => setFormData(prev => ({ ...prev, thumbnail_image: '' }));
    const removeGalleryImage = (index) => setFormData(prev => ({ ...prev, gallery_images: prev.gallery_images.filter((_, i) => i !== index) }));
    const addManualDate = () => {
        if (newDate && !manualDates.includes(newDate)) {
            setManualDates([...manualDates, newDate].sort());
            setNewDate('');
        }
    };
    const removeManualDate = (dateToRemove) => setManualDates(manualDates.filter(date => date !== dateToRemove));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setIsCreating(true);
        try {
            const allImages = [formData.thumbnail_image, ...formData.gallery_images].filter(Boolean);
            const tourData = { ...formData, images: allImages, availability_dates: manualDates };
            if (editingTour) {
                await axios.put(`${BACKEND_URL}/api/tours/${editingTour.id}`, tourData);
            } else {
                await axios.post(`${BACKEND_URL}/api/tours`, tourData);
            }
            resetForm();
            setShowModal(false);
            fetchTours();
        } catch (error) {
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
            ...initialFormData,
            ...tour,
            map_locations: tour.map_locations || '',
            highlights: tour.highlights || { pt: '', en: '', es: '' },
            thumbnail_image: tour.images?.[0] || '',
            gallery_images: tour.images?.slice(1) || [],
        });
        setShowModal(true);
    };

    const handleDelete = async (tourId) => {
        if (window.confirm('Tem certeza que deseja eliminar este tour?')) {
            try {
                await axios.delete(`${BACKEND_URL}/api/tours/${tourId}`);
                fetchTours();
            } catch (error) {
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
    
    const resetForm = () => {
        setFormData(initialFormData);
        setManualDates([]);
        setNewDate('');
        setEditingTour(null);
        setUploadErrors({});
    };

    const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const weekDaysPT = { monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta', thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo' };
    
    // 3. O RETURN COM O JSX
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Gestão de Tours</h2>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                    + Adicionar Tour
                </button>
            </div>

            <div className="grid gap-4">
                {tours.map((tour) => (
                    <div key={tour.id} className="bg-white rounded-lg shadow p-6 flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <img src={tour.images?.[0] || '/placeholder.png'} alt={tour.name.pt} className="w-20 h-20 object-cover rounded"/>
                            <div>
                                <h3 className="text-lg font-semibold">{tour.name.pt}</h3>
                                <p className="text-gray-600">{tour.location} • {tour.duration_hours}h • €{tour.price}</p>
                                <span className={`inline-block px-2 py-1 text-xs rounded ${tour.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {tour.active ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => toggleTourStatus(tour)} className={`px-3 py-1 rounded text-sm ${tour.active ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                {tour.active ? 'Desativar' : 'Ativar'}
                            </button>
                            <button onClick={() => handleEdit(tour)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">Editar</button>
                            <button onClick={() => handleDelete(tour.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm">Eliminar</button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <h3 className="text-xl font-bold">{editingTour ? 'Editar Tour' : 'Adicionar Novo Tour'}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Localização</label>
                                    <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required className="w-full border rounded px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Duração (horas)</label>
                                    <input type="number" value={formData.duration_hours} onChange={(e) => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) || 0 })} min="1" step="0.5" required className="w-full border rounded px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Preço Total (€)</label>
                                    <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} min="0" step="0.01" required className="w-full border rounded px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Máx. Participantes</label>
                                    <input type="number" value={formData.max_participants} onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 1 })} min="1" max="4" required className="w-full border rounded px-3 py-2" />
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Tipo de Tour</label>
                                    <select value={formData.tour_type} onChange={(e) => setFormData({ ...formData, tour_type: e.target.value })} className="w-full border rounded px-3 py-2">
                                        <option value="cultural">Cultural</option>
                                        <option value="gastronomic">Gastronômico</option>
                                        <option value="mixed">Misto</option>
                                        <option value="custom">Personalizado</option>
                                    </select>
                                </div>
                            </div>
                            {['name', 'short_description', 'description', 'highlights', 'includes', 'excludes'].map(field => (
                                <div key={field} className="space-y-2">
                                     <label className="block text-sm font-medium capitalize">
                                        {field.replace('_', ' ')}
                                        {['highlights', 'includes', 'excludes'].includes(field) && " (um por linha)"}
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        {['pt', 'en', 'es'].map(lang => (
                                            <div key={lang}>
                                                <label className="text-xs text-gray-500">{lang.toUpperCase()}</label>
                                                <textarea
                                                    value={formData[field]?.[lang] || ''}
                                                    onChange={(e) => setFormData({ ...formData, [field]: { ...formData[field], [lang]: e.target.value } })}
                                                    required={['name', 'short_description', 'description'].includes(field)}
                                                    rows="4"
                                                    className="w-full border rounded px-3 py-2"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="space-y-2">
                                <label className="block text-sm font-medium capitalize">Itinerário por Horários</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500">PORTUGUÊS (PT)</label>
                                        <textarea
                                            value={formData.route_description.pt || ''}
                                            onChange={(e) => setFormData({ ...formData, route_description: { ...formData.route_description, pt: e.target.value } })}
                                            rows="8"
                                            className="w-full border rounded px-3 py-2 font-mono text-sm"
                                            placeholder="10:00 - Início do tour..."
                                        />
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg border">
                                        <h4 className="font-semibold text-sm mb-2 text-gray-800">Preview do Itinerário</h4>
                                        <div className="text-sm space-y-2">
                                            {parseItineraryPreview(formData.route_description.pt).length > 0 ? (
                                                parseItineraryPreview(formData.route_description.pt).map((block, index) => (
                                                    <div key={index} className="flex items-start">
                                                        <span className="font-bold text-blue-600 mr-2 min-w-[50px]">{block.time}</span>
                                                        <span className="text-gray-700">{block.title}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-gray-400 text-xs">O preview aparecerá aqui.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                     <div>
                                        <label className="text-xs text-gray-500">INGLÊS (EN)</label>
                                        <textarea
                                            value={formData.route_description.en || ''}
                                            onChange={(e) => setFormData({ ...formData, route_description: { ...formData.route_description, en: e.target.value } })}
                                            rows="8" className="w-full border rounded px-3 py-2 font-mono text-sm" />
                                     </div>
                                      <div>
                                        <label className="text-xs text-gray-500">ESPANHOL (ES)</label>
                                        <textarea
                                            value={formData.route_description.es || ''}
                                            onChange={(e) => setFormData({ ...formData, route_description: { ...formData.route_description, es: e.target.value } })}
                                            rows="8" className="w-full border rounded px-3 py-2 font-mono text-sm" />
                                     </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium">Localizações para o Mapa</label>
                                <textarea
                                    value={formData.map_locations}
                                    onChange={(e) => setFormData({ ...formData, map_locations: e.target.value })}
                                    rows="5"
                                    className="w-full border rounded px-3 py-2 font-mono text-sm"
                                    placeholder={`Exemplo:\nCastelo de Chambord, 47.6161, 1.5172\nCastelo de Chenonceau, 47.3249, 1.0703`}
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded hover:bg-gray-100">Cancelar</button>
                                <button type="submit" disabled={loading || uploadingThumbnail || uploadingGallery} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                                    {loading ? 'A guardar...' : (editingTour ? 'Atualizar Tour' : 'Criar Tour')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTourManager;