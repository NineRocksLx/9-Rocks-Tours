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
        <GoogleMap mapContainerClassName="w-full h-full rounded-lg" center={{ lat: 47.3249, lng: 1.0703 }} zoom={8} options={{ streetViewControl: false, mapTypeControl: false }}>
            {locations.map((loc, index) => <MarkerF key={index} position={{ lat: loc.lat, lng: loc.lng }} title={loc.name} />)}
        </GoogleMap>
    );
};

// Componente Breadcrumbs
const Breadcrumbs = ({ tourName, currentLang }) => {
    const { t } = useTranslation();
    const getUrl = (page) => `/${currentLang !== 'pt' ? currentLang : ''}/${page === 'home' ? '' : page}`;

    return (
        <nav className="bg-white py-3 px-4 border-b" aria-label="Breadcrumb">
            <div className="max-w-7xl mx-auto"><div className="flex items-center text-sm text-gray-600">
                <Link to={getUrl('home')} className="hover:text-blue-600">{t('nav_home')}</Link><span className="mx-2">/</span>
                <Link to={getUrl('tours')} className="hover:text-blue-600">{t('nav_tours')}</Link><span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">{tourName}</span>
            </div></div>
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
    const [processedItinerary, setProcessedItinerary] = useState(null); // Estado para o itinerário processado

    // 2. Função para "traduzir" o itinerário de texto para objeto
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
                    title: line.replace(timeRegex, '').replace(':', '').trim() || t('itinerary_activity_at', { time: timeMatch[0] }),
                    duration: timeMatch[0].replace('h', ':00'),
                    type: line.toLowerCase().includes('almoço') ? 'meal' : 'visit',
                });
            }
        });
        return { [currentLang]: parsedStops };
    };

    // 3. useEffect para buscar os dados
    useEffect(() => {
        const fetchTourData = async () => {
            if (!id) { setError(t('message.error')); setLoading(false); return; }
            setLoading(true);
            try {
                const response = await axios.get(`${BACKEND_URL}/api/tours/${id}`);
                if (!response.data) { throw new Error(t('message.no_tours')); }
                setTourData(response.data);
                // **A PONTE MÁGICA ACONTECE AQUI**
                // Converte o `route_description` para o formato que o TourItinerary precisa
                if (response.data.route_description) {
                    setProcessedItinerary(parseItineraryFromText(response.data.route_description));
                }
            } catch (err) {
                setError(err.message || t('message.error'));
            } finally {
                setLoading(false);
            }
        };
        fetchTourData();
    }, [id, currentLang]); // Depender de currentLang para reprocessar o itinerário se o idioma mudar

    if (loading) { return <div className="min-h-screen flex items-center justify-center"><p>{t('message_loading')}</p></div>; }
    if (error) { return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>; }
    if (!tourData) { return <div className="min-h-screen flex items-center justify-center">{t('message.no_tours')}</div>; }

    // Extração de dados
    const tourName = tourData.name[currentLang] || tourData.name.pt;
    const shortDescription = tourData.short_description[currentLang] || tourData.short_description.pt;
    const highlights = tourData.highlights?.[currentLang]?.split('\n').filter(item => item.trim() !== '') || [];
    const includesText = tourData.includes?.[currentLang]?.split('\n').filter(item => item.trim() !== '') || [];
    const excludesText = tourData.excludes?.[currentLang]?.split('\n').filter(item => item.trim() !== '') || [];
    const bookingUrl = `/${currentLang !== 'pt' ? currentLang + '/' : ''}reservar?tour=${id}`;
    const mainImage = tourData.images?.[0];
    const galleryImages = tourData.images?.slice(1, 3) || [];

    return (
        <>
            <Helmet>
              <title>{`${tourName} - 9 Rocks Tours`}</title>
              <meta name="description" content={shortDescription} />
            </Helmet>
            
            <div className="bg-white">
                <Breadcrumbs tourName={tourName} currentLang={currentLang} />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                    <section className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">{tourName}</h1>
                        <p className="text-lg text-gray-600">{shortDescription}</p>
                        {tourData.images && tourData.images.length > 0 && (
                            <div className="grid grid-cols-2 grid-rows-2 gap-2 h-[250px] md:h-[450px] relative mt-6">
                                <div className="col-span-1 row-span-2"><img src={mainImage} alt={`Imagem principal de ${tourName}`} className="w-full h-full object-cover rounded-l-lg" /></div>
                                <div className="col-span-1 row-span-1"><img src={galleryImages[0] || mainImage} alt={`Imagem de ${tourName} 2`} className="w-full h-full object-cover rounded-tr-lg" /></div>
                                <div className="col-span-1 row-span-1"><img src={galleryImages[1] || mainImage} alt={`Imagem de ${tourName} 3`} className="w-full h-full object-cover rounded-br-lg" /></div>
                            </div>
                        )}
                    </section>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2">
                            <div className="p-4 border rounded-lg mb-8">
                                <h3 className="font-bold text-lg mb-4">{t('tour_details.about_activity')}</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center"><span className="mr-3 text-2xl">🚫</span><div><b>{t('tour_details.free_cancellation_title')}</b><br/><span className="text-sm text-gray-500">{t('tour_details.free_cancellation_description')}</span></div></div>
                                    <div className="flex items-center"><span className="mr-3 text-2xl">⏱️</span><div><b>{t('tour_duration')}</b><br/><span className="text-sm text-gray-500">{tourData.duration_hours} {t('common.hours')}</span></div></div>
                                    <div className="flex items-center"><span className="mr-3 text-2xl">🎤</span><div><b>{t('tour_professional_guide')}</b><br/><span className="text-sm text-gray-500">{t('tour_details.guide_languages')}</span></div></div>
                                </div>
                            </div>
                            
                            <section id="destaques" className="mb-10"><h2 className="text-2xl font-bold text-gray-800 mb-4">{t('tour_details.highlights')}</h2><ul className="list-disc list-inside text-gray-700 space-y-2">{highlights.map((item, index) => <li key={index}>{item}</li>)}</ul></section>
                            
                            <section id="itinerario" className="mb-10"><h2 className="text-2xl font-bold text-gray-800 mb-4">{t('tab_itinerary')}</h2><TourItinerary itinerary={processedItinerary} currentLanguage={currentLang} /></section>
                            
                            <section id="inclui" className="mb-10"><h2 className="text-2xl font-bold text-gray-800 mb-4">{t('tour_includes')}</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">{includesText.map((item, index) => <div key={index} className="flex items-start"><span className="text-green-500 mr-2 mt-1">✓</span><span>{item}</span></div>)}</div></section>
                            
                            <section id="nao-inclui" className="mb-10"><h2 className="text-2xl font-bold text-gray-800 mb-4">{t('tour_excludes')}</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">{excludesText.map((item, index) => <div key={index} className="flex items-start"><span className="text-red-500 mr-2 mt-1">✗</span><span>{item}</span></div>)}</div></section>
                            
                            <section id="mapa" className="mb-10 h-96"><h2 className="text-2xl font-bold text-gray-800 mb-4">{t('itinerary_tour_region')}</h2><TourMap locationsStr={tourData.map_locations} /></section>
                        </div>
                        <div className="lg:col-span-1">
                            <div className="sticky top-8"><div className="p-6 rounded-lg shadow-lg border border-gray-200">
                                <p className="text-gray-600">{t('tour_details.from')}</p>
                                <div className="text-4xl font-bold text-gray-900 mb-4">{formatPrice(tourData.price)}</div>
                                <Link to={bookingUrl} className="w-full block text-center bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">{t('tour_book_now')}</Link>
                                <p className="text-sm text-center mt-3 text-gray-600">{t('tour_details.book_now_pay_later')}</p>
                            </div></div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};

export default TourDetails;