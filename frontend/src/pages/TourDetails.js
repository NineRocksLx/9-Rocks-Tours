import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

// Hook SEO
const useSEO = () => {
  const location = useLocation();
  const [currentLang, setCurrentLang] = useState('pt');

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/en')) setCurrentLang('en');
    else if (path.startsWith('/es')) setCurrentLang('es');
    else setCurrentLang('pt');
  }, [location]);

  return { currentLang, setCurrentLang };
};

// Componente SEO para Tours
const TourSEOHead = ({ tourData }) => {
  const { currentLang } = useSEO();
  const baseUrl = "https://9rocks.pt";

  if (!tourData) return null;

  const generateTourSEO = () => {
    const baseTitle = {
      pt: `${tourData.name} | Tour Exclusivo que Vai Transformar a Sua Viagem`,
      en: `${tourData.name} | Exclusive Tour That Will Transform Your Journey`,
      es: `${tourData.name} | Tour Exclusivo que Transformará Tu Viaje`
    };

    const baseDescription = {
      pt: `Descubra ${tourData.name} como nunca imaginou. ${tourData.duration} de pura aventura, guias especializados e acesso exclusivo. Reserve já a partir de €${tourData.price}!`,
      en: `Discover ${tourData.name} like never imagined. ${tourData.duration} of pure adventure, expert guides, and exclusive access. Book now from €${tourData.price}!`,
      es: `Descubre ${tourData.name} como nunca imaginaste. ${tourData.duration} de pura aventura, guías expertos y acceso exclusivo. ¡Reserva ya desde €${tourData.price}!`
    };

    const keywords = {
      pt: `${tourData.name}, tour portugal, ${tourData.category}, aventura ${tourData.location}, experiência única portugal`,
      en: `${tourData.name}, portugal tour, ${tourData.category}, ${tourData.location} adventure, unique portugal experience`,
      es: `${tourData.name}, tour portugal, ${tourData.category}, aventura ${tourData.location}, experiencia única portugal`
    };

    return {
      title: baseTitle[currentLang],
      description: baseDescription[currentLang],
      keywords: keywords[currentLang]
    };
  };

  const seoData = generateTourSEO();

  // Structured Data para o Tour específico
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": tourData.name,
    "description": seoData.description,
    "image": tourData.images,
    "brand": {
      "@type": "Brand",
      "name": "9 Rocks Tours"
    },
    "offers": {
      "@type": "Offer",
      "price": tourData.price,
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock",
      "validFrom": new Date().toISOString(),
      "seller": {
        "@type": "Organization",
        "name": "9 Rocks Tours"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": tourData.rating || "4.8",
      "reviewCount": tourData.reviewCount || "89",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": tourData.reviews ? tourData.reviews.slice(0, 3).map(review => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.author
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating
      },
      "reviewBody": review.comment
    })) : []
  };

  return (
    <Helmet>
      <title>{seoData.title}</title>
      <meta name="description" content={seoData.description} />
      <meta name="keywords" content={seoData.keywords} />
      
      <meta property="og:title" content={seoData.title} />
      <meta property="og:description" content={seoData.description} />
      <meta property="og:type" content="product" />
      <meta property="og:url" content={`${baseUrl}${window.location.pathname}`} />
      <meta property="og:image" content={tourData.images?.[0]} />
      <meta property="og:site_name" content="9 Rocks Tours" />
      <meta property="og:locale" content={currentLang === 'pt' ? 'pt_PT' : currentLang === 'es' ? 'es_ES' : 'en_US'} />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoData.title} />
      <meta name="twitter:description" content={seoData.description} />
      <meta name="twitter:image" content={tourData.images?.[0]} />
      
      <link rel="canonical" href={`${baseUrl}${window.location.pathname}`} />
      
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
      <html lang={currentLang === 'pt' ? 'pt-PT' : currentLang === 'es' ? 'es-ES' : 'en-US'} />
    </Helmet>
  );
};

// Componente Breadcrumbs
const Breadcrumbs = ({ tourName }) => {
  const { currentLang } = useSEO();

  const labels = {
    pt: { home: 'Início', tours: 'Tours' },
    en: { home: 'Home', tours: 'Tours' },
    es: { home: 'Inicio', tours: 'Tours' }
  };

  const getUrl = (page) => {
    const langPrefix = currentLang === 'pt' ? '' : `/${currentLang}`;
    return page === 'home' ? `${langPrefix}/` : `${langPrefix}/${page}`;
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": labels[currentLang].home,
        "item": `https://9rockstours.com${getUrl('home')}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": labels[currentLang].tours,
        "item": `https://9rockstours.com${getUrl('tours')}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": tourName,
        "item": `https://9rockstours.com${window.location.pathname}`
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbData)}
      </script>
      <nav className="breadcrumbs bg-gray-100 py-3 px-4" aria-label="Breadcrumb">
        <div className="max-w-6xl mx-auto">
          <Link to={getUrl('home')} className="text-blue-600 hover:text-blue-800">
            {labels[currentLang].home}
          </Link>
          <span className="mx-2 text-gray-500"> &gt; </span>
          <Link to={getUrl('tours')} className="text-blue-600 hover:text-blue-800">
            {labels[currentLang].tours}
          </Link>
          <span className="mx-2 text-gray-500"> &gt; </span>
          <span className="text-gray-700">{tourName}</span>
        </div>
      </nav>
    </>
  );
};

// Componente Principal TourDetails
const TourDetails = () => {
  const { slug } = useParams();
  const { currentLang } = useSEO();
  const [tourData, setTourData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Conteúdo traduzido
  const content = {
    pt: {
      duration: "Duração",
      groupSize: "Tamanho do Grupo",
      difficulty: "Dificuldade",
      included: "Incluído",
      notIncluded: "Não Incluído",
      itinerary: "Itinerário",
      bookNow: "RESERVAR AGORA",
      from: "A partir de",
      perPerson: "por pessoa",
      reviews: "Avaliações",
      gallery: "Galeria",
      description: "Descrição",
      highlights: "Destaques",
      loading: "A carregar...",
      error: "Erro ao carregar tour",
      home: "Início",
      readyForAdventure: "Pronto para Viver Esta Aventura?"
    },
    en: {
      duration: "Duration",
      groupSize: "Group Size",
      difficulty: "Difficulty",
      included: "Included",
      notIncluded: "Not Included",
      itinerary: "Itinerary",
      bookNow: "BOOK NOW",
      from: "From",
      perPerson: "per person",
      reviews: "Reviews",
      gallery: "Gallery",
      description: "Description",
      highlights: "Highlights",
      loading: "Loading...",
      error: "Error loading tour",
      home: "Home",
      readyForAdventure: "Ready for This Adventure?"
    },
    es: {
      duration: "Duración",
      groupSize: "Tamaño del Grupo",
      difficulty: "Dificultad",
      included: "Incluido",
      notIncluded: "No Incluido",
      itinerary: "Itinerario",
      bookNow: "RESERVAR AHORA",
      from: "Desde",
      perPerson: "por persona",
      reviews: "Reseñas",
      gallery: "Galería",
      description: "Descripción",
      highlights: "Destacados",
      loading: "Cargando...",
      error: "Error al cargar tour",
      home: "Inicio",
      readyForAdventure: "¿Listo para Esta Aventura?"
    }
  };

  // Carregar dados do tour
  useEffect(() => {
    const fetchTourData = async () => {
      try {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
        const response = await fetch(`${BACKEND_URL}/api/tours/${slug}?lang=${currentLang}`);
        if (!response.ok) throw new Error('Tour not found');
        const data = await response.json();
        setTourData(data);
      } catch (error) {
        console.error('Erro ao carregar tour:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTourData();
  }, [slug, currentLang]);

  const getBookingUrl = () => {
    const langPrefix = currentLang === 'pt' ? '' : `/${currentLang}`;
    const page = currentLang === 'en' ? 'book' : 'reservar';
    return `${langPrefix}/${page}?tour=${slug}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{content[currentLang].loading}</p>
        </div>
      </div>
    );
  }

  if (!tourData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{content[currentLang].error}</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            ← {content[currentLang].home}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <TourSEOHead tourData={tourData} />
      
      <div className="tour-details">
        <Breadcrumbs tourName={tourData.name} />

        {/* Hero Section */}
        <section className="tour-hero bg-white">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Gallery */}
              <div className="tour-gallery">
                <div className="main-image mb-4">
                  <img 
                    src={tourData.images?.[activeImageIndex] || '/placeholder-tour.jpg'} 
                    alt={`${tourData.name} - Image ${activeImageIndex + 1}`}
                    className="w-full h-96 object-cover rounded-lg shadow-lg"
                  />
                </div>
                {tourData.images && tourData.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {tourData.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${tourData.name} - Thumbnail ${index + 1}`}
                        className={`w-full h-20 object-cover rounded cursor-pointer transition-opacity ${
                          index === activeImageIndex ? 'opacity-100 ring-2 ring-blue-500' : 'opacity-70 hover:opacity-100'
                        }`}
                        onClick={() => setActiveImageIndex(index)}
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Tour Info */}
              <div className="tour-info">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{tourData.name}</h1>
                
                {/* Rating */}
                <div className="tour-rating mb-6">
                  <div className="flex items-center">
                    <div className="flex text-yellow-400 text-xl">
                      {'★'.repeat(Math.floor(tourData.rating || 5))}
                      {'☆'.repeat(5 - Math.floor(tourData.rating || 5))}
                    </div>
                    <span className="ml-2 text-gray-600">
                      {tourData.rating || '4.8'} ({tourData.reviewCount || '89'} {content[currentLang].reviews})
                    </span>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="tour-quick-info grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="info-item p-4 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-gray-900">{content[currentLang].duration}</div>
                    <div className="text-gray-600">{tourData.duration || '8 horas'}</div>
                  </div>
                  <div className="info-item p-4 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-gray-900">{content[currentLang].groupSize}</div>
                    <div className="text-gray-600">{tourData.maxGroupSize || '8'} pessoas</div>
                  </div>
                  <div className="info-item p-4 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-gray-900">{content[currentLang].difficulty}</div>
                    <div className="text-gray-600">{tourData.difficulty || 'Fácil'}</div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="pricing mb-8">
                  <div className="flex items-baseline">
                    <span className="text-sm text-gray-600 mr-2">{content[currentLang].from}</span>
                    <span className="text-4xl font-bold text-green-600">€{tourData.price || '65'}</span>
                    <span className="text-sm text-gray-600 ml-2">{content[currentLang].perPerson}</span>
                  </div>
                </div>

                {/* Book Button */}
                <Link 
                  to={getBookingUrl()} 
                  className="inline-block w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-blue-700 transition-colors text-center"
                >
                  {content[currentLang].bookNow}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Description Section */}
        <section className="tour-description py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">{content[currentLang].description}</h2>
                <div className="prose max-w-none text-gray-700 mb-8">
                  <p>{tourData.description || 'Descrição do tour em desenvolvimento...'}</p>
                </div>

                {/* Highlights */}
                {tourData.highlights && tourData.highlights.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{content[currentLang].highlights}</h3>
                    <ul className="space-y-2">
                      {tourData.highlights.map((highlight, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span className="text-gray-700">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Itinerary */}
                {tourData.itinerary && tourData.itinerary.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">{content[currentLang].itinerary}</h3>
                    <div className="space-y-6">
                      {tourData.itinerary.map((item, index) => (
                        <div key={index} className="flex">
                          <div className="flex-shrink-0 w-20 text-sm font-semibold text-blue-600 bg-blue-50 rounded px-2 py-1 h-fit">
                            {item.time}
                          </div>
                          <div className="ml-4">
                            <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                            <p className="text-gray-700">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                {/* Included/Not Included */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                  {tourData.included && tourData.included.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-bold text-gray-900 mb-3">{content[currentLang].included}</h3>
                      <ul className="space-y-2">
                        {tourData.included.map((item, index) => (
                          <li key={index} className="flex items-start text-sm">
                            <span className="text-green-500 mr-2">✓</span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {tourData.notIncluded && tourData.notIncluded.length > 0 && (
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3">{content[currentLang].notIncluded}</h3>
                      <ul className="space-y-2">
                        {tourData.notIncluded.map((item, index) => (
                          <li key={index} className="flex items-start text-sm">
                            <span className="text-red-500 mr-2">✗</span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Booking Widget */}
                <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
                  <div className="text-center mb-4">
                    <div className="text-sm text-gray-600">{content[currentLang].from}</div>
                    <div className="text-3xl font-bold text-green-600">€{tourData.price || '65'}</div>
                    <div className="text-sm text-gray-600">{content[currentLang].perPerson}</div>
                  </div>
                  <Link 
                    to={getBookingUrl()} 
                    className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors text-center"
                  >
                    {content[currentLang].bookNow}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        {tourData.reviews && tourData.reviews.length > 0 && (
          <section className="reviews-section py-16 bg-white">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">{content[currentLang].reviews}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tourData.reviews.slice(0, 6).map((review, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-gray-900">{review.author}</div>
                      <div className="flex text-yellow-400">
                        {'★'.repeat(review.rating)}
                        {'☆'.repeat(5 - review.rating)}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{review.comment}</p>
                    <div className="text-sm text-gray-500">{review.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="tour-final-cta py-16 bg-blue-600 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-8">{content[currentLang].readyForAdventure}</h2>
            <Link 
              to={getBookingUrl()} 
              className="inline-block bg-yellow-500 text-gray-900 px-8 py-4 rounded-lg text-lg font-bold hover:bg-yellow-400 transition-colors"
            >
              {content[currentLang].bookNow}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default TourDetails;