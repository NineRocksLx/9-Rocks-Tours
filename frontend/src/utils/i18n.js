// Translation system for 9 Rocks Tours
// Supports Portuguese, English, and Spanish

const translations = {
  pt: {
    // Navigation & Header
    'nav_home': 'Início',
    'nav_tours': 'Tours',
    'nav_about': 'Sobre Nós',
    'nav_contact': 'Contacto',
    'nav_admin': 'Admin',
    
    // Homepage
    'home_title': '9 Rocks Tours',
    'home_subtitle': 'Descubra Portugal de forma autêntica',
    'home_description': 'Tours gastronômicos e culturais únicos pelos tesouros escondidos de Portugal',
    'home_cta': 'Explorar Tours',
    'home_featured_tours': 'Tours em Destaque',
    
    // Tour Types
    'tour_type_gastronomic': 'Gastronômico',
    'tour_type_cultural': 'Cultural', 
    'tour_type_mixed': 'Misto',
    'tour_type_custom': 'Personalizado',
    
    // Tour Details
    'tour_duration': 'Duração',
    'tour_price': 'Preço',
    'tour_participants': 'Participantes',
    'tour_location': 'Localização',
    'tour_includes': 'Incluído',
    'tour_excludes': 'Não incluído',
    'tour_route': 'Percurso',
    'tour_availability': 'Disponibilidade',
    'tour_book_now': 'Reservar Agora',
    'tour_view_details': 'Ver Detalhes',
    'tour_hours': 'horas',
    'tour_max_people': 'máx. pessoas',
    
    // Booking Form
    'booking_title': 'Reservar Tour',
    'booking_customer_name': 'Nome Completo',
    'booking_customer_email': 'Email',
    'booking_customer_phone': 'Telefone',
    'booking_selected_date': 'Data Selecionada',
    'booking_participants': 'Número de Participantes',
    'booking_special_requests': 'Pedidos Especiais',
    'booking_payment_method': 'Método de Pagamento',
    'booking_submit': 'Confirmar Reserva',
    'booking_total': 'Total',
    
    // Payment
    'payment_paypal': 'PayPal',
    'payment_multibanco': 'Multibanco',
    'payment_mbway': 'MBWay',
    'payment_credit_card': 'Cartão de Crédito',
    'payment_processing': 'A processar pagamento...',
    'payment_success': 'Pagamento realizado com sucesso!',
    'payment_error': 'Erro no pagamento. Tente novamente.',
    
    // Admin Panel
    'admin_title': 'Painel de Administração',
    'admin_login': 'Entrar',
    'admin_logout': 'Sair',
    'admin_tours': 'Gestão de Tours',
    'admin_bookings': 'Reservas',
    'admin_stats': 'Estatísticas',
    'admin_add_tour': 'Adicionar Tour',
    'admin_edit_tour': 'Editar Tour',
    'admin_delete_tour': 'Eliminar Tour',
    'admin_active': 'Ativo',
    'admin_inactive': 'Inativo',
    
    // Messages
    'message_success': 'Sucesso!',
    'message_error': 'Erro!',
    'message_loading': 'A carregar...',
    'message_no_tours': 'Não há tours disponíveis.',
    'message_book_success': 'Reserva realizada com sucesso!',

      // PT - Adicionar estas chaves:
    'tour_description': 'Descrição',
    'tour_route': 'Percurso',
    'tour_included': 'Incluído',
    'tour_not_included': 'Não Incluído',
    'tour_per_person': 'por pessoa',
    'tour_no_dates_available': 'Sem datas disponíveis no momento',
    'tour_instant_confirmation': 'Confirmação imediata',
    'tour_free_cancellation': 'Cancelamento gratuito até 24h antes',
    'tour_professional_guide': 'Guia profissional',
    'tour_reserve_now': 'Reservar Agora',
    'tour_select_date': 'Selecione uma data',
    'tour_person': 'pessoa',
    'tour_people': 'pessoas',
    
    // Common
    'common_save': 'Guardar',
    'common_cancel': 'Cancelar',
    'common_delete': 'Eliminar',
    'common_edit': 'Editar',
    'common_back': 'Voltar',
    'common_next': 'Seguinte',
    'common_previous': 'Anterior',
    'common_close': 'Fechar',
    'common_yes': 'Sim',
    'common_no': 'Não',
    'common_try_again': 'Tentar Novamente'
  },
  
  en: {
    // Navigation & Header
    'nav_home': 'Home',
    'nav_tours': 'Tours',
    'nav_about': 'About Us',
    'nav_contact': 'Contact',
    'nav_admin': 'Admin',
    
    // Homepage
    'home_title': '9 Rocks Tours',
    'home_subtitle': 'Discover Portugal authentically',
    'home_description': 'Unique gastronomic and cultural tours through Portugal\'s hidden treasures',
    'home_cta': 'Explore Tours',
    'home_featured_tours': 'Featured Tours',
    
    // Tour Types
    'tour_type_gastronomic': 'Gastronomic',
    'tour_type_cultural': 'Cultural',
    'tour_type_mixed': 'Mixed',
    'tour_type_custom': 'Custom',
    
    // Tour Details
    'tour_duration': 'Duration',
    'tour_price': 'Price',
    'tour_participants': 'Participants',
    'tour_location': 'Location',
    'tour_includes': 'Included',
    'tour_excludes': 'Not included',
    'tour_route': 'Route',
    'tour_availability': 'Availability',
    'tour_book_now': 'Book Now',
    'tour_view_details': 'View Details',
    'tour_hours': 'hours',
    'tour_max_people': 'max people',
    
    // Booking Form
    'booking_title': 'Book Tour',
    'booking_customer_name': 'Full Name',
    'booking_customer_email': 'Email',
    'booking_customer_phone': 'Phone',
    'booking_selected_date': 'Selected Date',
    'booking_participants': 'Number of Participants',
    'booking_special_requests': 'Special Requests',
    'booking_payment_method': 'Payment Method',
    'booking_submit': 'Confirm Booking',
    'booking_total': 'Total',

    'tour_description': 'Description',
    'tour_route': 'Route',
    'tour_included': 'Included',
    'tour_not_included': 'Not Included',
    'tour_per_person': 'per person',
    'tour_no_dates_available': 'No available dates at the moment',
    'tour_instant_confirmation': 'Instant confirmation',
    'tour_free_cancellation': 'Free cancellation up to 24h before',
    'tour_professional_guide': 'Professional guide',
    'tour_reserve_now': 'Book Now',
    'tour_select_date': 'Select a date',
    'tour_person': 'person',
    'tour_people': 'people',
    
    // Payment
    'payment_paypal': 'PayPal',
    'payment_multibanco': 'Multibanco',
    'payment_mbway': 'MBWay',
    'payment_credit_card': 'Credit Card',
    'payment_processing': 'Processing payment...',
    'payment_success': 'Payment successful!',
    'payment_error': 'Payment error. Please try again.',
    
    // Admin Panel
    'admin_title': 'Administration Panel',
    'admin_login': 'Login',
    'admin_logout': 'Logout',
    'admin_tours': 'Tour Management',
    'admin_bookings': 'Bookings',
    'admin_stats': 'Statistics',
    'admin_add_tour': 'Add Tour',
    'admin_edit_tour': 'Edit Tour',
    'admin_delete_tour': 'Delete Tour',
    'admin_active': 'Active',
    'admin_inactive': 'Inactive',
    
    // No arquivo frontend/src/utils/i18n.js
// Localiza a seção de Messages em cada idioma e substitui por:

// Para PT:
    // Messages
    'message.success': 'Sucesso!',
    'message.error': 'Erro ao carregar os dados. Por favor, tente novamente.',
    'message.loading': 'A carregar...',
    'message.no_tours': 'Não há tours disponíveis.',
    'message.book_success': 'Reserva realizada com sucesso!',
    'message_success': 'Sucesso!',
    'message_error': 'Erro ao carregar os dados. Por favor, tente novamente.',
    'message_loading': 'A carregar...',
    'message_no_tours': 'Não há tours disponíveis.',
    'message_book_success': 'Reserva realizada com sucesso!',

// Para EN:
    // Messages
    'message.success': 'Success!',
    'message.error': 'Error loading data. Please try again.',
    'message.loading': 'Loading...',
    'message.no_tours': 'No tours available.',
    'message.book_success': 'Booking successful!',
    'message_success': 'Success!',
    'message_error': 'Error loading data. Please try again.',
    'message_loading': 'Loading...',
    'message_no_tours': 'No tours available.',
    'message_book_success': 'Booking successful!',

// Para ES:
    // Messages
    'message.success': '¡Éxito!',
    'message.error': 'Error al cargar los datos. Por favor, inténtalo de nuevo.',
    'message.loading': 'Cargando...',
    'message.no_tours': 'No hay tours disponibles.',
    'message.book_success': '¡Reserva exitosa!',
    'message_success': '¡Éxito!',
    'message_error': 'Error al cargar los datos. Por favor, inténtalo de nuevo.',
    'message_loading': 'Cargando...',
    'message_no_tours': 'No hay tours disponibles.',
    'message_book_success': '¡Reserva exitosa!',
    
    // Common
    'common_save': 'Save',
    'common_cancel': 'Cancel',
    'common_delete': 'Delete',
    'common_edit': 'Edit',
    'common_back': 'Back',
    'common_next': 'Next',
    'common_previous': 'Previous',
    'common_close': 'Close',
    'common_yes': 'Yes',
    'common_no': 'No',
    'common_try_again': 'Try Again'
  },
  
  es: {
    // Navigation & Header
    'nav_home': 'Inicio',
    'nav_tours': 'Tours',
    'nav_about': 'Sobre Nosotros',
    'nav_contact': 'Contacto',
    'nav_admin': 'Admin',
    
    // Homepage
    'home_title': '9 Rocks Tours',
    'home_subtitle': 'Descubre Portugal auténticamente',
    'home_description': 'Tours gastronómicos y culturales únicos por los tesoros escondidos de Portugal',
    'home_cta': 'Explorar Tours',
    'home_featured_tours': 'Tours Destacados',
    
    // Tour Types
    'tour_type_gastronomic': 'Gastronómico',
    'tour_type_cultural': 'Cultural',
    'tour_type_mixed': 'Mixto',
    'tour_type_custom': 'Personalizado',
    
    // Tour Details
    'tour_duration': 'Duración',
    'tour_price': 'Precio',
    'tour_participants': 'Participantes',
    'tour_location': 'Ubicación',
    'tour_includes': 'Incluido',
    'tour_excludes': 'No incluido',
    'tour_route': 'Ruta',
    'tour_availability': 'Disponibilidad',
    'tour_book_now': 'Reservar Ahora',
    'tour_view_details': 'Ver Detalles',
    'tour_hours': 'horas',
    'tour_max_people': 'máx. personas',
    
    // Booking Form
    'booking_title': 'Reservar Tour',
    'booking_customer_name': 'Nombre Completo',
    'booking_customer_email': 'Email',
    'booking_customer_phone': 'Teléfono',
    'booking_selected_date': 'Fecha Seleccionada',
    'booking_participants': 'Número de Participantes',
    'booking_special_requests': 'Solicitudes Especiales',
    'booking_payment_method': 'Método de Pago',
    'booking_submit': 'Confirmar Reserva',
    'booking_total': 'Total',
    
    // Payment
    'payment_paypal': 'PayPal',
    'payment_multibanco': 'Multibanco',
    'payment_mbway': 'MBWay',
    'payment_credit_card': 'Tarjeta de Crédito',
    'payment_processing': 'Procesando pago...',
    'payment_success': '¡Pago exitoso!',
    'payment_error': 'Error en el pago. Inténtalo de nuevo.',
    
    // Admin Panel
    'admin_title': 'Panel de Administración',
    'admin_login': 'Entrar',
    'admin_logout': 'Salir',
    'admin_tours': 'Gestión de Tours',
    'admin_bookings': 'Reservas',
    'admin_stats': 'Estadísticas',
    'admin_add_tour': 'Añadir Tour',
    'admin_edit_tour': 'Editar Tour',
    'admin_delete_tour': 'Eliminar Tour',
    'admin_active': 'Activo',
    'admin_inactive': 'Inactivo',
    
    // Messages
    'message_success': '¡Éxito!',
    'message_error': '¡Error!',
    'message_loading': 'Cargando...',
    'message_no_tours': 'No hay tours disponibles.',
    'message_book_success': '¡Reserva exitosa!',
    
    // Common
    'common_save': 'Guardar',
    'common_cancel': 'Cancelar',
    'common_delete': 'Eliminar',
    'common_edit': 'Editar',
    'common_back': 'Volver',
    'common_next': 'Siguiente',
    'common_previous': 'Anterior',
    'common_close': 'Cerrar',
    'common_yes': 'Sí',
    'common_no': 'No',
    'common_try_again': 'Intentar de Nuevo'
  }
};

// Language management utility
class I18n {
  constructor() {
    this.currentLanguage = this.getStoredLanguage() || 'pt';
    this.supportedLanguages = ['pt', 'en', 'es'];
    this.translations = translations;
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
    // Always get fresh language from localStorage
    const storedLang = localStorage.getItem('9rocks_language');
    if (storedLang && this.supportedLanguages.includes(storedLang)) {
      this.currentLanguage = storedLang;
    }
    return this.currentLanguage;
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  t(key, replacements = {}) {
    if (!key) return '';
    
    const currentLang = this.getCurrentLanguage();
    const langTranslations = this.translations[currentLang];
    
    // Direct key lookup (for underscore-separated keys)
    let value = langTranslations[key];
    
    // If not found, try fallback languages
    if (!value) {
      value = this.translations['en'][key] || this.translations['pt'][key];
    }
    
    // If still not found, return the key itself
    if (!value) {
      console.warn(`Translation key not found: ${key} for language: ${currentLang}`);
      return key;
    }
    
    // Apply replacements
    if (replacements && typeof replacements === 'object') {
      Object.keys(replacements).forEach(placeholder => {
        const regex = new RegExp(`{${placeholder}}`, 'g');
        value = value.replace(regex, replacements[placeholder]);
      });
    }
    
    return value;
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

// Função adicional para pegar o idioma atual
export function getCurrentLanguage() {
  return localStorage.getItem("lang") || "en";
}