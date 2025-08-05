// hooks/usePremiumEmbeddedPayment.js - 9 Rocks Tours - Versão Premium com Pagamento Imediato
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import {
  useEmbeddedPaymentElement,
  IntentConfiguration,
  EmbeddedPaymentElementConfiguration,
  PaymentMethod,
  IntentCreationCallbackParams,
} from '@stripe/stripe-react-native';

const BACKEND_URL = __DEV__ ? 'http://localhost:8000' : 'https://api.9rocks.pt';

/**
 * 🚀 Hook Premium com PAGAMENTO IMEDIATO na planilha
 * Permite que o cliente finalize o pagamento diretamente no form sheet
 */
export const usePremiumEmbeddedPayment = (initialBookingData, options = {}) => {
  const {
    enableFormSheetAction = true,        // ✨ NOVO: Ativar pagamento imediato
    formSheetActionType = 'confirm',     // ✨ NOVO: Tipo de ação na planilha
    onPaymentComplete = null,           // ✨ NOVO: Callback de sucesso customizado
    enableGooglePay = true,             // ✨ NOVO: Ativar Google Pay
    autoNavigateOnSuccess = true,       // ✨ NOVO: Navegar automaticamente no sucesso
    ...customOptions
  } = options;

  // Estados principais
  const [bookingData, setBookingData] = useState(initialBookingData);
  const [intentConfig, setIntentConfig] = useState(null);
  const [elementConfig, setElementConfig] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  
  // Estados para funcionalidades avançadas
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(null);
  const [originalAmount, setOriginalAmount] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);

  // ✨ NOVOS ESTADOS PARA PAGAMENTO IMEDIATO
  const [formSheetPaymentResult, setFormSheetPaymentResult] = useState(null);
  const [lastPaymentAttempt, setLastPaymentAttempt] = useState(null);

  // 🏗️ CRIAR BOOKING NO BACKEND
  const createBookingIfNeeded = useCallback(async () => {
    try {
      if (bookingData.id && typeof bookingData.id === 'string' && bookingData.id.length > 5) {
        return bookingData.id;
      }

      console.log('🔄 Criando novo booking...');

      const bookingPayload = {
        tour_id: bookingData.tour.id,
        customer_name: `${bookingData.firstName} ${bookingData.lastName}`,
        customer_email: bookingData.email,
        customer_phone: bookingData.phone || '',
        selected_date: bookingData.date,
        participants: parseInt(bookingData.numberOfPeople),
        special_requests: bookingData.specialRequests || '',
        payment_method: 'stripe_embedded_premium',
        total_amount: currentAmount,
        original_amount: originalAmount,
        discount_applied: discountApplied,
        form_sheet_enabled: enableFormSheetAction
      };

      const response = await fetch(`${BACKEND_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao criar reserva');
      }

      const result = await response.json();
      const newBookingId = result.id || result.booking_id || result._id;
      
      console.log('✅ Booking criado:', newBookingId);
      return newBookingId;
      
    } catch (error) {
      console.error('❌ Erro ao criar booking:', error);
      throw error;
    }
  }, [bookingData, currentAmount, originalAmount, discountApplied, enableFormSheetAction]);

  // 🎯 CONFIRM HANDLER MELHORADO
  const confirmHandler = useCallback(async (
    paymentMethod,
    shouldSavePaymentMethod,
    intentCreationCallback
  ) => {
    try {
      console.log('🔄 ConfirmHandler Premium iniciado...', {
        paymentMethodId: paymentMethod.id,
        shouldSave: shouldSavePaymentMethod,
        amount: currentAmount,
        bookingId,
        formSheetEnabled: enableFormSheetAction
      });

      // 1. GARANTIR QUE TEMOS UM BOOKING
      let finalBookingId = bookingId;
      if (!finalBookingId) {
        finalBookingId = await createBookingIfNeeded();
        setBookingId(finalBookingId);
      }

      // 2. PREPARAR DADOS PARA O BACKEND
      const intentData = {
        amount: currentAmount,
        currency: 'eur',
        tour_id: bookingData.tour.id,
        booking_id: finalBookingId,
        customer_email: bookingData.email,
        customer_name: `${bookingData.firstName} ${bookingData.lastName}`,
        payment_method_id: paymentMethod.id,
        save_payment_method: shouldSavePaymentMethod,
        discount_code: discountApplied?.code || null,
        discount_amount: discountApplied?.amount || 0,
        original_amount: originalAmount,
        // ✨ NOVO: Indicar que é pagamento via form sheet
        form_sheet_payment: enableFormSheetAction,
        metadata: {
          form_sheet_enabled: enableFormSheetAction,
          payment_type: 'embedded_premium',
          google_pay_enabled: enableGooglePay
        }
      };

      console.log('📤 Enviando dados para backend (Premium):', intentData);

      // 3. CRIAR PAYMENT INTENT NO BACKEND
      const response = await fetch(`${BACKEND_URL}/api/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(intentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao criar Payment Intent');
      }

      const result = await response.json();

      console.log('✅ Payment Intent Premium criado:', result.payment_intent_id);

      // 4. RETORNAR CLIENT SECRET PARA O STRIPE
      intentCreationCallback({
        clientSecret: result.client_secret
      });

      // 5. LOG PARA ANALYTICS
      logPaymentEvent('premium_intent_created', {
        payment_intent_id: result.payment_intent_id,
        booking_id: finalBookingId,
        amount: currentAmount,
        original_amount: originalAmount,
        discount_applied: !!discountApplied,
        form_sheet_enabled: enableFormSheetAction
      });

    } catch (error) {
      console.error('❌ Erro no confirmHandler Premium:', error);
      
      // RETORNAR ERRO PARA O STRIPE
      intentCreationCallback({
        error: {
          message: error.message || 'Erro ao processar pagamento',
          type: 'api_error'
        }
      });

      // LOG DO ERRO
      logPaymentEvent('premium_intent_creation_failed', {
        error: error.message,
        booking_id: bookingId
      });
    }
  }, [bookingData, currentAmount, originalAmount, bookingId, discountApplied, enableFormSheetAction, enableGooglePay]);

  // ✨ NOVO: CALLBACK PARA PAGAMENTO IMEDIATO NA PLANILHA
  const onFormSheetConfirmComplete = useCallback((result) => {
    console.log('🎉 Form Sheet Payment Result:', result);
    
    setFormSheetPaymentResult(result);
    setLastPaymentAttempt(new Date().toISOString());

    switch (result.status) {
      case 'completed':
        console.log('✅ Pagamento completado via Form Sheet!');
        
        logPaymentEvent('form_sheet_payment_completed', {
          payment_intent_id: result.paymentIntent?.id,
          booking_id: bookingId,
          amount: currentAmount
        });

        // CALLBACK CUSTOMIZADO
        if (onPaymentComplete) {
          onPaymentComplete({
            success: true,
            status: 'completed',
            paymentIntent: result.paymentIntent,
            bookingId: bookingId,
            method: 'form_sheet',
            amount: currentAmount,
            savings: discountApplied?.amount || 0
          });
        } else {
          // ALERT PADRÃO
          Alert.alert(
            '🎉 Pagamento Confirmado!',
            discountApplied 
              ? `Pagamento confirmado com desconto de ${formatCurrency(discountApplied.amount)}! Você receberá um email com os detalhes.`
              : 'Sua reserva foi confirmada com sucesso! Você receberá um email com os detalhes.',
            [{ text: 'OK' }]
          );
        }
        break;

      case 'failed':
        console.error('❌ Pagamento falhou via Form Sheet:', result.error);
        
        logPaymentEvent('form_sheet_payment_failed', {
          error: result.error?.message,
          booking_id: bookingId
        });

        Alert.alert(
          'Erro no Pagamento',
          result.error?.message || 'Ocorreu um erro durante o processamento. Tente novamente.',
          [
            { text: 'Tentar Novamente', style: 'default' },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
        break;

      case 'canceled':
        console.log('ℹ️ Pagamento cancelado pelo usuário via Form Sheet');
        
        logPaymentEvent('form_sheet_payment_canceled', {
          booking_id: bookingId
        });
        
        // Não mostrar alert para cancelamento
        break;

      default:
        console.warn('⚠️ Status inesperado do Form Sheet:', result.status);
        break;
    }
  }, [bookingId, currentAmount, discountApplied, onPaymentComplete]);

  // ⚙️ CONFIGURAÇÕES MEMOIZADAS COM FORM SHEET ACTION
  const configurations = useMemo(() => {
    if (!bookingData || currentAmount <= 0) return { intent: null, element: null };

    const intentConfiguration = {
      mode: {
        amount: Math.round(currentAmount * 100), // Centavos
        currencyCode: 'EUR',
      },
      paymentMethodTypes: enableGooglePay ? ['card', 'googlePay'] : ['card'],
      confirmHandler,
    };

    const elementConfiguration = {
      merchantDisplayName: '9 Rocks Tours',
      returnURL: 'ninerocks://stripe-redirect',
      defaultValues: {
        billingDetails: {
          name: `${bookingData.firstName} ${bookingData.lastName}`,
          email: bookingData.email,
        }
      },
      appearance: {
        colors: {
          primary: '#2563eb',
          background: '#ffffff',
          componentBackground: '#f8fafc',
          componentBorder: '#e2e8f0',
          componentDivider: '#e2e8f0',
          primaryText: '#1e293b',
          secondaryText: '#64748b',
          componentText: '#1e293b',
          placeholderText: '#94a3b8'
        },
        shapes: {
          borderRadius: 8,
          borderWidth: 1
        }
      },
      // ✨ NOVA CONFIGURAÇÃO: FORM SHEET ACTION
      ...(enableFormSheetAction && {
        formSheetAction: {
          type: formSheetActionType, // 'confirm'
          onFormSheetConfirmComplete: onFormSheetConfirmComplete
        }
      })
    };

    return {
      intent: intentConfiguration,
      element: elementConfiguration
    };
  }, [
    bookingData, 
    currentAmount, 
    confirmHandler, 
    enableFormSheetAction, 
    formSheetActionType, 
    onFormSheetConfirmComplete,
    enableGooglePay
  ]);

  // 🎨 USAR O HOOK EMBEDDED PAYMENT ELEMENT
  const {
    embeddedPaymentElementView,
    paymentOption,
    confirm,
    update,
    clearPaymentOption,
    loadingError,
  } = useEmbeddedPaymentElement(
    intentConfig,
    elementConfig
  );

  // 🚀 INICIALIZAÇÃO
  const initialize = useCallback(async () => {
    try {
      console.log('🚀 Inicializando Premium Embedded Payment...', {
        formSheetEnabled: enableFormSheetAction,
        googlePayEnabled: enableGooglePay
      });

      if (!bookingData || !bookingData.depositAmount) {
        throw new Error('Dados de booking inválidos');
      }

      // Definir valores iniciais
      const initialAmount = bookingData.depositAmount;
      setOriginalAmount(initialAmount);
      setCurrentAmount(initialAmount);

      // Garantir que temos um booking ID
      const newBookingId = await createBookingIfNeeded();
      setBookingId(newBookingId);

      // Configurar os configs
      setIntentConfig(configurations.intent);
      setElementConfig(configurations.element);
      setIsInitialized(true);

      console.log('✅ Premium Embedded Payment inicializado');

    } catch (error) {
      console.error('❌ Erro na inicialização Premium:', error);
      Alert.alert(
        'Erro de Inicialização',
        error.message || 'Não foi possível inicializar o sistema de pagamentos',
        [{ text: 'OK' }]
      );
    }
  }, [bookingData, configurations, createBookingIfNeeded, enableFormSheetAction, enableGooglePay]);

  // 🔄 INICIALIZAR AUTOMATICAMENTE
  useEffect(() => {
    if (bookingData && !isInitialized) {
      initialize();
    }
  }, [bookingData, isInitialized, initialize]);

  // 💳 CONFIRMAR PAGAMENTO MANUAL (QUANDO NÃO USA FORM SHEET)
  const confirmPaymentManual = useCallback(async () => {
    if (!paymentOption || isProcessing) {
      Alert.alert('Atenção', 'Selecione um método de pagamento primeiro');
      return { success: false, error: 'No payment option selected' };
    }

    try {
      setIsProcessing(true);
      
      console.log('🔄 Confirmando pagamento manual...', {
        paymentOption: paymentOption.label,
        amount: currentAmount,
        bookingId,
        formSheetEnabled: enableFormSheetAction
      });

      logPaymentEvent('manual_payment_confirmation_started', {
        payment_option: paymentOption.label,
        amount: currentAmount,
        booking_id: bookingId
      });

      // USAR O MÉTODO CONFIRM DO HOOK
      const result = await confirm();

      console.log('📊 Resultado da confirmação manual:', result);

      // PROCESSAR DIFERENTES STATUS
      switch (result.status) {
        case 'completed':
          console.log('🎉 Pagamento manual completado!');
          
          logPaymentEvent('manual_payment_completed', {
            payment_intent_id: result.paymentIntent?.id,
            booking_id: bookingId,
            amount: currentAmount
          });

          return {
            success: true,
            status: 'completed',
            paymentIntent: result.paymentIntent,
            bookingId: bookingId,
            method: 'manual'
          };

        case 'failed':
          console.error('❌ Pagamento manual falhou:', result.error);
          
          logPaymentEvent('manual_payment_failed', {
            error: result.error?.message,
            booking_id: bookingId
          });

          return {
            success: false,
            status: 'failed',
            error: result.error?.message || 'Pagamento falhou'
          };

        case 'canceled':
          console.log('ℹ️ Pagamento manual cancelado');
          
          logPaymentEvent('manual_payment_canceled', {
            booking_id: bookingId
          });

          return {
            success: false,
            status: 'canceled',
            canceled: true
          };

        default:
          console.warn('⚠️ Status manual inesperado:', result.status);
          return {
            success: false,
            status: result.status || 'unknown',
            error: 'Status de pagamento desconhecido'
          };
      }

    } catch (error) {
      console.error('❌ Erro inesperado na confirmação manual:', error);
      
      logPaymentEvent('manual_payment_unexpected_error', {
        error: error.message,
        booking_id: bookingId
      });

      return {
        success: false,
        error: error.message || 'Erro inesperado durante o pagamento'
      };
    } finally {
      setIsProcessing(false);
    }
  }, [paymentOption, isProcessing, confirm, currentAmount, bookingId, enableFormSheetAction]);

  // 🎁 APLICAR CÓDIGO DE DESCONTO (MANTIDO DA VERSÃO ANTERIOR)
  const applyDiscountCode = useCallback(async (code) => {
    if (!code || !code.trim()) {
      Alert.alert('Atenção', 'Digite um código de desconto válido');
      return { success: false };
    }

    try {
      console.log('🎁 Aplicando código de desconto:', code);

      const response = await fetch(`${BACKEND_URL}/api/discounts/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          tour_id: bookingData.tour.id,
          amount: originalAmount,
          customer_email: bookingData.email
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Código de desconto inválido');
      }

      const discountData = await response.json();
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

      // ATUALIZAR O EMBEDDED PAYMENT ELEMENT
      if (update && intentConfig) {
        const updatedIntentConfig = {
          ...intentConfig,
          mode: {
            ...intentConfig.mode,
            amount: Math.round(newAmount * 100)
          }
        };

        await update(updatedIntentConfig);
        setIntentConfig(updatedIntentConfig);
      }

      console.log('✅ Desconto aplicado (Premium)');

      logPaymentEvent('premium_discount_applied', {
        code,
        discount_amount: discountAmount,
        original_amount: originalAmount,
        new_amount: newAmount,
        booking_id: bookingId
      });

      return {
        success: true,
        discount: discountData,
        newAmount,
        savings: discountAmount
      };

    } catch (error) {
      console.error('❌ Erro ao aplicar desconto Premium:', error);
      
      logPaymentEvent('premium_discount_application_failed', {
        code,
        error: error.message,
        booking_id: bookingId
      });

      return {
        success: false,
        error: error.message || 'Erro ao aplicar código de desconto'
      };
    }
  }, [originalAmount, bookingData, intentConfig, update, bookingId]);

  // 🗑️ REMOVER DESCONTO (MANTIDO DA VERSÃO ANTERIOR)
  const removeDiscount = useCallback(async () => {
    try {
      console.log('🗑️ Removendo desconto Premium...');

      setDiscountCode('');
      setDiscountApplied(null);
      setCurrentAmount(originalAmount);

      if (update && intentConfig) {
        const updatedIntentConfig = {
          ...intentConfig,
          mode: {
            ...intentConfig.mode,
            amount: Math.round(originalAmount * 100)
          }
        };

        await update(updatedIntentConfig);
        setIntentConfig(updatedIntentConfig);
      }

      console.log('✅ Desconto removido (Premium)');

      logPaymentEvent('premium_discount_removed', {
        original_amount: originalAmount,
        booking_id: bookingId
      });

      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao remover desconto Premium:', error);
      return { success: false, error: error.message };
    }
  }, [originalAmount, intentConfig, update, bookingId]);

  // 📊 ANALYTICS HELPER
  const logPaymentEvent = useCallback((event, data = {}) => {
    const eventData = {
      timestamp: new Date().toISOString(),
      event,
      booking_id: bookingId,
      tour_id: bookingData?.tour?.id,
      customer_email: bookingData?.email,
      amount: currentAmount,
      original_amount: originalAmount,
      discount_applied: !!discountApplied,
      form_sheet_enabled: enableFormSheetAction,
      google_pay_enabled: enableGooglePay,
      ...data
    };

    console.log(`📊 Premium Payment Event: ${event}`, eventData);
    
    // Integrar com analytics aqui
    // analytics().logEvent(`premium_embedded_payment_${event}`, eventData);
  }, [bookingId, bookingData, currentAmount, originalAmount, discountApplied, enableFormSheetAction, enableGooglePay]);

  // 🧪 DEBUG INFO COMPLETO
  const getDebugInfo = useCallback(() => {
    return {
      version: 'premium',
      hook_state: {
        isInitialized,
        isProcessing,
        bookingId,
        currentAmount,
        originalAmount,
        hasDiscount: !!discountApplied,
        hasPaymentOption: !!paymentOption,
        hasView: !!embeddedPaymentElementView,
        loadingError: loadingError?.message
      },
      premium_features: {
        form_sheet_enabled: enableFormSheetAction,
        form_sheet_action_type: formSheetActionType,
        google_pay_enabled: enableGooglePay,
        auto_navigate_on_success: autoNavigateOnSuccess,
        last_payment_attempt: lastPaymentAttempt,
        form_sheet_result: formSheetPaymentResult
      },
      configurations: {
        intent_set: !!intentConfig,
        element_set: !!elementConfig
      },
      booking_data: {
        tour_id: bookingData?.tour?.id,
        customer_email: bookingData?.email,
        participants: bookingData?.numberOfPeople
      },
      discount_info: discountApplied,
      payment_option: paymentOption ? {
        label: paymentOption.label,
      } : null
    };
  }, [
    isInitialized, isProcessing, bookingId, currentAmount, originalAmount,
    discountApplied, paymentOption, embeddedPaymentElementView, loadingError,
    intentConfig, elementConfig, bookingData, enableFormSheetAction, 
    formSheetActionType, enableGooglePay, autoNavigateOnSuccess,
    lastPaymentAttempt, formSheetPaymentResult
  ]);

  // 🎨 FUNÇÃO DE FORMATAÇÃO
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }, []);

  return {
    // Estados principais
    isInitialized,
    isProcessing,
    bookingId,
    currentAmount,
    originalAmount,

    // Componentes do Stripe
    embeddedPaymentElementView,
    paymentOption,
    loadingError,

    // Métodos principais
    initialize,
    confirmPayment: confirmPaymentManual, // Para compatibilidade
    confirmPaymentManual,
    applyDiscountCode,
    removeDiscount,

    // ✨ NOVOS: Estados do Form Sheet
    formSheetPaymentResult,
    lastPaymentAttempt,

    // ✨ NOVOS: Configurações Premium
    enableFormSheetAction,
    enableGooglePay,
    formSheetActionType,

    // Funcionalidades de desconto
    discountCode,
    discountApplied,

    // Utilities
    getDebugInfo,
    logPaymentEvent,
    formatCurrency,

    // Status helpers
    isReady: isInitialized && !!embeddedPaymentElementView && !loadingError,
    hasError: !!loadingError,
    canPay: !!paymentOption && !isProcessing,
    hasDiscount: !!discountApplied,
    savings: discountApplied?.amount || 0,
    
    // Configurações para uso manual (se necessário)
    intentConfig,
    elementConfig,
    
    // Métodos do Stripe (expostos para uso avançado)
    stripeUpdate: update,
    stripeClearPaymentOption: clearPaymentOption,
    stripeConfirm: confirm
  };
};

export default usePremiumEmbeddedPayment;