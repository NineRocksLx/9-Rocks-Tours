// frontend/src/components/PaymentComponent.js - GetYourGuide Style
import React, { useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config/appConfig';

const PaymentComponent = ({ bookingData, onPaymentSuccess, onBack }) => {
  const [paymentTiming, setPaymentTiming] = useState('now'); // 'now' or 'later'
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mockPaymentStep, setMockPaymentStep] = useState(0);

  // Conteúdo traduzido - GetYourGuide Style
  const content = {
    pt: {
      title: "Selecione quando deseja pagar",
      payNow: "Pagar agora",
      payLater: "Pagar depois",
      payLaterDescription: "Nenhuma cobrança será feita hoje. O pagamento será iniciado em Segunda-feira, 11 de Agosto de 2025.",
      paymentMethodTitle: "Selecione uma forma de pagamento",
      securityText: "Todos os pagamentos são criptografados e seguros",
      payButton: "Pagar",
      processing: "A processar...",
      backButton: "← Voltar aos dados da reserva",
      phoneLabel: "Número de telemóvel:",
      phonePlaceholder: "+351 912 345 678",
      mockNotice: "🔧 MODO SIMULAÇÃO",
      mockSecurityText: "Pagamento seguro (Modo SIMULAÇÃO)",
      summary: "Resumo do pedido",
      participants: "participantes",
      deposit: "Depósito a pagar:",
      remaining: "Restante no dia do tour:",
      editBooking: "Alterar data ou número de participantes"
    },
    en: {
      title: "Select when you want to pay",
      payNow: "Pay now",
      payLater: "Pay later",
      payLaterDescription: "No charge will be made today. Payment will be initiated on Monday, August 11, 2025.",
      paymentMethodTitle: "Select a payment method",
      securityText: "All payments are encrypted and secure",
      payButton: "Pay",
      processing: "Processing...",
      backButton: "← Back to booking details",
      phoneLabel: "Mobile number:",
      phonePlaceholder: "+351 912 345 678",
      mockNotice: "🔧 SIMULATION MODE",
      mockSecurityText: "Secure payment (Simulation Mode)",
      summary: "Order summary",
      participants: "participants",
      deposit: "Deposit to pay:",
      remaining: "Remaining on tour day:",
      editBooking: "Change date or number of participants"
    },
    es: {
      title: "Selecciona cuándo quieres pagar",
      payNow: "Pagar ahora",
      payLater: "Pagar después",
      payLaterDescription: "No se hará ningún cargo hoy. El pago se iniciará el Lunes, 11 de Agosto de 2025.",
      paymentMethodTitle: "Selecciona una forma de pago",
      securityText: "Todos los pagos están cifrados y son seguros",
      payButton: "Pagar",
      processing: "Procesando...",
      backButton: "← Volver a los datos de la reserva",
      phoneLabel: "Número de móvil:",
      phonePlaceholder: "+351 912 345 678",
      mockNotice: "🔧 MODO SIMULACIÓN",
      mockSecurityText: "Pago seguro (Modo Simulación)",
      summary: "Resumen del pedido",
      participants: "participantes",
      deposit: "Depósito a pagar:",
      remaining: "Restante el día del tour:",
      editBooking: "Cambiar fecha o número de participantes"
    }
  };

  const t = content[bookingData.language] || content.pt;

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

  const handlePayment = async (method) => {
    try {
      setLoading(true);
      setError('');

      if (paymentTiming === 'later') {
        // Simular "Pagar depois"
        setTimeout(() => {
          alert(`✅ Reserva confirmada! Você receberá instruções de pagamento por email.`);
          onPaymentSuccess();
        }, 1500);
        return;
      }

      console.log(`💳 Iniciando pagamento ${method.toUpperCase()}...`);

      const paymentData = {
        amount: bookingData.depositAmount,
        currency: 'EUR',
        tour_id: bookingData.tour.id,
        booking_id: bookingData.id,
        customer_email: bookingData.email,
        customer_name: `${bookingData.firstName} ${bookingData.lastName}`,
        payment_method: method
      };

      if (method === 'mbway' && phoneNumber) {
        paymentData.phone_number = phoneNumber;
      }

      const payment = await createPayment(paymentData);
      
      console.log(`✅ Pagamento ${method} criado:`, payment);
      
      // Simular processo de pagamento
      if (method === 'paypal') {
        setMockPaymentStep(1);
        setTimeout(() => {
          setMockPaymentStep(2);
          setTimeout(() => {
            alert(`✅ Pagamento ${method.toUpperCase()} simulado com sucesso!\n\nID Transação: ${payment.payment_id}`);
            onPaymentSuccess();
          }, 3000);
        }, 1000);
      } else {
        setTimeout(() => {
          alert(`✅ Pagamento ${method.toUpperCase()} simulado com sucesso!\n\nReferência: ${payment.payment_id}`);
          onPaymentSuccess();
        }, 2000);
      }
      
    } catch (error) {
      console.error(`❌ ${method} payment error:`, error);
      setError(error.message);
      setMockPaymentStep(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 🎯 PROGRESSO - GetYourGuide Style */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">✓</div>
              <span className="ml-2 text-sm font-medium text-green-600">Dados pessoais</span>
            </div>
            <div className="w-12 h-0.5 bg-blue-600"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
              <span className="ml-2 text-sm font-medium text-blue-600">Pagamento</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário de Pagamento */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
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
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
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
                      A processar pagamento de {formatPrice(bookingData.depositAmount)}...
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

              {mockPaymentStep === 0 && (
                <>
                  {/* 🎯 SELEÇÃO DE TIMING - GetYourGuide Style */}
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">{t.title}</h2>
                    
                    <div className="space-y-4">
                      {/* Pagar Agora */}
                      <div className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                        paymentTiming === 'now' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                      }`}>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="payment_timing"
                            value="now"
                            checked={paymentTiming === 'now'}
                            onChange={(e) => setPaymentTiming(e.target.value)}
                            className="w-5 h-5 text-blue-600 mr-4"
                          />
                          <div>
                            <span className="font-semibold text-gray-900">{t.payNow}</span>
                          </div>
                        </label>
                      </div>

                      {/* Pagar Depois */}
                      <div className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                        paymentTiming === 'later' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                      }`}>
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="radio"
                            name="payment_timing"
                            value="later"
                            checked={paymentTiming === 'later'}
                            onChange={(e) => setPaymentTiming(e.target.value)}
                            className="w-5 h-5 text-blue-600 mr-4 mt-0.5"
                          />
                          <div>
                            <div className="font-semibold text-gray-900 mb-1">{t.payLater}</div>
                            <p className="text-sm text-gray-600">{t.payLaterDescription}</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 🎯 MÉTODOS DE PAGAMENTO - Só se "Pagar Agora" */}
                  {paymentTiming === 'now' && (
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">{t.paymentMethodTitle}</h3>
                      
                      {/* Security Badge */}
                      <div className="flex items-center mb-6 p-3 bg-green-50 rounded-lg border border-green-200">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-green-800">{t.securityText}</span>
                      </div>
                      
                      <div className="space-y-3">
                        {/* PayPal */}
                        <div className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                          paymentMethod === 'paypal' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                        }`}>
                          <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                name="payment_method"
                                value="paypal"
                                checked={paymentMethod === 'paypal'}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-5 h-5 text-blue-600 mr-4"
                              />
                              <span className="font-medium">PayPal</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">{t.mockNotice}</div>
                              <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                                <span className="text-white font-bold text-xs">PayPal</span>
                              </div>
                            </div>
                          </label>
                        </div>

                        {/* Google Pay */}
                        <div className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                          paymentMethod === 'googlepay' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                        }`}>
                          <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                name="payment_method"
                                value="googlepay"
                                checked={paymentMethod === 'googlepay'}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-5 h-5 text-blue-600 mr-4"
                              />
                              <span className="font-medium">Google Pay</span>
                            </div>
                            <div className="w-12 h-8 bg-white border border-gray-300 rounded flex items-center justify-center">
                              <span className="text-gray-700 font-bold text-xs">G Pay</span>
                            </div>
                          </label>
                        </div>

                        {/* Cartão */}
                        <div className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                          paymentMethod === 'card' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                        }`}>
                          <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                name="payment_method"
                                value="card"
                                checked={paymentMethod === 'card'}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-5 h-5 text-blue-600 mr-4"
                              />
                              <span className="font-medium">Cartão de débito ou crédito</span>
                            </div>
                            <div className="flex space-x-1">
                              <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
                              <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">MC</div>
                              <div className="w-8 h-5 bg-blue-800 rounded text-white text-xs flex items-center justify-center font-bold">AE</div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 🎯 BOTÃO DE AÇÃO */}
                  <div className="space-y-4">
                    <button
                      onClick={() => handlePayment(paymentMethod)}
                      disabled={loading || mockPaymentStep > 0}
                      className={`
                        w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform
                        ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] cursor-pointer'}
                        text-white shadow-lg hover:shadow-xl
                      `}
                    >
                      {loading || mockPaymentStep === 1 ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                          {t.processing}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          {paymentTiming === 'later' ? 'Confirmar Reserva' : `${t.payButton} ${formatPrice(bookingData.depositAmount)}`}
                        </div>
                      )}
                    </button>

                    {/* Voltar */}
                    <button
                      onClick={onBack}
                      disabled={loading}
                      className="w-full text-blue-600 hover:text-blue-700 font-medium py-2 disabled:opacity-50"
                    >
                      {t.backButton}
                    </button>
                  </div>
                </>
              )}

              {/* Security Notice */}
              <div className="mt-6 text-center">
                <div className="text-xs text-gray-500 flex items-center justify-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  {t.mockSecurityText}
                </div>
              </div>
            </div>
          </div>

          {/* 🎯 SIDEBAR - GetYourGuide Style */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">{t.summary}</h3>
              
              {/* Tour Card */}
              <div className="flex items-start space-x-4 mb-6 p-4 bg-gray-50 rounded-xl">
                {bookingData.tour.images && bookingData.tour.images[0] && (
                  <img 
                    src={bookingData.tour.images[0]} 
                    alt={bookingData.tour.name?.[bookingData.language] || bookingData.tour.name?.pt} 
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg mb-2">
                    {bookingData.tour.name?.[bookingData.language] || bookingData.tour.name?.pt || bookingData.tour.name}
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(bookingData.date + 'T00:00:00').toLocaleDateString('pt-PT', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })}
                    </p>
                    <p className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {bookingData.numberOfPeople} {t.participants}
                    </p>
                  </div>
                  <button className="text-blue-600 text-sm hover:underline mt-2">
                    {t.editBooking}
                  </button>
                </div>
              </div>

              {/* Cálculos */}
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-800 font-bold text-lg">{t.deposit}</span>
                    <span className="text-blue-900 font-bold text-2xl">{formatPrice(bookingData.depositAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-600">{t.remaining}</span>
                    <span className="text-blue-700 font-semibold">{formatPrice(bookingData.remainingAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{`${bookingData.firstName} ${bookingData.lastName}`}</p>
                    <p className="text-sm text-gray-600">{bookingData.email}</p>
                    <p className="text-sm text-gray-600">{bookingData.phone}</p>
                  </div>
                  <button className="text-blue-600 text-sm hover:underline">
                    Editar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentComponent;