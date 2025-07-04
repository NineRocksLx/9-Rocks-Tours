import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/SEO/SEOHead';
import { LanguageSwitcher } from '../components/SEO/LanguageSwitcher';
import { useSEO } from '../hooks/useSEO';

const HomePage = () => {
  const { currentLang } = useSEO();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🌍 CONTEÚDO MULTILÍNGUE
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

  // 🔗 CARREGAR TOURS DO BACKEND
  useEffect(() => {
    const fetchTours = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/tours/featured');
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

  // 🔗 URLS INTELIGENTES
  const getURL = (path) => {
    const langPrefix = currentLang === 'pt' ? '' : `/${currentLang}`;
    return `${langPrefix}${path}`;
  };

  return (
    <>
      <SEOHead page="home" />
      
      <div className="homepage">
        {/* 🏠 HERO SECTION */}
        <section className="hero-section min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-600 to-green-500 text-white relative">
          <div className="absolute top-4 right-4">
            <LanguageSwitcher />
          </div>
          
          <div className="text-center max-w-4xl mx-auto px-4">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {content[currentLang].heroTitle}
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              {content[currentLang].heroSubtitle}
            </p>
            <Link 
              to={getURL('/tours')}
              className="bg-yellow-500 text-gray-900 px-8 py-4 rounded-lg text-lg font-bold hover:bg-yellow-400 transition-colors"
            >
              {content[currentLang].heroCTA}
            </Link>
          </div>
        </section>

        {/* 🎯 TOURS SECTION */}
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
    </>
  );
};

export default HomePage;