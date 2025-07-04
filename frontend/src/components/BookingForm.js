// frontend/src/pages/BookingForm.js
import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

// Hook SEO (mesmo dos outros componentes)
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
  const baseUrl = "https://9rockstours.com"; // ALTERE PARA SEU DOMÍNIO

  const seoContent = {
    pt: {
      title: tourData 
        ? `Reservar ${tourData.name} | Confirme Sua Aventura Agora`
        : "Reserve Agora | Garanta a Sua Aventura dos Sonhos",
      description: tourData
        ? `Reserve ${tourData.name} com segurança. Processo simples, pagamento protegido e confirmação imediata. A partir de €${tourData.price}!`
        : "Últimas vagas disponíveis! Processo simples, pagamento seguro e confirmação imediata. A sua próxima aventura está a um clique.",
      keywords: "reservar tour, booking online, viagem dos sonhos, aventura garantida, pagamento seguro"
    },
    en: {
      title: tourData
        ? `Book ${tourData.name} | Confirm Your Adventure Now`
        : "Book Now | Secure Your Dream Adventure",
      description: tourData
        ? `Book ${tourData.name} securely. Simple process, protected payment and instant confirmation. From €${tourData.price}!`
        : "Last spots available! Simple process, secure payment, instant confirmation. Your next adventure is one click away.",
      keywords: "book tour, online booking, dream trip, guaranteed adventure, secure payment"
    },
    es: {
      title: tourData
        ? `Reservar ${tourData.name} | Confirma Tu Aventura Ahora`
        : "Reserva Ahora | Asegura Tu Aventura de Ensueño",
      description: tourData
        ? `Reserva ${tourData.name} con seguridad. Proceso simple, pago protegido y confirmación inmediata. ¡Desde €${tourData.price}!`
        : "¡Últimos cupos disponibles! Proceso simple, pago seguro y confirmación instantánea. Tu próxima aventura está a un clic.",
      keywords: "reservar tour, booking online, viaje de ensueño, aventura garantizada, pago seguro"
    }
  };

  const seoData = seoContent[currentLang];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": seoData.title,
    "description": seoData.description,
    "url": `${baseUrl}${window.location.pathname}`,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": currentLang === 'pt' ? 'Início' : currentLang === 'en' ? 'Home' : 'Inicio',
          "item": `${baseUrl}${currentLang === 'pt' ? '/' : `/${currentLang}/`}`
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": seoData.title,
          "item": `${baseUrl}${window.location.pathname}`
        }
      ]
    }
  };

  return (
    <Helmet>
      <title>{seoData.title}</title>
      <meta name="description" content={seoData.description} />
      <meta name="keywords" content={seoData.keywords} />
      
      <meta property="og:title" content={seoData.title} />
      <meta property="og:description" content={seoData.description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${baseUrl}${window.location.pathname}`} />
      <meta property="og:image" content={`${baseUrl}/og-image-booking.jpg`} />
      <meta property="og:site_name" content="9 Rocks Tours" />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoData.title} />
      <meta name="twitter:description" content={seoData.description} />
      <meta name="twitter:image" content={`${baseUrl}/twitter-card-booking.jpg`} />
      
      <link rel="canonical" href={`${baseUrl}${window.location.pathname}`} />
      
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
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
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    numberOfPeople: 1,
    date: '',
    specialRequests: '',
    terms: false
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  // Conteúdo traduzido
  const content = {
    pt: {
      title: "Reserve Sua Aventura",
      subtitle: "Preencha os dados abaixo para confirmar sua reserva",
      personalInfo: "Informações Pessoais",
      firstName: "Nome",
      lastName: "Sobrenome", 
      email: "E-mail",
      phone: "Telefone",
      bookingDetails: "Detalhes da Reserva",
      numberOfPeople: "Número de Pessoas",
      preferredDate: "Data Preferida",
      specialRequests: "Pedidos Especiais",
      specialRequestsPlaceholder: "Alguma necessidade especial, restrições alimentares, etc.",
      termsText: "Aceito os",
      termsLink: "termos e condições",
      submit: "CONFIRMAR RESERVA",
      summary: "Resumo da Reserva",
      total: "Total",
      perPerson: "por pessoa",
      processing: "Processando...",
      successTitle: "Reserva Confirmada!",
      successMessage: "Obrigado! Sua reserva foi confirmada. Você receberá um e-mail com todos os detalhes.",
      backToTours: "Voltar aos Tours",
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
      subtitle: "Fill in the details below to confirm your booking",
      personalInfo: "Personal Information",
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      phone: "Phone",
      bookingDetails: "Booking Details", 
      numberOfPeople: "Number of People",
      preferredDate: "Preferred Date",
      specialRequests: "Special Requests",
      specialRequestsPlaceholder: "Any special needs, dietary restrictions, etc.",
      termsText: "I accept the",
      termsLink: "terms and conditions",
      submit: "CONFIRM BOOKING",
      summary: "Booking Summary",
      total: "Total",
      perPerson: "per person",
      processing: "Processing...",
      successTitle: "Booking Confirmed!",
      successMessage: "Thank you! Your booking has been confirmed. You will receive an email with all the details.",
      backToTours: "Back to Tours",
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
      subtitle: "Completa los datos a continuación para confirmar tu reserva",
      personalInfo: "Información Personal",
      firstName: "Nombre",
      lastName: "Apellido",
      email: "Correo",
      phone: "Teléfono",
      bookingDetails: "Detalles de la Reserva",
      numberOfPeople: "Número de Personas",
      preferredDate: "Fecha Preferida", 
      specialRequests: "Solicitudes Especiales",
      specialRequestsPlaceholder: "Alguna necesidad especial, restricciones alimentarias, etc.",
      termsText: "Acepto los",
      termsLink: "términos y condiciones", 
      submit: "CONFIRMAR RESERVA",
      summary: "Resumen de la Reserva",
      total: "Total",
      perPerson: "por persona",
      processing: "Procesando...",
      successTitle: "¡Reserva Confirmada!",
      successMessage: "¡Gracias! Tu reserva ha sido confirmada. Recibirás un correo con todos los detalles.",
      backToTours: "Volver a Tours",
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

  // Carregar dados do tour se especificado
  useEffect(() => {
    if (tourSlug) {
      const fetchTourData = async () => {
        try {
          const response = await fetch(`/api/tours/${tourSlug}?lang=${currentLang}`);
          const data = await response.json();
          setTourData(data);
        } catch (error) {
          console.error('Erro ao carregar tour:', error);
        }
      };
      fetchTourData();
    }
  }, [tourSlug, currentLang]);

  // Validação do formulário
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = content[currentLang].errors.firstName;
    if (!formData.lastName.trim()) newErrors.lastName = content[currentLang].errors.lastName;
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = content[currentLang].errors.email;
    }
    if (!formData.phone.trim()) newErrors.phone = content[currentLang].errors.phone;
    if (!formData.date) newErrors.date = content[currentLang].errors.date;
    if (!formData.terms) newErrors.terms = content[currentLang].errors.terms;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submeter formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const bookingData = {
        ...formData,
        tourId: tourData?.id,
        tourSlug: tourSlug,
        language: currentLang,
        totalPrice: tourData ? tourData.price * formData.numberOfPeople : 0
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        setSubmitted(true);
        
        // Google Analytics Event
        if (typeof gtag !== 'undefined') {
          gtag('event', 'purchase', {
            transaction_id: Date.now(),
            value: bookingData.totalPrice,
            currency: 'EUR',
            items: [{
              item_id: tourSlug,
              item_name: tourData?.name,
              price: tourData?.price,
              quantity: formData.numberOfPeople
            }]
          });
        }
      } else {
        throw new Error('Erro ao processar reserva');
      }
    } catch (error) {
      console.error('Erro ao submeter formulário:', error);
      alert('Erro ao processar sua reserva. Tente novamente.');
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

    // Limpar erro quando o usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const getToursUrl = () => {
    const langPrefix = currentLang === 'pt' ? '' : `/${currentLang}`;
    return `${langPrefix}/tours`;
  };

  const getTotalPrice = () => {
    return tourData ? tourData.price * formData.numberOfPeople : 0;
  };

  // Página de sucesso
  if (submitted) {
    return (
      <>
        <BookingSEOHead tourData={tourData} />
        <div className="booking-success">
          <div className="container">
            <div className="success-content">
              <div className="success-icon">✅</div>
              <h1>{content[currentLang].successTitle}</h1>
              <p>{content[currentLang].successMessage}</p>
              
              {tourData && (
                <div className="booking-summary">
                  <h3>{tourData.name}</h3>
                  <p>{content[currentLang].numberOfPeople}: {formData.numberOfPeople}</p>
                  <p>{content[currentLang].preferredDate}: {formData.date}</p>
                  <p>{content[currentLang].total}: €{getTotalPrice()}</p>
                </div>
              )}
              
              <Link to={getToursUrl()} className="back-button">
                {content[currentLang].backToTours}
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <BookingSEOHead tourData={tourData} />
      
      <div className="booking-form">
        <div className="container">
          <div className="booking-header">
            <h1>{content[currentLang].title}</h1>
            <p>{content[currentLang].subtitle}</p>
          </div>

          <div className="booking-content">
            <div className="form-section">
              <form onSubmit={handleSubmit}>
                {/* Informações Pessoais */}
                <div className="form-group">
                  <h2>{content[currentLang].personalInfo}</h2>
                  
                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="firstName">{content[currentLang].firstName} *</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={errors.firstName ? 'error' : ''}
                        required
                      />
                      {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                    </div>
                    
                    <div className="form-field">
                      <label htmlFor="lastName">{content[currentLang].lastName} *</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={errors.lastName ? 'error' : ''}
                        required
                      />
                      {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="email">{content[currentLang].email} *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={errors.email ? 'error' : ''}
                        required
                      />
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>
                    
                    <div className="form-field">
                      <label htmlFor="phone">{content[currentLang].phone} *</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={errors.phone ? 'error' : ''}
                        required
                      />
                      {errors.phone && <span className="error-message">{errors.phone}</span>}
                    </div>
                  </div>
                </div>

                {/* Detalhes da Reserva */}
                <div className="form-group">
                  <h2>{content[currentLang].bookingDetails}</h2>
                  
                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="numberOfPeople">{content[currentLang].numberOfPeople} *</label>
                      <select
                        id="numberOfPeople"
                        name="numberOfPeople"
                        value={formData.numberOfPeople}
                        onChange={handleInputChange}
                        required
                      >
                        {[1,2,3,4,5,6,7,8].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-field">
                      <label htmlFor="date">{content[currentLang].preferredDate} *</label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className={errors.date ? 'error' : ''}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                      {errors.date && <span className="error-message">{errors.date}</span>}
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="specialRequests">{content[currentLang].specialRequests}</label>
                    <textarea
                      id="specialRequests"
                      name="specialRequests"
                      value={formData.specialRequests}
                      onChange={handleInputChange}
                      placeholder={content[currentLang].specialRequestsPlaceholder}
                      rows="4"
                    />
                  </div>
                </div>

                {/* Termos e Condições */}
                <div className="form-group">
                  <div className="checkbox-field">
                    <input
                      type="checkbox"
                      id="terms"
                      name="terms"
                      checked={formData.terms}
                      onChange={handleInputChange}
                      className={errors.terms ? 'error' : ''}
                      required
                    />
                    <label htmlFor="terms">
                      {content[currentLang].termsText} <a href="/terms" target="_blank">{content[currentLang].termsLink}</a> *
                    </label>
                    {errors.terms && <span className="error-message">{errors.terms}</span>}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? content[currentLang].processing : content[currentLang].submit}
                </button>
              </form>
            </div>

            {/* Sidebar com resumo */}
            {tourData && (
              <div className="booking-sidebar">
                <div className="booking-summary">
                  <h3>{content[currentLang].summary}</h3>
                  
                  <div className="tour-info">
                    <img src={tourData.images[0]} alt={tourData.name} />
                    <div>
                      <h4>{tourData.name}</h4>
                      <p>{tourData.duration}</p>
                    </div>
                  </div>

                  <div className="price-breakdown">
                    <div className="price-line">
                      <span>€{tourData.price} x {formData.numberOfPeople} {content[currentLang].perPerson}</span>
                      <span>€{getTotalPrice()}</span>
                    </div>
                    
                    <div className="total-line">
                      <strong>
                        <span>{content[currentLang].total}</span>
                        <span>€{getTotalPrice()}</span>
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingForm;