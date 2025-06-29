import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from '../utils/useTranslation';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ToursPage = () => {
  const { t, getCurrentLanguage } = useTranslation();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/tours?active_only=true`);
      setTours(response.data);
    } catch (err) {
      console.error('Error fetching tours:', err);
      setError(t('message.error'));
    } finally {
      setLoading(false);
    }
  };

  const filteredTours = selectedType === 'all' 
    ? tours 
    : tours.filter(tour => tour.tour_type === selectedType);

  const getTourTypeColor = (type) => {
    const colors = {
      gastronomic: 'bg-orange-100 text-orange-800',
      cultural: 'bg-blue-100 text-blue-800',
      mixed: 'bg-purple-100 text-purple-800',
      custom: 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
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
          <button 
            onClick={fetchTours}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            {t('common_try_again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('nav_tours')}</h1>
          <p className="mt-2 text-lg text-gray-600">
            Explore as nossas experiências únicas por Portugal
          </p>
        </div>
      </div>

      {/* Tours Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tour Type Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-6 py-3 rounded-full font-medium transition-colors ${
              selectedType === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Todos os Tours
          </button>
          <button
            onClick={() => setSelectedType('gastronomic')}
            className={`px-6 py-3 rounded-full font-medium transition-colors ${
              selectedType === 'gastronomic'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t('tour_type_gastronomic')}
          </button>
          <button
            onClick={() => setSelectedType('cultural')}
            className={`px-6 py-3 rounded-full font-medium transition-colors ${
              selectedType === 'cultural'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t('tour_type_cultural')}
          </button>
          <button
            onClick={() => setSelectedType('mixed')}
            className={`px-6 py-3 rounded-full font-medium transition-colors ${
              selectedType === 'mixed'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t('tour_type_mixed')}
          </button>
        </div>

        {/* Tours Grid */}
        {filteredTours.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              {t('message_no_tours')}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTours.map((tour) => (
              <div key={tour.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {/* Tour Image */}
                <div className="h-48 bg-gradient-to-r from-gray-300 to-gray-400 relative">
                  {tour.images && tour.images.length > 0 ? (
                    <img
                      src={tour.images[0]}
                      alt={tour.name[getCurrentLanguage()] || tour.name.pt}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Tour Type Badge */}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTourTypeColor(tour.tour_type)}`}>
                      {t(`tour_type_${tour.tour_type}`)}
                    </span>
                  </div>
                </div>

                {/* Tour Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {tour.name[getCurrentLanguage()] || tour.name.pt}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed line-clamp-3">
                    {tour.short_description[getCurrentLanguage()] || tour.short_description.pt}
                  </p>
                  
                  {/* Tour Details */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {tour.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {tour.duration_hours} {t('tour_hours')}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                      1-{tour.max_participants} {t('tour_max_people')}
                    </div>
                  </div>

                  {/* Price and Action */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-indigo-600">
                        {formatPrice(tour.price)}
                      </span>
                      <span className="text-gray-500 text-sm ml-1">/ {t('tour_person')}</span>
                    </div>
                    <Link
                      to={`/tour/${tour.id}`}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors duration-200"
                    >
                      {t('tour_view_details')}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToursPage;