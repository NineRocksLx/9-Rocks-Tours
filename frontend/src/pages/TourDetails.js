import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { useTranslation } from '../utils/useTranslation';
import TourItinerary from '../components/TourItinerary';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { BACKEND_URL } from '../config/appConfig';

const Maps_API_KEY = process.env.REACT_APP_Maps_API_KEY;

const TourMap = ({ locationsStr }) => {
    const { isLoaded } = useJsApiLoader({ 
        id: 'google-map-script', 
        googleMapsApiKey: Maps_API_KEY,
        libraries: ['places']
    });
    
    const locations = React.useMemo(() => {
        if (!locationsStr || typeof locationsStr !== 'string') {
            return [];
        }
        
        const lines = locationsStr.split('\n').filter(line => line.trim() !== '');
        
        const parsedLocations = lines.map((line, index) => {
            const parts = line.split(',').map(item => item.trim());
            
            if (parts.length >= 3) {
                const [name, lat, lng] = parts;
                const latitude = parseFloat(lat);
                const longitude = parseFloat(lng);
                
                if (name && !isNaN(latitude) && !isNaN(longitude)) {
                    const PORTUGAL_BOUNDS = {
                        north: 42.154,
                        south: 36.838,
                        east: -6.189,
                        west: -9.526
                    };
                    
                    if (latitude >= PORTUGAL_BOUNDS.south && latitude <= PORTUGAL_BOUNDS.north &&
                        longitude >= PORTUGAL_BOUNDS.west && longitude <= PORTUGAL_BOUNDS.east) {
                        
                        return { 
                            name: name, 
                            lat: latitude, 
                            lng: longitude,
                            id: `tour-loc-${index}`
                        };
                    }
                }
            }
            return null;
        }).filter(loc => loc !== null);
        
        return parsedLocations;
    }, [locationsStr]);

    const getMapCenter = () => {
        if (locations.length > 0) {
            const avgLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
            const avgLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;
            return { lat: avgLat, lng: avgLng };
        }
        return { lat: 39.5, lng: -8.0 };
    };

    const getMapZoom = () => {
        if (locations.length === 0) return 7;
        if (locations.length === 1) return 12;
        
        const lats = locations.map(loc => loc.lat);
        const lngs = locations.map(loc => loc.lng);
        const latRange = Math.max(...lats) - Math.min(...lats);
        const lngRange = Math.max(...lngs) - Math.min(...lngs);
        const maxRange = Math.max(latRange, lngRange);
        
        if (maxRange > 2) return 6;
        if (maxRange > 1) return 7;
        if (maxRange > 0.5) return 8;
        return 10;
    };

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
    
    const mapCenter = getMapCenter();
    const mapZoom = getMapZoom();
    
    return (
        <GoogleMap 
            mapContainerClassName="w-full h-full rounded-lg" 
            center={mapCenter}
            zoom={mapZoom}
            options={{ 
                streetViewControl: false, 
                mapTypeControl: false,
                language: 'pt-PT',
                region: 'PT'
            }}
        >
            {locations.map((loc, index) => (
                <MarkerF 
                    key={loc.id || index} 
                    position={{ lat: loc.lat, lng: loc.lng }} 
                    title={loc.name}
                    label={{
                        text: (index + 1).toString(),
                        color: 'white',
                        fontWeight: 'bold'
                    }}
                />
            ))}
        </GoogleMap>
    );
};

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
    const { id } = useParams();
    const { t, getCurrentLanguage } = useTranslation();
    
    const [currentLang, setCurrentLang] = useState('pt');
    const [tourData, setTourData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processedItinerary, setProcessedItinerary] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        try {
            const lang = getCurrentLanguage();
            setCurrentLang(lang || 'pt');
        } catch (error) {
            console.error('Error getting language:', error);
            setCurrentLang('pt');
        }
    }, [getCurrentLanguage]);

    const getLocalizedText = (key) => {
        try {
            const translatedText = t(key);
            if (translatedText === key) {
                const fallbacks = {
                    'tour_book_now': { pt: 'Reservar Agora', en: 'Book Now', es: 'Reservar Ahora' },
                    'tour_details.from': { pt: 'Preço total', en: 'Total price', es: 'Precio total' },
                    'message_loading': { pt: 'A carregar...', en: 'Loading...', es: 'Cargando...' },
                    'message.error': { pt: 'Erro ao carregar', en: 'Error loading', es: 'Error al cargar' },
                    'try_again': { pt: 'Tentar Novamente', en: 'Try Again', es: 'Intentar de Nuevo' },
                };
                
                const fallback = fallbacks[key];
                if (fallback) {
                    return fallback[currentLang] || fallback.pt || key;
                }
            }
            return translatedText;
        } catch (error) {
            console.error(`Translation error for key "${key}":`, error);
            return key;
        }
    };

    const formatPrice = (price) => {
        try {
            return new Intl.NumberFormat('pt-PT', {
                style: 'currency',
                currency: 'EUR'
            }).format(price);
        } catch (error) {
            console.error('Error formatting price:', error);
            return `€${price}`;
        }
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

    useEffect(() => {
        const fetchTourData = async () => {
            if (!id) { 
                setError(getLocalizedText('message.error')); 
                setLoading(false); 
                return; 
            }
            
            setLoading(true);
            setError(null);
            
            try {
                const response = await axios.get(`${BACKEND_URL}/api/tours/${id}`);
                
                if (!response.data) { 
                    throw new Error(getLocalizedText('message.no_tours')); 
                }
                
                setTourData(response.data);
                
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

    useEffect(() => {
        if (tourData && tourData.route_description) {
            setProcessedItinerary(parseItineraryFromText(tourData.route_description));
        }
    }, [currentLang, tourData]);

    const bookingUrl = React.useMemo(() => {
        try {
            if (!id) return '#';
            
            const langPrefix = currentLang !== 'pt' ? `${currentLang}/` : '';
            const url = `/${langPrefix}reservar?tour=${id}`;
            
            return url;
        } catch (error) {
            console.error('Error generating booking URL:', error);
            return '#';
        }
    }, [currentLang, id]);

    const BookingButton = () => {
        const handleClick = (e) => {
            if (bookingUrl === '#') {
                e.preventDefault();
                alert('Erro ao gerar URL de reserva. Tente novamente.');
                return;
            }
        };

        return (
            <Link 
                to={bookingUrl}
                onClick={handleClick}
                className="w-full block text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
                {getLocalizedText('tour_book_now')}
            </Link>
        );
    };

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
                        {getLocalizedText('try_again')}
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

    const tourName = tourData.name[currentLang] || tourData.name.pt;
    const shortDescription = tourData.short_description[currentLang] || tourData.short_description.pt;
    const fullDescription = tourData.description[currentLang] || tourData.description.pt;
    
    const highlights = tourData.highlights?.[currentLang]?.split('\n').filter(item => item.trim() !== '') || 
                      tourData.highlights?.pt?.split('\n').filter(item => item.trim() !== '') || 
                      [];
    
    const includesText = tourData.includes?.[currentLang]?.split('\n').filter(item => item.trim() !== '') || [];
    const excludesText = tourData.excludes?.[currentLang]?.split('\n').filter(item => item.trim() !== '') || [];

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
                    <section className="mb-8">
                        <div className="mb-4">
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                                {tourName}
                            </h1>
                            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                                {shortDescription}
                            </p>
                        </div>

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

                        {tourData.images && tourData.images.length > 0 && (
                            <div className="relative">
                                {galleryImages.length > 0 ? (
                                    <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] md:h-[500px] rounded-xl overflow-hidden">
                                        <div className="col-span-2 row-span-2">
                                            <img 
                                                src={mainImage} 
                                                alt={`Imagem principal de ${tourName}`} 
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                                            />
                                        </div>
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
                                
                                {galleryImages.length > 4 && (
                                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                        +{galleryImages.length - 4} {getLocalizedText('total_photos')}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2">
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
                                        {getLocalizedText('tab_overview')}
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
                                        {getLocalizedText('tab_included')}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('map')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'map'
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {getLocalizedText('tab_map')}
                                    </button>
                                </nav>
                            </div>

                            <div className="tab-content">
                                {activeTab === 'overview' && (
                                    <div className="space-y-8">
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
                                        
                                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden h-80">
                                            <TourMap 
                                                locationsStr={tourData.map_locations || ''} 
                                            />
                                        </div>
                                        
                                        {tourData.map_locations && (
                                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                                <h4 className="font-medium text-gray-800 mb-2">{getLocalizedText('tour_locations_title')}</h4>
                                                <div className="space-y-1">
                                                    {tourData.map_locations.split('\n').filter(line => line.trim()).map((line, index) => {
                                                        const parts = line.split(',').map(item => item.trim());
                                                        const [name] = parts;
                                                        return (
                                                            <div key={index} className="text-sm text-gray-600 flex items-center">
                                                                <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center mr-2 font-medium">
                                                                    {index + 1}
                                                                </span>
                                                                <span className="font-medium">{name}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </section>
                                )}
                            </div>
                        </div>
                        
                        <div className="lg:col-span-1">
                            <div className="sticky top-8">
                                <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100">
                                    <div className="text-center mb-6">
                                        <p className="text-gray-600 text-sm mb-1">
                                            {getLocalizedText('tour_details.from')}
                                        </p>
                                        <div className="text-4xl font-bold text-gray-900 mb-2">
                                            {formatPrice(tourData.price)}
                                        </div>
                                    </div>

                                    <BookingButton />
                                    
                                    <p className="text-sm text-center mt-4 text-gray-600">
                                        {getLocalizedText('tour_details.book_now_pay_later')}
                                    </p>

                                    <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <svg className="w-5 h-5 mr-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            {getLocalizedText('tour_instant_confirmation')}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <svg className="w-5 h-5 mr-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                            </svg>
                                            {getLocalizedText('tour_mobile_ticket_accepted')}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <svg className="w-5 h-5 mr-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                                            </svg>
                                            {getLocalizedText('tour_max_participants')}
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