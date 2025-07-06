// frontend/src/components/SEOHead.js - VERSÃO OTIMIZADA 🚀
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useTranslation } from '../utils/useTranslation';

const SEOHead = ({ 
  title, 
  description, 
  lang, 
  ogImage = '/images/9rocks-tours-og.jpg',
  tourSchema = null,
  keywords = null,
  noindex = false
}) => {
  const location = useLocation();
  const { t, getCurrentLanguage } = useTranslation();
  
  // 🔧 CONFIGURAÇÃO DINÂMICA
  const baseUrl = process.env.REACT_APP_BASE_URL || "https://9rocks.pt";
  const currentUrl = `${baseUrl}${location.pathname}`;
  const currentLang = lang || getCurrentLanguage();
  
  // 🚀 GERAÇÃO URLS MAIS ROBUSTA
  const generateAlternateUrls = () => {
    const cleanPath = location.pathname.replace(/^\/(en|es)/, '') || '/';
    
    return [
      { lang: 'pt', href: `${baseUrl}${cleanPath}` },
      { lang: 'en', href: `${baseUrl}/en${cleanPath}` },
      { lang: 'es', href: `${baseUrl}/es${cleanPath}` }
    ];
  };
  
  const alternateLangs = generateAlternateUrls();
  
  // 🎯 TITLE E DESCRIPTION OTIMIZADOS PARA CONVERSÃO
  const optimizedTitle = title || `${t('seo_default_title')} | 9 Rocks Tours`;
  const optimizedDescription = description || t('seo_default_description');
  
  // 📊 KEYWORDS INTELIGENTES
  const defaultKeywords = {
    pt: 'tours portugal, tours lisboa, tours porto, tours sintra, tours gastronómicos portugal, tours culturais portugal',
    en: 'portugal tours, lisbon tours, porto tours, sintra tours, gastronomic tours portugal, cultural tours portugal',
    es: 'tours portugal, tours lisboa, tours oporto, tours sintra, tours gastronómicos portugal, tours culturales portugal'
  };
  
  const seoKeywords = keywords || defaultKeywords[currentLang];
  
  // 🌍 LOCALE MAPPING
  const localeMap = {
    pt: 'pt_PT',
    en: 'en_US', 
    es: 'es_ES'
  };

  return (
    <Helmet>
      {/* 🧠 SEO BÁSICO COMPLETO */}
      <html lang={currentLang} />
      <title>{optimizedTitle}</title>
      <meta name="description" content={optimizedDescription} />
      <meta name="keywords" content={seoKeywords} />
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* 🤖 ROBOTS */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      )}
      
      {/* 🔗 CANONICAL E HREFLANG */}
      <link rel="canonical" href={currentUrl} />
      {alternateLangs.map((alt) => (
        <link 
          rel="alternate" 
          hreflang={alt.lang} 
          href={alt.href} 
          key={alt.lang} 
        />
      ))}
      <link rel="alternate" hreflang="x-default" href={alternateLangs[0].href} />
      
      {/* 📱 OPEN GRAPH (CONVERSÃO REDES SOCIAIS) */}
      <meta property="og:title" content={optimizedTitle} />
      <meta property="og:description" content={optimizedDescription} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={`${baseUrl}${ogImage}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={localeMap[currentLang]} />
      <meta property="og:site_name" content="9 Rocks Tours" />
      
      {/* 🐦 TWITTER CARDS */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={optimizedTitle} />
      <meta name="twitter:description" content={optimizedDescription} />
      <meta name="twitter:image" content={`${baseUrl}${ogImage}`} />
      <meta name="twitter:site" content="@9RocksTours" />
      
      {/* 📊 STRUCTURED DATA (se for tour) */}
      {tourSchema && (
        <script type="application/ld+json">
          {JSON.stringify(tourSchema)}
        </script>
      )}
      
      {/* ⚡ PERFORMANCE HINTS */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
      
      {/* 🔍 BUSINESS INFO MICRO-DATA */}
      <meta name="author" content="9 Rocks Tours" />
      <meta name="company" content="9 Rocks Tours" />
      <meta name="geo.region" content="PT" />
      <meta name="geo.placename" content="Lisboa, Portugal" />
      
      {/* 📱 MOBILE OPTIMIZATION */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* 🎨 THEME COLORS */}
      <meta name="theme-color" content="#4F46E5" />
      <meta name="msapplication-navbutton-color" content="#4F46E5" />
      <meta name="apple-mobile-web-app-status-bar-style" content="#4F46E5" />
    </Helmet>
  );
};

export default SEOHead;