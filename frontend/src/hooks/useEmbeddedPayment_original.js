// hooks/useEmbeddedPayment.js - Hook React Web para Cartões + MB WAY
import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'https://api.9rocks.pt';

/**
 * 🚀 Hook React Web para adicionar Cartões + MB WAY
 * Mantém compatibilidade com PayPal + Google Pay existentes
 */
export const useEmbeddedPayment = (bookingData, options = {}) => {
  const {
    onPaymentComplete = null,
    enableDiscounts = true,
    autoNavigateOnSuccess = true,
    ...customOptions
  } = options;

  // Estados principais
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [error, setError] = useState('');
  
  // Estados para Stripe (cartões + MB WAY)
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  
  // Estados para descontos
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(null);
  const [originalAmount, setOriginalAmount] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);

  // 🏗️ CRIAR BOOKING SE NECESSÁRIO
  const createBookingIfNeeded = useCallback(async () => {
    try {
      if (bookingData.id && typeof bookingData.id === 'string' && bookingData.id.length > 5) {
        return bookingData.id;
      }

      console.log('🔄 Criando booking...');

      const bookingPayload = {
        tour_id: bookingData.tour.id,
        customer_name: `${bookingData.firstName} ${bookingData.lastName}`,
        customer_email: bookingData.email,
        customer_phone: bookingData.phone || '',
        selected_date: bookingData.date,
        participants: parseInt(bookingData.numberOfPeople),
        special_requests: bookingData.specialRequests || '',
        payment_method: 'stripe_embedded',
        total_amount: currentAmount || bookingData.depositAmount,
        original_amount: originalAmount || bookingData.depositAmount
      };

      const response = await axios.post(`${BACKEND_URL}/api/bookings`, bookingPayload);
      const newBookingId = response.data.id || response.data.booking_id || response.data._id;
      
      console.log('✅ Booking criado:', newBookingId);
      return newBookingId;
      
    } catch (error) {
      console.error('❌ Erro ao criar booking:', error);
      throw error;
    }
  }, [bookingData, currentAmount, originalAmount]);

  // 🔧 INICIALIZAR STRIPE PARA CARTÕES + MB WAY
  const initializeStripe = useCallback(async () => {
    try {
      console.log('🚀 Inicializando Stripe para cartões + MB WAY...');

      // 1. Carregar Stripe.js
      const { loadStripe } = await import('@stripe/stripe-js');
      const configResponse = await axios.get(`${BACKEND_URL}/api/payments/stripe/config`);
      
      if (!configResponse.data.publishable_key) {
        throw new Error('Chave pública do Stripe não encontrada');
      }

      const stripe = await loadStripe(configResponse.data.publishable_key);
      setStripePromise(Promise.resolve(stripe));

      // 2. Garantir booking
      let finalBookingId = bookingId;
      if (!finalBookingId) {
        finalBookingId = await createBookingIfNeeded();
        setBookingId(finalBookingId);
      }

      // 3. Criar Payment Intent para cartões + MB WAY
      const intentData = {
        amount: currentAmount || bookingData.depositAmount,
        currency: 'eur', // MB WAY só funciona com EUR
        tour_id: bookingData.tour.id,
        booking_id: finalBookingId,
        customer_email: bookingData.email,
        customer_name: `${bookingData.firstName} ${bookingData.lastName}`,
      };

      console.log('📤 Criando Payment Intent:', intentData);

      const intentResponse = await axios.post(`${BACKEND_URL}/api/payments/create-intent`, intentData);

      if (!intentResponse.data.client_secret) {
        throw new Error('Client Secret não recebido');
      }

      setClientSecret(intentResponse.data.client_secret);
      setPaymentIntentId(intentResponse.data.payment_intent_id);

      console.log('✅ Stripe inicializado para cartões + MB WAY');

      return {
        stripe,
        clientSecret: intentResponse.data.client_secret,
        paymentIntentId: intentResponse.data.payment_intent_id
      };

    } catch (error) {
      console.error('❌ Erro na inicialização Stripe:', error);
      setError(error.message || 'Erro ao inicializar pagamento');
      throw error;
    }
  }, [bookingData, currentAmount, bookingId, createBookingIfNeeded]);

  // 🚀 INICIALIZAÇÃO PRINCIPAL
  const initialize = useCallback(async () => {
    try {
      console.log('🚀 Inicializando sistema de pagamento...');

      if (!bookingData || !bookingData.depositAmount) {
        throw new Error('Dados de booking inválidos');
      }

      // Definir valores iniciais
      const initialAmount = bookingData.depositAmount;
      setOriginalAmount(initialAmount);
      setCurrentAmount(initialAmount);

      // Inicializar Stripe (cartões + MB WAY)
      await initializeStripe();

      setIsInitialized(true);
      console.log('✅ Sistema inicializado');

    } catch (error) {
      console.error('❌ Erro na inicialização:', error);
      setError(error.message || 'Erro na inicialização');
    }
  }, [bookingData, initializeStripe]);

  // 🔄 INICIALIZAR AUTOMATICAMENTE
  useEffect(() => {
    if (bookingData && !isInitialized && !error) {
      initialize();
    }
  }, [bookingData, isInitialized, error, initialize]);

  // 💳 CONFIRMAR PAGAMENTO STRIPE
  const confirmStripePayment = useCallback(async (stripe, elements) => {
    if (!stripe || !elements || !clientSecret) {
      throw new Error('Stripe não está pronto');
    }

    try {
      setIsProcessing(true);
      setError('');

      console.log('🔄 Confirmando pagamento Stripe...');

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?booking_id=${bookingId}`,
        },
        redirect: 'if_required'
      });

      if (error) {
        console.error('❌ Erro no pagamento:', error);
        throw new Error(error.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ Pagamento bem-sucedido!');

        // Callback personalizado
        if (onPaymentComplete) {
          onPaymentComplete({
            success: true,
            status: 'completed',
            paymentIntent,
            bookingId,
            method: 'stripe_cards_mbway',
            amount: currentAmount,
            savings: discountApplied?.amount || 0
          });
        }

        if (autoNavigateOnSuccess) {
          setTimeout(() => {
            window.location.href = `/payment/success?booking_id=${bookingId}`;
          }, 1000);
        }

        return {
          success: true,
          paymentIntent,
          bookingId
        };
      }

      // Para MB WAY e outros métodos assíncronos
      if (paymentIntent && paymentIntent.status === 'processing') {
        console.log('⏳ Pagamento em processamento (MB WAY)...');
        return {
          success: true,
          status: 'processing',
          paymentIntent,
          bookingId,
          message: 'Aguarde a confirmação no seu telemóvel'
        };
      }

      throw new Error('Pagamento não completado');

    } finally {
      setIsProcessing(false);
    }
  }, [clientSecret, bookingId, currentAmount, discountApplied, onPaymentComplete, autoNavigateOnSuccess]);

  // 🎁 APLICAR CÓDIGO DE DESCONTO
  const applyDiscountCode = useCallback(async (code) => {
    if (!enableDiscounts) {
      throw new Error('Descontos não habilitados');
    }

    if (!code || !code.trim()) {
      throw new Error('Digite um código de desconto válido');
    }

    try {
      console.log('🎁 Aplicando desconto:', code);

      const response = await axios.post(`${BACKEND_URL}/api/discounts/validate`, {
        code: code.trim().toUpperCase(),
        tour_id: bookingData.tour.id,
        amount: originalAmount,
        customer_email: bookingData.email
      });

      const discountData = response.data;
      const discountAmount = discountData.discount_amount || 0;
      const newAmount = Math.max(originalAmount - discountAmount, 0.50);

      setDiscountCode(code.trim().toUpperCase());
      setDiscountApplied({
        code: code.trim().toUpperCase(),
        amount: discountAmount,
        percentage: discountData.discount_percentage || 0,
        description: discountData.description || 'Desconto aplicado'
      });
      setCurrentAmount(newAmount);

      // Re-inicializar Payment Intent com novo valor
      if (clientSecret) {
        await initializeStripe();
      }

      console.log('✅ Desconto aplicado');

      return {
        success: true,
        discount: discountData,
        newAmount,
        savings: discountAmount
      };

    } catch (error) {
      console.error('❌ Erro ao aplicar desconto:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Código inválido';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [enableDiscounts, originalAmount, bookingData, clientSecret, initializeStripe]);

  // 🗑️ REMOVER DESCONTO
  const removeDiscount = useCallback(async () => {
    try {
      console.log('🗑️ Removendo desconto...');

      setDiscountCode('');
      setDiscountApplied(null);
      setCurrentAmount(originalAmount);
      setError('');

      // Re-inicializar Payment Intent com valor original
      if (clientSecret) {
        await initializeStripe();
      }

      console.log('✅ Desconto removido');
      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao remover desconto:', error);
      return { success: false, error: error.message };
    }
  }, [originalAmount, clientSecret, initializeStripe]);

  // 🎨 FUNÇÃO DE FORMATAÇÃO
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }, []);

  // 🧪 DEBUG INFO
  const getDebugInfo = useCallback(() => {
    return {
      version: 'embedded_web_v1',
      hook_state: {
        isInitialized,
        isProcessing,
        bookingId,
        currentAmount,
        originalAmount,
        hasDiscount: !!discountApplied,
        hasClientSecret: !!clientSecret,
        hasError: !!error
      },
      stripe_state: {
        stripe_ready: !!stripePromise,
        client_secret_ready: !!clientSecret,
        payment_intent_id: paymentIntentId
      },
      booking_data: {
        tour_id: bookingData?.tour?.id,
        customer_email: bookingData?.email,
        participants: bookingData?.numberOfPeople,
        deposit_amount: bookingData?.depositAmount
      },
      discount_info: discountApplied,
      last_error: error
    };
  }, [
    isInitialized, isProcessing, bookingId, currentAmount, originalAmount,
    discountApplied, clientSecret, error, stripePromise, paymentIntentId, bookingData
  ]);

  return {
    // Estados principais
    isInitialized,
    isProcessing,
    bookingId,
    currentAmount,
    originalAmount,
    error,

    // Stripe específico
    stripePromise,
    clientSecret,
    paymentIntentId,

    // Métodos principais
    initialize,
    confirmStripePayment,
    applyDiscountCode,
    removeDiscount,

    // Funcionalidades de desconto
    discountCode,
    discountApplied,
    enableDiscounts,

    // Utilities
    getDebugInfo,
    formatCurrency,

    // Status helpers
    isReady: isInitialized && !!stripePromise && !!clientSecret && !error,
    hasError: !!error,
    canPay: !isProcessing && isInitialized && !!clientSecret,
    hasDiscount: !!discountApplied,
    savings: discountApplied?.amount || 0,

    // Setters para controlo externo
    setError,
    setIsProcessing
  };
};

export default useEmbeddedPayment;