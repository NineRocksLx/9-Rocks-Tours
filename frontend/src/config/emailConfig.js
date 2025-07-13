// frontend/src/config/emailConfig.js
export const EMAIL_CONFIG = {
  // ✅ Emails de reserva por idioma (CRIADOS)
  booking: {
    pt: 'reserva@9rocks.pt',
    en: 'booking@9rocks.pt', 
    es: 'reservas@9rocks.pt'
  },
  
  // ✅ Emails de informação geral (CRIADOS)
  info: {
    pt: 'info@9rocks.pt',
    en: 'hello@9rocks.pt',
    es: 'hola@9rocks.pt'
  },
  
  // ✅ Emails de tours (CRIADOS)
  tours: {
    pt: 'tours@9rocks.pt',
    en: 'tours-en@9rocks.pt', 
    es: 'tours-es@9rocks.pt'
  },
  
  // ✅ Emails técnicos (CRIADOS)
  technical: {
    support: 'support@9rocks.pt',
    noreply: 'noreply@9rocks.pt',
    admin: 'geral@9rocks.pt' // Email principal
  },
  
  // 🎨 Configurações de email por idioma
  signatures: {
    pt: {
      name: '9 Rocks Tours',
      tagline: 'Descubra Portugal connosco',
      phone: '+351 xxx xxx xxx',
      website: 'https://9rockstours.com',
      social: {
        instagram: '@9rockstours',
        facebook: '9RocksTours'
      }
    },
    en: {
      name: '9 Rocks Tours', 
      tagline: 'Discover Portugal with us',
      phone: '+351 xxx xxx xxx',
      website: 'https://9rockstours.com/en',
      social: {
        instagram: '@9rockstours',
        facebook: '9RocksTours'
      }
    },
    es: {
      name: '9 Rocks Tours',
      tagline: 'Descubre Portugal con nosotros', 
      phone: '+351 xxx xxx xxx',
      website: 'https://9rockstours.com/es',
      social: {
        instagram: '@9rockstours',
        facebook: '9RocksTours'
      }
    }
  },

  // 📧 Configurações para diferentes tipos de email
  emailTypes: {
    booking_confirmation: {
      priority: 'high',
      category: 'primary',
      autoReply: true
    },
    contact_form: {
      priority: 'normal', 
      category: 'social',
      autoReply: true
    },
    tour_inquiry: {
      priority: 'high',
      category: 'primary', 
      autoReply: true
    },
    newsletter: {
      priority: 'low',
      category: 'promotions',
      autoReply: false
    }
  }
};

// 🔧 Função helper para obter email correto
export const getEmailByLanguage = (type, language = 'pt') => {
  return EMAIL_CONFIG[type]?.[language] || EMAIL_CONFIG[type]?.pt;
};

// 📨 Templates de email por idioma
export const EMAIL_TEMPLATES = {
  booking_confirmation: {
    pt: {
      subject: 'Reserva Confirmada - 9 Rocks Tours',
      from: EMAIL_CONFIG.booking.pt,
      replyTo: EMAIL_CONFIG.booking.pt,
      template: 'booking_confirmation_pt',
      autoReply: 'Obrigado pelo seu email! Responderemos em até 24 horas. 🇵🇹'
    },
    en: {
      subject: 'Booking Confirmed - 9 Rocks Tours', 
      from: EMAIL_CONFIG.booking.en,
      replyTo: EMAIL_CONFIG.booking.en,
      template: 'booking_confirmation_en',
      autoReply: 'Thank you for your email! We\'ll respond within 24 hours. 🇬🇧'
    },
    es: {
      subject: 'Reserva Confirmada - 9 Rocks Tours',
      from: EMAIL_CONFIG.booking.es,
      replyTo: EMAIL_CONFIG.booking.es, 
      template: 'booking_confirmation_es',
      autoReply: '¡Gracias por su email! Responderemos en 24 horas. 🇪🇸'
    }
  },
  
  contact_form: {
    pt: {
      subject: 'Nova Mensagem do Site - 9 Rocks Tours',
      from: EMAIL_CONFIG.info.pt,
      replyTo: EMAIL_CONFIG.info.pt,
      to: EMAIL_CONFIG.technical.admin,
      autoReply: 'Obrigado pelo contacto! Responderemos brevemente. 🇵🇹'
    },
    en: {
      subject: 'New Website Message - 9 Rocks Tours',
      from: EMAIL_CONFIG.info.en,
      replyTo: EMAIL_CONFIG.info.en,
      to: EMAIL_CONFIG.technical.admin,
      autoReply: 'Thank you for contacting us! We\'ll respond soon. 🇬🇧'  
    },
    es: {
      subject: 'Nuevo Mensaje del Sitio Web - 9 Rocks Tours',
      from: EMAIL_CONFIG.info.es,
      replyTo: EMAIL_CONFIG.info.es,
      to: EMAIL_CONFIG.technical.admin,
      autoReply: '¡Gracias por contactarnos! Responderemos pronto. 🇪🇸'
    }
  },

  tour_inquiry: {
    pt: {
      subject: 'Consulta sobre Tour - 9 Rocks Tours',
      from: EMAIL_CONFIG.tours.pt,
      replyTo: EMAIL_CONFIG.tours.pt,
      to: EMAIL_CONFIG.technical.admin,
      autoReply: 'Obrigado pelo interesse! Enviaremos informações detalhadas em breve. 🇵🇹'
    },
    en: {
      subject: 'Tour Inquiry - 9 Rocks Tours',
      from: EMAIL_CONFIG.tours.en, 
      replyTo: EMAIL_CONFIG.tours.en,
      to: EMAIL_CONFIG.technical.admin,
      autoReply: 'Thank you for your interest! We\'ll send detailed information soon. 🇬🇧'
    },
    es: {
      subject: 'Consulta sobre Tour - 9 Rocks Tours',
      from: EMAIL_CONFIG.tours.es,
      replyTo: EMAIL_CONFIG.tours.es,
      to: EMAIL_CONFIG.technical.admin,
      autoReply: '¡Gracias por su interés! Enviaremos información detallada pronto. 🇪🇸'
    }
  }
};

// 🎯 Função para gerar configuração de email baseada no contexto
export const generateEmailConfig = (type, language, customData = {}) => {
  const template = EMAIL_TEMPLATES[type]?.[language];
  const signature = EMAIL_CONFIG.signatures[language];
  
  if (!template) {
    console.warn(`Email template not found for type: ${type}, language: ${language}`);
    return null;
  }

  return {
    from: template.from,
    replyTo: template.replyTo,
    to: customData.to || template.to,
    subject: customData.subject || template.subject,
    language: language,
    signature: signature,
    autoReply: template.autoReply,
    priority: EMAIL_CONFIG.emailTypes[type]?.priority || 'normal',
    category: EMAIL_CONFIG.emailTypes[type]?.category || 'primary',
    ...customData
  };
};

// 📊 Função para tracking de emails por idioma
export const trackEmailEvent = (type, language, additionalData = {}) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'email_sent', {
      email_type: type,
      language: language,
      email_from: getEmailByLanguage(type === 'booking_confirmation' ? 'booking' : 'info', language),
      ...additionalData
    });
  }
  
  console.log(`📧 Email tracked: ${type} (${language})`, additionalData);
};