// frontend/src/components/StripeCheckoutForm.js - VERSÃO COM DEBUG
import React, { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";

const StripeCheckoutForm = ({ onProcessing, onError, onSuccess, amount, bookingData }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    console.log("🔍 DEBUG: handleSubmit chamado");

    // Verificação robusta da inicialização do Stripe
    if (!stripe || !elements) {
      console.error("❌ DEBUG: Stripe não inicializado", { stripe: !!stripe, elements: !!elements });
      onError("Stripe não está inicializado. Por favor, recarregue a página.");
      return;
    }

    // Verificação se o formulário está pronto
    if (!isReady) {
      console.error("❌ DEBUG: Formulário não está pronto");
      onError("Formulário ainda não está pronto. Aguarde um momento.");
      return;
    }

    setIsProcessing(true);
    onProcessing(true);

    try {
      console.log("🔍 DEBUG: Preparando billing_details", { bookingData });

      // Incluir billing_details obrigatórios
      const confirmParams = {
        return_url: window.location.origin,
        payment_method_data: {
          billing_details: {
            name: bookingData ? `${bookingData.firstName} ${bookingData.lastName}` : "Cliente",
            email: bookingData ? bookingData.email : "cliente@example.com",
            phone: bookingData ? bookingData.phone : null
          }
        }
      };

      console.log("🔍 DEBUG: Calling stripe.confirmPayment", { confirmParams });

      // Confirmar o pagamento sem redirecionamento
      const result = await stripe.confirmPayment({
        elements,
        confirmParams,
        redirect: "if_required"  // Não redireciona, fica na mesma página
      });

      console.log("🔍 DEBUG: stripe.confirmPayment result:", result);

      // Tratar diferentes cenários de resposta
      if (result.error) {
        console.error("❌ DEBUG: Erro no pagamento:", result.error);
        
        // Tratamento de erros específicos
        let errorMessage = result.error.message || "Erro no processamento do pagamento";
        
        if (result.error.type === 'card_error') {
          errorMessage = `Erro no cartão: ${result.error.message}`;
        } else if (result.error.type === 'validation_error') {
          errorMessage = `Dados inválidos: ${result.error.message}`;
        }
        
        onError(errorMessage);
      } else if (result.paymentIntent) {
        console.log("✅ DEBUG: Pagamento bem-sucedido! Calling onSuccess...", result.paymentIntent);
        
        try {
          onSuccess(result.paymentIntent);
          console.log("✅ DEBUG: onSuccess chamado com sucesso");
        } catch (successError) {
          console.error("❌ DEBUG: Erro ao chamar onSuccess:", successError);
          onError("Erro após pagamento bem-sucedido: " + successError.message);
        }
      } else {
        console.warn("⚠️ DEBUG: Resultado inesperado:", result);
        onError("O pagamento não foi concluído. Tente novamente.");
      }
    } catch (error) {
      console.error("❌ DEBUG: Erro inesperado no handleSubmit:", error);
      onError("Erro inesperado no processamento: " + error.message);
    } finally {
      console.log("🔍 DEBUG: Finalizando processamento");
      setIsProcessing(false);
      onProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      <PaymentElement 
        onReady={() => {
          console.log("✅ DEBUG: PaymentElement pronto");
          setIsReady(true);
        }}
        onChange={(event) => {
          console.log("🔍 DEBUG: PaymentElement onChange:", event);
          if (event.error) {
            console.error("❌ DEBUG: Erro no PaymentElement:", event.error);
            onError(event.error.message);
          } else {
            onError(''); // Limpar erro se estava tudo bem
          }
        }}
        options={{
          layout: "tabs",
          fields: {
            billingDetails: "auto"
          }
        }}
      />
      
      {/* Indicador de carregamento/pronto */}
      {!isReady && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-2"></div>
          <span className="text-gray-600 text-sm">A carregar formulário de pagamento...</span>
        </div>
      )}
      
      <button 
        disabled={isProcessing || !stripe || !elements || !isReady}
        className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-colors ${
          isProcessing || !isReady 
            ? "bg-gray-400 cursor-not-allowed text-gray-200" 
            : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
        }`}
        onClick={() => console.log("🔍 DEBUG: Botão de pagamento clicado")}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            A processar pagamento...
          </div>
        ) : !isReady ? (
          "Aguarde..."
        ) : (
          `Pagar ${new Intl.NumberFormat('pt-PT', { 
            style: 'currency', 
            currency: 'EUR' 
          }).format(amount || 0)}`
        )}
      </button>
      
      {/* Informação de segurança */}
      <div className="text-center text-xs text-gray-500 mt-4">
        <div className="flex items-center justify-center space-x-4">
          <span className="flex items-center">
            🔒 Seguro via Stripe
          </span>
          <span className="flex items-center">
            🛡️ Dados encriptados
          </span>
        </div>
      </div>
    </form>
  );
};

export default StripeCheckoutForm;