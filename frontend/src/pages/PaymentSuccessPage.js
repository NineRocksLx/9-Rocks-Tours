// frontend/src/components/PaymentSuccessPage.js - VERSÃO COMPLETAMENTE CORRIGIDA
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config/appConfig';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    console.log("🔍 DEBUG: PaymentSuccessPage carregada");
    console.log("🔍 DEBUG: location.state:", location.state);
    console.log("🔍 DEBUG: searchParams:", Object.fromEntries(searchParams));
    
    const stateData = location.state;
    
    if (stateData && stateData.paymentSuccess) {
      console.log("✅ DEBUG: Dados via state (Stripe/Google Pay)");
      handleDirectPaymentSuccess(stateData);
    } else if (searchParams.get('paymentId') && searchParams.get('PayerID')) {
      console.log("✅ DEBUG: Callback PayPal detectado");
      handlePayPalCallback();
    } else {
      console.log("⚠️ DEBUG: Acesso direto - mostrando página de teste");
      handleDirectAccess();
    }
  }, [searchParams, location.state]);

  // ===================================================================
  // 🎯 FUNÇÃO DE DATA CORRIGIDA - GARANTE DIA CORRETO
  // ===================================================================
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      // Se é uma string ISO completa, pega só a parte da data
      const dateOnly = dateString.substring(0, 10);
      const [year, month, day] = dateOnly.split('-').map(num => parseInt(num, 10));
      
      // CORREÇÃO CRÍTICA: CRIA DATA LOCAL (não UTC) - ESTA É A CHAVE!
      const localDate = new Date(year, month - 1, day);
      
      return localDate.toLocaleDateString('pt-PT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      console.error('Erro ao formatar data:', e);
      return dateString; // Retorna original se der erro
    }
  };

  const handleDirectAccess = () => {
    console.log("🔍 DEBUG: Mostrando página de teste/demo");
    
    setPaymentDetails({
      method: 'card',
      transaction_id: 'demo_transaction_' + Date.now(),
      booking_id: 'demo_booking_' + Date.now(),
      amount: 207.00,
      payer_email: 'demo@example.com'
    });

    // CORREÇÃO: Data de exemplo que vai funcionar corretamente
    setBookingDetails({
      tour_name: 'Demo Tour - Explore Portugal',
      selected_date: '2025-08-26', // Data de exemplo fixa no formato correto
      participants: 2,
      customer_name: 'Cliente Demonstração',
      customer_email: 'demo@example.com',
      customer_phone: '+351 912 345 678',
      special_requests: 'Esta é uma demonstração da página de sucesso.'
    });

    setStatus('completed');
  };

  const handleDirectPaymentSuccess = async (data) => {
    try {
      setStatus('processing');
      
      if (data.booking_id) {
        const bookingResponse = await axios.get(`${BACKEND_URL}/api/bookings/${data.booking_id}`);
        setBookingDetails(bookingResponse.data);
      }
      
      setPaymentDetails(data);
      setStatus('completed');
      
    } catch (err) {
      console.error('Erro ao buscar detalhes da reserva:', err);
      setPaymentDetails(data);
      setStatus('completed');
    }
  };

  const handlePayPalCallback = async () => {
    const paymentId = searchParams.get('paymentId');
    const payerId = searchParams.get('PayerID');
    const bookingId = searchParams.get('booking_id');

    console.log("🔍 DEBUG: PayPal params:", { paymentId, payerId, bookingId });

    if (!paymentId || !payerId) {
      console.log("❌ DEBUG: Parâmetros PayPal em falta");
      setStatus('failed');
      setError('Dados de pagamento PayPal inválidos ou em falta.');
      return;
    }

    try {
      setStatus('processing');
      
      const response = await axios.post(`${BACKEND_URL}/api/payments/paypal/execute/${paymentId}`, {
        payer_id: payerId
      });

      if (response.data.status === 'completed') {
        setPaymentDetails({
          method: 'paypal',
          transaction_id: response.data.transaction_id,
          booking_id: bookingId,
          amount: response.data.amount,
          payer_email: response.data.payer_email
        });

        if (bookingId) {
          try {
            const bookingResponse = await axios.get(`${BACKEND_URL}/api/bookings/${bookingId}`);
            setBookingDetails(bookingResponse.data);
          } catch (bookingErr) {
            console.error('Erro ao buscar detalhes da reserva:', bookingErr);
          }
        }

        setStatus('completed');
      } else {
        setStatus('failed');
        setError(response.data.message?.details || 'O pagamento PayPal falhou.');
      }
    } catch (err) {
      setStatus('failed');
      setError(err.response?.data?.detail || 'Erro ao finalizar pagamento PayPal.');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0);
  };

  const getPaymentMethodName = (method) => {
    switch (method) {
      case 'google_pay': return 'Google Pay';
      case 'paypal': return 'PayPal';
      case 'card': return 'Cartão de Crédito';
      case 'multibanco': return 'MB WAY';
      default: return method || 'Pagamento Online';
    }
  };

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">A processar o seu pagamento...</h2>
          <p className="text-gray-600">Por favor, aguarde. Não feche esta janela.</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Erro no Pagamento</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Voltar à Página Inicial
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full text-blue-600 py-2 font-medium hover:text-blue-700"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Pagamento Realizado com Sucesso!</h1>
            <p className="text-xl text-gray-600">A sua reserva está confirmada. Obrigado por escolher a 9 Rocks Tours!</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Detalhes do Pagamento</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Método de Pagamento:</span>
                  <span className="font-semibold text-gray-900">
                    {getPaymentMethodName(paymentDetails?.method)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">ID da Transação:</span>
                  <span className="font-mono text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {paymentDetails?.transaction_id || 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Valor Pago (Depósito):</span>
                  <span className="font-bold text-green-600 text-lg">
                    {formatPrice(paymentDetails?.amount)}
                  </span>
                </div>
                
                {paymentDetails?.payer_email && (
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">Email do Pagador:</span>
                    <span className="text-gray-900">{paymentDetails.payer_email}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Data do Pagamento:</span>
                  <span className="text-gray-900">
                    {new Date().toLocaleDateString('pt-PT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {paymentDetails?.receipt_url && (
                <div className="mt-6">
                  <a
                    href={paymentDetails.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Baixar Recibo de Pagamento
                  </a>
                </div>
              )}
            </div>

            {bookingDetails && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Detalhes da Reserva</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Tour:</h3>
                    <p className="text-gray-700">{bookingDetails.tour_name || 'Tour em Portugal'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Data da Reserva:</h4>
                      <p className="text-blue-700 font-medium">
                        {/* 🎯 CORREÇÃO CRÍTICA: Agora mostra a data da reserva corretamente */}
                        {formatDate(bookingDetails.selected_date)}
                      </p>
                      {/* DEBUG: Vamos ver o valor original */}
                      <p className="text-xs text-gray-400 mt-1">
                        Debug: {bookingDetails.selected_date}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Participantes:</h4>
                      <p className="text-gray-700">{bookingDetails.participants || 1}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Cliente:</h4>
                    <p className="text-gray-700">{bookingDetails.customer_name}</p>
                    <p className="text-gray-600 text-sm">{bookingDetails.customer_email}</p>
                    {bookingDetails.customer_phone && (
                      <p className="text-gray-600 text-sm">{bookingDetails.customer_phone}</p>
                    )}
                  </div>

                  {bookingDetails.special_requests && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Pedidos Especiais:</h4>
                      <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                        {bookingDetails.special_requests}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">📧 Próximos Passos</h3>
            <div className="space-y-3 text-blue-800">
              <p className="flex items-start">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Irá receber um <strong>email de confirmação</strong> nos próximos minutos com todos os detalhes da sua reserva.</span>
              </p>
              <p className="flex items-start">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Entraremos em contacto <strong>24-48h antes do tour</strong> para confirmar a hora e local de encontro.</span>
              </p>
              <p className="flex items-start">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Para questões urgentes, contacte-nos via <strong>WhatsApp: +351 963 366 458</strong></span>
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Voltar à Página Inicial
            </button>
            <button
              onClick={() => navigate('/tours')}
              className="bg-white text-blue-600 border-2 border-blue-600 py-3 px-8 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Ver Mais Tours
            </button>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-2">Precisa de ajuda?</p>
            <div className="flex justify-center space-x-6 text-sm">
              <a href="mailto:ninerockstours@gmail.com" className="text-blue-600 hover:text-blue-700">
                📧 ninerockstours@gmail.com
              </a>
              <a href="tel:+351963366458" className="text-blue-600 hover:text-blue-700">
                📞 +351 963 366 458
              </a>
              <a href="https://wa.me/351963366458" className="text-blue-600 hover:text-blue-700">
                💬 WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;