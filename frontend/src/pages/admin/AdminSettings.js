import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminTourManager from '../../components/AdminTourManager';
import HeroImagesManager from '../../components/HeroImagesManager'; // ← ADICIONAR IMPORT
import { BACKEND_URL } from '../../config/appConfig';

const AdminSettings = () => {
    const [activeTab, setActiveTab] = useState('tours');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Estados para Tours
    const [tours, setTours] = useState([]);
    const [editingTour, setEditingTour] = useState(null);
    const [showTourForm, setShowTourForm] = useState(false);

    // Estados para Filtros
    const [filters, setFilters] = useState({
        difficulty_levels: [],
        duration_ranges: [],
        price_ranges: []
    });

    useEffect(() => {
        if (activeTab === 'tours') {
            fetchTours();
        } else if (activeTab === 'filters') {
            fetchFilters();
        }
        // ✅ REMOVER fetchHeroImages - o HeroImagesManager gere sozinho
    }, [activeTab]);

    const showMessage = (message, type = 'success') => {
        if (type === 'success') {
            setSuccess(message);
            setError('');
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(message);
            setSuccess('');
        }
    };

    // ===== TOURS MANAGEMENT - COM TOKEN (FUNCIONANDO) =====
    const fetchTours = async () => {
        setLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('admin_token');
            
            if (!token) {
                setError('Token de autenticação não encontrado');
                return;
            }

            console.log('🔍 Fetching tours from:', `${BACKEND_URL}/api/tours/`);
            
            const response = await axios.get(`${BACKEND_URL}/api/tours/`, {
                 params: { active_only: false },
                 headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                 },
                 timeout: 15000
            });
            
            console.log('✅ Tours response:', response.data);
            setTours(response.data || []);
            showMessage(`${response.data?.length || 0} tours loaded successfully!`);
            
        } catch (err) {
            console.error('❌ Error loading tours:', err);
            
            if (err.response?.status === 401) {
                setError('Sessão expirada. Faça login novamente.');
            } else if (err.response?.status === 403) {
                setError('Permissão negada. Verifique suas credenciais.');
            } else if (err.code === 'ECONNABORTED') {
                setError('Backend timeout - please try again');
            } else if (err.response) {
                setError(`Backend error ${err.response.status}: ${err.response.data?.detail || err.message}`);
            } else if (err.request) {
                setError(`Cannot connect to backend: ${BACKEND_URL}`);
            } else {
                setError(err.response?.data?.message || 'Erro ao carregar tours');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEditTour = (tour) => {
        setEditingTour(tour);
        setShowTourForm(true);
    };

    const handleNewTour = () => {
        setEditingTour({});
        setShowTourForm(true);
    };

    const handleCloseTourForm = () => {
        setShowTourForm(false);
        setEditingTour(null);
        fetchTours();
    };

    const deleteTour = async (tourId) => {
        if (!window.confirm('Tem certeza que deseja excluir este tour?')) return;
        
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            
            await axios.delete(`${BACKEND_URL}/api/tours/${tourId}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            showMessage('Tour excluído com sucesso!');
            fetchTours();
        } catch (error) {
            console.error('❌ Error deleting tour:', error);
            setError('Erro ao excluir o tour');
        } finally {
            setLoading(false);
        }
    };

    // ===== FILTERS MANAGEMENT =====
    const fetchFilters = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${BACKEND_URL}/api/filters`);
            setFilters(response.data || {
                difficulty_levels: [],
                duration_ranges: [],
                price_ranges: []
            });
            console.log('✅ Filters loaded');
        } catch (error) {
            console.error('❌ Error loading filters:', error);
            showMessage('Error loading filters', 'error');
        } finally {
            setLoading(false);
        }
    };

    const saveFilters = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            await axios.post(`${BACKEND_URL}/api/admin/filters`, filters, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            showMessage('Filters updated successfully!');
        } catch (error) {
            console.error('❌ Error saving filters:', error);
            showMessage('Error saving filters', 'error');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'tours', name: 'Tours', icon: '🚐' },
        { id: 'hero', name: 'Hero Images', icon: '🖼️' },
        { id: 'filters', name: 'Filters', icon: '🔍' }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold mb-2">🚐 Tours Management</h1>
                <p className="text-indigo-100 text-lg">Manage tours, hero images and filters</p>
            </div>

            {/* Backend Status */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="text-blue-800 font-medium">🔗 Backend:</span>
                        <code className="ml-2 bg-blue-100 px-2 py-1 rounded text-sm">{BACKEND_URL}</code>
                    </div>
                    <button
                        onClick={() => fetchTours()}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                        🔄 Test Connection
                    </button>
                </div>
            </div>

            {/* Messages */}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
                    <span className="mr-2">✅</span>
                    {success}
                </div>
            )}
            
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
                    <span className="mr-2">❌</span>
                    <div className="flex-1">
                        <div className="font-medium">Connection Error</div>
                        <div className="text-sm mt-1">{error}</div>
                    </div>
                    <button 
                        onClick={() => setError('')}
                        className="ml-auto text-red-600 hover:text-red-800"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Tabs Navigation */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                                    activeTab === tab.id
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'tours' && (
                        <>
                            {showTourForm ? (
                                <AdminTourManager
                                    tourToEdit={editingTour}
                                    onFormClose={handleCloseTourForm}
                                />
                            ) : (
                                <ToursManager
                                    tours={tours}
                                    onEditTour={handleEditTour}
                                    onNewTour={handleNewTour}
                                    onDeleteTour={deleteTour}
                                    loading={loading}
                                />
                            )}
                        </>
                    )}

                    {/* ✅ USAR HEROIMAGESMANAGER EXISTENTE */}
                    {activeTab === 'hero' && (
                        <HeroImagesManager />
                    )}

                    {activeTab === 'filters' && (
                        <FiltersManager
                            filters={filters}
                            setFilters={setFilters}
                            onSave={saveFilters}
                            loading={loading}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// ===== TOURS MANAGER COMPONENT (INALTERADO) =====
const ToursManager = ({ tours, onEditTour, onNewTour, onDeleteTour, loading }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">🚐 Gerir Tours</h2>
                <button
                    onClick={onNewTour}
                    className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Adicionar Novo Tour
                </button>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                    <p className="text-gray-600">A carregar tours...</p>
                </div>
            )}

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-900">
                        Tours Existentes ({tours.length})
                    </h3>
                </div>

                {!loading && tours.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-500 text-lg mb-4">
                            Nenhum tour encontrado
                        </div>
                        <button
                            onClick={onNewTour}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Criar o primeiro tour
                        </button>
                    </div>
                )}

                {!loading && tours.length > 0 && (
                    <div className="space-y-4 p-4">
                        {tours.map((tour) => (
                            <div key={tour.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                                <div className="flex-grow">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {tour.name?.pt || 'Tour sem nome'}
                                    </h3>
                                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                        <span>ID: {tour.id}</span>
                                        <span>•</span>
                                        <span>
                                            Status: {tour.active ? 
                                                <span className="text-green-600 font-medium">Ativo</span> : 
                                                <span className="text-red-600 font-medium">Inativo</span>
                                            }
                                        </span>
                                        <span>•</span>
                                        <span>Preço: €{tour.price || 0}</span>
                                        <span>•</span>
                                        <span>Duração: {tour.duration_hours || 0}h</span>
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => onEditTour(tour)}
                                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => onDeleteTour(tour.id)}
                                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors flex items-center"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ===== FILTERS MANAGER COMPONENT (INALTERADO) =====
const FiltersManager = ({ filters, setFilters, onSave, loading }) => {
    const addFilterItem = (category, item) => {
        setFilters(prev => ({
            ...prev,
            [category]: [...(prev[category] || []), item]
        }));
    };

    const removeFilterItem = (category, index) => {
        setFilters(prev => ({
            ...prev,
            [category]: prev[category].filter((_, i) => i !== index)
        }));
    };

    const FilterSection = ({ title, category, placeholder, icon }) => {
        const [newItem, setNewItem] = useState('');

        const handleAdd = () => {
            if (newItem.trim()) {
                addFilterItem(category, newItem.trim());
                setNewItem('');
            }
        };

        return (
            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">{icon}</span>
                    {title}
                </h4>
                
                <div className="flex gap-2 mb-3">
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder={placeholder}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <button
                        onClick={handleAdd}
                        className="bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 text-sm"
                    >
                        +
                    </button>
                </div>

                <div className="space-y-2">
                    {(filters[category] || []).map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                            <span className="text-sm">{item}</span>
                            <button
                                onClick={() => removeFilterItem(category, index)}
                                className="text-red-600 hover:text-red-800 text-sm"
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                    {(!filters[category] || filters[category].length === 0) && (
                        <p className="text-gray-500 text-sm italic">No items added</p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">🔍 Filters Management</h2>
                <button
                    onClick={onSave}
                    disabled={loading}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                    {loading ? '⏳' : '💾'} 
                    <span className="ml-1">Save Filters</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FilterSection
                    title="Difficulty Levels"
                    category="difficulty_levels"
                    placeholder="ex: Easy, Moderate, Hard"
                    icon="⛰️"
                />
                <FilterSection
                    title="Duration Ranges"
                    category="duration_ranges"
                    placeholder="ex: 2-4 hours, Full day"
                    icon="⏱️"
                />
                <FilterSection
                    title="Price Ranges"
                    category="price_ranges"
                    placeholder="ex: €0-50, €50-100"
                    icon="💰"
                />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-blue-900 font-medium mb-2">💡 Filter Tips</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                    <li>• Use clear and consistent names</li>
                    <li>• Keep options organized in logical order</li>
                    <li>• For prices, use format "€0-50" for better understanding</li>
                    <li>• For durations, be specific: "2-4 hours" instead of "Short"</li>
                </ul>
            </div>
        </div>
    );
};

export default AdminSettings;