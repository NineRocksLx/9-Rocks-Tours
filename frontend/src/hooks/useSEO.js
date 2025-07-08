// frontend/src/hooks/useSEO.js - VERSÃO CORRIGIDA E FINAL

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../utils/useTranslation';
import {
  generatePageTitle,
  generateMetaDescription,
  generateTourSchema,
  generateOrganizationSchema,
  generateBreadcrumbSchema,
  generateOGImageUrl,
  trackPageView
} from '../utils/seoHelpers';

export const useSEO = ({
  title,
  description,
  type = 'website',
  tour = null,
  breadcrumbs = [],
  keywords = null,
  noindex = false
}) => {
  const location = useLocation();
  const { getCurrentLanguage } = useTranslation();
  const [seoData, setSeoData] = useState(null);
  
  const currentLang = getCurrentLanguage();
  const baseUrl = process.env.REACT_APP_BASE_URL || "https://9rockstours.com";
  const currentUrl = `${baseUrl}${location.pathname}`;

  useEffect(() => {
    const optimizedTitle = generatePageTitle(title, currentLang);
    const optimizedDescription = generateMetaDescription(description, currentLang);
    const ogImage = generateOGImageUrl(title, type);
    
    let structuredData = [generateOrganizationSchema()];
    
    if (tour) {
      structuredData.push(generateTourSchema(tour, currentLang));
    }
    if (breadcrumbs.length > 0) {
      structuredData.push(generateBreadcrumbSchema(breadcrumbs, currentLang));
    }
    
    const seoConfig = {
      title: optimizedTitle,
      description: optimizedDescription,
      lang: currentLang,
      ogImage,
      keywords,
      noindex,
      structuredData,
      url: currentUrl,
      type
    };
    
    setSeoData(seoConfig);
    
    trackPageView(currentUrl, optimizedTitle);

  }, [title, description, currentLang, location.pathname, tour, type, breadcrumbs, keywords, noindex]);

  return seoData;
};

// 🎯 HOOK ESPECÍFICO PARA TOURS (COM A CORREÇÃO APLICADA)
export const useTourSEO = (tour) => {
  const { getCurrentLanguage } = useTranslation();
  const currentLang = getCurrentLanguage();
  
  // ==================================================================
  // A CORREÇÃO CRÍTICA ESTÁ AQUI:
  // 1. A linha `if (!tour) return null;` foi REMOVIDA.
  // 2. Definimos valores padrão para que o hook funcione mesmo que `tour` seja nulo no início.
  // ==================================================================
  
  const tourTitle = tour ? (tour.name[currentLang] || tour.name.pt) : 'A carregar Tour...';
  const tourDescription = tour ? (tour.short_description[currentLang] || tour.short_description.pt) : '';
  
  const breadcrumbs = tour ? [
    { name: 'Home', url: currentLang === 'pt' ? '/' : `/${currentLang}/` },
    { name: 'Tours', url: currentLang === 'pt' ? '/tours' : `/${currentLang}/tours` },
    { name: tourTitle, url: `/tour/${tour.id}` }
  ] : [];
  
  const tourKeywords = tour ? {
    pt: `${tourTitle}, tour ${tour.location}, ${tour.tour_type} portugal, tours portugal`,
    en: `${tourTitle}, ${tour.location} tour, ${tour.tour_type} portugal, portugal tours`,
    es: `${tourTitle}, tour ${tour.location}, ${tour.tour_type} portugal, tours portugal`
  } : {};

  // O hook `useSEO` é agora chamado em todas as renderizações, resolvendo o erro.
  return useSEO({
    title: tourTitle,
    description: tourDescription,
    type: 'tour',
    tour,
    breadcrumbs,
    keywords: tourKeywords[currentLang] || ''
  });
};

// O resto dos hooks permanece igual
export const useHomeSEO = () => {
  const { t, getCurrentLanguage } = useTranslation();
  const currentLang = getCurrentLanguage();
  
  const homeTitle = {
    pt: "Tours Autênticos em Portugal",
    en: "Authentic Tours in Portugal", 
    es: "Tours Auténticos en Portugal"
  };
  
  const homeDescription = {
    pt: "Descubra Portugal como um local com tours gastronómicos e culturais únicos. Grupos pequenos, experiências autênticas em Lisboa, Porto, Sintra e Fátima.",
    en: "Discover Portugal like a local with unique gastronomic and cultural tours. Small groups, authentic experiences in Lisbon, Porto, Sintra and Fatima.",
    es: "Descubre Portugal como un local con tours gastronómicos y culturales únicos. Grupos pequeños, experiencias auténticas en Lisboa, Oporto, Sintra y Fátima."
  };

  return useSEO({
    title: homeTitle[currentLang],
    description: homeDescription[currentLang],
    type: 'homepage'
  });
};

export const useToursPageSEO = () => {
  const { getCurrentLanguage } = useTranslation();
  const currentLang = getCurrentLanguage();
  
  const toursTitle = {
    pt: "Todos os Tours em Portugal",
    en: "All Tours in Portugal",
    es: "Todos los Tours en Portugal"
  };
  
  const toursDescription = {
    pt: "Explore todos os nossos tours gastronómicos e culturais por Portugal. Lisboa, Porto, Sintra, Fátima e mais destinos únicos.",
    en: "Explore all our gastronomic and cultural tours through Portugal. Lisbon, Porto, Sintra, Fatima and more unique destinations.",
    es: "Explora todos nuestros tours gastronómicos y culturales por Portugal. Lisboa, Oporto, Sintra, Fátima y más destinos únicos."
  };
  
  const breadcrumbs = [
    { name: 'Home', url: currentLang === 'pt' ? '/' : `/${currentLang}/` },
    { name: 'Tours', url: currentLang === 'pt' ? '/tours' : `/${currentLang}/tours` }
  ];

  return useSEO({
    title: toursTitle[currentLang],
    description: toursDescription[currentLang],
    type: 'tours',
    breadcrumbs
  });
};

export const useContactSEO = () => {
  const { getCurrentLanguage } = useTranslation();
  const currentLang = getCurrentLanguage();
  
  const contactTitle = {
    pt: "Contacto - 9 Rocks Tours",
    en: "Contact - 9 Rocks Tours",
    es: "Contacto - 9 Rocks Tours"
  };
  
  const contactDescription = {
    pt: "Entre em contacto connosco para reservar o seu tour em Portugal. Telefone, email e WhatsApp disponíveis. Respostas rápidas garantidas.",
    en: "Contact us to book your tour in Portugal. Phone, email and WhatsApp available. Fast responses guaranteed.",
    es: "Contáctanos para reservar tu tour en Portugal. Teléfono, email y WhatsApp disponibles. Respuestas rápidas garantizadas."
  };

  return useSEO({
    title: contactTitle[currentLang],
    description: contactDescription[currentLang],
    type: 'contact'
  });
};

export default useSEO;