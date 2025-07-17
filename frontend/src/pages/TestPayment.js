// pages/TestPayment.js
import React from 'react';
import PremiumPaymentComponent from '../components/PremiumPaymentComponent';

const TestPayment = () => {
  const testData = {
    tour: { 
      id: 'test-tour-123', 
      name: 'Tour de Teste Sintra' 
    },
    firstName: 'João',
    lastName: 'Silva',
    email: 'joao@teste.com',
    phone: '+351912345678',
    date: '2025-08-15',
    numberOfPeople: 1,
    depositAmount: 5.0, // €5 para teste
    remainingAmount: 20.0,
    specialRequests: 'Teste de pagamento'
  };

  const handlePaymentSuccess = (result) => {
    console.log('✅ Pagamento bem-sucedido:', result);
    alert('✅ TESTE BEM-SUCEDIDO!\n\n' + JSON.stringify(result, null, 2));
  };

  const handleBack = () => {
    console.log('← Voltar clicado');
    alert('← Botão voltar clicado!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Teste de Pagamento
          </h1>
          <p className="text-gray-600">
            Teste cartões e MB WAY com dados fictícios
          </p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-yellow-800 mb-2">🔧 Modo de Teste:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• <strong>Cartão sucesso:</strong> 4242424242424242</li>
            <li>• <strong>Cartão falha:</strong> 4000000000000002</li>
            <li>• <strong>CVC:</strong> 123 | <strong>Data:</strong> 12/25</li>
            <li>• <strong>MB WAY:</strong> +351912345678</li>
          </ul>
        </div>
        
        <PremiumPaymentComponent 
          bookingData={testData}
          onPaymentSuccess={handlePaymentSuccess}
          onBack={handleBack}
        />
      </div>
    </div>
  );
};

export default TestPayment;