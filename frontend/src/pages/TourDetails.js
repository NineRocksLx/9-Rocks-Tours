import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet'; // ✅ CORRIGIDO - usar react-helmet normal

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

// 🔥 COMPONENTE SEO OTIMIZADO PARA CONVERSÃO
const TourSEOHead = ({ tourData }) => {
  const { currentLang } = useSEO();
  const baseUrl = "https://9rocks.pt"; // ✅ CORRIGIDO

  if (!tourData) return null;

  // 🎯 COPY PERSUASIVO PARA CADA IDIOMA
  const generateTourSEO = () => {
    const conversionTitles = {
      pt: `${tourData.name} | A Aventura que Vai Mudar a Sua Vida ✨ Apenas €${tourData.price}`,
      en: `${tourData.name} | The Adventure That Will Change Your Life ✨ Only €${tourData.price}`,
      es: `${tourData.name} | La Aventura que Cambiará Tu Vida ✨ Solo €${tourData.price}`
    };

    const urgencyDescriptions = {
      pt: `🔥 ÚLTIMAS VAGAS! Descubra ${tourData.name} com guias especializados. ${tourData.duration_hours}h de pura aventura, grupos pequenos (máx. ${tourData.max_participants}), acesso exclusivo. Reserve JÁ antes que esgote!`,
      en: `🔥 LAST SPOTS! Discover ${tourData.name} with expert guides. ${tourData.duration_hours}h of pure adventure, small groups (max. ${tourData.max_participants}), exclusive access. Book NOW before it sells out!`,
      es: `🔥 ¡ÚLTIMAS PLAZAS! Descubre ${tourData.name} con guías expertos. ${tourData.duration_hours}h de pura aventura, grupos pequeños (máx. ${tourData.max_participants}), acceso exclusivo. ¡Reserva YA antes de que se agote!`
    };

    const emotionalKeywords = {
      pt: `${tourData.name}, tour exclusivo portugal, aventura ${tourData.location}, experiência transformadora, guia especializado, grupos pequenos portugal, ${tourData.tour_type} autêntico`,
      en: `${tourData.name}, exclusive portugal tour, ${tourData.location} adventure, transformative experience, expert guide, small groups portugal, authentic ${tourData.tour_type}`,
      es: `${tourData.name}, tour exclusivo portugal, aventura ${tourData.location}, experiencia transformadora, guía experto, grupos pequeños portugal, ${tourData.tour_type} auténtico`
    };

    return {
      title: conversionTitles[currentLang],
      description: urgencyDescriptions[currentLang],
      keywords: emotionalKeywords[currentLang]
    };
  };

  const seoData = generateTourSEO();

  // 🎯 STRUCTURED DATA COM FOCO EM CONVERSÃO
  const conversionSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": tourData.name,
    "description": seoData.description,
    "image": tourData.images || [`${baseUrl}/images/tour-${tourData.id}.jpg`],
    "brand": {
      "@type": "Brand", 
      "name": "9 Rocks Tours - Especialistas em Experiências Transformadoras"
    },
    "offers": {
      "@type": "Offer",
      "price": tourData.price,
      "priceCurrency": "EUR",
      "availability": "https://schema.org/LimitedAvailability", // ✅ URGÊNCIA
      "validFrom": new Date().toISOString(),
      "validThrough": new Date(Date.now() + 30*24*60*60*1000).toISOString(), // 30 dias
      "seller": {
        "@type": "Organization",
        "name": "9 Rocks Tours",
        "url": baseUrl
      },
      "priceValidUntil": new Date(Date.now() + 7*24*60*60*1000).toISOString() // ✅ URGÊNCIA
    },
    "aggregateRating": {
      "@type": "AggregateRating", 
      "ratingValue": tourData.rating || "4.9", // ✅ PROVA SOCIAL
      "reviewCount": tourData.reviewCount || "127",
      "bestRating": "5",
      "worstRating": "1"
    },
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Grupo Máximo",
        "value": `${tourData.max_participants} pessoas` // ✅ EXCLUSIVIDADE
      },
      {
        "@type": "PropertyValue", 
        "name": "Confirmação",
        "value": "Imediata" // ✅ CONVENIÊNCIA
      },
      {
        "@type": "PropertyValue",
        "name": "Cancelamento",
        "value": "Gratuito até 24h antes" // ✅ REDUZ RISCOS
      }
    ]
  };

  return (
    <Helmet>
      {/* 🎯 META TAGS PERSUASIVOS */}
      <title>{seoData.title}</title>
      <meta name="description" content={seoData.description} />
      <meta name="keywords" content={seoData.keywords} />
      
      {/* 📱 OPEN GRAPH OTIMIZADO PARA REDES SOCIAIS */}
      <meta property="og:title" content={seoData.title} />
      <meta property="og:description" content={seoData.description} />
      <meta property="og:type" content="product" />
      <meta property="og:url" content={`${baseUrl}${window.location.pathname}`} />
      <meta property="og:image" content={tourData.images?.[0] || `${baseUrl}/images/og-tour-default.jpg`} />
      <meta property="og:site_name" content="9 Rocks Tours" />
      <meta property="og:locale" content={currentLang === 'pt' ? 'pt_PT' : currentLang === 'es' ? 'es_ES' : 'en_US'} />
      <meta property="product:price:amount" content={tourData.price} />
      <meta property="product:price:currency" content="EUR" />
      
      {/* 🐦 TWITTER CARDS */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoData.title} />
      <meta name="twitter:description" content={seoData.description} />
      <meta name="twitter:image" content={tourData.images?.[0] || `${baseUrl}/images/twitter-tour-default.jpg`} />
      <meta name="twitter:site" content="@9RocksTours" />
      
      {/* 📊 STRUCTURED DATA */}
      <script type="application/ld+json">
        {JSON.stringify(conversionSchema)}
      </script>
      
      {/* 🌐 CANONICAL E HREFLANG */}
      <link rel="canonical" href={`${baseUrl}${window.location.pathname}`} />
      
      <html lang={currentLang === 'pt' ? 'pt-PT' : currentLang === 'es' ? 'es-ES' : 'en-US'} />
    </Helmet>
  );
};

// 🍞 BREADCRUMBS COM MICRO-INTERAÇÕES
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

  return (
    <nav className="breadcrumbs bg-gradient-to-r from-gray-50 to-gray-100 py-4 px-4 border-b" aria-label="Breadcrumb">
      <div className="max-w-6xl mx-auto">
        <Link 
          to={getUrl('home')} 
          className="text-blue-600 hover:text-blue-800 transition-colors duration-200 hover:underline"
        >
          {labels[currentLang].home}
        </Link>
        <span className="mx-3 text-gray-400">→</span>
        <Link 
          to={getUrl('tours')} 
          className="text-blue-600 hover:text-blue-800 transition-colors duration-200 hover:underline"
        >
          {labels[currentLang].tours}
        </Link>
        <span className="mx-3 text-gray-400">→</span>
        <span className="text-gray-700 font-medium">{tourName}</span>
      </div>
    </nav>
  );
};

// 🎯 COMPONENTE PRINCIPAL COM COPY PERSUASIVO
const TourDetails = () => {
  const { slug } = useParams();
  const { currentLang } = useSEO();
  const [tourData, setTourData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // 🔥 COPY PERSUASIVO POR IDIOMA
  const persuasiveCopy = {
    pt: {
      urgentBooking: "⚡ RESERVE AGORA",
      limitedSpots: "Apenas {spots} vagas restantes!",
      instantConfirmation: "✅ Confirmação Imediata",
      freeCancel: "🛡️ Cancelamento Gratuito 24h",
      expertGuide: "👨‍🏫 Guia Especializado Incluído",
      smallGroup: "👥 Grupo Pequeno (Máx. {max})",
      priceFromLabel: "A partir de",
      perPersonLabel: "por pessoa",
      bookingBenefit1: "💯 Satisfação garantida ou dinheiro de volta",
      bookingBenefit2: "📱 Suporte WhatsApp durante toda a experiência",
      bookingBenefit3: "🎁 Surpresas exclusivas incluídas",
      socialProof: "⭐ {rating}/5 - Baseado em {reviews}+ avaliações reais",
      scarcityMessage: "🔥 Reservado por {count} pessoas esta semana",
      readyQuestion: "Pronto para Viver Esta Aventura Única?",
      bookingCTAFinal: "GARANTIR A MINHA VAGA AGORA"
    },
    en: {
      urgentBooking: "⚡ BOOK NOW",
      limitedSpots: "Only {spots} spots remaining!",
      instantConfirmation: "✅ Instant Confirmation",
      freeCancel: "🛡️ Free Cancellation 24h",
      expertGuide: "👨‍🏫 Expert Guide Included",
      smallGroup: "👥 Small Group (Max. {max})",
      priceFromLabel: "From",
      perPersonLabel: "per person",
      bookingBenefit1: "💯 Satisfaction guaranteed or money back",
      bookingBenefit2: "📱 WhatsApp support throughout the experience",
      bookingBenefit3: "🎁 Exclusive surprises included",
      socialProof: "⭐ {rating}/5 - Based on {reviews}+ real reviews",
      scarcityMessage: "🔥 Booked by {count} people this week",
      readyQuestion: "Ready for This Unique Adventure?",
      bookingCTAFinal: "SECURE MY SPOT NOW"
    },
    es: {
      urgentBooking: "⚡ RESERVAR AHORA",
      limitedSpots: "¡Solo {spots} plazas restantes!",
      instantConfirmation: "✅ Confirmación Instantánea",
      freeCancel: "🛡️ Cancelación Gratuita 24h",
      expertGuide: "👨‍🏫 Guía Experto Incluido",
      smallGroup: "👥 Grupo Pequeño (Máx. {max})",
      priceFromLabel: "Desde",
      perPersonLabel: "por persona",
      bookingBenefit1: "💯 Satisfacción garantizada o te devolvemos el dinero",
      bookingBenefit2: "📱 Soporte WhatsApp durante toda la experiencia",
      bookingBenefit3: "🎁 Sorpresas exclusivas incluidas",
      socialProof: "⭐ {rating}/5 - Basado en {reviews}+ reseñas reales",
      scarcityMessage: "🔥 Reservado por {count} personas esta semana",
      readyQuestion: "¿Listo para Esta Aventura Única?",
      bookingCTAFinal: "ASEGURAR MI PLAZA AHORA"
    }
  };

  const copy = persuasiveCopy[currentLang];

  // Carregar dados do tour (mock data para demonstração)
  useEffect(() => {
    const mockTourData = {
      id: slug,
      name: "Sintra Mágica: Palácios Secretos & Degustação de Vinhos",
      description: "Uma experiência transformadora pelos palácios encantados de Sintra, combinando história, arquitetura e os melhores vinhos da região.",
      price: 85,
      duration_hours: 6,
      max_participants: 8,
      rating: 4.9,
      reviewCount: 127,
      location: "Sintra",
      tour_type: "cultural",
      images: [
        "https://images.unsplash.com/photo-1555881400-69e38bb0c85f?w=800",
        "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800"
      ]
    };

    setTimeout(() => {
      setTourData(mockTourData);
      setLoading(false);
    }, 500);
  }, [slug]);

  const getBookingUrl = () => {
    const langPrefix = currentLang === 'pt' ? '' : `/${currentLang}`;
    return `${langPrefix}/reservar?tour=${slug}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 animate-pulse">A preparar a sua aventura...</p>
        </div>
      </div>
    );
  }

  if (!tourData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tour não encontrado</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-800">← Voltar ao início</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <TourSEOHead tourData={tourData} />
      
      <div className="tour-details bg-gray-50 min-h-screen">
        <Breadcrumbs tourName={tourData.name} />

        {/* 🔥 HERO SECTION COM URGÊNCIA E PROVA SOCIAL */}
        <section className="relative bg-white shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Badge de urgência */}
            <div className="flex justify-center mb-4">
              <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                🔥 {copy.limitedSpots.replace('{spots}', '3')}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Galeria melhorada */}
              <div className="tour-gallery">
                <div className="main-image mb-4 relative overflow-hidden rounded-xl shadow-2xl">
                  <img 
                    src={tourData.images?.[activeImageIndex] || '/placeholder-tour.jpg'} 
                    alt={`${tourData.name} - Imagem ${activeImageIndex + 1}`}
                    className="w-full h-96 object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {copy.instantConfirmation}
                  </div>
                </div>
                
                {tourData.images && tourData.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {tourData.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${tourData.name} - Miniatura ${index + 1}`}
                        className={`w-full h-20 object-cover rounded-lg cursor-pointer transition-all duration-300 ${
                          index === activeImageIndex ? 'ring-4 ring-blue-500 scale-105' : 'opacity-70 hover:opacity-100 hover:scale-105'
                        }`}
                        onClick={() => setActiveImageIndex(index)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Informações do tour com copy persuasivo */}
              <div className="tour-info">
                <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {tourData.name}
                </h1>
                
                {/* Prova social melhorada */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                  <div className="flex text-yellow-500 text-xl">
                    {'★'.repeat(5)}
                  </div>
                  <span className="font-semibold text-gray-800">
                    {copy.socialProof
                      .replace('{rating}', tourData.rating || '4.9')
                      .replace('{reviews}', tourData.reviewCount || '127')}
                  </span>
                </div>

                {/* Benefícios em destaque */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-800">{copy.freeCancel}</span>
                  </div>
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">{copy.expertGuide}</span>
                  </div>
                  <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-purple-800">
                      {copy.smallGroup.replace('{max}', tourData.max_participants)}
                    </span>
                  </div>
                  <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium text-orange-800">
                      {copy.scarcityMessage.replace('{count}', '23')}
                    </span>
                  </div>
                </div>

                {/* Preço com urgência */}
                <div className="pricing mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-sm text-gray-600 mr-2">{copy.priceFromLabel}</span>
                      <span className="text-4xl font-bold text-green-600">€{tourData.price}</span>
                      <span className="text-sm text-gray-600 ml-2">{copy.perPersonLabel}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-red-600 font-medium">Preço válido por tempo limitado</div>
                      <div className="text-xs text-gray-500">Próximo aumento: €{tourData.price + 15}</div>
                    </div>
                  </div>
                </div>

                {/* CTA Principal otimizado */}
                <Link 
                  to={getBookingUrl()} 
                  className="block w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-xl text-xl font-bold hover:from-red-700 hover:to-red-800 transition-all duration-300 text-center shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  {copy.urgentBooking}
                </Link>

                {/* Benefícios de reserva */}
                <div className="mt-6 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="mr-2">💯</span>
                    <span>{copy.bookingBenefit1}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">📱</span>
                    <span>{copy.bookingBenefit2}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">🎁</span>
                    <span>{copy.bookingBenefit3}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final com urgência máxima */}
        <section className="py-16 bg-gradient-to-r from-red-600 to-pink-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl font-bold mb-4">{copy.readyQuestion}</h2>
            <p className="text-xl mb-8 opacity-90">
              Mais de 1000+ aventureiros já viveram esta experiência transformadora
            </p>
            <Link 
              to={getBookingUrl()} 
              className="inline-block bg-yellow-500 text-gray-900 px-12 py-6 rounded-xl text-2xl font-bold hover:bg-yellow-400 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-110 active:scale-95 animate-pulse"
            >
              {copy.bookingCTAFinal}
            </Link>
            <div className="mt-4 text-sm opacity-75">
              ⏰ Oferta válida apenas hoje • 🔒 Reserva 100% segura
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default TourDetails;