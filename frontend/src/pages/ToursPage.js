import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from '../utils/useTranslation';
import { tourFiltersService } from '../services/tourFiltersService'; // 🔥 NOVO

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ToursPage = () => {
  const { t, getCurrentLanguage } = useTranslation();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  
  // 🔥 NOVO: Estados para filtros dinâmicos
  const [tourFilters, setTourFilters] = useState([]);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filtersError, setFiltersError] = useState(null);

  useEffect(() => {
    fetchTours();
    fetchTourFilters(); // 🔥 NOVO
  }, []);

  const fetchTours = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/tours?active_only=true`);
      setTours(response.data);
    } catch (err) {
      console.error('Error fetching tours:', err);
      setError(t('message.error'));
    } finally {
      setLoading(false);
    }
  };

  // 🔥 NOVA FUNÇÃO: Buscar filtros do Firebase
  const fetchTourFilters = async () => {
    try {
      setFiltersLoading(true);
      setFiltersError(null);
      
      console.log('🔍 ToursPage: Fetching tour filters from Firebase...');
      const filters = await tourFiltersService.getActiveFilters();
      
      console.log('✅ ToursPage: Tour filters loaded:', filters);
      setTourFilters(filters);
      
    } catch (err) {
      console.error('❌ ToursPage: Error fetching tour filters:', err);
      setFiltersError(err.message);
      
      // Fallback: usar filtros padrão
      console.log('ToursPage: Using fallback filters');
      setTourFilters(tourFiltersService.getDefaultFilters());
    } finally {
      setFiltersLoading(false);
    }
  };

  // 🔥 NOVA FUNÇÃO: Obter label traduzido dos filtros
  const getFilterLabel = (filter) => {
    const currentLang = getCurrentLanguage();
    if (filter.labels && filter.labels[currentLang]) {
      return filter.labels[currentLang];
    }
    return filter.labels?.pt || filter.key || 'Filtro';
  };

  // 🔥 NOVA FUNÇÃO: Obter cor do filtro baseada na chave
  const getFilterColor = (filterKey) => {
    const colors = {
      all: 'bg-indigo-600 hover:bg-indigo-700',
      gastronomic: 'bg-orange-600 hover:bg-orange-700',
      cultural: 'bg-blue-600 hover:bg-blue-700',
      mixed: 'bg-purple-600 hover:bg-purple-700',
      custom: 'bg-green-600 hover:bg-green-700'
    };
    return colors[filterKey] || 'bg-gray-600 hover:bg-gray-700';
  };

  const filteredTours = selectedType === 'all' 
    ? tours 
    : tours.filter(tour => tour.tour_type === selectedType);

  const getTourTypeColor = (type) => {
    const colors = {
      gastronomic: 'bg-orange-100 text-orange-800',
      cultural: 'bg-blue-100 text-blue-800',
      mixed: 'bg-purple-100 text-purple-800',
      custom: 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (loading || filtersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">{t('message_loading')}</p>
          {filtersLoading && <p className="text-sm text-gray-500 mt-2">A carregar filtros...</p>}
        </div>
      </div>
    );
  }

  if (error && !filtersError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <button 
            onClick={fetchTours}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            {t('common_try_again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('nav_tours')}</h1>
          <p className="mt-2 text-lg text-gray-600">
            {t('tours_page_subtitle')}
          </p>
        </div>
      </div>

      {/* Tours Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 🔥 NOVO: Tour Type Filter Dinâmico do Firebase */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {tourFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedType(filter.key)}
              className={`px-6 py-3 rounded-full font-medium transition-colors ${
                selectedType === filter.key
                  ? `${getFilterColor(filter.key)} text-white`
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {getFilterLabel(filter)}
            </button>
          ))}
        </div>

        {/* 🔥 DEBUG: Mostrar info dos filtros em desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 p-4 bg-gray-100 rounded-lg text-sm">
            <strong>🔍 Debug Filtros (ToursPage):</strong>
            <div>Filtros carregados: {tourFilters.length}</div>
            <div>Filtro selecionado: {selectedType}</div>
            <div>Tours filtrados: {filteredTours.length}</div>
            <div className="mt-2">
              <strong>Filtros disponíveis:</strong>
              <ul className="ml-4">
                {tourFilters.map(filter => (
                  <li key={filter.key}>
                    {filter.key}: "{getFilterLabel(filter)}" (ativo: {filter.active ? 'sim' : 'não'})
                  </li>
                ))}
              </ul>
            </div>
            {filtersError && (
              <div className="mt-2 text-red-600">
                <strong>Erro nos filtros:</strong> {filtersError}
              </div>
            )}
          </div>
        )}

        {/* Tours Grid */}
        {filteredTours.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              {t('message_no_tours')}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTours.map((tour) => (
              <div key={tour.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {/* Tour Image */}
                <div className="h-48 bg-gradient-to-r from-gray-300 to-gray-400 relative">
                  {tour.images && tour.images.length > 0 ? (
                    <img
                      src={tour.images[0]}
                      alt={tour.name[getCurrentLanguage()] || tour.name.pt}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Tour Type Badge - MELHORADO: Usa o filtro personalizado se existir */}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTourTypeColor(tour.tour_type)}`}>
                      {(() => {
                        const matchingFilter = tourFilters.find(f => f.key === tour.tour_type);
                        return matchingFilter ? getFilterLabel(matchingFilter) : t(`tour_type_${tour.tour_type}`);
                      })()}
                    </span>
                  </div>
                </div>

                {/* Tour Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {tour.name[getCurrentLanguage()] || tour.name.pt}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed line-clamp-3">
                    {tour.short_description[getCurrentLanguage()] || tour.short_description.pt}
                  </p>
                  
                  {/* Tour Details */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {tour.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {tour.duration_hours} {t('tour_hours')}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                      1-{tour.max_participants} {t('tour_max_people')}
                    </div>
                  </div>

                  {/* Price and Action */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-indigo-600">
                        {formatPrice(tour.price)}
                      </span>
                    </div>
                    <Link
                      to={`/tour/${tour.id}`}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors duration-200"
                    >
                      {t('tour_view_details')}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Section - CORRIGIDO: Agora com traduções */}
      <div className="bg-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">
              {t('cta_ready_for_experience')}
            </h2>
            <p className="text-xl mb-8">
              {t('cta_join_us_description')}
            </p>
            <Link
              to="/contact"
              className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors duration-300"
            >
              {t('cta_contact_us')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToursPage;