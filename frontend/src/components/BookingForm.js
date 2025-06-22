import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from '../utils/useTranslation';
import PaymentComponent from './PaymentComponent';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const BookingForm = ({ tour, onClose, onBookingComplete }) => {
  const [step, setStep] = useState(1); // 1: Booking Form, 2: Payment
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    selected_date: '',
    participants: 1,
    special_requests: '',
    payment_method: 'paypal'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotal = () => {
    return tour.price * formData.participants;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const bookingData = {
        ...formData,
        tour_id: tour.id
      };

      const response = await axios.post(`${BACKEND_URL}/api/bookings`, bookingData);
      setBooking(response.data);
      setStep(2); // Move to payment step
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err.response?.data?.detail || 'Erro ao criar reserva. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    onBookingComplete();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const { t, getCurrentLanguage } = useTranslation();
  const currentLang = getCurrentLanguage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 1 ? t('booking_title') : 'Pagamento'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            // Booking Form
            <>
              {/* Tour Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {tour.name[currentLang] || tour.name.pt}
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {tour.location}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    {tour.duration_hours} horas
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {formatPrice(tour.price)} por pessoa
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                  <div className="text-red-800">{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('booking.customer_name')} *
                    </label>
                    <input
                      type="text"
                      id="customer_name"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('booking.customer_email')} *
                    </label>
                    <input
                      type="email"
                      id="customer_email"
                      name="customer_email"
                      value={formData.customer_email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('booking.customer_phone')} *
                  </label>
                  <input
                    type="tel"
                    id="customer_phone"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    required
                    placeholder="+351 912 345 678"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Tour Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="selected_date" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('booking.selected_date')} *
                    </label>
                    <select
                      id="selected_date"
                      name="selected_date"
                      value={formData.selected_date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Selecione uma data</option>
                      {tour.availability_dates?.map((date) => (
                        <option key={date} value={date}>
                          {formatDate(date)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="participants" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('booking.participants')} *
                    </label>
                    <select
                      id="participants"
                      name="participants"
                      value={formData.participants}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {Array.from({ length: tour.max_participants }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'pessoa' : 'pessoas'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="special_requests" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('booking.special_requests')}
                  </label>
                  <textarea
                    id="special_requests"
                    name="special_requests"
                    value={formData.special_requests}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Alergias alimentares, necessidades especiais, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Total */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      {formatPrice(calculateTotal())}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {formData.participants} × {formatPrice(tour.price)}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                  >
                    {i18n.t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'A processar...' : 'Continuar para Pagamento'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            // Payment Step
            <PaymentComponent
              booking={booking}
              tour={tour}
              total={calculateTotal()}
              onSuccess={handlePaymentSuccess}
              onBack={() => setStep(1)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingForm;