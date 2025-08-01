// frontend/src/components/BookingForm.js - VERSÃO COMPLETAMENTE CORRIGIDA
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { BACKEND_URL } from '../config/appConfig';
import BookingCalendarPicker from './BookingCalendarPicker';
import PaymentComponent from './PaymentComponent';
import TermsModal from './TermsModal';
import { useTranslation } from '../utils/useTranslation';

// Hook SEO (mantido)
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

// ===================================================================
// 🔧 FUNÇÕES DE DATA CORRIGIDAS - ZERO PROBLEMAS DE TIMEZONE
// ===================================================================

/**
 * 🎯 Extrai data no formato YYYY-MM-DD SEM conversão de timezone
 * INPUT: "2025-07-28T10:00:00.000Z" → OUTPUT: "2025-07-28"
 */
const extractDateFromISO = (isoString) => {
  if (!isoString) return null;
  try {
    // CORREÇÃO: Pega apenas os primeiros 10 caracteres (YYYY-MM-DD)
    return isoString.substring(0, 10);
  } catch (e) {
    console.error("Erro ao extrair data:", e);
    return null;
  }
};

/**
 * 🎯 Formata data para exibição SEM problemas de timezone
 * GARANTE que o dia mostrado é exatamente o dia selecionado
 */
const formatDateForDisplay = (isoString, language = 'pt') => {
  if (!isoString) return '';
  try {
    // CORREÇÃO: Extrai apenas YYYY-MM-DD
    const dateStr = isoString.substring(0, 10);
    const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
    
    // CORREÇÃO CRÍTICA: Cria data LOCAL (não UTC) para garantir que não há conversão
    const localDate = new Date(year, month - 1, day);
    
    const locales = {
      'pt': 'pt-PT',
      'en': 'en-GB', 
      'es': 'es-ES'
    };
    
    return localDate.toLocaleDateString(locales[language], {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    console.error("Erro ao formatar data para exibição:", e);
    return '';
  }
};

/**
 * 🎯 Converte data YYYY-MM-DD para ISO string DO MEIO-DIA UTC
 * Isso evita problemas de timezone ao enviar para o backend
 */
const convertDateToISOMidday = (dateString) => {
  if (!dateString) return null;
  try {
    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    // Criamos às 12:00 UTC para evitar problemas de timezone
    const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return utcDate.toISOString();
  } catch (e) {
    console.error("Erro ao converter data para ISO:", e);
    return null;
  }
};

// Componente SEO para Booking (mantido)
const BookingSEOHead = ({ tourData }) => {
  const { currentLang } = useSEO();
  const baseUrl = "https://9rockstours.com";

  const seoContent = {
    pt: {
      title: tourData 
        ? `Reservar ${tourData.name?.pt || tourData.name} | Confirme Sua Aventura Agora`
        : "Reserve Agora | Garanta a Sua Aventura dos Sonhos",
      description: tourData
        ? `Reserve ${tourData.name?.pt || tourData.name} com segurança. Pague apenas 30% agora, restante no dia do tour. Confirmação imediata!`
        : "Reserve com segurança! Pague apenas 30% agora, restante no dia do tour. Confirmação imediata.",
      keywords: "reservar tour, booking online, viagem dos sonhos, aventura garantida, pagamento seguro"
    },
    en: {
      title: tourData
        ? `Book ${tourData.name?.en || tourData.name} | Confirm Your Adventure Now`
        : "Book Now | Secure Your Dream Adventure",
      description: tourData
        ? `Book ${tourData.name?.en || tourData.name} securely. Pay only 30% now, rest on tour day. Instant confirmation!`
        : "Book securely! Pay only 30% now, rest on tour day. Instant confirmation!",
      keywords: "book tour, online booking, dream trip, guaranteed adventure, secure payment"
    },
    es: {
      title: tourData
        ? `Reservar ${tourData.name?.es || tourData.name} | Confirma Tu Aventura Ahora`
        : "Reserva Ahora | Asegura Tu Aventura de Ensueño",
      description: tourData
        ? `Reserva ${tourData.name?.es || tourData.name} con seguridad. Paga solo 30% ahora, resto el día del tour. ¡Confirmación inmediata!`
        : "¡Reserva con seguridad! Paga solo 30% ahora, resto el día del tour. ¡Confirmación inmediata!",
      keywords: "reservar tour, booking online, viaje de ensueño, aventura garantizada, pago seguro"
    }
  };

  const seoData = seoContent[currentLang];

  return (
    <Helmet>
      <title>{seoData.title}</title>
      <meta name="description" content={seoData.description} />
      <meta name="keywords" content={seoData.keywords} />
      
      <meta property="og:title" content={seoData.title} />
      <meta property="og:description" content={seoData.description} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={`${baseUrl}/og-image-booking.jpg`} />
      <meta property="og:site_name" content="9 Rocks Tours" />
      
      <html lang={currentLang === 'pt' ? 'pt-PT' : currentLang === 'es' ? 'es-ES' : 'en-US'} />
    </Helmet>
  );
};

// Componente Principal BookingForm
const BookingForm = () => {
  const { currentLang } = useSEO();
  const { id: tourSlug } = useParams();
  
  const [tourData, setTourData] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [occupiedDates, setOccupiedDates] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [tourLoading, setTourLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const { t } = useTranslation();
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    numberOfPeople: 2,
    date: '', // Armazena ISO string
    selectedDateString: '', // 🆕 Armazena YYYY-MM-DD para display
    specialRequests: '',
    terms: false
  });

  const content = {
    pt: {
      title: "Reserve Sua Aventura",
      subtitle: "Pague apenas 30% agora, restante no dia do tour",
      personalInfo: "Informações Pessoais",
      firstName: "Nome",
      lastName: "Sobrenome", 
      email: "E-mail",
      phone: "Telefone",
      bookingDetails: "Detalhes da Reserva",
      numberOfPeople: "Número de Pessoas",
      numberOfPeopleHelp: "(+ de 4 pessoas fale connosco, arranjamos uma solução)",
      preferredDate: "Data Preferida",
      selectDate: "Selecione uma data disponível",
      noAvailableDates: "Sem datas disponíveis. Contacte-nos para mais opções.",
      specialRequests: "Pedidos Especiais",
      specialRequestsPlaceholder: "Alguma necessidade especial, restrições alimentares, etc.",
      termsText: "Aceito os",
      termsLink: "termos e condições",
      submit: "IR PARA PAGAMENTO",
      submitSecondary: "Cancelamento gratuito até 24 horas antes",
      summary: "Resumo da Reserva",
      tourPrice: "Preço do Tour",
      depositToPay: "Depósito a Pagar (30%)",
      remainingPayment: "Restante no dia do tour",
      processing: "Processando...",
      successTitle: "Reserva Confirmada!",
      successMessage: "Obrigado! Sua reserva foi confirmada. Você receberá um e-mail com todos os detalhes e instruções de pagamento.",
      backToTours: "Voltar aos Tours",
      noTour: "Tour não encontrado",
      loading: "Carregando...",
      completeForm: "Preencha todos os campos obrigatórios para continuar",
      dateUnavailable: "Esta data já não está disponível. Por favor, escolha outra.",
      errors: {
        firstName: "Nome é obrigatório",
        lastName: "Sobrenome é obrigatório",
        email: "E-mail válido é obrigatório",
        phone: "Telefone é obrigatório",
        date: "Data é obrigatória",
        terms: "Você deve aceitar os termos e condições"
      }
    },
    en: {
      title: "Book Your Adventure",
      subtitle: "Pay only 30% now, rest on tour day",
      personalInfo: "Personal Information",
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      phone: "Phone",
      bookingDetails: "Booking Details", 
      numberOfPeople: "Number of People",
      numberOfPeopleHelp: "(+ 4 people contact us, we'll arrange a solution)",
      preferredDate: "Preferred Date",
      selectDate: "Select an available date",
      noAvailableDates: "No available dates. Contact us for more options.",
      specialRequests: "Special Requests",
      specialRequestsPlaceholder: "Any special needs, dietary restrictions, etc.",
      termsText: "I accept the",
      termsLink: "terms and conditions",
      submit: "GO TO PAYMENT",
      submitSecondary: "Free cancellation up to 24 hours before",
      summary: "Booking Summary",
      tourPrice: "Tour Price",
      depositToPay: "Deposit to Pay (30%)",
      remainingPayment: "Remaining on tour day",
      processing: "Processing...",
      successTitle: "Booking Confirmed!",
      successMessage: "Thank you! Your booking has been confirmed. You will receive an email with all details and payment instructions.",
      backToTours: "Back to Tours",
      noTour: "Tour not found",
      loading: "Loading...",
      completeForm: "Please complete all required fields to continue",
      dateUnavailable: "This date is no longer available. Please choose another date.",
      errors: {
        firstName: "First name is required",
        lastName: "Last name is required", 
        email: "Valid email is required",
        phone: "Phone is required",
        date: "Date is required",
        terms: "You must accept the terms and conditions"
      }
    },
    es: {
      title: "Reserva Tu Aventura",
      subtitle: "Paga solo 30% ahora, resto el día del tour",
      personalInfo: "Información Personal",
      firstName: "Nombre",
      lastName: "Apellido",
      email: "Correo",
      phone: "Teléfono",
      bookingDetails: "Detalles de la Reserva",
      numberOfPeople: "Número de Personas",
      numberOfPeopleHelp: "(+ de 4 personas contáctanos, encontraremos una solución)",
      preferredDate: "Fecha Preferida", 
      selectDate: "Selecciona una fecha disponible",
      noAvailableDates: "Sin fechas disponibles. Contáctanos para más opciones.",
      specialRequests: "Solicitudes Especiales",
      specialRequestsPlaceholder: "Alguna necesidad especial, restricciones alimentarias, etc.",
      termsText: "Acepto los",
      termsLink: "términos y condiciones", 
      submit: "IR AL PAGO",
      submitSecondary: "Cancelación gratuita hasta 24 horas antes",
      summary: "Resumo da Reserva",
      tourPrice: "Precio del Tour",
      depositToPay: "Depósito a Pagar (30%)",
      remainingPayment: "Restante el día del tour",
      processing: "Procesando...",
      successTitle: "¡Reserva Confirmada!",
      successMessage: "¡Gracias! Tu reserva ha sido confirmada. Recibirás un correo con todos los detalles e instrucciones de pago.",
      backToTours: "Volver a Tours",
      noTour: "Tour no encontrado",
      loading: "Cargando...",
      completeForm: "Complete todos los campos obligatorios para continuar",
      dateUnavailable: "Esta fecha ya no está disponible. Por favor, elige otra fecha.",
      errors: {
        firstName: "El nombre es obligatorio",
        lastName: "El apellido es obligatorio",
        email: "Se requiere un correo válido",
        phone: "El teléfono es obligatorio", 
        date: "La fecha es obligatoria",
        terms: "Debes aceptar los términos y condiciones"
      }
    }
  };

  // ===================================================================
  // 🔄 FUNÇÃO PARA RECARREGAR DATAS OCUPADAS APÓS RESERVA
  // ===================================================================
  const refreshOccupiedDates = async () => {
    if (!tourSlug) return;
    
    try {
      const response = await axios.get(`${BACKEND_URL}/api/tours/${tourSlug}/occupied-dates`);
      if (response.data && response.data.occupied_dates) {
        setOccupiedDates(response.data.occupied_dates);
        console.log("✅ Datas ocupadas atualizadas:", response.data.occupied_dates);
      }
    } catch (error) {
      console.warn('Aviso: Não foi possível atualizar as datas ocupadas:', error);
    }
  };

  // Carregamento inicial de dados
  useEffect(() => {
    const fetchTourAndBookingData = async () => {
      if (!tourSlug) {
        setTourLoading(false);
        return;
      }
      setTourLoading(true);
      setTourData(null);
      setAvailableDates([]);
      setOccupiedDates([]);
      setApiError('');

      try {
        // Passo 1: Buscar os dados principais do tour
        const tourResponse = await axios.get(`${BACKEND_URL}/api/tours/${tourSlug}`);
        setTourData(tourResponse.data);
        
        // Passo 2: Popula as datas disponíveis (CÓDIGO MODIFICADO PARA DAR CONTROLO TOTAL AO ADMIN)
        if (tourResponse.data && tourResponse.data.available_dates && tourResponse.data.available_dates.length > 0) {
            setAvailableDates(tourResponse.data.available_dates);
        } else {
            console.warn("Aviso: O tour não tem 'available_dates' definidas. O tour não estará disponível para reserva.");
            // Garante que nenhuma data é mostrada se não forem definidas pelo admin
            setAvailableDates([]);
        }

        // Passo 3: Buscar as datas já ocupadas
        await refreshOccupiedDates();

      } catch (error) {
        console.error('Erro CRÍTICO ao buscar dados do tour:', error);
        setTourData(null);
        setApiError('Não foi possível carregar os dados do tour. Verifique o link ou tente mais tarde.');
      } finally {
        setTourLoading(false);
      }
    };
    fetchTourAndBookingData();
  }, [tourSlug]);

  const getTourPrice = () => tourData?.price || 0;
  const getDepositAmount = () => Math.round(getTourPrice() * 0.3);
  const getRemainingAmount = () => getTourPrice() - getDepositAmount();
  const formatPrice = (price) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(price);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = content[currentLang].errors.firstName;
    if (!formData.lastName.trim()) newErrors.lastName = content[currentLang].errors.lastName;
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = content[currentLang].errors.email;
    if (!formData.phone.trim()) newErrors.phone = content[currentLang].errors.phone;
    if (!formData.date) newErrors.date = content[currentLang].errors.date;
    if (!formData.terms) newErrors.terms = content[currentLang].errors.terms;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormComplete = () => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.email.trim() &&
      /\S+@\S+\.\S+/.test(formData.email) &&
      formData.phone.trim() &&
      formData.date &&
      formData.terms
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(''); 

    if (!validateForm()) {
      console.log('Formulário inválido');
      return;
    }

    setLoading(true);

    const bookingPayload = {
      tour_id: tourSlug,
      selectedDate: formData.date,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone || '',
      // ## ✅ CORREÇÃO CRÍTICA APLICADA AQUI ##
      // O segundo argumento (radix) foi corrigido para 10 (decimal).
      // O anterior `4` causava erros para números de pessoas >= 4.
      numberOfPeople: parseInt(formData.numberOfPeople, 10),
      specialRequests: formData.specialRequests || '',
    };

    try {
      const response = await axios.post(`${BACKEND_URL}/api/payments/create-booking`, bookingPayload);

      if (response.status === 200 || response.status === 201) {
        const newBookingId = response.data.bookingId;
        setBookingId(newBookingId);
        
        const bookedDateString = formData.selectedDateString;
        if (bookedDateString && !occupiedDates.includes(bookedDateString)) {
          setOccupiedDates(prev => [...prev, bookedDateString]);
          console.log(`✅ Data ${bookedDateString} marcada como ocupada localmente`);
        }
        
        setTimeout(() => refreshOccupiedDates(), 1000);
        
        setSubmitted(true);
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 409) {
          setApiError(content[currentLang].dateUnavailable);
          
          const failedDateString = formData.selectedDateString;
          if (failedDateString && !occupiedDates.includes(failedDateString)) {
            setOccupiedDates(prev => [...prev, failedDateString]);
          }
          
          setFormData(prev => ({ ...prev, date: '', selectedDateString: '' }));
          refreshOccupiedDates();
        } else {
          const detail = error.response.data?.detail || 'Ocorreu um erro ao processar a sua reserva.';
          setApiError(`Erro: ${detail}`);
        }
      } else {
        setApiError('Erro de rede. Por favor, verifique a sua ligação e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      let isValid = false;
      
      switch (name) {
        case 'firstName':
        case 'lastName':
        case 'phone':
          isValid = value.trim().length > 0;
          break;
        case 'email':
          isValid = value.trim().length > 0 && /\S+@\S+\.\S+/.test(value);
          break;
        case 'terms':
          isValid = checked;
          break;
        default:
          isValid = true;
      }

      if (isValid) {
        setErrors(prev => ({
          ...prev,
          [name]: undefined
        }));
      }
    }
  };

  // ===================================================================
  // 🎯 FUNÇÃO CORRIGIDA DE SELEÇÃO DE DATA - ZERO PROBLEMAS
  // ===================================================================
  const handleDateSelect = (selectedDateString) => {
    setApiError('');
    setErrors(prev => ({ ...prev, date: undefined }));
    
    if (typeof selectedDateString !== 'string') {
        console.error('Formato de data inválido recebido do calendário:', selectedDateString);
        return;
    }
    
    console.log(`🗓️ SELECIONADO: ${selectedDateString}`);
    
    const isoString = convertDateToISOMidday(selectedDateString);
    
    if (!isoString) {
        console.error('Erro ao converter data para ISO');
        return;
    }
    
    setFormData(prev => ({ 
      ...prev, 
      date: isoString,
      selectedDateString: selectedDateString
    }));
    
    console.log(`✅ ARMAZENADO: ISO=${isoString}, Display=${selectedDateString}`);
    console.log(`📊 DISPLAY VAI MOSTRAR: ${formatDateForDisplay(selectedDateString + 'T12:00:00', currentLang)}`);
  };

  const getToursUrl = () => {
    const langPrefix = currentLang === 'pt' ? '' : `/${currentLang}`;
    return `${langPrefix}/tours`;
  };

  if (tourLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">{content[currentLang].loading}</p>
        </div>
      </div>
    );
  }

  if (!BACKEND_URL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-900 mb-4">Configuração Incompleta</h1>
          <p className="text-red-700 mb-4">
            BACKEND_URL não está definido. Verifique suas variáveis de ambiente.
          </p>
        </div>
      </div>
    );
  }
  
  if (submitted && bookingId) {
    const paymentBookingData = {
      id: bookingId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      numberOfPeople: formData.numberOfPeople,
      date: formData.date,
      specialRequests: formData.specialRequests,
      language: currentLang,
      tour: tourData,
      depositAmount: getDepositAmount(),
      remainingAmount: getRemainingAmount(),
      totalAmount: getTourPrice()
    };

    return (
      <>
        <BookingSEOHead tourData={tourData} />
        <PaymentComponent 
          bookingData={paymentBookingData}
          onBack={() => {
            setSubmitted(false);
            setBookingId(null);
          }}
        />
      </>
    );
  }

  return (
    <>
      <BookingSEOHead tourData={tourData} />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{content[currentLang].title}</h1>
            <p className="text-lg text-blue-600 font-medium">{content[currentLang].subtitle}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                
                {apiError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-300 text-red-800 rounded-lg text-center">
                    {apiError}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">{content[currentLang].personalInfo}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                          {content[currentLang].firstName} *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className={`
                              w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 
                              ${errors.firstName 
                                ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                                : formData.firstName.trim() 
                                  ? 'border-green-500 bg-green-50 focus:ring-green-500' 
                                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                              }
                              focus:outline-none focus:ring-2 focus:ring-opacity-50
                            `}
                            placeholder="Introduza o seu nome"
                            required
                          />
                        </div>
                        {errors.firstName && (
                          <div className="mt-1 flex items-center text-red-600 text-sm">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.firstName}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                          {content[currentLang].lastName} *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className={`
                              w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 
                              ${errors.lastName 
                                ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                                : formData.lastName.trim() 
                                  ? 'border-green-500 bg-green-50 focus:ring-green-500' 
                                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                              }
                              focus:outline-none focus:ring-2 focus:ring-opacity-50
                            `}
                            placeholder="Introduza o seu sobrenome"
                            required
                          />
                        </div>
                        {errors.lastName && (
                          <div className="mt-1 flex items-center text-red-600 text-sm">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.lastName}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                          {content[currentLang].email} *
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`
                              w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 
                              ${errors.email 
                                ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                                : (formData.email.trim() && /\S+@\S+\.\S+/.test(formData.email))
                                  ? 'border-green-500 bg-green-50 focus:ring-green-500' 
                                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                              }
                              focus:outline-none focus:ring-2 focus:ring-opacity-50
                            `}
                            placeholder="exemplo@email.com"
                            required
                          />
                        </div>
                        {errors.email && (
                          <div className="mt-1 flex items-center text-red-600 text-sm">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.email}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                          {content[currentLang].phone} *
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className={`
                              w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 
                              ${errors.phone 
                                ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                                : formData.phone.trim() 
                                  ? 'border-green-500 bg-green-50 focus:ring-green-500' 
                                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                              }
                              focus:outline-none focus:ring-2 focus:ring-opacity-50
                            `}
                            placeholder="+351 xxx xxx xxx"
                            required
                          />
                        </div>
                        {errors.phone && (
                          <div className="mt-1 flex items-center text-red-600 text-sm">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">{content[currentLang].bookingDetails}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="numberOfPeople" className="block text-sm font-semibold text-gray-700 mb-2">
                          {content[currentLang].numberOfPeople} *
                        </label>
                        <div className="relative">
                          <select
                            id="numberOfPeople"
                            name="numberOfPeople"
                            value={formData.numberOfPeople}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none bg-white transition-all duration-200"
                            required
                          >
                            {[1,2,3,4].map(num => (
                              <option key={num} value={num}>{num} {num === 1 ? 'pessoa' : 'pessoas'}</option>
                            ))}
                          </select>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {content[currentLang].numberOfPeopleHelp}
                        </p>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          {content[currentLang].preferredDate} *
                        </label>
                        <BookingCalendarPicker
                          availableDates={availableDates}
                          occupiedDates={occupiedDates}
                          selectedDate={formData.selectedDateString} // Passa a string original
                          onDateSelect={handleDateSelect}
                          language={currentLang}
                        />
                        {errors.date && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex items-center text-red-600 text-sm">
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {errors.date}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6">
                      <label htmlFor="specialRequests" className="block text-sm font-semibold text-gray-700 mb-2">
                        {content[currentLang].specialRequests}
                        <span className="text-gray-400 font-normal ml-1">(Opcional)</span>
                      </label>
                      <textarea
                        id="specialRequests"
                        name="specialRequests"
                        value={formData.specialRequests}
                        onChange={handleInputChange}
                        placeholder={content[currentLang].specialRequestsPlaceholder}
                        rows="4"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition-all duration-200 resize-none"
                      />
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <div className={`
                      flex items-start p-4 rounded-xl border-2 transition-all duration-200
                      ${errors.terms 
                        ? 'border-red-500 bg-red-50' 
                        : formData.terms 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-300 bg-gray-50'
                      }
                    `}>
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id="terms"
                          name="terms"
                          checked={formData.terms}
                          onChange={handleInputChange}
                          className="h-5 w-5 rounded border-2 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
                          required
                        />
                      </div>
                      <div className="ml-3 flex-1">
                       <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                        {t('terms_and_conditions_accept')}
                        <button 
                          type="button"
                          onClick={() => setShowTermsModal(true)}
                          className="text-blue-600 hover:text-blue-800 hover:underline ml-1 font-medium"
                        >
                         {t('terms_and_conditions_short')}
                        </button> *
                        </label>
                      </div>
                    </div>
                    {errors.terms && (
                      <div className="mt-2 flex items-center text-red-600 text-sm">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.terms}
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      className={`
                        w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform
                        ${isFormComplete() && !loading
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] cursor-pointer'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                        }
                        ${loading ? 'animate-pulse' : ''}
                      `}
                      disabled={!isFormComplete() || loading}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                          {content[currentLang].processing}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                          {content[currentLang].submit}
                        </div>
                      )}
                    </button>
                    <div className="mt-3 text-center">
                      <p className="text-sm text-gray-600 flex items-center justify-center">
                        <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {content[currentLang].submitSecondary}
                      </p>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">{content[currentLang].summary}</h3>
                {tourData ? (
                  <>
                    <div className="flex items-start space-x-4 mb-6 p-4 bg-gray-50 rounded-xl">
                      {tourData.images && tourData.images[0] && (
                        <img 
                          src={tourData.images[0]} 
                          alt={tourData.name?.[currentLang] || tourData.name?.pt || tourData.name} 
                          className="w-20 h-20 object-cover rounded-lg shadow-sm"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg leading-tight mb-2">{tourData.name?.[currentLang] || tourData.name?.pt}</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {formData.numberOfPeople} {formData.numberOfPeople === 1 ? 'pessoa' : 'pessoas'}
                          </p>
                          <p className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {tourData.duration_hours} horas
                          </p>
                          {formData.selectedDateString && (
                            <p className="flex items-center font-medium text-blue-700">
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              {/* 🎯 CORREÇÃO CRÍTICA: Agora formata corretamente usando selectedDateString */}
                              {formatDateForDisplay(formData.selectedDateString + 'T12:00:00', currentLang)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">{content[currentLang].tourPrice}</span>
                        <span className="font-bold text-lg">{formatPrice(getTourPrice())}</span>
                      </div>
                      
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-blue-800 font-bold text-lg">{content[currentLang].depositToPay}</span>
                          <span className="text-blue-900 font-bold text-2xl">{formatPrice(getDepositAmount())}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-blue-600">{content[currentLang].remainingPayment}</span>
                          <span className="text-blue-700 font-semibold">{formatPrice(getRemainingAmount())}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>Carregando dados do tour...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 🎯 MODAL DE TERMOS E CONDIÇÕES - ADICIONADO AQUI */}
        <TermsModal 
          isOpen={showTermsModal} 
          onClose={() => setShowTermsModal(false)} 
        />
      </div>
    </>
  );
};

export default BookingForm;