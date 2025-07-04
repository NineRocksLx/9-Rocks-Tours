// frontend/src/pages/TourDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

// Hook SEO (mesmo do HomePage)
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
  const baseUrl = "https://9rockstours.com"; // ALTERE PARA SEU DOMÍNIO

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
      <meta property="og:image" content={tourData.images[0]} />
      <meta property="og:site_name" content="9 Rocks Tours" />
      <meta property="og:locale" content={currentLang === 'pt' ? 'pt_PT' : currentLang === 'es' ? 'es_ES' : 'en_US'} />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoData.title} />
      <meta name="twitter:description" content={seoData.description} />
      <meta name="twitter:image" content={tourData.images[0]} />
      
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
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to={getUrl('home')}>{labels[currentLang].home}</Link>
        <span> &gt; </span>
        <Link to={getUrl('tours')}>{labels[currentLang].tours}</Link>
        <span> &gt; </span>
        <span>{tourName}</span>
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
      error: "Erro ao carregar tour"
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
      error: "Error loading tour"
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
      error: "Error al cargar tour"
    }
  };

  // Carregar dados do tour
  useEffect(() => {
    const fetchTourData = async () => {
      try {
        const response = await fetch(`/api/tours/${slug}?lang=${currentLang}`);
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
      <div className="loading-container">
        <div className="loading">{content[currentLang].loading}</div>
      </div>
    );
  }

  if (!tourData) {
    return (
      <div className="error-container">
        <h1>{content[currentLang].error}</h1>
        <Link to="/" className="back-home">← {content[currentLang].home}</Link>
      </div>
    );
  }

  return (
    <>
      <TourSEOHead tourData={tourData} />
      
      <div className="tour-details">
        <Breadcrumbs tourName={tourData.name} />

        {/* Hero Section */}
        <section className="tour-hero">
          <div className="tour-gallery-main">
            <img 
              src={tourData.images[activeImageIndex]} 
              alt={`${tourData.name} - Image ${activeImageIndex + 1}`}
              className="main-image"
            />
            <div className="gallery-thumbnails">
              {tourData.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${tourData.name} - Thumbnail ${index + 1}`}
                  className={`thumbnail ${index === activeImageIndex ? 'active' : ''}`}
                  onClick={() => setActiveImageIndex(index)}
                  loading="lazy"
                />
              ))}
            </div>
          </div>

          <div className="tour-info">
            <h1>{tourData.name}</h1>
            <div className="tour-rating">
              <span className="stars">
                {'★'.repeat(Math.floor(tourData.rating))}
                {'☆'.repeat(5 - Math.floor(tourData.rating))}
              </span>
              <span className="rating-text">
                {tourData.rating} ({tourData.reviewCount} {content[currentLang].reviews})
              </span>
            </div>

            <div className="tour-quick-info">
              <div className="info-item">
                <strong>{content[currentLang].duration}:</strong> {tourData.duration}
              </div>
              <div className="info-item">
                <strong>{content[currentLang].groupSize}:</strong> {tourData.maxGroupSize} pessoas
              </div>
              <div className="info-item">
                <strong>{content[currentLang].difficulty}:</strong> {tourData.difficulty}
              </div>
            </div>

            <div className="pricing">
              <span className="from">{content[currentLang].from}</span>
              <span className="price">€{tourData.price}</span>
              <span className="per-person">{content[currentLang].perPerson}</span>
            </div>

            <Link to={getBookingUrl()} className="book-button">
              {content[currentLang].bookNow}
            </Link>
          </div>
        </section>

        {/* Description Section */}
        <section className="tour-description">
          <div className="container">
            <div className="description-grid">
              <div className="main-content">
                <h2>{content[currentLang].description}</h2>
                <p>{tourData.description}</p>

                <h3>{content[currentLang].highlights}</h3>
                <ul className="highlights-list">
                  {tourData.highlights?.map((highlight, index) => (
                    <li key={index}>{highlight}</li>
                  ))}
                </ul>

                <h3>{content[currentLang].itinerary}</h3>
                <div className="itinerary">
                  {tourData.itinerary?.map((item, index) => (
                    <div key={index} className="itinerary-item">
                      <div className="time">{item.time}</div>
                      <div className="activity">
                        <h4>{item.title}</h4>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sidebar">
                <div className="included-section">
                  <h3>{content[currentLang].included}</h3>
                  <ul className="included-list">
                    {tourData.included?.map((item, index) => (
                      <li key={index}>✓ {item}</li>
                    ))}
                  </ul>

                  <h3>{content[currentLang].notIncluded}</h3>
                  <ul className="not-included-list">
                    {tourData.notIncluded?.map((item, index) => (
                      <li key={index}>✗ {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="booking-widget">
                  <div className="widget-price">
                    <span className="from">{content[currentLang].from}</span>
                    <span className="price">€{tourData.price}</span>
                    <span className="per-person">{content[currentLang].perPerson}</span>
                  </div>
                  <Link to={getBookingUrl()} className="widget-book-button">
                    {content[currentLang].bookNow}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        {tourData.reviews && tourData.reviews.length > 0 && (
          <section className="reviews-section">
            <div className="container">
              <h2>{content[currentLang].reviews}</h2>
              <div className="reviews-grid">
                {tourData.reviews.slice(0, 6).map((review, index) => (
                  <div key={index} className="review-card">
                    <div className="review-header">
                      <div className="reviewer-name">{review.author}</div>
                      <div className="review-rating">
                        {'★'.repeat(review.rating)}
                        {'☆'.repeat(5 - review.rating)}
                      </div>
                    </div>
                    <p className="review-text">{review.comment}</p>
                    <div className="review-date">{review.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Call to Action Final */}
        <section className="tour-final-cta">
          <div className="container">
            <h2>Pronto para Viver Esta Aventura?</h2>
            <Link to={getBookingUrl()} className="final-cta-button">
              {content[currentLang].bookNow}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default TourDetails;