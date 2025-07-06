import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from '../utils/useTranslation';
import { heroImagesService } from '../services/heroImagesService';
import { tourFiltersService } from '../services/tourFiltersService';
import SEOHead from '../components/SEOHead';
import { useHomeSEO } from '../hooks/useSEO';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const HomePage = () => {
  const seoData = useHomeSEO();
  const { t, getCurrentLanguage } = useTranslation();
  const currentLang = getCurrentLanguage();
  
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Estados para filtros dinâmicos
  const [tourFilters, setTourFilters] = useState([]);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filtersError, setFiltersError] = useState(null);

  // Estados para Hero Images do Firebase
  const [heroImages, setHeroImages] = useState([]);
  const [heroLoading, setHeroLoading] = useState(true);
  const [heroError, setHeroError] = useState(null);

  // Imagens de fallback (caso Firebase falhe)
  const fallbackHeroImages = [
    {
      id: 'fallback_1',
      title: { 
        pt: 'Évora Clássica', 
        en: 'Classic Évora', 
        es: 'Évora Clásica' 
      },
      subtitle: { 
        pt: 'A visita começa pela bela cidade medieval de Évora', 
        en: 'Visit the beautiful medieval city of Évora', 
        es: 'Una visita começa pela bela cidade medieval de Évora' 
      },
      imageUrl: 'https://discoverportugal2day.com/wp-content/uploads/2016/12/evora2-1024x539.webp',
      order: 1,
      active: true
    }
  ];

  // Conteúdo multilíngue
  const content = {
    pt: {
      heroTitle: "Aventuras que Transformam Vidas",
      heroSubtitle: "Descubra paraísos escondidos com experiências únicas",
      heroCTA: "COMECE SUA AVENTURA",
      toursTitle: "Tours em Destaque",
      bookNow: "Reservar Agora",
      from: "A partir de"
    },
    en: {
      heroTitle: "Adventures That Transform Lives",
      heroSubtitle: "Discover hidden paradises with unique experiences",
      heroCTA: "START YOUR ADVENTURE",
      toursTitle: "Featured Tours",
      bookNow: "Book Now",
      from: "From"
    },
    es: {
      heroTitle: "Aventuras que Transforman Vidas",
      heroSubtitle: "Descubre paraísos ocultos con experiencias únicas",
      heroCTA: "COMIENZA TU AVENTURA",
      toursTitle: "Tours Destacados",
      bookNow: "Reservar Ahora",
      from: "Desde"
    }
  };

  // Função para obter texto localizado
  const getLocalizedText = (textObj) => {
    return textObj[currentLang] || textObj.pt || textObj.en || '';
  };

  // Carregar tours do backend
  useEffect(() => {
    const fetchTours = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/tours/featured`);
        if (response.ok) {
          const data = await response.json();
          setTours(data);
        }
      } catch (error) {
        console.error('Erro ao carregar tours:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, []);

  // Carregar hero images
  useEffect(() => {
    const loadHeroImages = async () => {
      try {
        const images = await heroImagesService.getAllHeroImages();
        setHeroImages(images.length > 0 ? images : fallbackHeroImages);
      } catch (error) {
        console.error('Erro ao carregar hero images:', error);
        setHeroImages(fallbackHeroImages);
      } finally {
        setHeroLoading(false);
      }
    };

    loadHeroImages();
  }, []);

  // Carousel automático
  useEffect(() => {
    if (heroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [heroImages.length]);

  // URLs inteligentes
  const getURL = (path) => {
    const langPrefix = currentLang === 'pt' ? '' : `/${currentLang}`;
    return `${langPrefix}${path}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead {...seoData} />
      
      {/* Hero Section com Carousel de Imagens do Firebase */}
      <div className="relative h-screen overflow-hidden">
        {/* Background Images Carousel */}
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
                  console.error('Erro ao carregar imagem:', image.imageUrl);
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="%23e5e7eb"/><text x="960" y="540" text-anchor="middle" fill="%236b7280" font-size="48">Imagem não disponível</text></svg>';
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            </div>
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center text-white px-4 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                {heroImages[currentImageIndex] 
                  ? getLocalizedText(heroImages[currentImageIndex].title)
                  : content[currentLang].heroTitle
                }
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              {heroImages[currentImageIndex] 
                ? getLocalizedText(heroImages[currentImageIndex].subtitle)
                : content[currentLang].heroSubtitle
              }
            </p>
            <Link 
              to={getURL('/tours')}
              className="bg-yellow-500 text-gray-900 px-8 py-4 rounded-lg text-lg font-bold hover:bg-yellow-400 transition-colors"
            >
              {content[currentLang].heroCTA}
            </Link>
          </div>
        </div>
      </div>

      {/* Tours Section */}
      <section className="tours-section py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            {content[currentLang].toursTitle}
          </h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tours.map((tour, index) => (
                <div key={index} className="tour-card bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="tour-image h-48 bg-gray-300 relative">
                    {tour.image && (
                      <img 
                        src={tour.image} 
                        alt={tour.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute top-4 right-4 bg-yellow-500 text-gray-900 px-3 py-1 rounded-full font-bold">
                      {content[currentLang].from} €{tour.price || '65'}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{tour.name || 'Tour Exemplo'}</h3>
                    <p className="text-gray-600 mb-4">{tour.description || 'Descrição do tour...'}</p>
                    <Link 
                      to={getURL(`/tours/${tour.slug || 'exemplo'}`)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {content[currentLang].bookNow}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;