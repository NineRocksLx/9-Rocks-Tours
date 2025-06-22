import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from '../utils/useTranslation';
import BookingForm from '../components/BookingForm';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const TourDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, getCurrentLanguage } = useTranslation();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    fetchTour();
  }, [id]);

  const fetchTour = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/tours/${id}`);
      setTour(response.data);
    } catch (err) {
      console.error('Error fetching tour:', err);
      if (err.response?.status === 404) {
        setError('Tour não encontrado');
      } else {
        setError(t('message.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getTourTypeColor = (type) => {
    const colors = {
      gastronomic: 'bg-orange-100 text-orange-800',
      cultural: 'bg-blue-100 text-blue-800',
      mixed: 'bg-purple-100 text-purple-800',
      custom: 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(getCurrentLanguage() === 'pt' ? 'pt-PT' : 'en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <Link 
            to="/"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  if (!tour) {
    return null;
  }

  const currentLang = getCurrentLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                  </svg>
                  {t('nav_home')}
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                    {tour.name[currentLang] || tour.name.pt}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Left Column - Images and Gallery */}
          <div className="lg:col-span-7">
            {/* Main Image */}
            <div className="aspect-w-16 aspect-h-9 mb-4">
              <div className="w-full h-96 bg-gradient-to-r from-gray-300 to-gray-400 rounded-lg overflow-hidden">
                {tour.images && tour.images.length > 0 ? (
                  <img
                    src={tour.images[selectedImageIndex]}
                    alt={tour.name[currentLang] || tour.name.pt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <svg className="w-24 h-24 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Image Thumbnails */}
            {tour.images && tour.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {tour.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      index === selectedImageIndex ? 'border-indigo-600' : 'border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${tour.name[currentLang] || tour.name.pt} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Tour Description */}
            <div className="mt-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Sobre este Tour
                </h2>
                <div className="prose prose-lg text-gray-700 leading-relaxed">
                  {tour.description[currentLang] || tour.description.pt}
                </div>
              </div>

              {/* Route Description */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {t('tour_route')}
                </h3>
                <div className="text-gray-700 leading-relaxed">
                  {tour.route_description[currentLang] || tour.route_description.pt}
                </div>
              </div>

              {/* Includes/Excludes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-green-700 mb-3">
                    ✓ {t('tour_includes')}
                  </h4>
                  <div className="text-gray-700">
                    {tour.includes[currentLang] || tour.includes.pt}
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-red-700 mb-3">
                    ✗ {t('tour_excludes')}
                  </h4>
                  <div className="text-gray-700">
                    {tour.excludes[currentLang] || tour.excludes.pt}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-5 mt-8 lg:mt-0">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              {/* Tour Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTourTypeColor(tour.tour_type)}`}>
                    {t(`tour_type_${tour.tour_type}`)}
                  </span>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-indigo-600">
                      {formatPrice(tour.price)}
                    </div>
                    <div className="text-sm text-gray-500">por pessoa</div>
                  </div>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {tour.name[currentLang] || tour.name.pt}
                </h1>
              </div>

              {/* Tour Info */}
              <div className="space-y-3 mb-6 border-b pb-6">
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>{tour.location}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>{tour.duration_hours} {t('tour_hours')}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                  <span>Máximo {tour.max_participants} pessoas</span>
                </div>
              </div>

              {/* Availability */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t('tour.availability')}
                </h3>
                {tour.availability_dates && tour.availability_dates.length > 0 ? (
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {tour.availability_dates.slice(0, 5).map((date, index) => (
                      <div key={index} className="text-sm text-gray-600 py-1">
                        {formatDate(date)}
                      </div>
                    ))}
                    {tour.availability_dates.length > 5 && (
                      <div className="text-sm text-gray-500 italic">
                        +{tour.availability_dates.length - 5} mais datas disponíveis
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Entre em contacto para verificar disponibilidade
                  </div>
                )}
              </div>

              {/* Booking Button */}
              <button
                onClick={() => setShowBookingForm(true)}
                className="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors duration-200"
                disabled={!tour.availability_dates || tour.availability_dates.length === 0}
              >
                {t('tour.book_now')}
              </button>

              {/* Contact Info */}
              <div className="mt-4 text-center text-sm text-gray-500">
                Tem dúvidas? <Link to="/contact" className="text-indigo-600 hover:text-indigo-700">Entre em contacto</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <BookingForm
          tour={tour}
          onClose={() => setShowBookingForm(false)}
          onBookingComplete={() => {
            setShowBookingForm(false);
            navigate('/booking-success');
          }}
        />
      )}
    </div>
  );
};

export default TourDetails;