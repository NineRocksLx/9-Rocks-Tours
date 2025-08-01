// frontend/src/pages/HomePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../utils/useTranslation';
import SEOHead from '../components/SEOHead';
import axios from 'axios';
import { BACKEND_URL } from '../config/appConfig';
import PremiumPaymentComponent from '../components/PremiumPaymentComponent';

// 🐞 FUNÇÃO DE DEPURAÇÃO PARA O FRONTEND
const debugLog = (...args) => {
  // Esta função só vai imprimir para a consola se estiver em modo de desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log('%c[DEBUG 🏠 HomePage.js]', 'color: #22C55E; font-weight: bold;', ...args);
  }
};

// O seu componente original, com a correção integrada
const HomePage = () => {
  const { t, getCurrentLanguage } = useTranslation();
  const currentLang = getCurrentLanguage();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPaymentTest, setShowPaymentTest] = useState(false);

  const fallbackHeroImages = [
    {
      id: 'fallback_1',
      title: { pt: 'Sintra Mágica', en: 'Magical Sintra', es: 'Sintra Mágica' },
      subtitle: { pt: 'Descubra palácios encantados', en: 'Discover enchanted palaces', es: 'Descubre palacios encantados' },
      imageUrl: 'https://media.timeout.com/images/105732838/1920/1080/image.webp',
    },
    {
      id: 'fallback_2',
      title: { pt: 'Porto Autêntico', en: 'Authentic Porto', es: 'Oporto Auténtico' },
      subtitle: { pt: 'Sabores e tradições do Norte', en: 'Northern flavors and traditions', es: 'Sabores y tradiciones del Norte' },
      imageUrl: 'https://images.unsplash.com/photo-1555881400-69e38bb0c85f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    }
  ];

  const defaultTourFilters = [
    { key: 'all', labels: { pt: 'Todos os Tours', en: 'All Tours', es: 'Todos los Tours' }, order: 0 },
    { key: 'cultural', labels: { pt: 'Cultural', en: 'Cultural', es: 'Cultural' }, order: 1 },
    { key: 'gastronomic', labels: { pt: 'Gastronómico', en: 'Gastronomic', es: 'Gastronómico' }, order: 2 }
  ];

  const [heroImages, setHeroImages] = useState(fallbackHeroImages);
  const [tours, setTours] = useState([]);
  const [tourFilters, setTourFilters] = useState(defaultTourFilters);
  const [selectedType, setSelectedType] = useState('all');

  // ✅ CORREÇÃO APLICADA AQUI
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    debugLog("Iniciando carregamento de TODOS os dados da página.");

    // Função para buscar os tours de forma independente
    const fetchTours = async () => {
        try {
            const tourParams = { active_only: true};
            debugLog("1. A fazer pedido de TOURS para:", `${BACKEND_URL}/api/tours`, "com parâmetros:", tourParams);
            const toursResponse = await axios.get(`${BACKEND_URL}/api/tours/`, { params: tourParams });
            
            debugLog("2. Resposta de TOURS recebida do backend:", toursResponse);

            if (toursResponse && Array.isArray(toursResponse.data)) {
                debugLog(`3. ✅ SUCESSO: Recebidos ${toursResponse.data.length} tours. A atualizar o estado.`);
                setTours(toursResponse.data);
            } else {
                debugLog("❌ ERRO: Os dados de tours recebidos não são um array!", toursResponse.data);
                setTours([]); // Garante que fica como um array vazio em caso de erro
            }
        } catch (err) {
            debugLog("❌ ERRO CRÍTICO ao buscar TOURS:", err);
            // Define um erro geral, mas não impede que o resto carregue
            setError(t('message_error'));
            setTours([]);
        }
    };

    // Função para buscar as outras configurações
    const fetchConfigs = async () => {
        try {
            debugLog("A fazer pedidos de CONFIGS (hero-images, tour-filters).");
            const [heroImagesResponse, tourFiltersResponse] = await Promise.all([
                axios.get(`${BACKEND_URL}/api/config/hero-images`),
                axios.get(`${BACKEND_URL}/api/config/tour-filters`),
            ]);

            if (Array.isArray(heroImagesResponse.data) && heroImagesResponse.data.length > 0) {
                setHeroImages(heroImagesResponse.data);
            } else {
                setHeroImages(fallbackHeroImages);
            }

            if (Array.isArray(tourFiltersResponse.data) && tourFiltersResponse.data.length > 0) {
                const hasAllFilter = tourFiltersResponse.data.some(f => f.key === 'all');
                const allFilter = { key: 'all', labels: { pt: 'Todos os Tours', en: 'All Tours', es: 'Todos los Tours' }, order: -1 };
                const finalFilters = hasAllFilter ? tourFiltersResponse.data : [allFilter, ...tourFiltersResponse.data];
                finalFilters.sort((a, b) => (a.order || 0) - (b.order || 0));
                setTourFilters(finalFilters);
            } else {
                setTourFilters(defaultTourFilters);
            }
        } catch (err) {
            debugLog("Aviso: Ocorreu um erro ao buscar as configurações. A usar valores de fallback.", err);
            // Define um erro geral, mas não impede que o resto carregue
            setError(t('message_error'));
            setHeroImages(fallbackHeroImages);
            setTourFilters(defaultTourFilters);
        }
    };
    
    // Executa as duas funções em paralelo e só para o loading no fim
    await Promise.all([fetchTours(), fetchConfigs()]);
    setLoading(false);
    debugLog("Carregamento de dados finalizado.");

  }, [t]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    debugLog(`O estado 'tours' foi atualizado. Contém agora ${tours.length} tours.`);
  }, [tours]);

  useEffect(() => {
    if (heroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [heroImages.length]);

  const getLocalizedText = (textObj) => {
    if (!textObj) return '';
    return textObj[currentLang] || textObj.en || textObj.pt || '';
  };

  const getFilterLabel = (filter) => {
    if (filter.labels && filter.labels[currentLang]) {
      return filter.labels[currentLang];
    }
    return filter.labels?.en || filter.labels?.pt || filter.key || 'Filter';
  };

  const getURL = (path) => {
    const langPrefix = currentLang === 'en' ? '' : `/${currentLang}`;
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

  const TestPaymentSection = () => {
    const testData = {
      tour: { id: 'test-homepage', name: 'Tour de Teste - HomePage' },
      firstName: 'João', lastName: 'Silva',
      email: 'joao@teste.com', phone: '+351912345678',
      date: '2025-08-15', numberOfPeople: 1,
      depositAmount: 5.0, remainingAmount: 20.0,
      specialRequests: 'Teste via HomePage'
    };

    if (!showPaymentTest) {
      return (
        <div className="max-w-2xl mx-auto text-center py-8">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-red-800 mb-3">
              🧪 Modo de Desenvolvimento
            </h3>
            <p className="text-red-700 mb-4">
              Testar novo sistema de pagamento (Cartões + MB WAY)
            </p>
            <button 
              onClick={() => setShowPaymentTest(true)}
              className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-600 transition-colors"
            >
              🧪 TESTAR PAGAMENTO PREMIUM
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-4">🧪 Teste de Pagamento Premium</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-yellow-800 mb-2">🔧 Cartões de Teste:</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• <strong>✅ Sucesso:</strong> 4242424242424242</p>
              <p>• <strong>❌ Falha:</strong> 4000000000000002</p>
              <p>• <strong>CVC:</strong> 123 | <strong>Data:</strong> 12/25</p>
              <p>• <strong>📱 MB WAY:</strong> +351912345678</p>
            </div>
          </div>
          <button 
            onClick={() => setShowPaymentTest(false)}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            ← Voltar à HomePage
          </button>
        </div>
        
        <PremiumPaymentComponent 
          bookingData={testData}
          onPaymentSuccess={(result) => {
            console.log('✅ Teste bem-sucedido:', result);
            alert('✅ TESTE BEM-SUCEDIDO!\n\n' + 
              'Método: ' + result.method + '\n' +
              'ID Transação: ' + result.transaction_id + '\n' +
              'Booking ID: ' + result.booking_id + '\n' +
              'Valor: €' + result.amount
            );
            setShowPaymentTest(false);
          }}
          onBack={() => setShowPaymentTest(false)}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-indigo-600 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">9 Rocks Tours</h2>
          <p className="text-lg text-gray-600 mb-6">{t('message_loading')}</p>
        </div>
      </div>
    );
  }

  if (error && tours.length === 0) { // Mostra erro principal apenas se os tours não carregarem
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center max-w-lg bg-white p-8 rounded-lg shadow-lg border border-red-200">
          <div className="text-5xl mb-4">😢</div>
          <h2 className="text-2xl font-bold text-red-800 mb-3">Ocorreu um Erro</h2>
          <p className="text-red-700 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            🔄 Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="9 Rocks Tours - Epic Adventures in Portugal"
        description="Discover hidden paradises with exclusive tours"
        lang={currentLang}
      />
      
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
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><rect width="1920" height="1080" fill="%23e5e7eb"/><text x="960" y="540" text-anchor="middle" fill="%236b7280" font-size="48">Image not available</text></svg>';
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

      {process.env.NODE_ENV === 'development' && (
        <div className="bg-red-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <TestPaymentSection />
          </div>
        </div>
      )}

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

      <div id="tours" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {t('home_featured_tours')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('home_featured_tours_description')}
          </p>
        </div>

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

        {debugLog("4. A renderizar a secção de tours. Número de tours filtrados:", filteredTours.length)}
        {loading ? (
          <div className="text-center py-16 text-gray-500 text-xl">{t('message_loading')}</div>
        ) : filteredTours.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-500 text-xl">
              {t('message_no_tours')}
            </div>
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
                      alt={getLocalizedText(tour.name)}
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
                    {getLocalizedText(tour.name)}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed line-clamp-2">
                    {getLocalizedText(tour.short_description)}
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
