// Translation system for 9 Rocks Tours
// Supports Portuguese, English, and Spanish

const translations = {
  pt: {
    // Tabs e Navegação
    'tab_overview': 'Visão Geral',
    'tab_itinerary': 'Itinerário', 
    'tab_details': 'Detalhes',

    // Navigation & Header
    'nav_home': 'Início',
    'nav_tours': 'Tours',
    'nav_about': 'Sobre Nós',
    'nav_contact': 'Contacto',
    'nav_admin': 'Admin',

    // Homepage
    'home_title': '9 Rocks Tours',
    'home_subtitle': 'Descubra Portugal de forma autêntica',
    'home_description': 'Tours gastronómicos e culturais únicos pelos tesouros escondidos de Portugal',
    'home_cta': 'Explorar Tours',
    'home_featured_tours': 'Tours em Destaque',
    'home_featured_tours_description': 'Descubra experiências únicas pelos tesouros escondidos de Portugal',
    'why_choose_us_title': 'Porquê escolher a 9 Rocks Tours?',
    'why_choose_us_subtitle': 'A sua experiência em Portugal começa aqui',
    'specialized_guides_title': 'Guias Especializados',
    'specialized_guides_description': 'Guias locais experientes que conhecem cada segredo de Portugal',
    'small_groups_title': 'Grupos Pequenos',
    'small_groups_description': 'Máximo 4 pessoas por tour para uma experiência mais pessoal. Fale connosco para grupos maiores de 4 pessoas, temos uma solução.',
    'authentic_experiences_title': 'Experiências Autênticas',
    'authentic_experiences_description': 'Descubra Portugal como um local, não como um turista',
    'view_all_tours': 'Ver Todos os Tours',
    'years_experience': 'Anos Experiência',
    'tours_completed': 'Tours Realizados',
    'average_rating': 'Avaliação Média',
    'satisfied_clients': 'Clientes Satisfeitos',
    
    // Tours Page
    'tours_page_subtitle': 'Explore as nossas experiências únicas por Portugal',
    'tours_filter_all': 'Todos os Tours',
    
    // CTA Section
    'cta_ready_for_experience': 'Pronto para uma experiência única?',
    'cta_join_us_description': 'Junte-se a nós e descubra os sabores e histórias de Portugal',
    'cta_contact_us': 'Entre em Contacto',
    
    // About & Contact
    'about_page_title': 'Sobre a 9 Rocks Tours',
    'about_page_description': 'Somos especialistas em tours gastronómicos e culturais por Portugal. A nossa missão é mostrar-lhe os tesouros escondidos do nosso belo país.',
    'contact_page_title': 'Contacte-nos',
    'contact_phone': 'Telefone',
    'contact_address': 'Morada',
    
    // Tour Types
    'tour_type_gastronomic': 'Gastronómico',
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
    'tour_type_label': 'Tipo:',
    'tour_duration_label': 'Duração:',
    'tour_max_group': 'Grupo máximo:',
    'tour_deposit_info': 'Depósito (30%):',
    'tour_remaining_payment': 'Restante no dia do tour:',
    'tour_description': 'Descrição',
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
    "nav_home": "Início",
    "nav_tours": "Tours",
    "tour_details_highlights": "Destaques",
    "tour_details_full_description": "Descrição Completa",
    "tour_details_itinerary": "Itinerário",
    "tour_details_includes": "Incluído",
    "tour_details_excludes": "Não incluído",
    "tour_details_per_person": "por pessoa",
    "tour_details_select_date": "Selecione a data",
    "tour_details_participants": "Participantes",
    "tour_details_book_now": "Reservar Agora",
    "tour_details_free_cancellation": "✓ Cancelamento gratuito",

    // Itinerário
    'itinerary_tour_schedule': 'Itinerário do Tour',
    'itinerary_detailed_schedule': 'Itinerário Detalhado',
    'itinerary_duration': 'Duração',
    'itinerary_activities': 'atividades',
    'itinerary_main_stops': 'Horários principais',
    'itinerary_included_activities': 'Atividades incluídas',
    'itinerary_detailed_program': 'Programa Detalhado',
    'itinerary_tour_program': 'Programa do Tour',
    'itinerary_tour_in': 'Tour em',
    'itinerary_unique_experience': 'Experiência única pelos pontos de interesse',
    'itinerary_guided_visit': 'Visita guiada pelos principais locais',
    'itinerary_local_stories': 'Histórias e curiosidades locais',
    'itinerary_photo_time': 'Tempo para fotografias e descobertas',
    'itinerary_additional_info': 'Informação Adicional',
    'itinerary_small_group': 'Grupo pequeno',
    'itinerary_max': 'máximo',
    'itinerary_people': 'pessoas',
    'itinerary_professional_guide': 'Guia profissional incluído',
    'itinerary_tour_region': 'Região do Tour',
    'itinerary_important_info': 'Informações Importantes',
    'itinerary_group': 'Grupo',
    'itinerary_payment': 'Pagamento',
    'itinerary_payment_details': '30% depósito + 70% no dia',
    'itinerary_cancellation': 'Cancelamento',
    'itinerary_cancellation_details': 'Gratuito até 24h antes',
    'itinerary_activity_at': 'Atividade às {time}',
    'itinerary_other_stops': 'Outras paradas',
    'itinerary_tour_info': 'Informações do Tour',
    'itinerary_meeting_point': 'Ponto de encontro confirmado 24h antes',
    'itinerary_whatsapp_contact': 'Guia contactável via WhatsApp',
    'itinerary_flexible_schedule': 'Horários flexíveis conforme ritmo do grupo',

    // Sidebar
    'sidebar_total_price': 'Preço total do tour',
    'sidebar_deposit': 'Depósito (30%):',
    'sidebar_remaining': 'Restante no dia do tour:',
    'sidebar_dates_available': 'datas disponíveis',
    'sidebar_instant_confirmation': 'Confirmação imediata',
    'sidebar_free_cancellation': 'Cancelamento gratuito até 24h antes',
    'sidebar_professional_guide': 'Guia profissional',
    'sidebar_type': 'Tipo:',
    'sidebar_duration': 'Duração:',
    'sidebar_max_group': 'Grupo máximo:',

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
    'common_try_again': 'Tentar Novamente',
    'common_hours': 'horas',
    'common_hour': 'hora',
    'common_person': 'pessoa',
    'common_people': 'pessoas',
    'common_up_to': 'Até',

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
    'booking_success_title': 'Reserva Confirmada!',
    'booking_success_description': 'Obrigado pela sua reserva. Receberá um email de confirmação em breve.',
    
    // Payment
    'payment_paypal': 'PayPal',
    'payment_multibanco': 'Multibanco',
    'payment_mbway': 'MBWay',
    'payment_credit_card': 'Cartão de Crédito',
    'payment_processing': 'A processar pagamento...',
    'payment_success': 'Pagamento realizado com sucesso!',
    'payment_error': 'Erro no pagamento. Tente novamente.',
    'payment_success_title': 'Pagamento Realizado!',
    'payment_success_description': 'O seu pagamento foi processado com sucesso. A sua reserva está confirmada.',
    'payment_cancel_title': 'Pagamento Cancelado',
    'payment_cancel_description': 'O pagamento foi cancelado. Pode tentar novamente quando estiver pronto.',
    'back_to_home': 'Voltar ao Início',
    
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
    'message_error': 'Erro ao carregar os dados. Por favor, tente novamente.',
    'message_loading': 'A carregar...',
    'message_no_tours': 'Não há tours disponíveis.',
    'message_book_success': 'Reserva realizada com sucesso!',
    'message.success': 'Sucesso!',
    'message.error': 'Erro ao carregar os dados. Por favor, tente novamente.',
    'message.loading': 'A carregar...',
    'message.no_tours': 'Não há tours disponíveis.',
    'message.book_success': 'Reserva realizada com sucesso!',
  },
  
  en: {
    // Tabs e Navegação
    'tab_overview': 'Overview',
    'tab_itinerary': 'Itinerary',
    'tab_details': 'Details',

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
    'home_featured_tours_description': 'Discover unique experiences through Portugal\'s hidden treasures',
    'why_choose_us_title': 'Why choose 9 Rocks Tours?',
    'why_choose_us_subtitle': 'Your Portuguese experience starts here',
    'specialized_guides_title': 'Specialized Guides',
    'specialized_guides_description': 'Experienced local guides who know every secret of Portugal',
    'small_groups_title': 'Small Groups',
    'small_groups_description': 'Maximum 4 people per tour for a more personal experience. Contact us for groups larger than 4 people, we have a solution.',
    'authentic_experiences_title': 'Authentic Experiences',
    'authentic_experiences_description': 'Discover Portugal like a local, not like a tourist',
    'view_all_tours': 'View All Tours',
    'years_experience': 'Years Experience',
    'tours_completed': 'Tours Completed',
    'average_rating': 'Average Rating',
    'satisfied_clients': 'Satisfied Clients',
    
    // Tours Page
    'tours_page_subtitle': 'Explore our unique experiences through Portugal',
    'tours_filter_all': 'All Tours',
    
    // CTA Section
    'cta_ready_for_experience': 'Ready for a unique experience?',
    'cta_join_us_description': 'Join us and discover the flavors and stories of Portugal',
    'cta_contact_us': 'Get in Touch',
    
    // About & Contact
    'about_page_title': 'About 9 Rocks Tours',
    'about_page_description': 'We are specialists in gastronomic and cultural tours through Portugal. Our mission is to show you the hidden treasures of our beautiful country.',
    'contact_page_title': 'Contact Us',
    'contact_phone': 'Phone',
    'contact_address': 'Address',
    
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
    'tour_description': 'Description',
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
    'tour_type_label': 'Type:',
    'tour_duration_label': 'Duration:',
    'tour_max_group': 'Max group:',
    'tour_deposit_info': 'Deposit (30%):',
    'tour_remaining_payment': 'Remaining on tour day:',
    "nav_home": "Home",
    "nav_tours": "Tours",
    "tour_details_highlights": "Highlights",
    "tour_details_full_description": "Full Description",
    "tour_details_itinerary": "Itinerary",
    "tour_details_includes": "What's Included",
    "tour_details_excludes": "Not Included",
    "tour_details_per_person": "per person",
    "tour_details_select_date": "Select date",
    "tour_details_participants": "Participants",
    "tour_details_book_now": "Book Now",
    "tour_details_free_cancellation": "✓ Free cancellation",

    // Itinerário
    'itinerary_tour_schedule': 'Tour Schedule',
    'itinerary_detailed_schedule': 'Detailed Itinerary',
    'itinerary_duration': 'Duration',
    'itinerary_activities': 'activities',
    'itinerary_main_stops': 'Main stops',
    'itinerary_included_activities': 'Included activities',
    'itinerary_detailed_program': 'Detailed Program',
    'itinerary_tour_program': 'Tour Program',
    'itinerary_tour_in': 'Tour in',
    'itinerary_unique_experience': 'Unique experience through points of interest',
    'itinerary_guided_visit': 'Guided visit to main locations',
    'itinerary_local_stories': 'Local stories and curiosities',
    'itinerary_photo_time': 'Time for photos and discoveries',
    'itinerary_additional_info': 'Additional Information',
    'itinerary_small_group': 'Small group',
    'itinerary_max': 'maximum',
    'itinerary_people': 'people',
    'itinerary_professional_guide': 'Professional guide included',
    'itinerary_tour_region': 'Tour Region',
    'itinerary_important_info': 'Important Information',
    'itinerary_group': 'Group',
    'itinerary_payment': 'Payment',
    'itinerary_payment_details': '30% deposit + 70% on tour day',
    'itinerary_cancellation': 'Cancellation',
    'itinerary_cancellation_details': 'Free up to 24h before',
    'itinerary_activity_at': 'Activity at {time}',
    'itinerary_other_stops': 'Other stops',
    'itinerary_tour_info': 'Tour Information',
    'itinerary_meeting_point': 'Meeting point confirmed 24h before',
    'itinerary_whatsapp_contact': 'Guide contactable via WhatsApp',
    'itinerary_flexible_schedule': 'Flexible schedule according to group pace',

    // Sidebar
    'sidebar_total_price': 'Total tour price',
    'sidebar_deposit': 'Deposit (30%):',
    'sidebar_remaining': 'Remaining on tour day:',
    'sidebar_dates_available': 'available dates',
    'sidebar_instant_confirmation': 'Instant confirmation',
    'sidebar_free_cancellation': 'Free cancellation up to 24h before',
    'sidebar_professional_guide': 'Professional guide',
    'sidebar_type': 'Type:',
    'sidebar_duration': 'Duration:',
    'sidebar_max_group': 'Max group:',

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
    'common_try_again': 'Try Again',
    'common_hours': 'hours',
    'common_hour': 'hour',
    'common_person': 'person',
    'common_people': 'people',
    'common_up_to': 'Up to',
    
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
    'booking_success_title': 'Booking Confirmed!',
    'booking_success_description': 'Thank you for your booking. You will receive a confirmation email shortly.',
    
    // Payment
    'payment_paypal': 'PayPal',
    'payment_multibanco': 'Multibanco',
    'payment_mbway': 'MBWay',
    'payment_credit_card': 'Credit Card',
    'payment_processing': 'Processing payment...',
    'payment_success': 'Payment successful!',
    'payment_error': 'Payment error. Please try again.',
    'payment_success_title': 'Payment Successful!',
    'payment_success_description': 'Your payment has been processed successfully. Your booking is confirmed.',
    'payment_cancel_title': 'Payment Cancelled',
    'payment_cancel_description': 'The payment was cancelled. You can try again when ready.',
    'back_to_home': 'Back to Home',
    
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
  },
  
  es: {
    // Tabs e Navegação
    'tab_overview': 'Resumen',
    'tab_itinerary': 'Itinerario',
    'tab_details': 'Detalles',

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
    'home_featured_tours_description': 'Descubre experiencias únicas por los tesoros escondidos de Portugal',
    'why_choose_us_title': '¿Por qué elegir 9 Rocks Tours?',
    'why_choose_us_subtitle': 'Tu experiencia portuguesa comienza aquí',
    'specialized_guides_title': 'Guías Especializados',
    'specialized_guides_description': 'Guías locales experimentados que conocen cada secreto de Portugal',
    'small_groups_title': 'Grupos Pequeños',
    'small_groups_description': 'Máximo 4 personas por tour para una experiencia más personal. Contáctanos para grupos de más de 4 personas, tenemos una solución.',
    'authentic_experiences_title': 'Experiencias Auténticas',
    'authentic_experiences_description': 'Descubre Portugal como un local, no como un turista',
    'view_all_tours': 'Ver Todos los Tours',
    'years_experience': 'Años de Experiencia',
    'tours_completed': 'Tours Realizados',
    'average_rating': 'Valoración Media',
    'satisfied_clients': 'Clientes Satisfechos',

    // Tours Page
    'tours_page_subtitle': 'Explora nuestras experiencias únicas por Portugal',
    'tours_filter_all': 'Todos los Tours',
    
    // CTA Section
    'cta_ready_for_experience': '¿Listo para una experiencia única?',
    'cta_join_us_description': 'Únete a nosotros y descubre los sabores e historias de Portugal',
    'cta_contact_us': 'Ponte en Contacto',
    
    // About & Contact
    'about_page_title': 'Sobre 9 Rocks Tours',
    'about_page_description': 'Somos especialistas en tours gastronómicos y culturales por Portugal. Nuestra misión es mostrarte los tesoros escondidos de nuestro hermoso país.',
    'contact_page_title': 'Contáctanos',
    'contact_phone': 'Teléfono',
    'contact_address': 'Dirección',
    
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
    'tour_description': 'Descripción',
    'tour_included': 'Incluido',
    'tour_not_included': 'No Incluido',
    'tour_reserve_now': 'Reservar Ahora', 
    'tour_no_dates_available': 'No hay fechas disponibles en este momento',
    'tour_type_label': 'Tipo:',
    'tour_duration_label': 'Duración:',
    'tour_max_group': 'Grupo máximo:',
    'tour_deposit_info': 'Depósito (30%):',
    'tour_remaining_payment': 'Restante el día del tour:',

    // Itinerário
    'itinerary_tour_schedule': 'Horario del Tour',
    'itinerary_detailed_schedule': 'Itinerario Detallado',
    'itinerary_duration': 'Duración',
    'itinerary_activities': 'actividades',
    'itinerary_main_stops': 'Paradas principales',
    'itinerary_included_activities': 'Actividades incluidas',
    'itinerary_detailed_program': 'Programa Detallado',
    'itinerary_tour_program': 'Programa del Tour',
    'itinerary_tour_in': 'Tour en',
    'itinerary_unique_experience': 'Experiencia única por puntos de interés',
    'itinerary_guided_visit': 'Visita guiada a lugares principales',
    'itinerary_local_stories': 'Historias y curiosidades locales',
    'itinerary_photo_time': 'Tiempo para fotos y descubrimientos',
    'itinerary_additional_info': 'Información Adicional',
    'itinerary_small_group': 'Grupo pequeño',
    'itinerary_max': 'máximo',
    'itinerary_people': 'personas',
    'itinerary_professional_guide': 'Guía profesional incluido',
    'itinerary_tour_region': 'Región del Tour',
    'itinerary_important_info': 'Información Importante',
    'itinerary_group': 'Grupo',
    'itinerary_payment': 'Pago',
    'itinerary_payment_details': '30% depósito + 70% el día del tour',
    'itinerary_cancellation': 'Cancelación',
    'itinerary_cancellation_details': 'Gratuita hasta 24h antes',
    'itinerary_activity_at': 'Actividad a las {time}',
    'itinerary_other_stops': 'Otras paradas',
    'itinerary_tour_info': 'Información del Tour',
    'itinerary_meeting_point': 'Punto de encuentro confirmado 24h antes',
    'itinerary_whatsapp_contact': 'Guía contactable vía WhatsApp',
    'itinerary_flexible_schedule': 'Horarios flexibles según ritmo del grupo',
    
    // Sidebar
    'sidebar_total_price': 'Precio total del tour',
    'sidebar_deposit': 'Depósito (30%):',
    'sidebar_remaining': 'Restante el día del tour:',
    'sidebar_dates_available': 'fechas disponibles',
    'sidebar_instant_confirmation': 'Confirmación inmediata',
    'sidebar_free_cancellation': 'Cancelación gratuita hasta 24h antes',
    'sidebar_professional_guide': 'Guía profesional',
    'sidebar_type': 'Tipo:',
    'sidebar_duration': 'Duración:',
    'sidebar_max_group': 'Grupo máximo:',

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
    'common_try_again': 'Intentar de Nuevo',
    'common_hours': 'horas',
    'common_hour': 'hora',
    'common_person': 'persona',
    'common_people': 'personas',
    'common_up_to': 'Hasta',

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
    'booking_success_title': '¡Reserva Confirmada!',
    'booking_success_description': 'Gracias por tu reserva. Recibirás un email de confirmación en breve.',
    
    // Payment
    'payment_paypal': 'PayPal',
    'payment_multibanco': 'Multibanco',
    'payment_mbway': 'MBWay',
    'payment_credit_card': 'Tarjeta de Crédito',
    'payment_processing': 'Procesando pago...',
    'payment_success': '¡Pago exitoso!',
    'payment_error': 'Error en el pago. Inténtalo de nuevo.',
    'payment_success_title': '¡Pago Exitoso!',
    'payment_success_description': 'Tu pago ha sido procesado exitosamente. Tu reserva está confirmada.',
    'payment_cancel_title': 'Pago Cancelado',
    'payment_cancel_description': 'El pago fue cancelado. Puedes intentar de nuevo cuando estés listo.',
    'back_to_home': 'Volver al Inicio',
    
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
    'message_error': 'Error al cargar los datos. Por favor, inténtalo de nuevo.',
    'message_loading': 'Cargando...',
    'message_no_tours': 'No hay tours disponibles.',
    'message_book_success': '¡Reserva exitosa!',
    'message.success': '¡Éxito!',
    'message.error': 'Error al cargar los datos. Por favor, inténtalo de nuevo.',
    'message.loading': 'Cargando...',
    'message.no_tours': 'No hay tours disponibles.',
    'message.book_success': '¡Reserva exitosa!',
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