import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

// ✅ CONFIGURAÇÃO ROBUSTA COM FALLBACKS SEGUROS
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL || 'https://ninerocks-backend-742946187892.europe-west1.run.app';

// ✅ IMPORTAÇÕES CONDICIONAIS MELHORADAS
let Helmet, GoogleMap, useJsApiLoader, MarkerF, useTranslation, TourItinerary;

try {
  // Helmet com múltiplos fallbacks
  try {
    const helmetAsync = require('react-helmet-async');
    Helmet = helmetAsync.Helmet;
  } catch {
    try {
      const helmetRegular = require('react-helmet');
      Helmet = helmetRegular.Helmet || helmetRegular.default;
    } catch {
      Helmet = ({ children, ...props }) => children || null;
    }
  }

  // Google Maps com fallback completo
  try {
    const googleMapsModule = require('@react-google-maps/api');
    GoogleMap = googleMapsModule.GoogleMap;
    useJsApiLoader = googleMapsModule.useJsApiLoader;
    MarkerF = googleMapsModule.MarkerF || googleMapsModule.Marker;
  } catch {
    GoogleMap = null;
    useJsApiLoader = null;
    MarkerF = null;
  }

  // Tradução com fallback funcional
  try {
    const translationModule = require('../utils/useTranslation');
    useTranslation = translationModule.useTranslation || translationModule.default;
  } catch {
    useTranslation = () => ({
      t: (key) => {
        const translations = {
          'tour_book_now': 'Reservar Agora',
          'message_loading': 'A carregar...',
          'message.error': 'Erro ao carregar',
          'try_again': 'Tentar Novamente',
          'tour_overview': 'Visão Geral',
          'tour_itinerary': 'Itinerário',
          'tour_includes': 'Incluído',
          'tour_location': 'Localização',
          'tour_highlights': 'Destaques',
          'tour_duration': 'Duração',
          'tour_price': 'Preço',
          'per_person': 'por pessoa'
        };
        return translations[key] || key;
      },
      getCurrentLanguage: () => 'pt'
    });
  }

  // TourItinerary com fallback
  try {
    const itineraryModule = require('../components/TourItinerary');
    TourItinerary = itineraryModule.default || itineraryModule.TourItinerary;
  } catch {
    TourItinerary = ({ itineraryData, currentLang }) => (
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-800">📋 Itinerário</h4>
        <p className="text-gray-600">Itinerário detalhado disponível durante a reserva.</p>
      </div>
    );
  }

} catch (error) {
  console.warn('❌ Algumas dependências falharam ao carregar:', error);
  
  // Fallbacks completos se tudo falhar
  Helmet = ({ children }) => children || null;
  GoogleMap = null;
  useJsApiLoader = null;
  MarkerF = null;
  useTranslation = () => ({
    t: (key) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    getCurrentLanguage: () => 'pt'
  });
  TourItinerary = () => <div className="text-gray-600">Itinerário não disponível</div>;
}

// ✅ COMPONENTE MAPA MELHORADO
const TourMap = ({ locationsStr }) => {
  const Maps_API_KEY = process.env.REACT_APP_Maps_API_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

  // Parse das localizações
  const locations = React.useMemo(() => {
    if (!locationsStr || typeof locationsStr !== 'string') return [];
    
    try {
      return locationsStr.split('\n')
        .filter(line => line.trim() !== '')
        .map((line, index) => {
          const parts = line.split(',').map(item => item.trim());
          if (parts.length >= 3) {
            const [name, lat, lng] = parts;
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);
            
            if (!isNaN(latitude) && !isNaN(longitude)) {
              return { 
                id: `loc-${index}`, 
                name, 
                lat: latitude, 
                lng: longitude 
              };
            }
          }
          return null;
        }).filter(loc => loc !== null);
    } catch {
      return [];
    }
  }, [locationsStr]);

  // Fallback se não há Google Maps ou API Key
  if (!Maps_API_KEY || !useJsApiLoader || !GoogleMap) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 h-96">
        <h4 className="font-semibold mb-4">🗺️ Localizações do Tour</h4>
        {locations.length > 0 ? (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {locations.map((location, index) => (
              <div key={location.id} className="flex items-center p-3 bg-white rounded border">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium">{location.name}</p>
                  <p className="text-sm text-gray-500">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📍</div>
              <p>Configure REACT_APP_Maps_API_KEY para ver o mapa</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Componente Google Maps funcional
  const GoogleMapComponent = () => {
    const { isLoaded, loadError } = useJsApiLoader({
      id: 'google-map-script',
      googleMapsApiKey: Maps_API_KEY,
      libraries: ['places']
    });

    if (loadError) {
      return (
        <div className="flex items-center justify-center h-full bg-red-50 rounded-lg p-8">
          <div className="text-center text-red-600">
            <p>❌ Erro ao carregar Google Maps</p>
            <p className="text-sm mt-2">Verifique a API Key</p>
          </div>
        </div>
      );
    }

    if (!isLoaded) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-200 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">A carregar mapa...</p>
          </div>
        </div>
      );
    }

    // Calcular centro e zoom baseado nas localizações
    const center = locations.length > 0 
      ? {
          lat: locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length,
          lng: locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length
        }
      : { lat: 39.5, lng: -8.0 };

    return (
      <GoogleMap
        mapContainerClassName="w-full h-full rounded-lg"
        center={center}
        zoom={locations.length > 1 ? 10 : 12}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true
        }}
      >
        {locations.map((location, index) => (
          MarkerF ? (
            <MarkerF
              key={location.id}
              position={{ lat: location.lat, lng: location.lng }}
              title={location.name}
              label={{
                text: (index + 1).toString(),
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          ) : null
        ))}
      </GoogleMap>
    );
  };

  return (
    <div className="h-96 rounded-lg overflow-hidden">
      <GoogleMapComponent />
    </div>
  );
};

// ✅ COMPONENTE ITINERÁRIO MELHORADO
const TourItineraryComponent = ({ itineraryData, currentLang = 'pt' }) => {
  if (!itineraryData) {
    return <p className="text-gray-600">Itinerário não disponível</p>;
  }

  let stops = [];
  
  // Parse inteligente do itinerário
  if (typeof itineraryData === 'object' && itineraryData[currentLang]) {
    stops = itineraryData[currentLang];
  } else if (typeof itineraryData === 'string') {
    stops = itineraryData.split('\n')
      .filter(line => line.trim() !== '')
      .map(line => ({
        title: line.trim(),
        duration: '30-60 min',
        type: 'visit'
      }));
  } else if (Array.isArray(itineraryData)) {
    stops = itineraryData;
  }

  if (stops.length === 0) {
    return <p className="text-gray-600">Detalhes do itinerário serão fornecidos durante a reserva</p>;
  }

  return (
    <div className="space-y-4">
      {stops.map((stop, index) => (
        <div key={index} className="flex items-start border-l-4 border-blue-500 pl-4 py-2">
          <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1 flex-shrink-0">
            {index + 1}
          </div>
          <div className="flex-grow">
            <h4 className="font-medium text-gray-800 mb-1">
              {typeof stop === 'string' ? stop : stop.title || stop.name}
            </h4>
            {stop.duration && (
              <p className="text-sm text-gray-500 mb-1">⏱️ {stop.duration}</p>
            )}
            {stop.description && (
              <p className="text-sm text-gray-600">{stop.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ✅ COMPONENTE PRINCIPAL COMPLETO
const TourDetails = () => {
  const { id } = useParams();
  const { t, getCurrentLanguage } = useTranslation();
  
  const [currentLang, setCurrentLang] = useState('pt');
  const [tourData, setTourData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // ✅ CONFIGURAÇÃO DE IDIOMA
  useEffect(() => {
    try {
      const lang = getCurrentLanguage();
      setCurrentLang(lang || 'pt');
    } catch (error) {
      console.error('Error getting language:', error);
      setCurrentLang('pt');
    }
  }, [getCurrentLanguage]);

  // ✅ FUNÇÃO DE TRADUÇÃO SEGURA
  const getLocalizedText = (key) => {
    try {
      return t(key);
    } catch (error) {
      console.error(`Translation error for key "${key}":`, error);
      const fallbacks = {
        'tour_book_now': 'Reservar Agora',
        'message_loading': 'A carregar...',
        'message.error': 'Erro ao carregar',
        'try_again': 'Tentar Novamente',
        'tour_overview': 'Visão Geral',
        'tour_itinerary': 'Itinerário',
        'tour_includes': 'Incluído',
        'tour_location': 'Localização',
        'tour_highlights': 'Destaques'
      };
      return fallbacks[key] || key.replace(/_/g, ' ');
    }
  };

  // ✅ FUNÇÕES UTILITÁRIAS
  const getLocalizedContent = (content, fallback = '') => {
    if (!content) return fallback;
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
      return content[currentLang] || content.pt || content.en || content.es || fallback;
    }
    return fallback;
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Preço sob consulta';
    return `€${parseFloat(price).toFixed(0)}`;
  };

  const parseListFromText = (text) => {
    if (!text) return [];
    if (typeof text === 'string') {
      return text.split('\n').filter(item => item.trim() !== '');
    }
    if (Array.isArray(text)) return text;
    return [];
  };

  // ✅ CARREGAMENTO DE DADOS DO TOUR
  useEffect(() => {
    const fetchTourData = async () => {
      if (!id) {
        setError('ID do tour em falta');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log(`🔍 Buscando tour: ${BACKEND_URL}/api/tours/${id}`);
        const response = await axios.get(`${BACKEND_URL}/api/tours/${id}`, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Resposta do tour:', response.data);
        
        if (!response.data) {
          throw new Error('Tour não encontrado');
        }
        
        setTourData(response.data);
      } catch (err) {
        console.error('❌ Erro ao buscar tour:', err);
        if (err.code === 'ECONNABORTED') {
          setError('Timeout: Servidor demorou muito a responder');
        } else if (err.response?.status === 404) {
          setError('Tour não encontrado');
        } else if (err.response?.status === 500) {
          setError('Erro no servidor');
        } else if (!navigator.onLine) {
          setError('Sem conexão à internet');
        } else {
          setError(err.response?.data?.detail || err.message || 'Erro ao carregar tour');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchTourData();
  }, [id]);

  // ✅ LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">{getLocalizedText('message_loading')}</p>
          <p className="text-sm text-gray-500 mt-2">A conectar ao servidor...</p>
        </div>
      </div>
    );
  }
  
  // ✅ ERROR STATE
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-xl mb-4">❌ {error}</div>
          <div className="space-y-4">
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 w-full transition-colors"
            >
              {getLocalizedText('try_again')}
            </button>
            <Link 
              to="/tours"
              className="block bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Voltar aos Tours
            </Link>
            <div className="text-xs text-gray-500 mt-4">
              <p>Backend: {BACKEND_URL}</p>
              <p>Tour ID: {id}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // ✅ NO DATA STATE
  if (!tourData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">Tour não encontrado</div>
          <Link 
            to="/tours"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver Todos os Tours
          </Link>
        </div>
      </div>
    );
  }

  // ✅ EXTRAÇÃO DE DADOS COM FALLBACKS ROBUSTOS
  const tourName = getLocalizedContent(tourData.name, 'Tour sem nome');
  const shortDescription = getLocalizedContent(tourData.short_description, 'Descrição não disponível');
  const fullDescription = getLocalizedContent(tourData.description, '');
  const highlights = parseListFromText(getLocalizedContent(tourData.highlights));
  const includesText = parseListFromText(getLocalizedContent(tourData.includes));
  const excludesText = parseListFromText(getLocalizedContent(tourData.excludes));
  const price = tourData.price || 0;
  const duration = tourData.duration_hours || tourData.duration || 1;
  const mainImage = tourData.images?.[0] || tourData.image;
  const allImages = tourData.images || (mainImage ? [mainImage] : []);

  return (
    <div className="bg-white min-h-screen">
      {/* ✅ SEO com Helmet */}
      {Helmet && (
        <Helmet>
          <title>{tourName} - 9 Rocks Tours</title>
          <meta name="description" content={shortDescription} />
          <meta property="og:title" content={tourName} />
          <meta property="og:description" content={shortDescription} />
          {mainImage && <meta property="og:image" content={mainImage} />}
          <meta property="og:type" content="website" />
        </Helmet>
      )}

      {/* ✅ Breadcrumbs */}
      <nav className="bg-white py-3 px-4 border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center text-sm text-gray-600">
            <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/tours" className="hover:text-blue-600 transition-colors">Tours</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{tourName}</span>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* ✅ CONTEÚDO PRINCIPAL */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {tourName}
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                {shortDescription}
              </p>
              
              {/* Badges informativos */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  <span className="mr-1">⏱️</span>
                  {duration}h
                </div>
                <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  <span className="mr-1">💰</span>
                  {formatPrice(price)}
                </div>
                {tourData.difficulty && (
                  <div className="flex items-center bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                    <span className="mr-1">📊</span>
                    {tourData.difficulty}
                  </div>
                )}
              </div>
            </div>

            {/* ✅ GALERIA DE IMAGENS */}
            {allImages.length > 0 && (
              <div className="space-y-4">
                {/* Imagem principal */}
                <div className="relative h-64 md:h-96 rounded-xl overflow-hidden">
                  <img 
                    src={mainImage} 
                    alt={tourName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                
                {/* Galeria adicional */}
                {allImages.length > 1 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {allImages.slice(1, 5).map((image, index) => (
                      <div key={index} className="relative h-24 rounded-lg overflow-hidden">
                        <img 
                          src={image} 
                          alt={`${tourName} ${index + 2}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ✅ TABS DE NAVEGAÇÃO */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', label: getLocalizedText('tour_overview'), icon: '📋' },
                  { id: 'itinerary', label: getLocalizedText('tour_itinerary'), icon: '🗺️' },
                  { id: 'includes', label: getLocalizedText('tour_includes'), icon: '✅' },
                  { id: 'location', label: getLocalizedText('tour_location'), icon: '📍' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* ✅ CONTEÚDO DOS TABS */}
            <div className="bg-white rounded-lg p-6 border">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Descrição completa */}
                  {fullDescription && (
                    <div>
                      <h3 className="text-xl font-semibold mb-4">📖 Sobre este Tour</h3>
                      <div className="prose max-w-none text-gray-700 leading-relaxed">
                        {fullDescription.split('\n').map((paragraph, index) => (
                          paragraph.trim() && (
                            <p key={index} className="mb-4">{paragraph}</p>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Destaques */}
                  {highlights.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-4">🌟 {getLocalizedText('tour_highlights')}</h3>
                      <ul className="space-y-3">
                        {highlights.map((highlight, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-500 mr-3 mt-1">✓</span>
                            <span className="text-gray-700">{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'itinerary' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">📋 Itinerário Detalhado</h3>
                  <TourItineraryComponent 
                    itineraryData={tourData.itinerary} 
                    currentLang={currentLang} 
                  />
                </div>
              )}

              {activeTab === 'includes' && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Incluído */}
                  <div>
                    <h4 className="font-semibold text-green-600 mb-4 text-lg">✅ Incluído no Tour</h4>
                    {includesText.length > 0 ? (
                      <ul className="space-y-3">
                        {includesText.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-500 mr-3 mt-1">✓</span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">Informações detalhadas fornecidas durante a reserva</p>
                    )}
                  </div>

                  {/* Não incluído */}
                  <div>
                    <h4 className="font-semibold text-red-600 mb-4 text-lg">❌ Não Incluído</h4>
                    {excludesText.length > 0 ? (
                      <ul className="space-y-3">
                        {excludesText.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-red-500 mr-3 mt-1">✗</span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">Consulte-nos para mais detalhes</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'location' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">📍 Localização e Mapa</h3>
                  <TourMap locationsStr={tourData.map_locations || tourData.locations} />
                  
                  {/* Informações adicionais de localização */}
                  {tourData.meeting_point && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">📍 Ponto de Encontro</h4>
                      <p className="text-blue-700">{getLocalizedContent(tourData.meeting_point)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ✅ SIDEBAR DE RESERVA MELHORADA */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white p-6 rounded-xl shadow-xl border">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {formatPrice(price)}
                  </div>
                  <p className="text-gray-600 text-sm">
                    {duration}h • {getLocalizedText('per_person')}
                  </p>
                </div>

                {/* Informações rápidas */}
                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duração:</span>
                    <span className="font-medium">{duration} horas</span>
                  </div>
                  {tourData.group_size && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Grupo:</span>
                      <span className="font-medium">{tourData.group_size}</span>
                    </div>
                  )}
                  {tourData.language && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Idiomas:</span>
                      <span className="font-medium">{getLocalizedContent(tourData.language)}</span>
                    </div>
                  )}
                </div>

                <Link 
                  to={`/reservar/${id}`}
                  className="w-full block text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105"
                >
                  {getLocalizedText('tour_book_now')}
                </Link>
                
                <p className="text-sm text-center mt-4 text-gray-600">
                  🔒 Reserva segura • Cancela até 24h antes
                </p>

                {/* Contactos de suporte */}
                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-500 mb-2">Precisa de ajuda?</p>
                  <div className="space-y-1 text-sm">
                    <a href="tel:+351910000000" className="block text-blue-600 hover:text-blue-700">
                      📞 +351 910 000 000
                    </a>
                    <a href="mailto:info@9rocks.pt" className="block text-blue-600 hover:text-blue-700">
                      ✉️ info@9rocks.pt
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TourDetails;