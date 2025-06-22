import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import axios from 'axios';
import i18n from '../utils/i18n';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PaymentComponent = ({ booking, tour, total, onSuccess, onBack }) => {
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const createPayment = async (paymentData) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/payments/create`, {
        ...paymentData,
        return_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/payment/cancel`
      });
      
      return response.data;
    } catch (error) {
      console.error('Payment creation error:', error);
      throw new Error(error.response?.data?.detail || 'Erro ao criar pagamento');
    }
  };

  const handlePayPalPayment = async () => {
    const payment = await createPayment({
      amount: total,
      currency: 'EUR',
      tour_id: tour.id,
      booking_id: booking.id,
      customer_email: booking.customer_email,
      customer_name: booking.customer_name,
      payment_method: 'paypal'
    });
    
    return payment.payment_id;
  };

  const handlePayPalApprove = async (data) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${BACKEND_URL}/api/payments/execute/${data.orderID}`,
        { payer_id: data.payerID }
      );
      
      if (response.status === 200) {
        onSuccess();
      }
    } catch (error) {
      console.error('Payment execution error:', error);
      setError('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAlternativePayment = async (method) => {
    try {
      setLoading(true);
      setError('');

      const paymentData = {
        amount: total,
        currency: 'EUR',
        tour_id: tour.id,
        booking_id: booking.id,
        customer_email: booking.customer_email,
        customer_name: booking.customer_name,
        payment_method: method
      };

      if (method === 'mbway' && phoneNumber) {
        paymentData.phone_number = phoneNumber;
      }

      const payment = await createPayment(paymentData);
      
      if (payment.approval_url) {
        // Redirect to PayPal for Multibanco/MBWay processing
        window.location.href = payment.approval_url;
      } else {
        // For demonstration purposes, simulate success
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error('Alternative payment error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const currentLang = i18n.getCurrentLanguage();

  // PayPal configuration - using mock client ID for demo
  const paypalOptions = {
    'client-id': 'MOCK_PAYPAL_CLIENT_ID', // This should be replaced with real PayPal client ID
    currency: 'EUR',
    intent: 'capture',
    locale: currentLang === 'pt' ? 'pt_PT' : currentLang === 'es' ? 'es_ES' : 'en_US'
  };

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Resumo da Reserva</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Tour:</span>
            <span className="font-medium">{tour.name[currentLang] || tour.name.pt}</span>
          </div>
          <div className="flex justify-between">
            <span>Data:</span>
            <span>{new Date(booking.selected_date).toLocaleDateString('pt-PT')}</span>
          </div>
          <div className="flex justify-between">
            <span>Participantes:</span>
            <span>{booking.participants}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold text-gray-900">
            <span>Total:</span>
            <span className="text-lg">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Payment Method Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Escolha o método de pagamento
        </h3>
        
        <div className="space-y-3">
          {/* PayPal Option */}
          <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${
            paymentMethod === 'paypal' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
          }`}>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="payment_method"
                value="paypal"
                checked={paymentMethod === 'paypal'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-3"
              />
              <div className="flex items-center">
                <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">PayPal</span>
                </div>
                <span className="font-medium">PayPal</span>
              </div>
            </label>
          </div>

          {/* Multibanco Option */}
          <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${
            paymentMethod === 'multibanco' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
          }`}>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="payment_method"
                value="multibanco"
                checked={paymentMethod === 'multibanco'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-3"
              />
              <div className="flex items-center">
                <div className="w-12 h-8 bg-red-600 rounded flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-xs">MB</span>
                </div>
                <span className="font-medium">Multibanco</span>
              </div>
            </label>
          </div>

          {/* MBWay Option */}
          <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${
            paymentMethod === 'mbway' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
          }`}>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="payment_method"
                value="mbway"
                checked={paymentMethod === 'mbway'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-3"
              />
              <div className="flex items-center">
                <div className="w-12 h-8 bg-green-600 rounded flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-xs">MB</span>
                </div>
                <span className="font-medium">MBWay</span>
              </div>
            </label>
            
            {paymentMethod === 'mbway' && (
              <div className="mt-3">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Número de telemóvel:
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+351 912 345 678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Processing */}
      <div className="space-y-4">
        {paymentMethod === 'paypal' && (
          <div>
            <PayPalScriptProvider options={paypalOptions}>
              <PayPalButtons
                style={{ layout: 'vertical' }}
                createOrder={handlePayPalPayment}
                onApprove={handlePayPalApprove}
                onError={(err) => {
                  console.error('PayPal error:', err);
                  setError('Erro no PayPal. Tente novamente.');
                }}
                disabled={loading}
              />
            </PayPalScriptProvider>
          </div>
        )}

        {paymentMethod === 'multibanco' && (
          <button
            onClick={() => handleAlternativePayment('multibanco')}
            disabled={loading}
            className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'A processar...' : 'Pagar com Multibanco'}
          </button>
        )}

        {paymentMethod === 'mbway' && (
          <button
            onClick={() => handleAlternativePayment('mbway')}
            disabled={loading || !phoneNumber}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'A processar...' : 'Pagar com MBWay'}
          </button>
        )}
      </div>

      {/* Back Button */}
      <div className="flex justify-start">
        <button
          onClick={onBack}
          disabled={loading}
          className="text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
        >
          ← Voltar aos dados da reserva
        </button>
      </div>

      {/* Security Notice */}
      <div className="text-xs text-gray-500 text-center">
        <div className="flex items-center justify-center mb-1">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Pagamento seguro
        </div>
        <p>Os seus dados de pagamento são processados de forma segura.</p>
      </div>
    </div>
  );
};

export default PaymentComponent;