import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../utils/useTranslation';
import SEOHead from '../components/SEOHead';

// 🔥 VERSÃO DEBUG COM FIREBASE - 9 ROCKS TOURS
const HomePage = () => {
  const { t, getCurrentLanguage } = useTranslation();
  const currentLang = getCurrentLanguage();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [debugInfo, setDebugInfo] = useState({
    firebase: 'checking...',
    heroImages: 'checking...',
    tourFilters: 'checking...',
    backend: 'checking...'
  });

  // 🔥 IMAGENS FALLBACK (caso Firebase falhe)
  const fallbackHeroImages = [
    {
      id: 'fallback_1',
      title: { 
        pt: 'Sintra Mágica', 
        en: 'Magical Sintra', 
        es: 'Sintra Mágica' 
      },
      subtitle: { 
        pt: 'Descubra palácios encantados', 
        en: 'Discover enchanted palaces', 
        es: 'Descubre palacios encantados' 
      },
      imageUrl: 'https://media.timeout.com/images/105732838/1920/1080/image.webp',
      order: 1,
      active: true
    },
    {
      id: 'fallback_2',
      title: { 
        pt: 'Porto Autêntico', 
        en: 'Authentic Porto', 
        es: 'Oporto Auténtico' 
      },
      subtitle: { 
        pt: 'Sabores e tradições do Norte', 
        en: 'Northern flavors and traditions', 
        es: 'Sabores y tradiciones del Norte' 
      },
      imageUrl: 'https://images.unsplash.com/photo-1555881400-69e38bb0c85f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
      order: 2,
      active: true
    }
  ];

  // Estados para dados
  const [heroImages, setHeroImages] = useState(fallbackHeroImages);
  const [tours, setTours] = useState([]);
  const [tourFilters, setTourFilters] = useState([
    {
      key: 'all',
      labels: { pt: 'Todos os Tours', en: 'All Tours', es: 'Todos los Tours' },
      order: 0,
      active: true
    },
    {
      key: 'cultural',
      labels: { pt: 'Cultural', en: 'Cultural', es: 'Cultural' },
      order: 1,
      active: true
    },
    {
      key: 'gastronomic', 
      labels: { pt: 'Gastronómico', en: 'Gastronomic', es: 'Gastronómico' },
      order: 2,
      active: true
    }
  ]);
  const [selectedType, setSelectedType] = useState('all');

  // 🧪 TESTE FIREBASE CONFIGURATION
  const testFirebaseConfig = async () => {
    try {
      console.log('🔥 Testando configuração Firebase...');
      
      // Verificar se Firebase está importado
      const { db } = await import('../config/firebase');
      console.log('✅ Firebase config importado com sucesso');
      
      setDebugInfo(prev => ({ ...prev, firebase: 'config_ok' }));
      return { success: true, db };
    } catch (error) {
      console.error('❌ Erro na configuração Firebase:', error);
      setDebugInfo(prev => ({ ...prev, firebase: `error: ${error.message}` }));
      return { success: false, error };
    }
  };

  // 🖼️ TESTE HERO IMAGES FIRESTORE
  const testHeroImages = async () => {
    try {
      console.log('🖼️ Testando Hero Images...');
      
      const { heroImagesService } = await import('../services/heroImagesService');
      console.log('✅ Hero Images Service importado');
      
      const images = await heroImagesService.getActiveHeroImages();
      console.log('✅ Hero Images carregadas:', images.length);
      
      if (images.length > 0) {
        setHeroImages(images);
        setDebugInfo(prev => ({ ...prev, heroImages: `success: ${images.length} images` }));
      } else {
        console.log('⚠️ Nenhuma hero image encontrada, usando fallback');
        setDebugInfo(prev => ({ ...prev, heroImages: 'empty_using_fallback' }));
      }
      
      return { success: true, count: images.length };
    } catch (error) {
      console.error('❌ Erro Hero Images:', error);
      setDebugInfo(prev => ({ ...prev, heroImages: `error: ${error.message}` }));
      return { success: false, error };
    }
  };

  // 🔍 TESTE TOUR FILTERS FIRESTORE
  const testTourFilters = async () => {
    try {
      console.log('🔍 Testando Tour Filters...');
      
      const { tourFiltersService } = await import('../services/tourFiltersService');
      console.log('✅ Tour Filters Service importado');
      
      const filters = await tourFiltersService.getActiveFilters();
      console.log('✅ Tour Filters carregados:', filters.length);
      
      if (filters.length > 0) {
        setTourFilters(filters);
        setDebugInfo(prev => ({ ...prev, tourFilters: `success: ${filters.length} filters` }));
      } else {
        console.log('⚠️ Nenhum filtro encontrado, usando padrão');
        setDebugInfo(prev => ({ ...prev, tourFilters: 'empty_using_default' }));
      }
      
      return { success: true, count: filters.length };
    } catch (error) {
      console.error('❌ Erro Tour Filters:', error);
      setDebugInfo(prev => ({ ...prev, tourFilters: `error: ${error.message}` }));
      return { success: false, error };
    }
  };

  // 🎯 TESTE TOURS BACKEND
 const testBackendTours = async () => {
    try {
        console.log('🎯 Fetching tours from backend...');
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        console.log('🔗 Backend URL:', BACKEND_URL);
        if (!BACKEND_URL) {
            throw new Error('REACT_APP_BACKEND_URL not defined');
        }
        const response = await fetch(`${BACKEND_URL}/api/tours?active_only=true`, {
            timeout: 5000
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('✅ Tours received:', JSON.stringify(data, null, 2));
        setTours(data);
        setDebugInfo(prev => ({ ...prev, backend: `success: ${data.length} tours` }));
        return { success: true, count: data.length };
    } catch (error) {
        console.error('❌ Error fetching tours:', error);
        setDebugInfo(prev => ({ ...prev, backend: `error: ${error.message}` }));
        setTours([]); // Fallback to empty array
        return { success: false, error };
    }
};
  // 🚀 FUNÇÃO PRINCIPAL DE CARREGAMENTO
  const loadAllData = async () => {
    console.log('🚀 HomePage: Iniciando carregamento de dados...');
    setLoading(true);
    setError(null);

    try {
      // 1. Testar configuração Firebase primeiro
      const firebaseTest = await testFirebaseConfig();
      
      if (firebaseTest.success) {
        // 2. Se Firebase OK, testar serviços Firestore
        await Promise.allSettled([
          testHeroImages(),
          testTourFilters()
        ]);
      }
      
      // 3. Testar backend independentemente
      await testBackendTours();
      
      console.log('✅ Carregamento concluído');
      
    } catch (error) {
      console.error('❌ Erro geral no carregamento:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 EFFECT PRINCIPAL
  useEffect(() => {
    loadAllData();
  }, []);

  // 🎠 CAROUSEL AUTOMÁTICO
  useEffect(() => {
    if (heroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [heroImages.length]);

  // 🔧 HELPER FUNCTIONS
  const getLocalizedText = (textObj) => {
    if (!textObj) return '';
    return textObj[currentLang] || textObj.pt || textObj.en || '';
  };

  const getFilterLabel = (filter) => {
    if (filter.labels && filter.labels[currentLang]) {
      return filter.labels[currentLang];
    }
    return filter.labels?.pt || filter.key || 'Filtro';
  };

  const getURL = (path) => {
    const langPrefix = currentLang === 'pt' ? '' : `/${currentLang}`;
    return `${langPrefix}${path}`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const filteredTours = selectedType === 'all' 
    ? tours 
    : tours.filter(tour => tour.tour_type === selectedType);

  // 🔄 LOADING STATE com DEBUG INFO
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-indigo-600 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">9 Rocks Tours</h2>
          <p className="text-lg text-gray-600 mb-6">{t('message_loading')}</p>
          
          {/* 🔍 DEBUG INFO */}
          <div className="bg-white rounded-lg p-4 text-left text-sm">
            <h3 className="font-bold mb-2">🔧 Status Debug:</h3>
            <div className="space-y-1">
              <div>🔥 Firebase: <span className="font-mono text-xs">{debugInfo.firebase}</span></div>
              <div>🖼️ Hero Images: <span className="font-mono text-xs">{debugInfo.heroImages}</span></div>
              <div>🔍 Tour Filters: <span className="font-mono text-xs">{debugInfo.tourFilters}</span></div>
              <div>🎯 Backend: <span className="font-mono text-xs">{debugInfo.backend}</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ❌ ERROR STATE
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-lg">
          <div className="text-red-600 text-xl mb-4">❌ Erro: {error}</div>
          
          {/* 🔍 DEBUG INFO COMPLETA */}
          <div className="bg-gray-100 rounded-lg p-4 text-left text-sm mb-6">
            <h3 className="font-bold mb-2">🔧 Diagnóstico Completo:</h3>
            <div className="space-y-1 font-mono text-xs">
              <div>🔥 Firebase: {debugInfo.firebase}</div>
              <div>🖼️ Hero Images: {debugInfo.heroImages}</div>
              <div>🔍 Tour Filters: {debugInfo.tourFilters}</div>
              <div>🎯 Backend: {debugInfo.backend}</div>
            </div>
          </div>
          
          <button 
            onClick={loadAllData}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            🔄 Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  console.log('🎨 HomePage: Renderizando interface...');

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="9 Rocks Tours - Aventuras Épicas em Portugal"
        description="Descubra paraísos escondidos com tours exclusivos"
        lang={currentLang}
      />
      
      {/* 🏔️ HERO SECTION */}
      <div className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <div
              key={image.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img 
                src={image.imageUrl} 
                alt={getLocalizedText(image.title)}
                className="w-full h-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
                onError={(e) => {
                  console.error('❌ Erro ao carregar imagem:', image.imageUrl);
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="%23e5e7eb"/><text x="960" y="540" text-anchor="middle" fill="%236b7280" font-size="48">Imagem não disponível</text></svg>';
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            </div>
          ))}
        </div>

        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center text-white px-4 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                {heroImages[currentImageIndex] 
                  ? getLocalizedText(heroImages[currentImageIndex].title)
                  : t('home_title')
                }
              </span>
            </h1>
            <p className="text-xl md:text-3xl mb-4 font-light opacity-90">
              {heroImages[currentImageIndex] 
                ? getLocalizedText(heroImages[currentImageIndex].subtitle)
                : t('home_subtitle')
              }
            </p>
            <p className="text-lg md:text-xl mb-12 opacity-80 max-w-2xl mx-auto leading-relaxed">
              {t('home_description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="#tours" 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                {t('home_cta')}
              </a>
              <Link
                to={getURL('/contact')}
                className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-gray-900 transition-all duration-300"
              >
                {t('cta_contact_us')}
              </Link>
            </div>
          </div>
        </div>

        {/* 🔴 CAROUSEL INDICATORS */}
        {heroImages.length > 1 && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentImageIndex 
                    ? 'bg-white scale-125' 
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 📊 CREDIBILIDADE */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-60">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">500+</div>
              <div className="text-sm text-gray-600">{t('tours_completed')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">4.9★</div>
              <div className="text-sm text-gray-600">{t('average_rating')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">98%</div>
              <div className="text-sm text-gray-600">{t('satisfied_clients')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">5</div>
              <div className="text-sm text-gray-600">{t('years_experience')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 🎯 TOURS SECTION */}
      <div id="tours" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {t('home_featured_tours')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('home_featured_tours_description')}
          </p>
        </div>

        {/* 🔍 TOUR FILTERS */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {tourFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedType(filter.key)}
              className={`px-8 py-4 rounded-full font-semibold transition-all duration-300 ${
                selectedType === filter.key
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-300 hover:shadow-md'
              }`}
            >
              {getFilterLabel(filter)}
            </button>
          ))}
        </div>

        {/* 🎴 TOURS GRID */}
        {filteredTours.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-500 text-xl">
              {t('message_no_tours')}
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Debug: {tours.length} tours totais, filtro: {selectedType}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTours.map((tour, index) => (
              <div 
                key={tour.id} 
                className="group bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
              >
                <div className="h-64 relative overflow-hidden">
                  {tour.images && tour.images.length > 0 ? (
                    <img
                      src={tour.images[0]}
                      alt={tour.name[currentLang] || tour.name.pt}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <svg className="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-4 py-2 rounded-full text-sm font-bold text-white shadow-lg bg-gradient-to-r from-indigo-400 to-purple-500">
                      {tour.tour_type || 'Tour'}
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                    {tour.duration_hours}h • {tour.max_participants} pessoas
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                    {tour.name[currentLang] || tour.name.pt}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed line-clamp-2">
                    {tour.short_description[currentLang] || tour.short_description.pt}
                  </p>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {tour.location}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {formatPrice(tour.price)}
                      </span>
                    </div>
                    <Link
                      to={getURL(`/tour/${tour.id}`)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
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

      {/* 🌟 WHY CHOOSE US */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('why_choose_us_title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('why_choose_us_subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {t('specialized_guides_title')}
              </h3>
              <p className="text-gray-600">
                {t('specialized_guides_description')}
              </p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {t('small_groups_title')}
              </h3>
              <p className="text-gray-600">
                {t('small_groups_description')}
              </p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {t('authentic_experiences_title')}
              </h3>
              <p className="text-gray-600">
                {t('authentic_experiences_description')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🎯 CTA FINAL */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t('cta_ready_for_experience')}
          </h2>
          <p className="text-xl md:text-2xl mb-10 opacity-90">
            {t('cta_join_us_description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={getURL('/tours')}
              className="bg-white text-indigo-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl"
            >
              {t('view_all_tours')}
            </Link>
            <Link
              to={getURL('/contact')}
              className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-indigo-600 transition-all duration-300"
            >
              {t('cta_contact_us')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;