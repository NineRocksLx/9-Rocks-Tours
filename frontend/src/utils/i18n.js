// Translation system for 9 Rocks Tours
// Supports Portuguese, English, and Spanish

const translations = {
  pt: {
    // Navigation & Header
    'nav.home': 'Início',
    'nav.tours': 'Tours',
    'nav.about': 'Sobre Nós',
    'nav.contact': 'Contacto',
    'nav.admin': 'Admin',
    
    // Homepage
    'home.title': '9 Rocks Tours',
    'home.subtitle': 'Descubra Portugal de forma autêntica',
    'home.description': 'Tours gastronômicos e culturais únicos pelos tesouros escondidos de Portugal',
    'home.cta': 'Explorar Tours',
    'home.featured_tours': 'Tours em Destaque',
    
    // Tour Types
    'tour.type.gastronomic': 'Gastronômico',
    'tour.type.cultural': 'Cultural', 
    'tour.type.mixed': 'Misto',
    'tour.type.custom': 'Personalizado',
    
    // Tour Details
    'tour.duration': 'Duração',
    'tour.price': 'Preço',
    'tour.participants': 'Participantes',
    'tour.location': 'Localização',
    'tour.includes': 'Incluído',
    'tour.excludes': 'Não incluído',
    'tour.route': 'Percurso',
    'tour.availability': 'Disponibilidade',
    'tour.book_now': 'Reservar Agora',
    'tour.view_details': 'Ver Detalhes',
    'tour.hours': 'horas',
    'tour.max_people': 'máx. pessoas',
    
    // Booking Form
    'booking.title': 'Reservar Tour',
    'booking.customer_name': 'Nome Completo',
    'booking.customer_email': 'Email',
    'booking.customer_phone': 'Telefone',
    'booking.selected_date': 'Data Selecionada',
    'booking.participants': 'Número de Participantes',
    'booking.special_requests': 'Pedidos Especiais',
    'booking.payment_method': 'Método de Pagamento',
    'booking.submit': 'Confirmar Reserva',
    'booking.total': 'Total',
    
    // Payment
    'payment.paypal': 'PayPal',
    'payment.multibanco': 'Multibanco',
    'payment.mbway': 'MBWay',
    'payment.credit_card': 'Cartão de Crédito',
    'payment.processing': 'A processar pagamento...',
    'payment.success': 'Pagamento realizado com sucesso!',
    'payment.error': 'Erro no pagamento. Tente novamente.',
    
    // Admin Panel
    'admin.title': 'Painel de Administração',
    'admin.login': 'Entrar',
    'admin.logout': 'Sair',
    'admin.tours': 'Gestão de Tours',
    'admin.bookings': 'Reservas',
    'admin.stats': 'Estatísticas',
    'admin.add_tour': 'Adicionar Tour',
    'admin.edit_tour': 'Editar Tour',
    'admin.delete_tour': 'Eliminar Tour',
    'admin.active': 'Ativo',
    'admin.inactive': 'Inativo',
    
    // Messages
    'message.success': 'Sucesso!',
    'message.error': 'Erro!',
    'message.loading': 'A carregar...',
    'message.no_tours': 'Não há tours disponíveis.',
    'message.book_success': 'Reserva realizada com sucesso!',
    
    // Common
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.back': 'Voltar',
    'common.next': 'Seguinte',
    'common.previous': 'Anterior',
    'common.close': 'Fechar',
    'common.yes': 'Sim',
    'common.no': 'Não',
    'common.try_again': 'Tentar Novamente'
  },
  
  en: {
    // Navigation & Header
    'nav.home': 'Home',
    'nav.tours': 'Tours',
    'nav.about': 'About Us',
    'nav.contact': 'Contact',
    'nav.admin': 'Admin',
    
    // Homepage
    'home.title': '9 Rocks Tours',
    'home.subtitle': 'Discover Portugal authentically',
    'home.description': 'Unique gastronomic and cultural tours through Portugal\'s hidden treasures',
    'home.cta': 'Explore Tours',
    'home.featured_tours': 'Featured Tours',
    
    // Tour Types
    'tour.type.gastronomic': 'Gastronomic',
    'tour.type.cultural': 'Cultural',
    'tour.type.mixed': 'Mixed',
    'tour.type.custom': 'Custom',
    
    // Tour Details
    'tour.duration': 'Duration',
    'tour.price': 'Price',
    'tour.participants': 'Participants',
    'tour.location': 'Location',
    'tour.includes': 'Included',
    'tour.excludes': 'Not included',
    'tour.route': 'Route',
    'tour.availability': 'Availability',
    'tour.book_now': 'Book Now',
    'tour.view_details': 'View Details',
    'tour.hours': 'hours',
    'tour.max_people': 'max people',
    
    // Booking Form
    'booking.title': 'Book Tour',
    'booking.customer_name': 'Full Name',
    'booking.customer_email': 'Email',
    'booking.customer_phone': 'Phone',
    'booking.selected_date': 'Selected Date',
    'booking.participants': 'Number of Participants',
    'booking.special_requests': 'Special Requests',
    'booking.payment_method': 'Payment Method',
    'booking.submit': 'Confirm Booking',
    'booking.total': 'Total',
    
    // Payment
    'payment.paypal': 'PayPal',
    'payment.multibanco': 'Multibanco',
    'payment.mbway': 'MBWay',
    'payment.credit_card': 'Credit Card',
    'payment.processing': 'Processing payment...',
    'payment.success': 'Payment successful!',
    'payment.error': 'Payment error. Please try again.',
    
    // Admin Panel
    'admin.title': 'Administration Panel',
    'admin.login': 'Login',
    'admin.logout': 'Logout',
    'admin.tours': 'Tour Management',
    'admin.bookings': 'Bookings',
    'admin.stats': 'Statistics',
    'admin.add_tour': 'Add Tour',
    'admin.edit_tour': 'Edit Tour',
    'admin.delete_tour': 'Delete Tour',
    'admin.active': 'Active',
    'admin.inactive': 'Inactive',
    
    // Messages
    'message.success': 'Success!',
    'message.error': 'Error!',
    'message.loading': 'Loading...',
    'message.no_tours': 'No tours available.',
    'message.book_success': 'Booking successful!',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.close': 'Close',
    'common.yes': 'Yes',
    'common.no': 'No'
  },
  
  es: {
    // Navigation & Header
    'nav.home': 'Inicio',
    'nav.tours': 'Tours',
    'nav.about': 'Sobre Nosotros',
    'nav.contact': 'Contacto',
    'nav.admin': 'Admin',
    
    // Homepage
    'home.title': '9 Rocks Tours',
    'home.subtitle': 'Descubre Portugal auténticamente',
    'home.description': 'Tours gastronómicos y culturales únicos por los tesoros escondidos de Portugal',
    'home.cta': 'Explorar Tours',
    'home.featured_tours': 'Tours Destacados',
    
    // Tour Types
    'tour.type.gastronomic': 'Gastronómico',
    'tour.type.cultural': 'Cultural',
    'tour.type.mixed': 'Mixto',
    'tour.type.custom': 'Personalizado',
    
    // Tour Details
    'tour.duration': 'Duración',
    'tour.price': 'Precio',
    'tour.participants': 'Participantes',
    'tour.location': 'Ubicación',
    'tour.includes': 'Incluido',
    'tour.excludes': 'No incluido',
    'tour.route': 'Ruta',
    'tour.availability': 'Disponibilidad',
    'tour.book_now': 'Reservar Ahora',
    'tour.view_details': 'Ver Detalles',
    'tour.hours': 'horas',
    'tour.max_people': 'máx. personas',
    
    // Booking Form
    'booking.title': 'Reservar Tour',
    'booking.customer_name': 'Nombre Completo',
    'booking.customer_email': 'Email',
    'booking.customer_phone': 'Teléfono',
    'booking.selected_date': 'Fecha Seleccionada',
    'booking.participants': 'Número de Participantes',
    'booking.special_requests': 'Solicitudes Especiales',
    'booking.payment_method': 'Método de Pago',
    'booking.submit': 'Confirmar Reserva',
    'booking.total': 'Total',
    
    // Payment
    'payment.paypal': 'PayPal',
    'payment.multibanco': 'Multibanco',
    'payment.mbway': 'MBWay',
    'payment.credit_card': 'Tarjeta de Crédito',
    'payment.processing': 'Procesando pago...',
    'payment.success': '¡Pago exitoso!',
    'payment.error': 'Error en el pago. Inténtalo de nuevo.',
    
    // Admin Panel
    'admin.title': 'Panel de Administración',
    'admin.login': 'Entrar',
    'admin.logout': 'Salir',
    'admin.tours': 'Gestión de Tours',
    'admin.bookings': 'Reservas',
    'admin.stats': 'Estadísticas',
    'admin.add_tour': 'Añadir Tour',
    'admin.edit_tour': 'Editar Tour',
    'admin.delete_tour': 'Eliminar Tour',
    'admin.active': 'Activo',
    'admin.inactive': 'Inactivo',
    
    // Messages
    'message.success': '¡Éxito!',
    'message.error': '¡Error!',
    'message.loading': 'Cargando...',
    'message.no_tours': 'No hay tours disponibles.',
    'message.book_success': '¡Reserva exitosa!',
    
    // Common
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.back': 'Volver',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
    'common.close': 'Cerrar',
    'common.yes': 'Sí',
    'common.no': 'No'
  }
};

// Language management utility
class I18n {
  constructor() {
    this.currentLanguage = this.getStoredLanguage() || 'pt';
    this.supportedLanguages = ['pt', 'en', 'es'];
  }

  getStoredLanguage() {
    return localStorage.getItem('9rocks_language');
  }

  setLanguage(lang) {
    if (this.supportedLanguages.includes(lang)) {
      this.currentLanguage = lang;
      localStorage.setItem('9rocks_language', lang);
      // Trigger language change event
      document.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
    }
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  t(key, replacements = {}) {
    const keys = key.split('.');
    let value = translations[this.currentLanguage];
    
    for (const k of keys) {
      value = value && value[k];
    }
    
    if (!value) {
      // Fallback to English, then Portuguese
      value = translations['en'];
      for (const k of keys) {
        value = value && value[k];
      }
      
      if (!value) {
        value = translations['pt'];
        for (const k of keys) {
          value = value && value[k];
        }
      }
    }
    
    // Apply replacements
    if (value && typeof value === 'string') {
      Object.keys(replacements).forEach(placeholder => {
        value = value.replace(`{${placeholder}}`, replacements[placeholder]);
      });
    }
    
    return value || key;
  }

  getLanguageFlag(lang) {
    const flags = {
      'pt': '🇵🇹',
      'en': '🇬🇧', 
      'es': '🇪🇸'
    };
    return flags[lang] || '🏳️';
  }

  getLanguageName(lang) {
    const names = {
      'pt': 'Português',
      'en': 'English',
      'es': 'Español'
    };
    return names[lang] || lang;
  }
}

// Create global instance
const i18n = new I18n();

// Export for use in React components
export default i18n;
export { translations };