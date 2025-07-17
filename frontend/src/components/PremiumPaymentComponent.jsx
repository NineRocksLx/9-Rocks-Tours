// components/PremiumPaymentComponent.jsx - VERSÃO SIMPLIFICADA SEM DESCONTO
import React, { useState } from 'react';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import useEmbeddedPayment from '../hooks/useEmbeddedPayment';

// 🎨 Componente interno para o formulário Stripe (cartões + MB WAY)
const StripePaymentForm = ({ onProcessing, onError, onSuccess, currentAmount, bookingId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError('Sistema de pagamento não está pronto');
      return;
    }

    setIsSubmitting(true);
    onProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?booking_id=${bookingId}`,
        },
        redirect: 'if_required'
      });

      if (error) {
        onError(error.message || 'Erro no pagamento');
      } else if (paymentIntent) {
        if (paymentIntent.status === 'succeeded') {
          onSuccess({
            paymentIntent,
            method: 'stripe_embedded',
            status: 'completed'
          });
        } else if (paymentIntent.status === 'processing') {
          onSuccess({
            paymentIntent,
            method: 'mbway',
            status: 'processing',
            message: '⏳ Aguarde a confirmação no seu telemóvel MB WAY'
          });
        }
      }
    } catch (err) {
      console.error('❌ Erro inesperado no pagamento:', err);
      onError('Erro inesperado no pagamento');
    } finally {
      setIsSubmitting(false);
      onProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stripe Payment Element - suporta cartões e MB WAY automaticamente */}
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <PaymentElement 
          options={{
            layout: 'tabs', // Layout em tabs para melhor UX
            fields: {
              billingDetails: {
                name: 'auto',
                email: 'auto'
              }
            }
          }}
        />
      </div>
      
      {/* Botão de pagamento */}
      <button 
        type="submit"
        disabled={isSubmitting || !stripe || !elements} 
        className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
          isSubmitting || !stripe || !elements
            ? 'bg-gray-400 cursor-not-allowed text-gray-200'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
        }`}
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
            A processar...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            💳 Pagar {formatCurrency(currentAmount)}
          </div>
        )}
      </button>

      {/* Informações de segurança */}
      <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          SSL Seguro
        </div>
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Confirmação Instantânea
        </div>
        <div className="flex items-center">
          <span className="text-green-600 font-medium">💳 Cartões + 📱 MB WAY</span>
        </div>
      </div>
    </form>
  );
};

// 🚀 Componente principal SIMPLIFICADO
const PremiumPaymentComponent = ({ bookingData, onPaymentSuccess, onBack }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // 🚀 USAR O HOOK SIMPLIFICADO (SEM DESCONTO)
  const {
    // Estados principais
    isInitialized,
    isProcessing,
    bookingId,
    currentAmount,
    error: hookError,

    // Stripe específico
    stripePromise,
    clientSecret,

    // Utilities
    formatCurrency,
    isReady,
    setError: setHookError,
    getDebugInfo
  } = useEmbeddedPayment(bookingData, {
    onPaymentComplete: handlePaymentComplete
  });

  // 🎉 CALLBACK PERSONALIZADO PARA SUCESSO
  function handlePaymentComplete(result) {
    console.log('🎉 Pagamento completado:', result);

    if (result.success && onPaymentSuccess) {
      onPaymentSuccess({
        method: result.method,
        transaction_id: result.paymentIntent?.id,
        booking_id: result.bookingId,
        amount: result.amount,
        savings: 0, // Sem desconto na versão simplificada
        status: result.status
      });
    }
  }

  // Combinar erros do hook e do componente
  const displayError = error || hookError;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          💳 Pagamento por Cartão ou MB WAY
        </h2>
        <p className="text-lg text-gray-600">
          {formatCurrency(currentAmount || bookingData.depositAmount || 5.0)}
        </p>
      </div>

      {/* Error Display */}
      {displayError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="text-red-800 font-medium">Erro no pagamento</div>
              <div className="text-red-700 text-sm mt-1">{displayError}</div>
              <button 
                onClick={() => {
                  setError('');
                  setHookError('');
                }}
                className="text-red-600 text-sm underline mt-2 hover:text-red-800"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stripe Payment Form */}
      {isReady && stripePromise && clientSecret ? (
        <div className="mb-8">
          <Elements 
            stripe={stripePromise} 
            options={{ 
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#2563eb',
                  colorBackground: '#ffffff',
                  colorText: '#1f2937',
                  colorDanger: '#dc2626',
                  borderRadius: '8px'
                }
              }
            }}
          >
            <StripePaymentForm 
              onProcessing={setProcessing}
              onError={setError}
              onSuccess={(result) => {
                if (result.status === 'processing') {
                  // Para MB WAY, mostrar estado de aguardo
                  setError('');
                  alert('⏳ Pagamento MB WAY iniciado! Confirme no seu telemóvel.');
                } else {
                  // Para cartões, processar sucesso imediato
                  handlePaymentComplete({
                    success: true,
                    ...result,
                    bookingId,
                    amount: currentAmount || bookingData.depositAmount || 5.0,
                    savings: 0
                  });
                }
              }}
              currentAmount={currentAmount || bookingData.depositAmount || 5.0}
              bookingId={bookingId}
            />
          </Elements>
        </div>
      ) : !displayError ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sistema de pagamento...</p>
        </div>
      ) : null}

      {/* Resumo lateral simplificado */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Resumo</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Tour:</span>
            <span className="font-medium">{bookingData.tour?.name?.pt || bookingData.tour?.name || 'Tour de Teste'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Data:</span>
            <span className="font-medium">
              {bookingData.date ? new Date(bookingData.date + 'T00:00:00').toLocaleDateString('pt-PT', { 
                day: 'numeric', month: 'long' 
              }) : '15 de agosto'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Participantes:</span>
            <span className="font-medium">{bookingData.numberOfPeople || 1}</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-blue-600">{formatCurrency(currentAmount || bookingData.depositAmount || 5.0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Botão Voltar */}
      <div className="text-center">
        <button
          onClick={onBack}
          disabled={processing || isProcessing}
          className="text-blue-600 hover:text-blue-700 font-medium py-2 disabled:opacity-50"
        >
          ← Voltar aos dados da reserva
        </button>
      </div>

      {/* Debug Info (desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs">
          <h4 className="font-bold mb-2">🔧 Debug Info:</h4>
          <button 
            onClick={() => console.log('Debug:', getDebugInfo())}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Ver Debug no Console
          </button>
        </div>
      )}

      {/* Trust indicators */}
      <div className="mt-6 text-center">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Pagamento 100% seguro
          </span>
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Confirmação instantânea
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Suporte a Visa, Mastercard, American Express e MB WAY
        </p>
      </div>
    </div>
  );
};

export default PremiumPaymentComponent;