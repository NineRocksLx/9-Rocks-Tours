// frontend/src/components/EmailTestComponent.js
import React, { useState } from 'react';
import { getEmailByLanguage, generateEmailConfig, trackEmailEvent } from '../config/emailConfig';

const EmailTestComponent = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('pt');
  const [emailType, setEmailType] = useState('booking_confirmation');
  const [testResults, setTestResults] = useState([]);

  const languages = [
    { code: 'pt', name: 'Português 🇵🇹', flag: '🇵🇹' },
    { code: 'en', name: 'English 🇬🇧', flag: '🇬🇧' },
    { code: 'es', name: 'Español 🇪🇸', flag: '🇪🇸' }
  ];

  const emailTypes = [
    { key: 'booking_confirmation', name: 'Confirmação de Reserva', icon: '📧' },
    { key: 'contact_form', name: 'Formulário de Contacto', icon: 'ℹ️' },
    { key: 'tour_inquiry', name: 'Consulta de Tour', icon: '🎯' }
  ];

  const testEmailConfig = () => {
    const timestamp = new Date().toLocaleTimeString();
    
    try {
      // 1. Testar obtenção de email por idioma
      const emailAddress = getEmailByLanguage(emailType === 'booking_confirmation' ? 'booking' : 'info', selectedLanguage);
      
      // 2. Gerar configuração completa
      const config = generateEmailConfig(emailType, selectedLanguage, {
        to: 'teste@example.com',
        subject: `Teste de Email - ${emailTypes.find(t => t.key === emailType)?.name}`
      });

      // 3. Simular tracking
      trackEmailEvent(emailType, selectedLanguage, {
        test_mode: true,
        timestamp: timestamp
      });

      const result = {
        timestamp,
        language: selectedLanguage,
        type: emailType,
        success: true,
        emailAddress,
        config,
        details: {
          from: config?.from,
          replyTo: config?.replyTo,
          subject: config?.subject,
          language: config?.language,
          priority: config?.priority
        }
      };

      setTestResults(prev => [result, ...prev.slice(0, 4)]);
      
      return result;
    } catch (error) {
      const result = {
        timestamp,
        language: selectedLanguage,
        type: emailType,
        success: false,
        error: error.message
      };

      setTestResults(prev => [result, ...prev.slice(0, 4)]);
      return result;
    }
  };

  const testAllLanguages = () => {
    languages.forEach(lang => {
      setTimeout(() => {
        const prevLang = selectedLanguage;
        setSelectedLanguage(lang.code);
        setTimeout(() => {
          testEmailConfig();
          setSelectedLanguage(prevLang);
        }, 100);
      }, languages.indexOf(lang) * 500);
    });
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          🧪 Teste de Configuração de Emails
        </h2>
        <p className="text-gray-600 mt-2">
          Teste a configuração de emails personalizados por idioma
        </p>
      </div>

      {/* Controles de Teste */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Seleção de Idioma */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Idioma para Teste:
          </label>
          <div className="space-y-2">
            {languages.map(lang => (
              <label key={lang.code} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="language"
                  value={lang.code}
                  checked={selectedLanguage === lang.code}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-4 h-4 text-blue-600 mr-3"
                />
                <span className="text-gray-700">{lang.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tipo de Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Tipo de Email:
          </label>
          <div className="space-y-2">
            {emailTypes.map(type => (
              <label key={type.key} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="emailType"
                  value={type.key}
                  checked={emailType === type.key}
                  onChange={(e) => setEmailType(e.target.value)}
                  className="w-4 h-4 text-blue-600 mr-3"
                />
                <span className="text-gray-700">{type.icon} {type.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Botões de Teste */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={testEmailConfig}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          🧪 Testar Configuração Atual
        </button>
        
        <button
          onClick={testAllLanguages}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          🌍 Testar Todos os Idiomas
        </button>
        
        <button
          onClick={clearResults}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
        >
          🗑️ Limpar Resultados
        </button>
      </div>

      {/* Resultados dos Testes */}
      {testResults.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Resultados dos Testes:</h3>
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  result.success 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className={`text-2xl ${result.success ? '✅' : '❌'}`}>
                      {result.success ? '✅' : '❌'}
                    </span>
                    <div>
                      <span className="font-semibold">
                        {languages.find(l => l.code === result.language)?.flag} 
                        {result.language.toUpperCase()}
                      </span>
                      <span className="mx-2">•</span>
                      <span className="text-gray-700">
                        {emailTypes.find(t => t.key === result.type)?.name}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{result.timestamp}</span>
                </div>

                {result.success ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Email Address:</span>
                        <br />
                        <code className="bg-white px-2 py-1 rounded text-blue-600">
                          {result.emailAddress}
                        </code>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">From:</span>
                        <br />
                        <code className="bg-white px-2 py-1 rounded text-green-600">
                          {result.details?.from}
                        </code>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Reply To:</span>
                        <br />
                        <code className="bg-white px-2 py-1 rounded text-purple-600">
                          {result.details?.replyTo}
                        </code>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Priority:</span>
                        <br />
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          result.details?.priority === 'high' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {result.details?.priority}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="font-semibold text-gray-700">Subject:</span>
                      <br />
                      <div className="bg-white p-2 rounded border">
                        {result.details?.subject}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-700">
                    <span className="font-semibold">Erro:</span> {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Atual */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">📧 Status da Configuração Atual:</h4>
        <div className="text-sm text-blue-800">
          <p><strong>Idioma:</strong> {languages.find(l => l.code === selectedLanguage)?.name}</p>
          <p><strong>Tipo:</strong> {emailTypes.find(t => t.key === emailType)?.name}</p>
          <p><strong>Email esperado:</strong> 
            <code className="ml-2 bg-blue-100 px-2 py-1 rounded">
              {getEmailByLanguage(emailType === 'booking_confirmation' ? 'booking' : 'info', selectedLanguage)}
            </code>
          </p>
        </div>
      </div>

      {/* Instruções */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">💡 Como Usar:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>Teste Individual:</strong> Selecione idioma e tipo, clique "Testar Configuração"</li>
          <li>• <strong>Teste Completo:</strong> Clique "Testar Todos os Idiomas" para validação completa</li>
          <li>• <strong>Verificação:</strong> Confirme se os emails retornados estão corretos</li>
          <li>• <strong>Debug:</strong> Use este componente para diagnosticar problemas de configuração</li>
        </ul>
      </div>
    </div>
  );
};

export default EmailTestComponent;