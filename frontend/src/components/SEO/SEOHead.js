import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSEO } from '../../hooks/useSEO';
import { SEO_CONFIG } from '../../utils/seoConfig';

// 📚 FALLBACK CONTENT (se API falhar)
const FALLBACK_CONTENT = {
  home: {
    pt: {
      title: "9 Rocks Tours - Aventuras Épicas em Portugal | Tours Inesquecíveis",
      description: "Descubra paraísos escondidos com a 9 Rocks Tours. Tours exclusivos, experiências únicas e aventuras que marcam para toda a vida.",
      keywords: "tours portugal, aventuras portugal, turismo portugal"
    },
    en: {
      title: "9 Rocks Tours - Epic Adventures in Portugal | Unforgettable Tours",
      description: "Discover hidden paradises with 9 Rocks Tours. Exclusive tours, unique experiences and adventures that last a lifetime.",
      keywords: "portugal tours, portugal adventures, portugal tourism"
    },
    es: {
      title: "9 Rocks Tours - Aventuras Épicas en Portugal | Tours Inolvidables", 
      description: "Descubre paraísos ocultos con 9 Rocks Tours. Tours exclusivos, experiencias únicas y aventuras que marcan para toda la vida.",
      keywords: "tours portugal, aventuras portugal, turismo portugal"
    }
  }
};

export const SEOHead = ({ page = 'home', customData = null }) => {
  const { currentLang, marketConfig, seoData, fetchSEOData } = useSEO();

  // 🔗 BUSCAR DADOS DO BACKEND
  useEffect(() => {
    if (!customData) {
      fetchSEOData(page);
    }
  }, [page, currentLang]);

  // 🎯 DADOS FINAIS (Backend > Custom > Fallback)
  const finalData = customData || 
                   seoData || 
                   FALLBACK_CONTENT[page]?.[currentLang] || 
                   FALLBACK_CONTENT.home[currentLang];

  // 🔗 URLs MULTILÍNGUE
  const currentUrl = `${SEO_CONFIG.baseUrl}${currentLang !== 'pt' ? `/${currentLang}` : ''}${window.location.pathname.replace(/^\/(en|es)/, '')}`;
  
  const alternateUrls = SEO_CONFIG.supportedLanguages.map(lang => {
    const cleanPath = window.location.pathname.replace(/^\/(en|es)/, '');
    return {
      lang,
      url: `${SEO_CONFIG.baseUrl}${lang !== 'pt' ? `/${lang}` : ''}${cleanPath}`
    };
  });

  // 📊 SCHEMA.ORG DINÂMICO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "name": "9 Rocks Tours",
    "description": finalData.description,
    "url": currentUrl,
    "logo": `${SEO_CONFIG.baseUrl}${SEO_CONFIG.images.logo}`,
    "image": `${SEO_CONFIG.baseUrl}${SEO_CONFIG.images.ogImage}`,
    "telephone": marketConfig.phone,
    "email": "info@9rocks.pt",
    "priceRange": "€€",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "PT",
      "addressRegion": marketConfig.region
    },
    "openingHours": marketConfig.businessHours,
    "sameAs": [
      "https://www.facebook.com/9rockstours",
      "https://www.instagram.com/9rockstours"
    ]
  };

  return (
    <Helmet>
      {/* 🎯 META TAGS FUNDAMENTAIS */}
      <title>{finalData.title}</title>
      <meta name="description" content={finalData.description} />
      <meta name="keywords" content={finalData.keywords} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={currentUrl} />
      
      {/* 🌍 HREFLANG TAGS */}
      {alternateUrls.map(({ lang, url }) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={SEO_CONFIG.baseUrl} />
      
      {/* 📱 OPEN GRAPH */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={finalData.title} />
      <meta property="og:description" content={finalData.description} />
      <meta property="og:image" content={`${SEO_CONFIG.baseUrl}${SEO_CONFIG.images.ogImage}`} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content="9 Rocks Tours" />
      <meta property="og:locale" content={currentLang === 'pt' ? 'pt_PT' : currentLang === 'en' ? 'en_US' : 'es_ES'} />
      
      {/* 🐦 TWITTER CARDS */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalData.title} />
      <meta name="twitter:description" content={finalData.description} />
      <meta name="twitter:image" content={`${SEO_CONFIG.baseUrl}${SEO_CONFIG.images.twitterCard}`} />
      
      {/* 🏪 SCHEMA.ORG */}
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
      
      {/* 🎨 PERFORMANCE */}
      <meta name="theme-color" content="#2563eb" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      
      {/* 🌐 LANGUAGE */}
      <html lang={currentLang === 'pt' ? 'pt-PT' : currentLang === 'es' ? 'es-ES' : 'en-US'} />
    </Helmet>
  );
};