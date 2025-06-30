import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import BookingForm from '../components/BookingForm';
import { useTranslation } from '../utils/useTranslation';
import TourItinerary from '../components/TourItinerary';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const TourDetails = () => {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { t, getCurrentLanguage } = useTranslation();
  const currentLang = getCurrentLanguage();

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/tours/${id}`);
        console.log('TOUR DATA:', response.data); // DEBUG
        console.log('ROUTE DESCRIPTION:', response.data.route_description); // DEBUG
        setTour(response.data);
      } catch (error) {
        console.error('Erro ao buscar tour:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [id]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(price);
  };

  const calculateDeposit = (totalPrice) => totalPrice * 0.30;
  const calculateRemaining = (totalPrice) => totalPrice * 0.70;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tour não encontrado</h2>
          <a href="/tours" className="text-indigo-600 hover:text-indigo-700">Voltar aos tours</a>
        </div>
      </div>
    );
  }

  // TABS COM TRADUÇÕES CORRETAS
  const tabs = [
    { key: 'overview', label: t('tab_overview'), icon: '📋' },
    { key: 'itinerary', label: t('tab_itinerary'), icon: '🗺️' },
    { key: 'details', label: t('tab_details'), icon: 'ℹ️' },
  ];
  
  const renderTabContent = () => {
    console.log('ACTIVE TAB:', activeTab); // DEBUG
    console.log('TOUR OBJECT:', tour); // DEBUG
    
    switch (activeTab) {
      case 'itinerary':
        console.log('RENDERING ITINERARY WITH TOUR:', tour); // DEBUG
        return (
          <div className="w-full max-w-none">
            <TourItinerary tour={tour} />
          </div>
        );
      case 'details':
        return (
          <div className="space-y-6 max-w-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {t('itinerary_important_info')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">🕒</span>
                <div>
                  <h4 className="font-medium text-gray-900">{t('itinerary_duration')}</h4>
                  <p className="text-gray-600">{tour.duration_hours} {t('common_hours')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">👥</span>
                <div>
                  <h4 className="font-medium text-gray-900">{t('itinerary_group')}</h4>
                  <p className="text-gray-600">
                    {t('itinerary_max')} {tour.max_participants} {tour.max_participants === 1 ? t('common_person') : t('common_people')}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">💰</span>
                <div>
                  <h4 className="font-medium text-gray-900">{t('itinerary_payment')}</h4>
                  <p className="text-gray-600">{t('itinerary_payment_details')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">❌</span>
                <div>
                  <h4 className="font-medium text-gray-900">{t('itinerary_cancellation')}</h4>
                  <p className="text-gray-600">{t('itinerary_cancellation_details')}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'overview':
      default:
        return (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('tour_description')}</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {tour.description[currentLang] || tour.description.pt}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="text-green-600 mr-2">✓</span>{t('tour_included')}
                </h4>
                <p className="text-gray-700">{tour.includes[currentLang] || tour.includes.pt}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="text-red-600 mr-2">✗</span>{t('tour_not_included')}
                </h4>
                <p className="text-gray-700">{tour.excludes[currentLang] || tour.excludes.pt}</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative">
        <div className="h-96 lg:h-[500px] relative overflow-hidden">
          {tour.images && tour.images.length > 0 ? (
            <img 
              src={tour.images[selectedImageIndex]} 
              alt={tour.name[currentLang] || tour.name.pt} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center">
              <span className="text-gray-600 text-xl">Sem imagem disponível</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
                {tour.name[currentLang] || tour.name.pt}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {tour.location}
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  {tour.duration_hours} {t('common_hours')}
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                  {t('common_up_to')} {tour.max_participants} {tour.max_participants === 1 ? t('common_person') : t('common_people')}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Image Gallery Thumbnails */}
        {tour.images && tour.images.length > 1 && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            {tour.images.slice(0, 4).map((img, idx) => (
              <button 
                key={idx} 
                onClick={() => setSelectedImageIndex(idx)} 
                className={`w-16 h-12 rounded overflow-hidden border-2 ${
                  idx === selectedImageIndex ? 'border-white' : 'border-white/50'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
            {tour.images.length > 4 && (
              <button className="w-16 h-12 rounded bg-black/50 text-white flex items-center justify-center text-xs font-semibold">
                +{tour.images.length - 4}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Content Tabs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button 
                      key={tab.key} 
                      onClick={() => setActiveTab(tab.key)} 
                      className={`flex-shrink-0 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.key 
                          ? 'border-indigo-500 text-indigo-600' 
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="mr-2 hidden sm:inline">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="p-4 sm:p-6 min-h-[300px] overflow-visible">
                {renderTabContent()}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Sidebar COM TODAS AS TRADUÇÕES */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <div className="mb-6">
                <div className="text-3xl font-bold text-indigo-600 mb-2">
                  {formatPrice(tour.price)}
                </div>
                <p className="text-gray-600 text-sm">{t('sidebar_total_price')}</p>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('sidebar_deposit')}</span>
                      <span className="font-semibold text-blue-600">
                        {formatPrice(calculateDeposit(tour.price))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('sidebar_remaining')}</span>
                      <span className="font-semibold">
                        {formatPrice(calculateRemaining(tour.price))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Availability Status */}
              {tour.availability_dates && tour.availability_dates.length > 0 ? (
                <div className="mb-6">
                  <p className="text-sm text-green-600 font-medium">
                    ✓ {tour.availability_dates.length} {t('sidebar_dates_available')}
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    {tour.availability_dates.slice(0, 3).map(date => (
                      <div key={date}>
                        {new Date(date + 'T00:00:00').toLocaleDateString('pt-PT')}
                      </div>
                    ))}
                    {tour.availability_dates.length > 3 && (
                      <div>+ {tour.availability_dates.length - 3} mais...</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <p className="text-sm text-red-600 font-medium">
                    {t('tour_no_dates_available')}
                  </p>
                </div>
              )}
              
              {/* Book Now Button COM TRADUÇÃO */}
              <button 
                onClick={() => setShowBookingForm(true)} 
                disabled={!tour.availability_dates || tour.availability_dates.length === 0} 
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('tour_reserve_now')}
              </button>
              
              {/* Benefits COM TODAS AS TRADUÇÕES */}
              <div className="mt-6 space-y-4 text-sm text-gray-600">
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('sidebar_instant_confirmation')}</span>
                </div>
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('sidebar_free_cancellation')}</span>
                </div>
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('sidebar_professional_guide')}</span>
                </div>
              </div>

              {/* Tour Info Summary COM TODAS AS TRADUÇÕES */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>{t('sidebar_type')}</span>
                    <span className="font-medium">{t(`tour_type_${tour.tour_type}`)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('sidebar_duration')}</span>
                    <span className="font-medium">{tour.duration_hours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('sidebar_max_group')}</span>
                    <span className="font-medium">
                      {tour.max_participants} {tour.max_participants === 1 ? t('common_person') : t('common_people')}
                    </span>
                  </div>
                </div>
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
            alert(t('message_book_success'));
          }}
        />
      )}
    </div>
  );
};

export default TourDetails;