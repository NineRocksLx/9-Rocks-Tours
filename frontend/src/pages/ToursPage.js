// frontend/src/pages/ToursPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from '../utils/useTranslation';
import { tourFiltersService } from '../services/tourFiltersService';
import { BACKEND_URL } from '../config/appConfig';

// 🐞 FUNÇÃO DE DEPURAÇÃO PARA O FRONTEND
const debugLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[DEBUG ✈️ ToursPage.js]', ...args);
  }
};

const ToursPage = () => {
  const { t, getCurrentLanguage } = useTranslation();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  
  // Estados para filtros dinâmicos
  const [tourFilters, setTourFilters] = useState([]);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filtersError, setFiltersError] = useState(null);

  useEffect(() => {
    fetchTours();
    fetchTourFilters();
  }, []);

  // Efeito para monitorizar o estado dos tours
  useEffect(() => {
    debugLog(`O estado 'tours' foi atualizado. Contém agora ${tours.length} tours.`);
  }, [tours]);

  const fetchTours = async () => {
    try {
      setLoading(true);
      const url = `${BACKEND_URL}/api/tours/`;
      debugLog("Iniciando 'fetchTours'. A fazer pedido para:", url);
      
      const response = await axios.get(url, { params: { active_only: true } });
      debugLog("Resposta recebida do backend para /api/tours:", response);

      if (response && Array.isArray(response.data)) {
        debugLog(`✅ SUCESSO: Recebidos ${response.data.length} tours do backend.`);
        if (response.data.length > 0) {
            debugLog("   -> Estrutura do primeiro tour recebido:", response.data[0]);
        }
        setTours(response.data);
      } else {
        debugLog("❌ ERRO: Os dados de tours recebidos do backend não são um array ou estão vazios!", response.data);
        setError(t('message.error'));
        setTours([]);
      }
    } catch (err) {
      debugLog("❌ ERRO CRÍTICO ao buscar tours em 'fetchTours':", err);
      if (err.response) {
        debugLog("   -> Resposta do erro do Axios:", err.response);
      }
      setError(t('message.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchTourFilters = async () => {
    try {
      setFiltersLoading(true);
      setFiltersError(null);
      
      const filters = await tourFiltersService.getActiveFilters();
      setTourFilters(filters);
      
    } catch (err) {
      console.error('Error fetching tour filters:', err);
      setFiltersError(err.message);
      
      // Fallback: usar filtros padrão
      setTourFilters(tourFiltersService.getDefaultFilters());
    } finally {
      setFiltersLoading(false);
    }
  };

  const getFilterLabel = (filter) => {
    const currentLang = getCurrentLanguage();
    if (filter.labels && filter.labels[currentLang]) {
      return filter.labels[currentLang];
    }
    return filter.labels?.pt || filter.key || 'Filtro';
  };

  const filteredTours = selectedType === 'all' 
    ? tours 
    : tours.filter(tour => tour.tour_type === selectedType);

  const getTourTypeColor = (type) => {
    const colors = {
      gastronomic: 'bg-orange-50 text-orange-700 border-orange-200',
      cultural: 'bg-blue-50 text-blue-700 border-blue-200',
      mixed: 'bg-purple-50 text-purple-700 border-purple-200',
      custom: 'bg-green-50 text-green-700 border-green-200'
    };
    return colors[type] || 'bg-gray-50 text-gray-700 border-gray-200';
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
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">{t('message_loading')}</p>
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
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {t('common_try_again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('nav_tours')}</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            {t('tours_page_subtitle')}
          </p>
        </div>
      </div>

      {/* Tours Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filtros limpos */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {tourFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedType(filter.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  selectedType === filter.key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {getFilterLabel(filter)}
              </button>
            ))}
          </div>
        </div>

        {/* Tours Grid */}
        {filteredTours.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-500 text-lg">
              {t('message_no_tours')}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTours.map((tour) => (
              <div key={tour.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
                
                {/* Tour Image */}
                <div className="h-48 bg-gray-100 relative">
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
                      <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Tour Type Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getTourTypeColor(tour.tour_type)}`}>
                      {(() => {
                        const matchingFilter = tourFilters.find(f => f.key === tour.tour_type);
                        return matchingFilter ? getFilterLabel(matchingFilter) : t(`tour_type_${tour.tour_type}`);
                      })()}
                    </span>
                  </div>
                </div>

                {/* Tour Content */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {tour.name[getCurrentLanguage()] || tour.name.pt}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {tour.short_description[getCurrentLanguage()] || tour.short_description.pt}
                  </p>
                  
                  {/* Tour Details */}
                  <div className="space-y-2 mb-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {tour.location}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {tour.duration_hours}h
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Máx. {tour.max_participants} pessoas
                    </div>
                  </div>

                  {/* Rating */}
                  {tour.rating && (
                    <div className="flex items-center mb-4">
                      <div className="flex text-yellow-400 text-sm mr-2">
                        {'★'.repeat(Math.floor(tour.rating))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {tour.rating} ({tour.reviewCount || 0})
                      </span>
                    </div>
                  )}

                  {/* Price and Action */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <span className="text-xl font-bold text-gray-900">
                        {formatPrice(tour.price)}
                      </span>
                    </div>
                    <Link
                      to={`/tour/${tour.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
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

      {/* CTA Section simplificado */}
      <div className="bg-gray-50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('cta_ready_for_experience')}
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              {t('cta_join_us_description')}
            </p>
            <Link
              to="/contact"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
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