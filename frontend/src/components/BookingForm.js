// frontend/src/components/BookingForm.js - Versão com Emails Personalizados
import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { BACKEND_URL } from '../config/appConfig';
import { getEmailByLanguage, generateEmailConfig, trackEmailEvent } from '../config/emailConfig';
import BookingCalendarPicker from './BookingCalendarPicker';
import PaymentComponent from './PaymentComponent';

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

// Componente SEO para Booking
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
  const [searchParams] = useSearchParams();
  const tourSlug = searchParams.get('tour');
  
  const [tourData, setTourData] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tourLoading, setTourLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    numberOfPeople: 2,
    date: '',
    specialRequests: '',
    terms: false
  });

  // Conteúdo traduzido
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
      summary: "Resumen de la Reserva",
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

  // Fetch de dados do tour e datas disponíveis
  useEffect(() => {
    const fetchTourData = async () => {
      if (!tourSlug) {
        setTourLoading(false);
        return;
      }
      
      setTourLoading(true);
      
      try {
        const tourResponse = await axios.get(`${BACKEND_URL}/api/tours/${tourSlug}`);
        setTourData(tourResponse.data);
        
        if (tourResponse.data.available_dates && tourResponse.data.available_dates.length > 0) {
          const dates = tourResponse.data.available_dates.map(dateStr => {
            return new Date(dateStr + 'T00:00:00');
          }).filter(date => date >= new Date());
          
          setAvailableDates(dates);
        } else {
          setAvailableDates([]);
        }
        
      } catch (error) {
        console.error('Error fetching tour:', error);
        setTourData(null);
        setAvailableDates([]);
      } finally {
        setTourLoading(false);
      }
    };

    fetchTourData();
  }, [tourSlug]);

  // Cálculos
  const getTourPrice = () => {
    return tourData?.price || 0;
  };

  const getDepositAmount = () => {
    return Math.round(getTourPrice() * 0.3);
  };

  const getRemainingAmount = () => {
    return getTourPrice() - getDepositAmount();
  };

  // Formatação de preços
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  // Verificar se uma data está disponível
  const isDateAvailable = (dateString) => {
    if (availableDates.length === 0) {
      const inputDate = new Date(dateString + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return inputDate >= today;
    }
    
    const inputDate = new Date(dateString + 'T00:00:00');
    return availableDates.some(availableDate => 
      availableDate.getTime() === inputDate.getTime()
    );
  };

  // Validação
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = content[currentLang].errors.firstName;
    if (!formData.lastName.trim()) newErrors.lastName = content[currentLang].errors.lastName;
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = content[currentLang].errors.email;
    }
    if (!formData.phone.trim()) newErrors.phone = content[currentLang].errors.phone;
    if (!formData.date) {
      newErrors.date = content[currentLang].errors.date;
    } else if (!isDateAvailable(formData.date)) {
      newErrors.date = 'Data não disponível para este tour';
    }
    if (!formData.terms) newErrors.terms = content[currentLang].errors.terms;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Verificar se o formulário está completo
  const isFormComplete = () => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.email.trim() &&
      /\S+@\S+\.\S+/.test(formData.email) &&
      formData.phone.trim() &&
      formData.date &&
      isDateAvailable(formData.date) &&
      formData.terms
    );
  };

  // Submeter formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      if (!tourData || !tourData.id) {
        throw new Error('Dados do tour não carregados');
      }

      if (!tourSlug) {
        throw new Error('Slug do tour não definido');
      }

      // 📧 CONFIGURAÇÃO DE EMAIL PERSONALIZADA
      const bookingEmail = getEmailByLanguage('booking', currentLang);
      const emailConfig = generateEmailConfig('booking_confirmation', currentLang, {
        to: formData.email.trim(),
        subject: `${content[currentLang].successTitle} - ${tourData.name?.[currentLang] || tourData.name?.pt || tourData.name}`
      });

      const bookingData = {
        customer_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        customer_email: formData.email.trim(),
        customer_phone: formData.phone.trim(),
        selected_date: formData.date,
        participants: parseInt(formData.numberOfPeople),
        tour_id: tourSlug,
        special_requests: (formData.specialRequests || "").trim(),
        total_amount: parseFloat(getTourPrice().toFixed(2)),
        deposit_amount: parseFloat(getDepositAmount().toFixed(2)),
        status: "pending",
        language: currentLang,
        payment_method: "pending",
        
        // 🎯 CONFIGURAÇÃO DE EMAIL PERSONALIZADA:
        email_config: emailConfig,
        booking_email: bookingEmail,
        reply_to_email: bookingEmail,
        tour_name: tourData.name?.[currentLang] || tourData.name?.pt || tourData.name,
        
        // 📊 DADOS PARA ANALYTICS:
        customer_language: currentLang,
        booking_source: 'website',
        email_language: currentLang
      };

      console.log(`📧 Reserva será enviada de: ${bookingEmail} (${currentLang.toUpperCase()})`);

      const response = await axios.post(`${BACKEND_URL}/api/bookings`, bookingData);

      if (response.status === 200 || response.status === 201) {
        const bookingId = response.data.booking_id || response.data.id || response.data._id || Date.now();
        
        // 📧 TRACKING DE EMAIL
        trackEmailEvent('booking_confirmation', currentLang, {
          booking_id: bookingId,
          tour_id: tourSlug,
          customer_email: formData.email,
          booking_email: bookingEmail,
          tour_name: tourData.name?.[currentLang] || tourData.name?.pt
        });

        // 📊 GOOGLE ANALYTICS MELHORADO
        if (typeof gtag !== 'undefined') {
          gtag('event', 'begin_checkout', {
            transaction_id: bookingId,
            value: getDepositAmount(),
            currency: 'EUR',
            language: currentLang,
            booking_email: bookingEmail,
            email_personalized: true,
            items: [{
              item_id: tourSlug,
              item_name: tourData?.name?.pt || tourData?.name,
              price: getTourPrice(),
              quantity: 1
            }]
          });
        }

        // ✅ SUCESSO COM MENSAGEM PERSONALIZADA
        const successMessage = {
          pt: `Reserva confirmada! Receberá um email de confirmação de ${bookingEmail} em breve.`,
          en: `Booking confirmed! You'll receive a confirmation email from ${bookingEmail} shortly.`,
          es: `¡Reserva confirmada! Recibirá un email de confirmación de ${bookingEmail} en breve.`
        };
        
        console.log(`✅ ${successMessage[currentLang]}`);
        
        setSubmitted(true);
        setBookingId(bookingId);
      } else {
        throw new Error('Resposta inesperada do servidor');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      
      // Modo demo para testes (sem alterações)
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        const mockBookingId = `DEMO_${Date.now()}`;
        setSubmitted(true);
        setBookingId(mockBookingId);
        return;
      }
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Erro desconhecido ao processar reserva';
      
      alert(`Erro ao processar reserva: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Input change com validação em tempo real
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Validação em tempo real
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

  const getToursUrl = () => {
    const langPrefix = currentLang === 'pt' ? '' : `/${currentLang}`;
    return `${langPrefix}/tours`;
  };

  // Loading do tour
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

  // Verificar configuração do backend
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

  // Página de pagamento
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
          onPaymentSuccess={() => {
            window.location.href = getToursUrl() + '?booking=success';
          }}
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
            
            {/* Informação do fluxo */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                  <span className="ml-2 font-medium text-blue-800">Preencher dados</span>
                </div>
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                  <span className="ml-2 font-medium text-gray-600">Página de pagamento</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold text-sm">✓</div>
                  <span className="ml-2 font-medium text-gray-600">Confirmação</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulário */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Informações Pessoais */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">{content[currentLang].personalInfo}</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Campo Nome */}
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
                          {formData.firstName.trim() && !errors.firstName && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
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
                      
                      {/* Campo Sobrenome */}
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
                          {formData.lastName.trim() && !errors.lastName && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
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
                      {/* Campo Email */}
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
                          {formData.email.trim() && /\S+@\S+\.\S+/.test(formData.email) && !errors.email && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
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
                      
                      {/* Campo Telefone */}
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
                          {formData.phone.trim() && !errors.phone && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
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

                  {/* Detalhes da Reserva */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">{content[currentLang].bookingDetails}</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Número de Pessoas */}
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
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 flex items-center">
                          <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {content[currentLang].numberOfPeopleHelp}
                        </p>
                      </div>
                      
                      {/* Seleção de Datas */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          {content[currentLang].preferredDate} *
                        </label>
                        
                        <BookingCalendarPicker
                          availableDates={availableDates}
                          selectedDate={formData.date}
                          onDateSelect={(date) => {
                            setFormData(prev => ({ ...prev, date }));
                            if (errors.date) {
                              setErrors(prev => ({ ...prev, date: undefined }));
                            }
                          }}
                          language={currentLang}
                          className="w-full"
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
                      <p className="text-xs text-gray-500 mt-2 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Ajude-nos a personalizar sua experiência
                      </p>
                    </div>
                  </div>

                  {/* Termos e Condições */}
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
                          className={`
                            h-5 w-5 rounded border-2 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200
                            ${errors.terms ? 'border-red-500' : 'border-gray-300'}
                          `}
                          required
                        />
                      </div>
                      <div className="ml-3 flex-1">
                        <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                          {content[currentLang].termsText} <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-800 underline font-medium">{content[currentLang].termsLink}</a> *
                        </label>
                        {formData.terms && (
                          <div className="mt-1 flex items-center text-green-600 text-sm">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>Termos aceites</span>
                          </div>
                        )}
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

                  {/* Botão de Submit */}
                  <div className="pt-2">
                    {!isFormComplete() && (
                      <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center text-amber-800 text-sm">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{content[currentLang].completeForm}</span>
                        </div>
                      </div>
                    )}

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
                          {isFormComplete() ? (
                            <>
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                              </svg>
                              {content[currentLang].submit}
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {content[currentLang].submit}
                            </>
                          )}
                        </div>
                      )}
                    </button>

                    {/* Elemento de confiança */}
                    <div className="mt-3 text-center">
                      <p className="text-sm text-gray-600 flex items-center justify-center">
                        <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {content[currentLang].submitSecondary}
                      </p>
                    </div>

                    {/* Elementos de Confiança */}
                    <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Pagamento 100% seguro</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Confirmação instantânea</span>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {content[currentLang].summary}
                </h3>
                
                {tourData ? (
                  <>
                    {/* Card do Tour */}
                    <div className="flex items-start space-x-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      {tourData.images && tourData.images[0] && (
                        <img 
                          src={tourData.images[0]} 
                          alt={tourData.name?.[currentLang] || tourData.name?.pt || tourData.name} 
                          className="w-20 h-20 object-cover rounded-lg shadow-sm"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg leading-tight mb-2">
                          {tourData.name?.[currentLang] || tourData.name?.pt || tourData.name}
                        </h4>
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
                          {formData.date && (
                            <p className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(formData.date + 'T00:00:00').toLocaleDateString(
                                currentLang === 'pt' ? 'pt-PT' : currentLang === 'es' ? 'es-ES' : 'en-GB',
                                { weekday: 'short', day: 'numeric', month: 'short' }
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cálculos de Preço */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">{content[currentLang].tourPrice}</span>
                        <span className="font-bold text-lg">{formatPrice(getTourPrice())}</span>
                      </div>
                      
                      {/* Destaque do Depósito */}
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
                      
                      {/* Elementos de Confiança no Sidebar */}
                      <div className="space-y-3 mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                        <h4 className="font-semibold text-green-800 flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Porquê reservar connosco?
                        </h4>
                        <div className="space-y-2 text-sm text-green-700">
                          <p className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            💳 Pagamento 100% seguro
                          </p>
                          <p className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            ⚡ Confirmação instantânea
                          </p>
                          <p className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            🎯 Pague apenas 30% agora
                          </p>
                          <p className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            🔄 Cancelamento flexível
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {tourSlug ? content[currentLang].noTour : 'Selecione um tour para ver o resumo'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingForm;