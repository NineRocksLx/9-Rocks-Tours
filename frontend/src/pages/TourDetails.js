import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { useTranslation } from '../utils/useTranslation';
import TourItinerary from '../components/TourItinerary';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const Maps_API_KEY = process.env.REACT_APP_Maps_API_KEY;

// Componente do Mapa
const TourMap = ({ locationsStr }) => {
    const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: Maps_API_KEY });
    const locations = React.useMemo(() => {
        if (!locationsStr) return [];
        return locationsStr.split('\n').map(line => {
            const [name, lat, lng] = line.split(',').map(item => item.trim());
            return { name, lat: parseFloat(lat), lng: parseFloat(lng) };
        }).filter(loc => loc.name && !isNaN(loc.lat) && !isNaN(loc.lng));
    }, [locationsStr]);

    if (!isLoaded) return <div className="flex items-center justify-center h-full bg-gray-200 rounded-lg"><p>A carregar mapa...</p></div>;
    
    return (
        <GoogleMap 
            mapContainerClassName="w-full h-full rounded-lg" 
            center={{ lat: 47.3249, lng: 1.0703 }} 
            zoom={8} 
            options={{ streetViewControl: false, mapTypeControl: false }}
        >
            {locations.map((loc, index) => 
                <MarkerF key={index} position={{ lat: loc.lat, lng: loc.lng }} title={loc.name} />
            )}
        </GoogleMap>
    );
};

// Componente Breadcrumbs
const Breadcrumbs = ({ tourName, currentLang }) => {
    const { t } = useTranslation();
    const getUrl = (page) => `/${currentLang !== 'pt' ? currentLang : ''}/${page === 'home' ? '' : page}`;

    return (
        <nav className="bg-white py-3 px-4 border-b" aria-label="Breadcrumb">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center text-sm text-gray-600">
                    <Link to={getUrl('home')} className="hover:text-blue-600">{t('nav_home') || 'Home'}</Link>
                    <span className="mx-2">/</span>
                    <Link to={getUrl('tours')} className="hover:text-blue-600">{t('nav_tours') || 'Tours'}</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900 font-medium">{tourName}</span>
                </div>
            </div>
        </nav>
    );
};

const TourDetails = () => {
    // 1. Hooks são chamados no topo
    const { id } = useParams();
    const { t, getCurrentLanguage } = useTranslation();
    const currentLang = getCurrentLanguage();
    const [tourData, setTourData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processedItinerary, setProcessedItinerary] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // 2. Funções auxiliares dentro do componente
    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const parseItineraryFromText = (textData) => {
        if (!textData || !textData[currentLang]) return null;
        const text = textData[currentLang];
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const parsedStops = [];
        let stopCounter = 1;
        
        lines.forEach(line => {
            const timeRegex = /(\d{1,2}[:h]\d{2}|\d{1,2}h)/i;
            const timeMatch = line.match(timeRegex);
            if (timeMatch) {
                parsedStops.push({
                    stop: stopCounter++,
                    title: line.replace(timeRegex, '').replace(':', '').trim() || `Atividade às ${timeMatch[0]}`,
                    duration: timeMatch[0].replace('h', ':00'),
                    type: line.toLowerCase().includes('almoço') ? 'meal' : 'visit',
                });
            }
        });
        
        return { [currentLang]: parsedStops };
    };

    const getLocalizedText = (key) => {
        const fallbackTexts = {
            // Novos textos estilo GetYourGuide
            'tour_details.instant_confirmation': {
                pt: 'Confirmação Instantânea',
                en: 'Instant Confirmation',
                es: 'Confirmación Instantánea'
            },
            'tour_details.mobile_ticket': {
                pt: 'Bilhete Móvel',
                en: 'Mobile Ticket',
                es: 'Billete Móvil'
            },
            'tour_details.small_groups': {
                pt: 'Grupos Pequenos',
                en: 'Small Groups',
                es: 'Grupos Pequeños'
            },
            'tour_details.live_guide': {
                pt: 'Guia ao Vivo',
                en: 'Live Guide',
                es: 'Guía en Vivo'
            },
            'tour_details.what_youll_do': {
                pt: 'O que vais fazer',
                en: 'What you\'ll do',
                es: 'Lo que harás'
            },
            'tour_details.experience_highlights': {
                pt: 'Destaques da Experiência',
                en: 'Experience Highlights',
                es: 'Aspectos Destacados de la Experiencia'
            },
            // Sobre a Atividade
            'tour_details.about_activity': {
                pt: 'Sobre Esta Experiência',
                en: 'About This Experience',
                es: 'Sobre Esta Experiencia'
            },
            // Cancelamento gratuito
            'tour_details.free_cancellation_title': {
                pt: 'Cancelamento Gratuito',
                en: 'Free Cancellation',
                es: 'Cancelación Gratuita'
            },
            'tour_details.free_cancellation_description': {
                pt: 'Cancele até 24 horas antes sem custos',
                en: 'Cancel up to 24 hours in advance at no cost',
                es: 'Cancela hasta 24 horas antes sin costo'
            },
            // Destaques
            'tour_details.highlights': {
                pt: 'Pontos de Destaque',
                en: 'Highlights',
                es: 'Puntos Destacados'
            },
            // Duração do tour
            'tour_duration': {
                pt: 'Duração do Tour',
                en: 'Tour Duration',
                es: 'Duración del Tour'
            },
            // Guia profissional
            'tour_professional_guide': {
                pt: 'Guia Profissional',
                en: 'Professional Guide',
                es: 'Guía Profesional'
            },
            'tour_details.guide_languages': {
                pt: 'Português, Inglês e Espanhol',
                en: 'Portuguese, English and Spanish',
                es: 'Portugués, Inglés y Español'
            },
            // Preço e reserva
            'tour_details.from': {
                pt: 'A partir de',
                en: 'From',
                es: 'Desde'
            },
            'tour_book_now': {
                pt: 'Reservar Agora',
                en: 'Book Now',
                es: 'Reservar Ahora'
            },
            'tour_details.book_now_pay_later': {
                pt: 'Reserve agora e pague depois - Sem taxas de reserva',
                en: 'Book now and pay later - No booking fees',
                es: 'Reserva ahora y paga después - Sin tasas de reserva'
            },
            // Outros textos comuns
            'common.hours': {
                pt: 'horas',
                en: 'hours',
                es: 'horas'
            },
            'tab_itinerary': {
                pt: 'Itinerário',
                en: 'Itinerary',
                es: 'Itinerario'
            },
            'tour_includes': {
                pt: 'O que está incluído',
                en: 'What\'s included',
                es: 'Qué está incluido'
            },
            'tour_excludes': {
                pt: 'O que não está incluído',
                en: 'What\'s not included',
                es: 'Qué no está incluido'
            },
            'itinerary_tour_region': {
                pt: 'Região do Tour',
                en: 'Tour Region',
                es: 'Región del Tour'
            },
            'tour_view_details': {
                pt: 'Ver Detalhes',
                en: 'View Details',
                es: 'Ver Detalles'
            },
            'message_loading': {
                pt: 'A carregar...',
                en: 'Loading...',
                es: 'Cargando...'
            },
            'message.error': {
                pt: 'Erro ao carregar os dados',
                en: 'Error loading data',
                es: 'Error al cargar datos'
            },
            'message.no_tours': {
                pt: 'Tour não encontrado',
                en: 'Tour not found',
                es: 'Tour no encontrado'
            }
        };

        // Tenta buscar a tradução do sistema primeiro
        const systemTranslation = t(key);
        
        // Se a tradução do sistema retornar a própria chave (não encontrou tradução)
        if (systemTranslation === key || systemTranslation.startsWith('**')) {
            // Usa o fallback
            const fallback = fallbackTexts[key];
            if (fallback && fallback[currentLang]) {
                return fallback[currentLang];
            }
            // Se não tem fallback para o idioma atual, tenta português
            if (fallback && fallback.pt) {
                return fallback.pt;
            }
        }
        
        return systemTranslation;
    };

    // 3. useEffect para buscar os dados
    useEffect(() => {
        const fetchTourData = async () => {
            if (!id) { 
                setError(getLocalizedText('message.error')); 
                setLoading(false); 
                return; 
            }
            
            setLoading(true);
            try {
                const response = await axios.get(`${BACKEND_URL}/api/tours/${id}`);
                if (!response.data) { 
                    throw new Error(getLocalizedText('message.no_tours')); 
                }
                
                console.log('🔍 DEBUG - Tour Data completa:', response.data);
                console.log('🔍 DEBUG - Highlights recebidos:', response.data.highlights);
                setTourData(response.data);
                
                // Converte o `route_description` para o formato que o TourItinerary precisa
                if (response.data.route_description) {
                    setProcessedItinerary(parseItineraryFromText(response.data.route_description));
                }
            } catch (err) {
                setError(err.message || getLocalizedText('message.error'));
            } finally {
                setLoading(false);
            }
        };
        
        fetchTourData();
    }, [id, currentLang]);

    // Re-processar itinerário quando o idioma muda
    useEffect(() => {
        if (tourData && tourData.route_description) {
            setProcessedItinerary(parseItineraryFromText(tourData.route_description));
        }
    }, [currentLang, tourData]);

    if (loading) { 
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">{getLocalizedText('message_loading')}</p>
                </div>
            </div>
        ); 
    }
    
    if (error) { 
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-xl mb-4">{error}</div>
                    <button 
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        ); 
    }
    
    if (!tourData) { 
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-gray-600 text-xl">{getLocalizedText('message.no_tours')}</div>
                </div>
            </div>
        ); 
    }

    // Extração de dados com DEBUG
    const tourName = tourData.name[currentLang] || tourData.name.pt;
    const shortDescription = tourData.short_description[currentLang] || tourData.short_description.pt;
    const fullDescription = tourData.description[currentLang] || tourData.description.pt;
    
    // DEBUG para highlights
    console.log('🔍 DEBUG - tourData.highlights:', tourData.highlights);
    console.log('🔍 DEBUG - currentLang:', currentLang);
    console.log('🔍 DEBUG - tourData.highlights[currentLang]:', tourData.highlights?.[currentLang]);
    
    const highlights = tourData.highlights?.[currentLang]?.split('\n').filter(item => item.trim() !== '') || 
                      tourData.highlights?.pt?.split('\n').filter(item => item.trim() !== '') || 
                      [];
    
    console.log('🔍 DEBUG - highlights processados:', highlights);
    
    const includesText = tourData.includes?.[currentLang]?.split('\n').filter(item => item.trim() !== '') || [];
    const excludesText = tourData.excludes?.[currentLang]?.split('\n').filter(item => item.trim() !== '') || [];
    const bookingUrl = `/${currentLang !== 'pt' ? currentLang + '/' : ''}reservar?tour=${id}`;
    const mainImage = tourData.images?.[0];
    const galleryImages = tourData.images?.slice(1) || [];

    return (
        <>
            <Helmet>
                <title>{`${tourName} - 9 Rocks Tours`}</title>
                <meta name="description" content={shortDescription} />
                <meta property="og:title" content={`${tourName} - 9 Rocks Tours`} />
                <meta property="og:description" content={shortDescription} />
                <meta property="og:image" content={mainImage} />
            </Helmet>
            
            <div className="bg-white">
                <Breadcrumbs tourName={tourName} currentLang={currentLang} />
                
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                    {/* Header Section - Estilo GetYourGuide */}
                    <section className="mb-8">
                        <div className="mb-4">
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                                {tourName}
                            </h1>
                            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                                {shortDescription}
                            </p>
                        </div>

                        {/* Quick Info Pills - Estilo GetYourGuide */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            <div className="flex items-center bg-green-50 text-green-700 px-3 py-2 rounded-full text-sm font-medium">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {getLocalizedText('tour_details.instant_confirmation')}
                            </div>
                            <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-2 rounded-full text-sm font-medium">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                </svg>
                                {getLocalizedText('tour_details.mobile_ticket')}
                            </div>
                            <div className="flex items-center bg-purple-50 text-purple-700 px-3 py-2 rounded-full text-sm font-medium">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                                </svg>
                                {getLocalizedText('tour_details.small_groups')}
                            </div>
                            <div className="flex items-center bg-orange-50 text-orange-700 px-3 py-2 rounded-full text-sm font-medium">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                {getLocalizedText('tour_details.live_guide')}
                            </div>
                        </div>

                        {/* Galeria de Imagens - Layout melhorado */}
                        {tourData.images && tourData.images.length > 0 && (
                            <div className="relative">
                                {galleryImages.length > 0 ? (
                                    <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] md:h-[500px] rounded-xl overflow-hidden">
                                        {/* Imagem principal - ocupa 2x2 */}
                                        <div className="col-span-2 row-span-2">
                                            <img 
                                                src={mainImage} 
                                                alt={`Imagem principal de ${tourName}`} 
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                                            />
                                        </div>
                                        {/* Imagens secundárias */}
                                        {galleryImages.slice(0, 4).map((image, index) => (
                                            <div key={index} className="col-span-1 row-span-1">
                                                <img 
                                                    src={image} 
                                                    alt={`Imagem de ${tourName} ${index + 2}`} 
                                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-[400px] md:h-[500px] rounded-xl overflow-hidden">
                                        <img 
                                            src={mainImage} 
                                            alt={`Imagem de ${tourName}`} 
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                                        />
                                    </div>
                                )}
                                
                                {/* Overlay com número de fotos */}
                                {galleryImages.length > 4 && (
                                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                        +{galleryImages.length - 4} fotos
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2">
                            {/* Quick Info Cards - Estilo GetYourGuide */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-gray-50 p-6 rounded-xl text-center">
                                    <div className="text-3xl mb-2">🚫</div>
                                    <h4 className="font-semibold text-gray-900 mb-1">
                                        {getLocalizedText('tour_details.free_cancellation_title')}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        {getLocalizedText('tour_details.free_cancellation_description')}
                                    </p>
                                </div>
                                
                                <div className="bg-gray-50 p-6 rounded-xl text-center">
                                    <div className="text-3xl mb-2">⏱️</div>
                                    <h4 className="font-semibold text-gray-900 mb-1">
                                        {getLocalizedText('tour_duration')}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        {tourData.duration_hours} {getLocalizedText('common.hours')}
                                    </p>
                                </div>
                                
                                <div className="bg-gray-50 p-6 rounded-xl text-center">
                                    <div className="text-3xl mb-2">🎤</div>
                                    <h4 className="font-semibold text-gray-900 mb-1">
                                        {getLocalizedText('tour_professional_guide')}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        {getLocalizedText('tour_details.guide_languages')}
                                    </p>
                                </div>
                            </div>

                            {/* Navegação por Tabs */}
                            <div className="border-b border-gray-200 mb-8">
                                <nav className="flex space-x-8">
                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'overview'
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        Visão Geral
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('itinerary')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'itinerary'
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {getLocalizedText('tab_itinerary')}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('included')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'included'
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        Incluído
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('map')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'map'
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        Mapa
                                    </button>
                                </nav>
                            </div>

                            {/* Conteúdo dos Tabs */}
                            <div className="tab-content">
                                {activeTab === 'overview' && (
                                    <div className="space-y-8">
                                        {/* Descrição completa */}
                                        {fullDescription && (
                                            <section>
                                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                                    {getLocalizedText('tour_details.what_youll_do')}
                                                </h2>
                                                <div className="prose prose-lg text-gray-700">
                                                    {fullDescription.split('\n').map((paragraph, index) => (
                                                        <p key={index} className="mb-4 leading-relaxed">
                                                            {paragraph}
                                                        </p>
                                                    ))}
                                                </div>
                                            </section>
                                        )}

                                        {/* Highlights - Seção melhorada */}
                                        {highlights.length > 0 && (
                                            <section>
                                                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                                    {getLocalizedText('tour_details.experience_highlights')}
                                                </h2>
                                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {highlights.map((item, index) => (
                                                            <div key={index} className="flex items-start">
                                                                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                                                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                                <span className="text-gray-800 font-medium leading-relaxed">
                                                                    {item}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </section>
                                        )}

                                        {/* Debug info se não há highlights */}
                                        {highlights.length === 0 && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                <p className="text-yellow-800 font-medium">
                                                    ⚠️ DEBUG: Nenhum highlight encontrado
                                                </p>
                                                <details className="mt-2">
                                                    <summary className="cursor-pointer text-sm text-yellow-700">
                                                        Ver dados de debug
                                                    </summary>
                                                    <pre className="mt-2 text-xs bg-yellow-100 p-2 rounded">
                                                        {JSON.stringify({
                                                            highlightsRaw: tourData.highlights,
                                                            currentLang: currentLang,
                                                            highlightsForLang: tourData.highlights?.[currentLang],
                                                            highlightsProcessed: highlights
                                                        }, null, 2)}
                                                    </pre>
                                                </details>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'itinerary' && (
                                    <section>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                            {getLocalizedText('tab_itinerary')}
                                        </h2>
                                        <TourItinerary itinerary={processedItinerary} currentLanguage={currentLang} />
                                    </section>
                                )}

                                {activeTab === 'included' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <section>
                                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                                <span className="text-green-600 mr-2">✓</span>
                                                {getLocalizedText('tour_includes')}
                                            </h3>
                                            <div className="space-y-3">
                                                {includesText.map((item, index) => (
                                                    <div key={index} className="flex items-start">
                                                        <span className="text-green-500 mr-3 mt-1 flex-shrink-0">✓</span>
                                                        <span className="text-gray-700">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                        
                                        <section>
                                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                                <span className="text-red-600 mr-2">✗</span>
                                                {getLocalizedText('tour_excludes')}
                                            </h3>
                                            <div className="space-y-3">
                                                {excludesText.map((item, index) => (
                                                    <div key={index} className="flex items-start">
                                                        <span className="text-red-500 mr-3 mt-1 flex-shrink-0">✗</span>
                                                        <span className="text-gray-700">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {activeTab === 'map' && (
                                    <section className="h-96">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                            {getLocalizedText('itinerary_tour_region')}
                                        </h2>
                                        <TourMap locationsStr={tourData.map_locations} />
                                    </section>
                                )}
                            </div>
                        </div>
                        
                        {/* Sidebar de Reserva - Melhorada */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-8">
                                <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100">
                                    {/* Preço */}
                                    <div className="text-center mb-6">
                                        <p className="text-gray-600 text-sm mb-1">
                                            {getLocalizedText('tour_details.from')}
                                        </p>
                                        <div className="text-4xl font-bold text-gray-900 mb-2">
                                            {formatPrice(tourData.price)}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            por pessoa
                                        </p>
                                    </div>

                                    {/* Botão de Reserva */}
                                    <Link 
                                        to={bookingUrl} 
                                        className="w-full block text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                    >
                                        {getLocalizedText('tour_book_now')}
                                    </Link>
                                    
                                    <p className="text-sm text-center mt-4 text-gray-600">
                                        {getLocalizedText('tour_details.book_now_pay_later')}
                                    </p>

                                    {/* Informações adicionais */}
                                    <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <svg className="w-5 h-5 mr-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Confirmação instantânea
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <svg className="w-5 h-5 mr-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                            </svg>
                                            Bilhete móvel aceite
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <svg className="w-5 h-5 mr-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                                            </svg>
                                            Máx. {tourData.max_participants} pessoas
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};

export default TourDetails;