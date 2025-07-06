// frontend/src/utils/seoHelpers.js - HELPERS SEO COMPLETOS 🎯

// 📊 SCHEMA.ORG GENERATORS
export const generateTourSchema = (tour, lang = 'pt') => {
  const baseUrl = process.env.REACT_APP_BASE_URL || "https://9rockstours.com";
  
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "name": tour.name[lang] || tour.name.pt,
    "description": tour.description[lang] || tour.description.pt,
    "url": `${baseUrl}/${lang === 'pt' ? '' : lang + '/'}tour/${tour.id}`,
    "image": tour.images?.[0] ? `${baseUrl}${tour.images[0]}` : `${baseUrl}/images/9rocks-tours-og.jpg`,
    "offers": {
      "@type": "Offer",
      "price": tour.price,
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock",
      "validFrom": new Date().toISOString(),
      "seller": {
        "@type": "Organization",
        "name": "9 Rocks Tours",
        "url": baseUrl
      }
    },
    "provider": {
      "@type": "Organization",
      "name": "9 Rocks Tours",
      "url": baseUrl,
      "logo": `${baseUrl}/images/9rocks-logo.png`,
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+351 96 3366 458",
        "contactType": "customer service",
        "availableLanguage": ["Portuguese", "English", "Spanish"]
      }
    },
    "duration": `PT${tour.duration_hours}H`,
    "touristType": "Individual",
    "maximumAttendeeCapacity": tour.max_participants,
    "location": {
      "@type": "Place",
      "name": tour.location,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "PT",
        "addressRegion": tour.location
      }
    },
    "category": tour.tour_type,
    "startDate": tour.availability_dates?.[0],
    "endDate": tour.availability_dates?.[tour.availability_dates.length - 1]
  };
};

// 🏢 ORGANIZATION SCHEMA
export const generateOrganizationSchema = () => {
  const baseUrl = process.env.REACT_APP_BASE_URL || "https://9rockstours.com";
  
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "name": "9 Rocks Tours",
    "url": baseUrl,
    "logo": `${baseUrl}/images/9rocks-logo.png`,
    "image": `${baseUrl}/images/9rocks-tours-og.jpg`,
    "description": "Tours gastronómicos e culturais únicos pelos tesouros escondidos de Portugal",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "PT",
      "addressRegion": "Lisboa",
      "addressLocality": "Lisboa"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+351 96 3366 458",
      "contactType": "customer service",
      "availableLanguage": ["Portuguese", "English", "Spanish"],
      "areaServed": "PT"
    },
    "sameAs": [
      "https://www.instagram.com/9rockstours",
      "https://www.facebook.com/9rockstours"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Tours in Portugal",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "TouristTrip",
            "name": "Cultural Tours Portugal"
          }
        },
        {
          "@type": "Offer", 
          "itemOffered": {
            "@type": "TouristTrip",
            "name": "Gastronomic Tours Portugal"
          }
        }
      ]
    }
  };
};

// 🍞 BREADCRUMB SCHEMA
export const generateBreadcrumbSchema = (breadcrumbs, lang = 'pt') => {
  const baseUrl = process.env.REACT_APP_BASE_URL || "https://9rockstours.com";
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": `${baseUrl}${crumb.url}`
    }))
  };
};

// 🎯 META TAGS GENERATORS
export const generatePageTitle = (pageTitle, lang = 'pt') => {
  const siteName = "9 Rocks Tours";
  const brandSuffix = {
    pt: " | Tours Autênticos em Portugal",
    en: " | Authentic Tours in Portugal", 
    es: " | Tours Auténticos en Portugal"
  };
  
  if (!pageTitle) {
    return siteName + brandSuffix[lang];
  }
  
  return `${pageTitle}${brandSuffix[lang]}`;
};

export const generateMetaDescription = (description, lang = 'pt') => {
  const defaults = {
    pt: "Descubra Portugal como um local com os nossos tours gastronómicos e culturais únicos. Grupos pequenos, experiências autênticas em Lisboa, Porto, Sintra e mais.",
    en: "Discover Portugal like a local with our unique gastronomic and cultural tours. Small groups, authentic experiences in Lisbon, Porto, Sintra and more.",
    es: "Descubre Portugal como un local con nuestros tours gastronómicos y culturales únicos. Grupos pequeños, experiencias auténticas en Lisboa, Oporto, Sintra y más."
  };
  
  return description || defaults[lang];
};

// 🔗 URL HELPERS
export const generateCleanUrl = (path, lang = 'pt') => {
  const baseUrl = process.env.REACT_APP_BASE_URL || "https://9rockstours.com";
  
  if (lang === 'pt') {
    return `${baseUrl}${path}`;
  }
  
  return `${baseUrl}/${lang}${path}`;
};

export const generateAlternateUrls = (path) => {
  const baseUrl = process.env.REACT_APP_BASE_URL || "https://9rockstours.com";
  
  return {
    pt: `${baseUrl}${path}`,
    en: `${baseUrl}/en${path}`,
    es: `${baseUrl}/es${path}`
  };
};

// 📱 SOCIAL SHARING HELPERS
export const generateSocialShareUrls = (url, title, description) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%20${encodedUrl}`
  };
};

// 🎨 OG IMAGE GENERATOR (opcional)
export const generateOGImageUrl = (title, type = 'tour') => {
  const baseUrl = process.env.REACT_APP_BASE_URL || "https://9rockstours.com";
  
  // Se tiveres um serviço de geração de imagens OG dinâmicas
  // return `${baseUrl}/api/og?title=${encodeURIComponent(title)}&type=${type}`;
  
  // Por agora, retornar imagem estática baseada no tipo
  const ogImages = {
    tour: '/images/og-tour.jpg',
    homepage: '/images/og-homepage.jpg', 
    tours: '/images/og-tours.jpg',
    about: '/images/og-about.jpg',
    contact: '/images/og-contact.jpg'
  };
  
  return `${baseUrl}${ogImages[type] || ogImages.tour}`;
};

// 🔍 STRUCTURED DATA VALIDATION
export const validateSchema = (schema) => {
  try {
    JSON.stringify(schema);
    return true;
  } catch (error) {
    console.error('Invalid schema:', error);
    return false;
  }
};

// 📊 SEO ANALYTICS HELPERS
export const trackPageView = (url, title) => {
  if (typeof gtag !== 'undefined') {
    gtag('config', 'GA_MEASUREMENT_ID', {
      page_title: title,
      page_location: url
    });
  }
};

export const trackSEOEvent = (action, category = 'SEO') => {
  if (typeof gtag !== 'undefined') {
    gtag('event', action, {
      event_category: category,
      event_label: window.location.pathname
    });
  }
};