// src/pages/TourDetails.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import BookingForm from '../components/BookingForm';
import { useTranslation } from '../utils/useTranslation';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const TourDetails = () => {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const { t, getCurrentLanguage } = useTranslation();
  const currentLang = getCurrentLanguage();

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/tours/${id}`);
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

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tour não encontrado</h2>
          <a href="/tours" className="text-indigo-600 hover:text-indigo-700">
            Voltar aos tours
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tour Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {tour.name[currentLang] || tour.name.pt}
          </h1>
          <div className="flex items-center gap-6 text-gray-600">
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
              {tour.duration_hours} horas
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
              Máximo {tour.max_participants} pessoas
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="mb-8">
              {tour.images && tour.images.length > 0 ? (
                <>
                  <div className="mb-4">
                    <img
                      src={tour.images[selectedImageIndex]}
                      alt={`${tour.name[currentLang]} - Imagem ${selectedImageIndex + 1}`}
                      className="w-full h-96 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/800x400?text=Imagem+não+disponível';
                      }}
                    />
                  </div>
                  {tour.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {tour.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Miniatura ${idx + 1}`}
                          className={`h-20 w-32 object-cover rounded cursor-pointer ${
                            idx === selectedImageIndex ? 'ring-2 ring-indigo-600' : ''
                          }`}
                          onClick={() => setSelectedImageIndex(idx)}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/160x80?text=Sem+imagem';
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">Sem imagens disponíveis</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Descrição</h2>
              <p className="text-gray-700 whitespace-pre-line">
                {tour.description[currentLang] || tour.description.pt}
              </p>
            </div>

            {/* Route */}
            {tour.route_description && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Percurso</h2>
                <p className="text-gray-700">
                  {tour.route_description[currentLang] || tour.route_description.pt}
                </p>
              </div>
            )}

            {/* Includes/Excludes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {tour.includes && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Incluído</h3>
                  <p className="text-gray-700">
                    {tour.includes[currentLang] || tour.includes.pt}
                  </p>
                </div>
              )}
              
              {tour.excludes && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Não Incluído</h3>
                  <p className="text-gray-700">
                    {tour.excludes[currentLang] || tour.excludes.pt}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Booking */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <div className="mb-6">
                <div className="text-3xl font-bold text-indigo-600 mb-2">
                  {formatPrice(tour.price)}
                </div>
                <p className="text-gray-600">por pessoa</p>
              </div>

              {tour.availability_dates && tour.availability_dates.length > 0 ? (
                <div className="mb-6">
                  <p className="text-sm text-green-600 font-medium">
                    ✓ {tour.availability_dates.length} datas disponíveis
                  </p>
                </div>
              ) : (
                <div className="mb-6">
                  <p className="text-sm text-red-600 font-medium">
                    Sem datas disponíveis no momento
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowBookingForm(true)}
                disabled={!tour.availability_dates || tour.availability_dates.length === 0}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Reservar Agora
              </button>

              <div className="mt-6 space-y-4 text-sm text-gray-600">
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Confirmação imediata</span>
                </div>
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Cancelamento gratuito até 24h antes</span>
                </div>
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Guia profissional</span>
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
            alert('Reserva realizada com sucesso!');
          }}
        />
      )}
    </div>
  );
};

export default TourDetails;