// frontend/src/components/PaymentComponent.js - VERSÃO COM DEBUG COMPLETO E GOOGLE PAY FUNCIONAL
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config/appConfig';

// ✅ SISTEMA DE DEBUG AVANÇADO
const DebugLogger = {
  enabled: true, // Muda para false em produção
  
  log: (step, data, type = 'info') => {
    if (!DebugLogger.enabled) return;
    
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔍';
    
    console.group(`${prefix} [${timestamp}] ${step}`);
    if (data) {
      console.log('Data:', data);
    }
    console.groupEnd();
    
    // Salvar no sessionStorage para análise posterior
    const debugLog = JSON.parse(sessionStorage.getItem('paymentDebugLog') || '[]');
    debugLog.push({
      timestamp,
      step,
      data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data,
      type
    });
    
    // Manter só os últimos 50 logs
    if (debugLog.length > 50) {
      debugLog.splice(0, debugLog.length - 50);
    }
    
    sessionStorage.setItem('paymentDebugLog', JSON.stringify(debugLog));
  },
  
  error: (step, error) => {
    DebugLogger.log(step, {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    }, 'error');
  },
  
  success: (step, data) => {
    DebugLogger.log(step, data, 'success');
  },
  
  // Função para exportar logs
  exportLogs: () => {
    const logs = sessionStorage.getItem('paymentDebugLog');
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-debug-${Date.now()}.json`;
    a.click();
  },
  
  clearLogs: () => {
    sessionStorage.removeItem('paymentDebugLog');
    console.clear();
  }
};

const PaymentComponent = ({ bookingData, onPaymentSuccess, onBack }) => {
  const [paymentMethod, setPaymentMethod] = useState('paypal');
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
  const [currentPaymentIntent, setCurrentPaymentIntent] = useState(null);

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
      comingSoon: "Em breve",
      debugMode: "Modo Debug",
      exportLogs: "Exportar Logs",
      clearLogs: "Limpar Logs"
    }
  };

  const t = content[bookingData.language] || content.pt;

  // ✅ INICIALIZAÇÃO COM DEBUG
  useEffect(() => {
    DebugLogger.log('PaymentComponent iniciado', {
      bookingData: bookingData,
      language: bookingData.language
    });
    
    initializePaymentMethods();
    
    // Monitor em tempo real (só em debug)
    if (DebugLogger.enabled) {
      startRealTimeMonitoring();
    }
  }, []);

  // ✅ MONITORAMENTO EM TEMPO REAL
  const startRealTimeMonitoring = () => {
    const monitorInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/debug/monitor/live`);
        const data = response.data;
        
        DebugLogger.log('Monitor em tempo real', {
          transactions: data.statistics.total_transactions,
          success_rate: data.statistics.success_rate,
          system_health: data.system_health
        });
        
        // Atualizar status se houve mudanças
        if (data.system_health.stripe_available !== (stripeConfig?.available)) {
          DebugLogger.log('Status Stripe mudou, re-inicializando');
          initializeGooglePay();
        }
        
      } catch (error) {
        DebugLogger.log('Erro no monitor em tempo real', error.message, 'error');
      }
    }, 30000); // A cada 30 segundos
    
    // Limpar interval quando componente desmontar
    return () => clearInterval(monitorInterval);
  };

  // ✅ VALIDAÇÃO AUTOMÁTICA DE SEGURANÇA
  // ✅ VALIDAÇÃO AUTOMÁTICA DE SEGURANÇA
  const validateSecurityConfig = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/debug/security/validate-config`);
      const data = response.data;
      
      if (data.security_score < 80) {
        DebugLogger.log('⚠️ Problemas de segurança detectados', data, 'warning');
        setError(`Configuração de segurança precisa de atenção (Score: ${data.security_score})`);
      } else {
        DebugLogger.success('Configuração de segurança validada', data);
      }
      
      return data;
    } catch (error) {
      DebugLogger.error('Erro na validação de segurança', error);
      return null;
    }
  };

  // ✅ TESTE DE COMPATIBILIDADE MOBILE
  const testMobileCompatibility = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/debug/mobile/user-agent-test`);
      const data = response.data;
      
      DebugLogger.log('Teste de compatibilidade mobile', data);
      
      if (!data.google_pay_compatibility.compatible) {
        DebugLogger.log('Google Pay não compatível neste dispositivo', data.google_pay_compatibility.notes, 'warning');
      }
      
      return data;
    } catch (error) {
      DebugLogger.error('Erro no teste mobile', error);
      return null;
    }
  };

  // ✅ SIMULAÇÃO DE FLUXO COMPLETO
  const runFullFlowSimulation = async () => {
    try {
      DebugLogger.log('Iniciando simulação de fluxo completo');
      
      const response = await axios.post(`${BACKEND_URL}/api/debug/simulate/complete-flow`, {
        payment_method: paymentMethod,
        amount: bookingData.depositAmount,
        simulate_failure: false
      });
      
      const data = response.data;
      
      if (data.success) {
        DebugLogger.success('Simulação bem-sucedida', data.simulation);
        
        // Mostrar recomendações
        if (data.recommendations && data.recommendations.length > 0) {
          DebugLogger.log('Recomendações da simulação', data.recommendations);
        }
      } else {
        DebugLogger.error('Simulação falhou', data);
      }
      
      return data;
    } catch (error) {
      DebugLogger.error('Erro na simulação', error);
      return null;
    }
  };

  const initializePaymentMethods = async () => {
    DebugLogger.log('Inicializando métodos de pagamento');
    
    // Executar validações e testes em paralelo
    const [paypalResult, googlePayResult, securityResult, mobileResult] = await Promise.all([
      testPayPalConnection(),
      initializeGooglePay(),
      DebugLogger.enabled ? validateSecurityConfig() : null,
      DebugLogger.enabled ? testMobileCompatibility() : null
    ]);
    
    // Se em modo debug, executar simulação também
    if (DebugLogger.enabled && (paypalResult || googlePayResult)) {
      setTimeout(() => {
        runFullFlowSimulation();
      }, 2000);
    }
  };

  // ✅ TESTE DE COMPATIBILIDADE MOBILE
  const testMobileCompatibility = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/debug/mobile/user-agent-test`);
      const data = response.data;
      
      DebugLogger.log('Teste de compatibilidade mobile', data);
      
      if (!data.google_pay_compatibility.compatible) {
        DebugLogger.log('Google Pay não compatível neste dispositivo', data.google_pay_compatibility.notes, 'warning');
      }
      
      return data;
    } catch (error) {
      DebugLogger.error('Erro no teste mobile', error);
      return null;
    }
  };

  // ✅ SIMULAÇÃO DE FLUXO COMPLETO
  const runFullFlowSimulation = async () => {
    try {
      DebugLogger.log('Iniciando simulação de fluxo completo');
      
      const response = await axios.post(`${BACKEND_URL}/api/debug/simulate/complete-flow`, {
        payment_method: paymentMethod,
        amount: bookingData.depositAmount,
        simulate_failure: false
      });
      
      const data = response.data;
      
      if (data.success) {
        DebugLogger.success('Simulação bem-sucedida', data.simulation);
        
        // Mostrar recomendações
        if (data.recommendations && data.recommendations.length > 0) {
          DebugLogger.log('Recomendações da simulação', data.recommendations);
        }
      } else {
        DebugLogger.error('Simulação falhou', data);
      }
      
      return data;
    } catch (error) {
      DebugLogger.error('Erro na simulação', error);
      return null;
    }
  };

  // ✅ TESTE PAYPAL COM DEBUG
  const testPayPalConnection = async () => {
    try {
      DebugLogger.log('Testando conexão PayPal');
      
      const response = await axios.get(`${BACKEND_URL}/api/payments/test/paypal`);
      
      if (response.data.status === 'success') {
        setPaypalStatus('available');
        DebugLogger.success('PayPal conectado', response.data);
      } else {
        setPaypalStatus('unavailable');
        DebugLogger.error('PayPal não conectado', response.data);
      }
    } catch (error) {
      setPaypalStatus('unavailable');
      DebugLogger.error('Erro no teste PayPal', error);
    }
  };

  // ✅ INICIALIZAÇÃO GOOGLE PAY COM DEBUG COMPLETO
  const initializeGooglePay = async () => {
    try {
      DebugLogger.log('Inicializando Google Pay - Passo 1: Buscar configuração Stripe');
      
      // 1. Buscar configuração do Stripe
      const configResponse = await axios.get(`${BACKEND_URL}/api/payments/stripe/config`);
      DebugLogger.log('Configuração Stripe recebida', configResponse.data);
      
      if (!configResponse.data.available) {
        setGooglePayStatus('unavailable');
        DebugLogger.error('Stripe não disponível', configResponse.data);
        return;
      }
      
      setStripeConfig(configResponse.data);
      
      // 2. Verificar se Google Pay está disponível no browser
      DebugLogger.log('Verificando disponibilidade Google Pay no browser');
      
      if (!window.google || !window.google.payments) {
        // Carregar Google Pay API dinamicamente
        await loadGooglePayAPI();
      }
      
      if (!window.google || !window.google.payments) {
        setGooglePayStatus('unavailable');
        DebugLogger.error('Google Pay API não carregada');
        return;
      }
      
      // 3. Inicializar cliente Google Pay
      const paymentsClient = getGooglePaymentsClient();
      setGooglePayClient(paymentsClient);
      
      // 4. Verificar se Google Pay é suportado
      const isReadyToPayRequest = getGoogleIsReadyToPayRequest();
      DebugLogger.log('Verificando se Google Pay está pronto', isReadyToPayRequest);
      
      const response = await paymentsClient.isReadyToPay(isReadyToPayRequest);
      DebugLogger.log('Resposta isReadyToPay', response);
      
      if (response.result) {
        setGooglePayReady(true);
        setGooglePayStatus('available');
        DebugLogger.success('Google Pay disponível e pronto');
      } else {
        setGooglePayStatus('unavailable');
        DebugLogger.error('Google Pay não suportado neste browser/dispositivo');
      }
      
    } catch (error) {
      setGooglePayStatus('unavailable');
      DebugLogger.error('Erro na inicialização Google Pay', error);
    }
  };

  // ✅ CARREGAR GOOGLE PAY API DINAMICAMENTE
  const loadGooglePayAPI = () => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.payments) {
        resolve();
        return;
      }
      
      DebugLogger.log('Carregando Google Pay API dinamicamente');
      
      const script = document.createElement('script');
      script.src = 'https://pay.google.com/gp/p/js/pay.js';
      script.onload = () => {
        DebugLogger.success('Google Pay API carregada');
        resolve();
      };
      script.onerror = () => {
        DebugLogger.error('Falha ao carregar Google Pay API');
        reject(new Error('Falha ao carregar Google Pay API'));
      };
      
      document.head.appendChild(script);
    });
  };

  // ✅ CONFIGURAÇÃO GOOGLE PAY CLIENT
  const getGooglePaymentsClient = () => {
    return new google.payments.api.PaymentsClient({
      environment: stripeConfig?.mode === 'live' ? 'PRODUCTION' : 'TEST',
      merchantInfo: {
        merchantName: '9 Rocks Tours',
        merchantId: stripeConfig?.merchant_id || '00000000000000000000000'
      },
      paymentDataCallbacks: {
        onPaymentAuthorized: onGooglePaymentAuthorized,
        onPaymentDataChanged: onGooglePaymentDataChanged
      }
    });
  };

  // ✅ CONFIGURAÇÃO BASE GOOGLE PAY
  const getGoogleIsReadyToPayRequest = () => {
    return {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [getGoogleCardPaymentMethod()]
    };
  };

  const getGoogleCardPaymentMethod = () => {
    return {
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
          'stripe:publishableKey': stripeConfig?.publishable_key
        }
      }
    };
  };

  // ✅ CRIAR PAYMENT REQUEST GOOGLE PAY
  const getGooglePaymentDataRequest = () => {
    const paymentDataRequest = Object.assign({}, getGoogleIsReadyToPayRequest());
    
    paymentDataRequest.allowedPaymentMethods[0].tokenizationSpecification.parameters['stripe:version'] = '2020-08-27';
    paymentDataRequest.allowedPaymentMethods[0].tokenizationSpecification.parameters['stripe:publishableKey'] = stripeConfig?.publishable_key;
    
    paymentDataRequest.transactionInfo = {
      totalPriceStatus: 'FINAL',
      totalPriceLabel: 'Total',
      totalPrice: bookingData.depositAmount.toFixed(2),
      currencyCode: 'EUR',
      countryCode: 'PT'
    };
    
    paymentDataRequest.merchantInfo = {
      merchantName: '9 Rocks Tours',
      merchantId: stripeConfig?.merchant_id || '00000000000000000000000'
    };
    
    paymentDataRequest.callbackIntents = ['PAYMENT_AUTHORIZATION'];
    
    return paymentDataRequest;
  };

  // ✅ CALLBACK GOOGLE PAY AUTHORIZATION
  const onGooglePaymentAuthorized = async (paymentData) => {
    DebugLogger.log('Google Pay - Payment authorized', paymentData);
    
    try {
      // Processar o pagamento com Stripe
      const result = await processGooglePayPayment(paymentData);
      
      if (result.success) {
        DebugLogger.success('Google Pay payment processado com sucesso', result);
        
        return {
          transactionState: 'SUCCESS'
        };
      } else {
        DebugLogger.error('Falha no processamento Google Pay', result);
        
        return {
          transactionState: 'ERROR',
          error: {
            reason: 'PAYMENT_DATA_INVALID',
            message: result.error || 'Erro no processamento'
          }
        };
      }
    } catch (error) {
      DebugLogger.error('Erro no callback Google Pay', error);
      
      return {
        transactionState: 'ERROR',
        error: {
          reason: 'OTHER_ERROR',
          message: error.message
        }
      };
    }
  };

  const onGooglePaymentDataChanged = (intermediatePaymentData) => {
    DebugLogger.log('Google Pay - Payment data changed', intermediatePaymentData);
    return {};
  };

  // ✅ PROCESSAR PAGAMENTO GOOGLE PAY
  const processGooglePayPayment = async (paymentData) => {
    try {
      DebugLogger.log('Processando pagamento Google Pay', paymentData);
      
      // 1. Criar booking se necessário
      const bookingId = await createBookingIfNeeded();
      
      // 2. Criar Payment Intent
      const intentData = {
        amount: bookingData.depositAmount,
        currency: 'EUR',
        tour_id: bookingData.tour.id,
        booking_id: bookingId,
        customer_email: bookingData.email,
        customer_name: `${bookingData.firstName} ${bookingData.lastName}`,
        payment_method: 'google_pay',
        return_url: `${window.location.origin}/payment/success?booking_id=${bookingId}`,
        cancel_url: `${window.location.origin}/payment/cancel?booking_id=${bookingId}`
      };
      
      DebugLogger.log('Criando Payment Intent para Google Pay', intentData);
      
      const intentResponse = await axios.post(`${BACKEND_URL}/api/payments/google-pay/create-intent`, intentData);
      
      DebugLogger.log('Payment Intent criado', intentResponse.data);
      
      // 3. Confirmar pagamento com token do Google Pay
      const confirmData = {
        payment_method: {
          card: {
            token: paymentData.paymentMethodData.tokenizationData.token
          }
        }
      };
      
      DebugLogger.log('Confirmando pagamento', confirmData);
      
      const confirmResponse = await axios.post(`${BACKEND_URL}/api/payments/stripe/confirm/${intentResponse.data.payment_intent_id}`, confirmData);
      
      DebugLogger.log('Resposta confirmação', confirmResponse.data);
      
      if (confirmResponse.data.status === 'succeeded') {
        DebugLogger.success('Pagamento Google Pay bem-sucedido');
        
        // Chamar callback de sucesso
        if (onPaymentSuccess) {
          onPaymentSuccess({
            method: 'google_pay',
            transaction_id: confirmResponse.data.transaction_id,
            booking_id: bookingId
          });
        }
        
        return { success: true, data: confirmResponse.data };
      } else {
        return { success: false, error: 'Pagamento não confirmado' };
      }
      
    } catch (error) {
      DebugLogger.error('Erro no processamento Google Pay', error);
      return { success: false, error: error.message };
    }
  };

  // ✅ CRIAR BOOKING
  const createBookingIfNeeded = async () => {
    try {
      if (bookingData.id && typeof bookingData.id === 'string' && bookingData.id.length > 5) {
        DebugLogger.log('Booking já existe', bookingData.id);
        return bookingData.id;
      }

      DebugLogger.log('Criando novo booking');
      
      const bookingPayload = {
        tour_id: bookingData.tour.id,
        customer_name: `${bookingData.firstName} ${bookingData.lastName}`,
        customer_email: bookingData.email,
        customer_phone: bookingData.phone,
        selected_date: bookingData.date,
        participants: parseInt(bookingData.numberOfPeople),
        special_requests: bookingData.specialRequests || '',
        payment_method: paymentMethod
      };

      const response = await axios.post(`${BACKEND_URL}/api/bookings`, bookingPayload);
      const newBookingId = response.data.id || response.data.booking_id || response.data._id;
      
      DebugLogger.success('Booking criado', newBookingId);
      return newBookingId;
      
    } catch (error) {
      DebugLogger.error('Erro ao criar booking', error);
      throw new Error('Erro ao criar reserva: ' + (error.response?.data?.detail || error.message));
    }
  };

  // ✅ HANDLE CLICK GOOGLE PAY
  const handleGooglePayClick = async () => {
    try {
      DebugLogger.log('Google Pay button clicado');
      
      if (!googlePayClient || !googlePayReady) {
        throw new Error('Google Pay não está pronto');
      }
      
      setLoading(true);
      setError('');
      
      const paymentDataRequest = getGooglePaymentDataRequest();
      DebugLogger.log('Payment data request', paymentDataRequest);
      
      const paymentData = await googlePayClient.loadPaymentData(paymentDataRequest);
      DebugLogger.log('Payment data recebido', paymentData);
      
      // O processamento será feito no callback onGooglePaymentAuthorized
      
    } catch (error) {
      DebugLogger.error('Erro no click Google Pay', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // ✅ CRIAR PAGAMENTO PAYPAL (mantido original)
  const createPayPalPayment = async (bookingId) => {
    try {
      const paymentData = {
        amount: bookingData.depositAmount,
        currency: 'EUR',
        tour_id: bookingData.tour.id,
        booking_id: bookingId,
        customer_email: bookingData.email,
        customer_name: `${bookingData.firstName} ${bookingData.lastName}`,
        payment_method: 'paypal',
        return_url: `${window.location.origin}/payment/success?booking_id=${bookingId}`,
        cancel_url: `${window.location.origin}/payment/cancel?booking_id=${bookingId}`
      };

      DebugLogger.log('Criando pagamento PayPal', paymentData);

      const response = await axios.post(`${BACKEND_URL}/api/payments/paypal/create`, paymentData);
      
      if (response.data.approval_url) {
        DebugLogger.success('Pagamento PayPal criado, redirecionando');
        window.location.href = response.data.approval_url;
      } else {
        throw new Error('URL de aprovação PayPal não recebida');
      }
      
    } catch (error) {
      DebugLogger.error('Erro no pagamento PayPal', error);
      throw new Error(error.response?.data?.detail || 'Erro ao processar pagamento PayPal');
    }
  };

  // ✅ HANDLE PAYMENT PRINCIPAL
  const handlePayment = async (method) => {
    try {
      setLoading(true);
      setError('');

      DebugLogger.log(`Iniciando pagamento ${method.toUpperCase()}`);

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
          if (googlePayStatus !== 'available') {
            throw new Error('Google Pay não está disponível no momento');
          }
          await handleGooglePayClick();
          break;

        case 'card':
          setError('Pagamento por cartão ainda não implementado. Use PayPal ou Google Pay.');
          break;

        case 'mbway':
          setError('MB WAY ainda não implementado. Use PayPal ou Google Pay.');
          break;

        default:
          throw new Error(`Método de pagamento ${method} não suportado`);
      }

    } catch (error) {
      DebugLogger.error(`Erro no pagamento ${method}`, error);
      setError(error.message);
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
      case 'card':
        return (
          <div className="flex space-x-1">
            <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
            <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">MC</div>
            <div className="w-8 h-5 bg-blue-800 rounded text-white text-xs flex items-center justify-center font-bold">AE</div>
          </div>
        );
      case 'mbway':
        return (
          <div className="w-16 h-8 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">MB WAY</div>
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
      case 'card':
      case 'mbway':
        return false;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Debug Panel (só aparece se debug estiver ativo) */}
      {DebugLogger.enabled && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs space-y-2">
            <div className="font-bold">{t.debugMode}</div>
            <div>PayPal: {paypalStatus}</div>
            <div>Google Pay: {googlePayStatus}</div>
            <div>GP Ready: {googlePayReady ? 'Yes' : 'No'}</div>
            <div className="space-x-2">
              <button 
                onClick={DebugLogger.exportLogs}
                className="bg-blue-600 px-2 py-1 rounded text-xs"
              >
                {t.exportLogs}
              </button>
              <button 
                onClick={DebugLogger.clearLogs}
                className="bg-red-600 px-2 py-1 rounded text-xs"
              >
                {t.clearLogs}
              </button>
            </div>
          </div>
        </div>
      )}

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
                
                {/* Security Banner */}
                <div className="flex items-center mb-6 p-3 bg-green-50 rounded-lg border border-green-200">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-green-800">{t.securityText}</span>
                </div>
                
                {/* Payment Methods */}
                <div className="space-y-3">
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

                  {/* Card - Disabled */}
                  <div className="border-2 rounded-xl p-4 opacity-50 cursor-not-allowed border-gray-200 bg-gray-50">
                    <label className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          disabled
                          className="w-5 h-5 text-gray-400 mr-4"
                        />
                        <div>
                          <span className="font-medium text-gray-500">Cartão de débito ou crédito</span>
                          <div className="text-xs text-gray-400 mt-1">{t.comingSoon}</div>
                        </div>
                      </div>
                      {getPaymentMethodIcon('card')}
                    </label>
                  </div>

                  {/* MB WAY - Disabled */}
                  <div className="border-2 rounded-xl p-4 opacity-50 cursor-not-allowed border-gray-200 bg-gray-50">
                    <label className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          disabled
                          className="w-5 h-5 text-gray-400 mr-4"
                        />
                        <div>
                          <span className="font-medium text-gray-500">MB WAY</span>
                          <div className="text-xs text-gray-400 mt-1">{t.comingSoon}</div>
                        </div>
                      </div>
                      {getPaymentMethodIcon('mbway')}
                    </label>
                  </div>
                </div>
              </div>

              {/* Payment Button */}
              <div className="space-y-4">
                <button
                  onClick={() => handlePayment(paymentMethod)}
                  disabled={loading || !isPaymentMethodAvailable(paymentMethod)}
                  className={`
                    w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform
                    ${loading || !isPaymentMethodAvailable(paymentMethod)
                      ? 'bg-gray-400 cursor-not-allowed text-gray-200' 
                      : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] cursor-pointer text-white shadow-lg hover:shadow-xl'
                    }
                  `}
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

                <button
                  onClick={onBack}
                  disabled={loading}
                  className="w-full text-blue-600 hover:text-blue-700 font-medium py-2 disabled:opacity-50"
                >
                  {t.backButton}
                </button>
              </div>

              {/* Trust Elements */}
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
              
              {/* Tour Card */}
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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

              {/* Price Breakdown */}
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
                  <button 
                    className="text-blue-600 text-sm hover:underline"
                    onClick={handleEditClick}
                  >
                    Editar
                  </button>
                </div>
              </div>

              {/* Trust Elements Sidebar */}
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