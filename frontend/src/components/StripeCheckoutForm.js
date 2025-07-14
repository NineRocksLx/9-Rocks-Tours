// frontend/src/components/StripeCheckoutForm.js
import React, { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";

const StripeCheckoutForm = ({ onProcessing, onError, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js ainda não carregou.
      return;
    }

    setIsProcessing(true);
    onProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // URL para onde o cliente será redirecionado após o pagamento
        // (ex: página de sucesso ou falha).
        return_url: `${window.location.origin}/booking-success`,
      },
      // Desativar o redirecionamento imediato para podermos controlar o estado
      redirect: "if_required" 
    });

    if (error) {
      // Este bloco é executado para erros imediatos (ex: falha de validação do cartão).
      // Erros de redirecionamento (como falha no 3D Secure) são tratados na `return_url`.
      console.error("Stripe Error:", error);
      onError(error.message || "Ocorreu um erro inesperado.");
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Pagamento foi bem sucedido sem redirecionamento!
      onSuccess(paymentIntent);
    }
    
    setIsProcessing(false);
    onProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      <PaymentElement />
      <button 
        disabled={isProcessing || !stripe || !elements} 
        className="w-full py-4 px-6 rounded-xl font-bold text-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isProcessing ? "A processar..." : `Pagar ${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(171)}`}
      </button>
    </form>
  );
};

export default StripeCheckoutForm;