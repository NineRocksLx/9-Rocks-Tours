// src/pages/TourDetails.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TourOverview from '../components/Tour/TourOverview';
import TourItinerary from '../components/Tour/TourItinerary';
import TourTripDetails from '../components/Tour/TourTripDetails';
import TourAccommodation from '../components/Tour/TourAccommodation';
import TourPricingDates from '../components/Tour/TourPricingDates';
import BookingForm from '../components/BookingForm';
import PaymentComponent from '../components/PaymentComponent';
import { getCurrentLanguage } from '../utils/i18n';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:8000';

const TourDetails = () => {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
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

  if (loading) return <div className="p-6 text-center">A carregar...</div>;
  if (!tour) return <div className="p-6 text-center">Tour não encontrado.</div>;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">
        {tour.name?.[currentLang] || tour.name?.pt || 'Sem nome'}
      </h1>

      {/* Imagem principal e miniaturas */}
      <div className="mb-4">
        <img
          src={tour.images?.[selectedImageIndex]}
          alt={`Imagem ${selectedImageIndex + 1}`}
          className="w-full h-96 object-cover rounded-lg"
        />
        <div className="flex mt-2 space-x-2 overflow-x-auto">
          {tour.images?.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Miniatura ${idx + 1}`}
              className={`h-20 w-32 object-cover rounded cursor-pointer ${
                idx === selectedImageIndex ? 'ring-4 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedImageIndex(idx)}
            />
          ))}
        </div>
      </div>

      <TourOverview tour={tour} />
      <TourItinerary itinerary={tour.itinerary} />
      <TourAccommodation accommodation={tour.accommodation} />
      <TourTripDetails details={tour.details} />
      <TourPricingDates pricing={tour.pricing} dates={tour.dates} />

      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">
          {currentLang === 'pt' ? 'Reserve o seu lugar' : 'Book your spot'}
        </h2>
        <BookingForm tourId={tour.id} />
        <div className="mt-4">
          <PaymentComponent amount={tour.price} />
        </div>
      </div>
    </div>
  );
};

export default TourDetails;
