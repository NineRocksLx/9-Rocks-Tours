import React, { useState } from 'react';
import axios from 'axios';
import i18n from '../utils/i18n';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PaymentComponent = ({ booking, tour, total, onSuccess, onBack }) => {
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mockPaymentStep, setMockPaymentStep] = useState(0); // 0: inicial, 1: processando, 2: sandbox

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const createPayment = async (paymentData) => {
    try {
      console.log('💳 Criando pagamento:', paymentData);
      
      const response = await axios.post(`${BACKEND_URL}/api/payments/create`, {
        ...paymentData,
        return_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/payment/cancel`
      });
      
      console.log('✅ Resposta do pagamento:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Payment creation error:', error);
      throw new Error(error.response?.data?.detail || 'Erro ao criar pagamento');
    }
  };

  // CORREÇÃO: PayPal MOCK melhorado
  const handlePayPalPayment = async () => {
    try {
      setLoading(true);
      setError('');
      setMockPaymentStep(1); // Processando
      
      console.log('🔄 Iniciando pagamento PayPal MOCK...');
      
      const paymentData = {
        amount: total,
        currency: 'EUR',
        tour_id: tour.id,
        booking_id: booking.id,
        customer_email: booking.customer_email,
        customer_name: booking.customer_name,
        payment_method: 'paypal'
      };
      
      const payment = await createPayment(paymentData);
      
      console.log('💳 Pagamento criado:', payment);
      
      // Simular redirecionamento para PayPal Sandbox
      setMockPaymentStep(2);
      
      // Simular aprovação automática do PayPal (MOCK)
      setTimeout(async () => {
        try {
          console.log('🔄 Simulando aprovação PayPal...');
          
          // Simular execução do pagamento
          const executionResponse = await axios.post(
            `${BACKEND_URL}/api/payments/execute/${payment.payment_id}`,
            { payer_id: 'MOCK_PAYER_ID_12345' }
          );
          
          console.log('✅ Pagamento executado:', executionResponse.data);
          
          alert('✅ Pagamento PayPal simulado com sucesso!\n\nID Transação: ' + payment.payment_id);
          onSuccess();
          
        } catch (execError) {
          console.error('❌ Erro na execução:', execError);
          setError('Erro ao finalizar pagamento PayPal');
          setMockPaymentStep(0);
        }
      }, 3000); // 3 segundos para simular processo PayPal
      
    } catch (error) {
      console.error('❌ PayPal payment error:', error);
      setError(error.message);
      setMockPaymentStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleAlternativePayment = async (method) => {
    try {
      setLoading(true);
      setError('');

      console.log(`💳 Iniciando pagamento ${method.toUpperCase()}...`);

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
      
      console.log(`✅ Pagamento ${method} criado:`, payment);
      
      // Simular sucesso para métodos alternativos
      setTimeout(() => {
        alert(`✅ Pagamento ${method.toUpperCase()} simulado com sucesso!\n\nReferência: ${payment.payment_id}`);
        onSuccess();
      }, 2000);
      
    } catch (error) {
      console.error(`❌ ${method} payment error:`, error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const currentLang = i18n.getCurrentLanguage();

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
            <span>Depósito a pagar:</span>
            <span className="text-lg text-indigo-600">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-red-800">{error}</div>
          </div>
        </div>
      )}

      {/* MOCK PayPal Simulator UI */}
      {mockPaymentStep === 2 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7.076 21.337H2.47a.64.64 0 0 1-.633-.74L4.944 2.79A.64.64 0 0 1 5.572 2h14.365a.64.64 0 0 1 .633.79l-2.109 17.807a.64.64 0 0 1-.633.74H7.076z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">
              🔄 PayPal Sandbox (SIMULAÇÃO)
            </h3>
            <p className="text-blue-700 mb-4">
              A processar pagamento de {formatPrice(total)}...
            </p>
            <div className="animate-pulse">
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
              </div>
            </div>
            <p className="text-sm text-blue-600 mt-3">
              ⏱️ Simulação automática em 3 segundos...
            </p>
          </div>
        </div>
      )}

      {/* Payment Method Selection */}
      {mockPaymentStep === 0 && (
        <>
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
                    <div>
                      <span className="font-medium">PayPal</span>
                      <div className="text-xs text-blue-600">🔧 MODO SIMULAÇÃO</div>
                    </div>
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
                    <div>
                      <span className="font-medium">Multibanco</span>
                      <div className="text-xs text-gray-500">Referência automática</div>
                    </div>
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
                    <div>
                      <span className="font-medium">MBWay</span>
                      <div className="text-xs text-gray-500">Pagamento via telemóvel</div>
                    </div>
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
              <button
                onClick={handlePayPalPayment}
                disabled={loading || mockPaymentStep > 0}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading || mockPaymentStep === 1 ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    A processar PayPal...
                  </div>
                ) : (
                  'Pagar com PayPal (SIMULAÇÃO)'
                )}
              </button>
            )}

            {paymentMethod === 'multibanco' && (
              <button
                onClick={() => handleAlternativePayment('multibanco')}
                disabled={loading}
                className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'A processar...' : 'Pagar com Multibanco (SIMULAÇÃO)'}
              </button>
            )}

            {paymentMethod === 'mbway' && (
              <button
                onClick={() => handleAlternativePayment('mbway')}
                disabled={loading || !phoneNumber}
                className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'A processar...' : 'Pagar com MBWay (SIMULAÇÃO)'}
              </button>
            )}
          </div>
        </>
      )}

      {/* Back Button */}
      {mockPaymentStep === 0 && (
        <div className="flex justify-start">
          <button
            onClick={onBack}
            disabled={loading}
            className="text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
          >
            ← Voltar aos dados da reserva
          </button>
        </div>
      )}

      {/* Security Notice */}
      <div className="text-xs text-gray-500 text-center">
        <div className="flex items-center justify-center mb-1">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Pagamento seguro (Modo SIMULAÇÃO)
        </div>
        <p>🔧 Todos os pagamentos são simulados para teste</p>
      </div>
    </div>
  );
};

export default PaymentComponent;