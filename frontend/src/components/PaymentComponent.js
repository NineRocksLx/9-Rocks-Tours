import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config/appConfig';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeCheckoutForm from './StripeCheckoutForm';

const PaymentComponent = ({ bookingData, onPaymentSuccess, onBack }) => {
  const navigate = useNavigate();
  console.log("🔍 DEBUG: PaymentComponent inicializado");
  console.log("🔍 DEBUG: navigate function:", typeof navigate);
  const [paymentMethod, setPaymentMethod] = useState('googlepay');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Estados de status dos métodos de pagamento
  const [paypalStatus, setPaypalStatus] = useState('checking');
  const [googlePayStatus, setGooglePayStatus] = useState('checking');
  const [stripeConfig, setStripeConfig] = useState(null);
  
  // Estados do Google Pay
  const [googlePayReady, setGooglePayReady] = useState(false);
  const [googlePayClient, setGooglePayClient] = useState(null);

  // Estados para o Stripe Elements
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState('');

  const content = {
    pt: {
      paymentMethodTitle: "Selecione uma forma de pagamento",
      securityText: "Todos os pagamentos são criptografados e seguros",
      payButton: "Pagar com",
      processing: "A processar...",
      backButton: "← Voltar aos dados da reserva",
      phoneLabel: "Número de telemóvel:",
      phonePlaceholder: "+351 912 345 678",
      summary: "Resumo do pedido",
      participants: "participantes",
      deposit: "Depósito a pagar:",
      remaining: "Restante no dia do tour:",
      editBooking: "Alterar data ou número de participantes",
      paypalAvailable: "PayPal disponível e conectado",
      paypalUnavailable: "PayPal temporariamente indisponível",
      testingPayment: "A testar conexão de pagamento...",
      securePayment: "Pagamento 100% seguro",
      instantConfirmation: "Confirmação instantânea",
      paymentError: "Erro no pagamento",
      tryAgain: "Tentar novamente",
      comingSoon: "Em breve"
    }
  };

  const t = content[bookingData.language] || content.pt;

  // Inicialização
  useEffect(() => {
    initializePaymentMethods();
    
    // Carregar a chave pública do Stripe para inicializar o Stripe.js
    axios.get(`${BACKEND_URL}/api/payments/stripe/config`).then(res => {
      if (res.data.publishable_key) {
        setStripePromise(loadStripe(res.data.publishable_key));
      }
    }).catch(err => {
      console.error('Erro ao carregar configuração Stripe:', err);
    });
  }, []);

  const initializePaymentMethods = async () => {
    // Executar em paralelo
    await Promise.all([
      testPayPalConnection(),
      initializeGooglePay()
    ]);
  };

  // Teste PayPal
  const testPayPalConnection = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/payments/test/paypal`);
      
      if (response.data.status === 'success' || response.data.status === 'connected') {
        setPaypalStatus('available');
      } else {
        setPaypalStatus('unavailable');
      }
    } catch (error) {
      setPaypalStatus('unavailable');
    }
  };

  // Inicialização Google Pay
  const initializeGooglePay = async () => {
    try {
      const configResponse = await axios.get(`${BACKEND_URL}/api/payments/stripe/config`);
      
      if (!configResponse.data.available || !configResponse.data.publishable_key) {
        setGooglePayStatus('unavailable');
        return;
      }
      
      setStripeConfig(configResponse.data);
      
      if (!window.google || !window.google.payments) {
        await loadGooglePayAPI();
      }
      
      if (!window.google || !window.google.payments) {
        setGooglePayStatus('unavailable');
        return;
      }
      
      const environment = configResponse.data.environment || 'TEST';
      
      const paymentsClient = new window.google.payments.api.PaymentsClient({
        environment: environment,
      });
      
      setGooglePayClient(paymentsClient);
      
      const isReadyToPayRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA']
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'stripe',
              'stripe:version': '2020-08-27',
              'stripe:publishableKey': configResponse.data.publishable_key
            }
          }
        }]
      };
      
      const response = await paymentsClient.isReadyToPay(isReadyToPayRequest);
      
      if (response.result) {
        setGooglePayReady(true);
        setGooglePayStatus('available');
      } else {
        setGooglePayStatus('unavailable');
      }
      
    } catch (error) {
      setGooglePayStatus('unavailable');
    }
  };

  // Carregar Google Pay API
  const loadGooglePayAPI = () => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.payments) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://pay.google.com/gp/p/js/pay.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar Google Pay API'));
      
      document.head.appendChild(script);
    });
  };

  // Handle Google Pay Click
  const handleGooglePayClick = async () => {
    try {
      if (!googlePayClient || !googlePayReady || !stripeConfig) {
        throw new Error('Google Pay não está pronto');
      }
      
      setLoading(true);
      setError('');
      
      if (!bookingData.depositAmount || bookingData.depositAmount <= 0) {
        throw new Error('Valor do depósito inválido');
      }
      
      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX']
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'stripe',
              'stripe:version': '2020-08-27',
              'stripe:publishableKey': stripeConfig.publishable_key
            }
          }
        }],
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPriceLabel: 'Total',
          totalPrice: bookingData.depositAmount.toFixed(2),
          currencyCode: 'EUR',
          countryCode: 'PT'
        },
        merchantInfo: {
          merchantName: '9 Rocks Tours',
          merchantId: stripeConfig.merchant_id || '00000000000000000000000'
        }
      };
      
      const paymentData = await googlePayClient.loadPaymentData(paymentDataRequest);
      await processGooglePayPayment(paymentData);
      
    } catch (error) {
      if (error.statusCode === 'CANCELED') {
        setError(''); // Não mostrar erro se o utilizador cancelou
      } else if (error.statusCode === 'DEVELOPER_ERROR') {
        setError('Erro de configuração do Google Pay. Contacte o suporte.');
      } else {
        setError(error.message || 'Erro no Google Pay');
      }
      
      setLoading(false);
    }
  };

  // Processar pagamento Google Pay
  const processGooglePayPayment = async (paymentData) => {
    try {
      const bookingId = await createBookingIfNeeded();
      
      const intentData = {
        amount: bookingData.depositAmount,
        currency: 'EUR',
        tour_id: bookingData.tour.id,
        booking_id: bookingId,
        customer_email: bookingData.email,
        customer_name: `${bookingData.firstName} ${bookingData.lastName}`,
        tour_name: bookingData.tour.name?.[bookingData.language] || bookingData.tour.name?.pt || bookingData.tour.name,
        participants: bookingData.numberOfPeople,
        payment_method: 'google_pay'
      };
      
      const intentResponse = await axios.post(`${BACKEND_URL}/api/payments/create-intent`, intentData);
      
      if (!intentResponse.data.payment_intent_id) {
        throw new Error('Payment Intent não criado pelo backend');
      }
      
      const paymentMethodData = {
        type: 'card',
        card: {
          token: paymentData.paymentMethodData.tokenizationData.token
        }
      };
      
      const confirmResponse = await axios.post(
        `${BACKEND_URL}/api/payments/stripe/confirm/${intentResponse.data.payment_intent_id}`, 
        { payment_method_data: paymentMethodData }
      );
      
      if (confirmResponse.data.status === 'succeeded') {
        const successData = {
          method: 'google_pay',
          transaction_id: confirmResponse.data.transaction_id,
          booking_id: bookingId,
          amount: confirmResponse.data.amount,
          receipt_url: confirmResponse.data.receipt_url
        };

        // Chamar callback se fornecido
        if (onPaymentSuccess) {
          onPaymentSuccess(successData);
        }

        // Navegar para página de sucesso
        navigate('/payment/success', {
          state: {
            paymentSuccess: true,
            ...successData
          }
        });
      } else {
        throw new Error(`Pagamento não confirmado. Status: ${confirmResponse.data.status}`);
      }
      
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message;
      setError('Erro ao processar pagamento: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Criar booking
  const createBookingIfNeeded = async () => {
    try {
      if (bookingData.id && typeof bookingData.id === 'string' && bookingData.id.length > 5) {
        return bookingData.id;
      }

      const bookingPayload = {
        tour_id: bookingData.tour.id,
        customer_name: `${bookingData.firstName} ${bookingData.lastName}`,
        customer_email: bookingData.email,
        customer_phone: bookingData.phone,
        selected_date: bookingData.date,
        participants: parseInt(bookingData.numberOfPeople),
        special_requests: bookingData.specialRequests || '',
        payment_method: paymentMethod,
        language: bookingData.language || 'pt'
      };

      const response = await axios.post(`${BACKEND_URL}/api/bookings`, bookingPayload);
      const newBookingId = response.data.id || response.data.booking_id || response.data._id;
      
      return newBookingId;
      
    } catch (error) {
      throw new Error('Erro ao criar reserva: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Criar pagamento PayPal
  const createPayPalPayment = async (bookingId) => {
    try {
      const paymentData = {
        amount: bookingData.depositAmount,
        currency: 'EUR',
        tour_id: bookingData.tour.id,
        booking_id: bookingId,
        customer_email: bookingData.email,
        customer_name: `${bookingData.firstName} ${bookingData.lastName}`,
        tour_name: bookingData.tour.name?.[bookingData.language] || bookingData.tour.name?.pt || bookingData.tour.name,
        participants: bookingData.numberOfPeople,
        payment_method: 'paypal',
        return_url: `${window.location.origin}/payment/success?booking_id=${bookingId}`,
        cancel_url: `${window.location.origin}/payment/cancel?booking_id=${bookingId}`
      };

      const response = await axios.post(`${BACKEND_URL}/api/payments/paypal/create`, paymentData);
      
      if (response.data.approval_url) {
        window.location.href = response.data.approval_url;
      } else {
        throw new Error('URL de aprovação PayPal não recebida');
      }
      
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Erro ao processar pagamento PayPal');
    }
  };

  // Setup Stripe Elements
  const setupStripeElements = async () => {
    setLoading(true);
    setError('');
    try {
      const { depositAmount, tour, email, firstName, lastName } = bookingData;
      if (!depositAmount || depositAmount <= 0) {
        throw new Error("O valor do depósito é inválido.");
      }
      if (!tour || !tour.id) {
        throw new Error("ID do Tour em falta. Volte ao passo anterior e tente novamente.");
      }
      if (!email || !firstName || !lastName) {
        throw new Error("Dados do cliente (nome, apelido, email) estão em falta.");
      }

      const bookingId = await createBookingIfNeeded();

      const intentData = {
        amount: depositAmount,
        currency: 'EUR',
        tour_id: tour.id,
        booking_id: bookingId,
        customer_email: email,
        customer_name: `${firstName} ${lastName}`,
        tour_name: tour.name?.[bookingData.language] || tour.name?.pt || tour.name,
        participants: bookingData.numberOfPeople
      };

      const response = await axios.post(`${BACKEND_URL}/api/payments/create-intent`, intentData);
      
      if (response.data.client_secret) {
        setClientSecret(response.data.client_secret);
      } else {
        throw new Error('Client Secret não recebido do backend.');
      }

    } catch (err) {
      const backendError = err.response?.data?.detail || err.response?.data?.message || err.message;
      let detailedMessage = 'Não foi possível iniciar o pagamento. Verifique os dados e tente novamente.';

      if (typeof backendError === 'string') {
        detailedMessage = backendError;
      } else if (Array.isArray(backendError)) {
        const firstError = backendError[0];
        detailedMessage = `Erro nos dados: o campo '${firstError.loc?.join('.') || 'desconhecido'}' ${firstError.msg || 'é inválido'}.`;
      }

      setError(detailedMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Payment Principal
  const handlePayment = async (method) => {
    try {
      setLoading(true);
      setError('');

      if (method === 'mbway' && !phoneNumber.trim()) {
        throw new Error('Número de telemóvel é obrigatório para MB WAY');
      }

      const bookingId = await createBookingIfNeeded();

      switch (method) {
        case 'paypal':
          if (paypalStatus !== 'available') {
            throw new Error('PayPal não está disponível no momento');
          }
          await createPayPalPayment(bookingId);
          break;

        case 'googlepay':
          if (googlePayStatus !== 'available' || !googlePayReady) {
            throw new Error('Google Pay não está disponível no momento');
          }
          await handleGooglePayClick();
          break;

        case 'stripe_elements':
          if (!clientSecret || !stripePromise) {
            throw new Error('Stripe Elements não está pronto');
          }
          break;

        default:
          throw new Error(`Método de pagamento ${method} não suportado`);
      }

    } catch (error) {
      setError(error.message);
    } finally {
      if (method !== 'paypal') { // PayPal redireciona, não precisa parar loading
        setLoading(false);
      }
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0);
  };

  const handleEditClick = () => {
    if (window.confirm('Tem a certeza que quer voltar e editar os dados? O progresso atual será perdido.')) {
      onBack();
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'paypal':
        return (
          <div className="w-16 h-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">PayPal</span>
          </div>
        );
      case 'googlepay':
        return (
          <div className="w-16 h-8 bg-white border border-gray-300 rounded flex items-center justify-center">
            <span className="text-gray-700 font-bold text-xs">G Pay</span>
          </div>
        );
      case 'stripe_elements':
        return (
          <div className="flex space-x-1">
            <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
            <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">MC</div>
            <div className="w-8 h-5 bg-blue-800 rounded text-white text-xs flex items-center justify-center font-bold">AE</div>
            <div className="w-16 h-5 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">MB WAY</div>
          </div>
        );
      default:
        return null;
    }
  };

  const isPaymentMethodAvailable = (method) => {
    switch (method) {
      case 'paypal':
        return paypalStatus === 'available';
      case 'googlepay':
        return googlePayStatus === 'available' && googlePayReady;
      case 'stripe_elements':
        return stripePromise !== null;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
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
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
              <span className="ml-2 text-sm font-medium text-gray-500">Confirmação</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <div className="text-red-800 font-medium">{t.paymentError}</div>
                      <div className="text-red-700 text-sm mt-1">{error}</div>
                      <button 
                        onClick={() => setError('')}
                        className="text-red-600 text-sm underline mt-2 hover:text-red-800"
                      >
                        {t.tryAgain}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading Indicator */}
              {(paypalStatus === 'checking' || googlePayStatus === 'checking') && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-3"></div>
                    <span className="text-blue-800 text-sm">{t.testingPayment}</span>
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">{t.paymentMethodTitle}</h2>
                
                <div className="flex items-center mb-6 p-3 bg-green-50 rounded-lg border border-green-200">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-green-800">{t.securityText}</span>
                </div>
                
                <div className="space-y-3">
                  {/* Google Pay */}
                  <div className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                    paymentMethod === 'googlepay' ? 'border-black bg-gray-100' : 'border-gray-300 hover:border-gray-400'
                  } ${!isPaymentMethodAvailable('googlepay') ? 'opacity-75' : ''}`}>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="payment_method"
                          value="googlepay"
                          checked={paymentMethod === 'googlepay'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          disabled={!isPaymentMethodAvailable('googlepay')}
                          className="w-5 h-5 text-black mr-4"
                        />
                        <div>
                          <span className="font-medium">Google Pay</span>
                          {googlePayStatus === 'available' && googlePayReady && (
                            <div className="flex items-center mt-1">
                              <svg className="w-4 h-4 text-green-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="text-green-700 text-xs">Google Pay disponível</span>
                            </div>
                          )}
                          {(googlePayStatus === 'unavailable' || !googlePayReady) && (
                            <div className="flex items-center mt-1">
                              <svg className="w-4 h-4 text-red-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <span className="text-red-700 text-xs">Google Pay indisponível</span>
                            </div>
                          )}
                          {googlePayStatus === 'checking' && (
                            <div className="flex items-center mt-1">
                              <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent mr-1"></div>
                              <span className="text-blue-700 text-xs">Verificando...</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {getPaymentMethodIcon('googlepay')}
                    </label>
                  </div>

                  {/* PayPal */}
                  <div className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                    paymentMethod === 'paypal' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  } ${!isPaymentMethodAvailable('paypal') ? 'opacity-75' : ''}`}>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="payment_method"
                          value="paypal"
                          checked={paymentMethod === 'paypal'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          disabled={!isPaymentMethodAvailable('paypal')}
                          className="w-5 h-5 text-blue-600 mr-4"
                        />
                        <div>
                          <span className="font-medium">PayPal</span>
                          {paypalStatus === 'available' && (
                            <div className="flex items-center mt-1">
                              <svg className="w-4 h-4 text-green-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="text-green-700 text-xs">{t.paypalAvailable}</span>
                            </div>
                          )}
                          {paypalStatus === 'unavailable' && (
                            <div className="flex items-center mt-1">
                              <svg className="w-4 h-4 text-red-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <span className="text-red-700 text-xs">{t.paypalUnavailable}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {getPaymentMethodIcon('paypal')}
                    </label>
                  </div>

                  {/* Stripe Elements (Card and MB WAY) */}
                  <div className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                    paymentMethod === 'stripe_elements' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="payment_method"
                          value="stripe_elements"
                          checked={paymentMethod === 'stripe_elements'}
                          onChange={(e) => {
                            setPaymentMethod(e.target.value);
                            setupStripeElements();
                          }}
                          className="w-5 h-5 text-blue-600 mr-4"
                        />
                        <div>
                          <span className="font-medium">Cartão de Crédito / MB WAY</span>
                          <div className="text-xs text-gray-500 mt-1">Pagamento seguro via Stripe</div>
                        </div>
                      </div>
                      {getPaymentMethodIcon('stripe_elements')}
                    </label>
                    {paymentMethod === 'stripe_elements' && clientSecret && stripePromise && (
                      <div className="mt-4">
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                          <StripeCheckoutForm 
                            onProcessing={setLoading}
                            onError={setError}
                            onSuccess={(paymentIntent) => {
                              console.log("✅ DEBUG PaymentComponent: onSuccess chamado", paymentIntent);
                              
                              try {
                                const successData = {
                                  method: paymentIntent.payment_method_types[0],
                                  transaction_id: paymentIntent.id,
                                  booking_id: bookingData.id,
                                  amount: paymentIntent.amount / 100,
                                  receipt_url: paymentIntent.charges?.data[0]?.receipt_url
                                };

                                console.log("🔍 DEBUG PaymentComponent: successData preparado", successData);

                                // Chamar callback se fornecido
                                if (onPaymentSuccess) {
                                  console.log("🔍 DEBUG PaymentComponent: Chamando onPaymentSuccess callback");
                                  onPaymentSuccess(successData);
                                }

                                // Navegar para página de sucesso
                                console.log("🔍 DEBUG PaymentComponent: Tentando navegar para /payment/success");
                                navigate('/payment/success', {
                                  state: {
                                    paymentSuccess: true,
                                    ...successData
                                  }
                                });
                                console.log("✅ DEBUG PaymentComponent: navigate() chamado");
                              } catch (navError) {
                                console.error("❌ DEBUG PaymentComponent: Erro na navegação:", navError);
                                setError("Pagamento bem-sucedido, mas erro ao redirecionar: " + navError.message);
                              }
                            }}
                            amount={bookingData.depositAmount}
                            bookingData={bookingData}
                          />
                        </Elements>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Botões de pagamento */}
              <div className="space-y-4 mt-6">
                {/* Botão de pagamento principal, condicional */}
                {paymentMethod !== 'stripe_elements' && (
                    <button
                      onClick={() => handlePayment(paymentMethod)}
                      disabled={loading || !isPaymentMethodAvailable(paymentMethod)}
                      className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform ${
                        loading || !isPaymentMethodAvailable(paymentMethod)
                          ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                          : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] cursor-pointer text-white shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                          {t.processing}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          {`${t.payButton} ${paymentMethod.toUpperCase()} ${formatPrice(bookingData.depositAmount)}`}
                        </div>
                      )}
                    </button>
                )}

                {/* Botão de voltar, sempre visível */}
                <button
                  onClick={onBack}
                  disabled={loading}
                  className="w-full text-blue-600 hover:text-blue-700 font-medium py-2 disabled:opacity-50"
                >
                  {t.backButton}
                </button>
              </div>

              <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>{t.securePayment}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t.instantConfirmation}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">{t.summary}</h3>
              
              <div className="flex items-start space-x-4 mb-6 p-4 bg-gray-50 rounded-xl">
                {bookingData.tour.images && bookingData.tour.images[0] && (
                  <img 
                    src={bookingData.tour.images[0]} 
                    alt={bookingData.tour.name?.[bookingData.language] || bookingData.tour.name?.pt} 
                    className="w-20 h-20 object-cover rounded-lg shadow-sm"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg mb-2 leading-tight">
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {bookingData.numberOfPeople} {t.participants}
                    </p>
                  </div>
                  <button 
                    className="text-blue-600 text-sm hover:underline mt-2"
                    onClick={handleEditClick}
                  >
                    {t.editBooking}
                  </button>
                </div>
              </div>

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

              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{`${bookingData.firstName} ${bookingData.lastName}`}</p>
                    <p className="text-sm text-gray-600">{bookingData.email}</p>
                    <p className="text-sm text-gray-600">{bookingData.phone}</p>
                  </div>
                  <button 
                    className="text-blue-600 text-sm hover:underline"
                    onClick={handleEditClick}
                  >
                    Editar
                  </button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="space-y-2 text-sm text-green-700">
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    💳 Pagamento 100% seguro
                  </p>
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    ⚡ Confirmação instantânea
                  </p>
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    🎯 Pague apenas 30% agora
                  </p>
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    🔄 Cancelamento flexível
                  </p>
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