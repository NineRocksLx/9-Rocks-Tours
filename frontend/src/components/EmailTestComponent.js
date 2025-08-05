import React, { useState } from 'react';
import { getEmailByLanguage, generateEmailConfig, trackEmailEvent, EMAIL_TEMPLATES } from '../config/emailConfig';

const EmailTestComponent = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('pt');
  const [emailType, setEmailType] = useState('booking_confirmation');
  const [testResults, setTestResults] = useState([]);
  // Novos estados para estratégia de reservas
  const [bookingStrategy, setBookingStrategy] = useState({
    customerName: '',
    tourName: '',
    tourDate: '',
    enabled: false
  });
  const [scheduledEmails, setScheduledEmails] = useState([]);

  const languages = [
    { code: 'pt', name: 'Português 🇵🇹', flag: '🇵🇹' },
    { code: 'en', name: 'English 🇬🇧', flag: '🇬🇧' },
    { code: 'es', name: 'Español 🇪🇸', flag: '🇪🇸' }
  ];

  const emailTypes = [
    { key: 'booking_confirmation', name: 'Confirmação de Reserva', icon: '📧' },
    { key: 'booking_reminder', name: 'Lembrete de Tour (véspera)', icon: '🎒' },
    { key: 'contact_form', name: 'Formulário de Contacto', icon: 'ℹ️' },
    { key: 'tour_inquiry', name: 'Consulta de Tour', icon: '🎯' }
  ];

  // Templates para estratégia de reservas (usando a estrutura do emailConfig.js)
  const bookingSequenceTemplates = {
    pt: {
      confirmation: {
        subject: 'Obrigado por escolher a 9 Rocks Tours! 🌟',
        from: 'reserva@9rocks.pt',
        content: `Olá {{customerName}},

Muito obrigado por ter escolhido a 9 Rocks Tours para a sua aventura!

Estamos verdadeiramente entusiasmados por poder proporcionar-lhe uma experiência única e memorável no {{tourName}} marcado para {{tourDate}}.

A nossa equipa está já a preparar tudo nos mínimos detalhes para garantir que este tour seja inesquecível. Iremos contactá-lo brevemente com mais informações sobre o ponto de encontro e preparativos.

Para qualquer dúvida, pode contactar-nos:
📧 Email: reserva@9rocks.pt
📞 Telefone: +351 XXX XXX XXX

Até breve!
Equipa 9 Rocks Tours 🏔️`,
        delay: 25 // minutos após reserva
      },
      reminder: {
        subject: 'Amanhã é o grande dia! Preparações para o {{tourName}} 🎒',
        from: 'tours@9rocks.pt',
        content: `Olá {{customerName}},

Esperamos que esteja tão entusiasmado quanto nós para o {{tourName}} de amanhã!

📍 **Ponto de Encontro:** 
Vamos combinar o local exato por telefone ainda hoje. Pode contactar-nos através do +351 XXX XXX XXX.

👕 **O que vestir:**
- Roupa confortável e adequada ao clima
- Calçado antiderrapante (muito importante!)
- Casaco impermeável (por precaução)
- Protetor solar e chapéu

🎒 **O que levar:**
- Água (1.5L mínimo)
- Snacks energéticos
- Máquina fotográfica
- Espírito de aventura!

📞 **Contactos de emergência:**
- Email: tours@9rocks.pt
- Telefone: +351 XXX XXX XXX

Estamos ansiosos por esta aventura convosco!

Equipa 9 Rocks Tours 🌟`,
        delay: -24 // 24 horas antes
      }
    },
    en: {
      confirmation: {
        subject: 'Thank you for choosing 9 Rocks Tours! 🌟',
        from: 'booking@9rocks.pt',
        content: `Hello {{customerName}},

Thank you so much for choosing 9 Rocks Tours for your adventure!

We are truly excited to provide you with a unique and memorable experience on the {{tourName}} scheduled for {{tourDate}}.

Our team is already preparing everything down to the smallest detail to ensure this tour is unforgettable. We will contact you shortly with more information about the meeting point and preparations.

For any questions, you can contact us:
📧 Email: booking@9rocks.pt
📞 Phone: +351 XXX XXX XXX

See you soon!
9 Rocks Tours Team 🏔️`,
        delay: 25
      },
      reminder: {
        subject: 'Tomorrow is the big day! Preparations for {{tourName}} 🎒',
        from: 'tours-en@9rocks.pt',
        content: `Hello {{customerName}},

We hope you're as excited as we are for tomorrow's {{tourName}}!

📍 **Meeting Point:** 
We'll arrange the exact location by phone today. You can contact us at +351 XXX XXX XXX.

👕 **What to wear:**
- Comfortable weather-appropriate clothing
- Non-slip footwear (very important!)
- Waterproof jacket (just in case)
- Sunscreen and hat

🎒 **What to bring:**
- Water (1.5L minimum)
- Energy snacks
- Camera
- Spirit of adventure!

📞 **Emergency contacts:**
- Email: tours-en@9rocks.pt
- Phone: +351 XXX XXX XXX

We're looking forward to this adventure with you!

9 Rocks Tours Team 🌟`,
        delay: -24
      }
    },
    es: {
      confirmation: {
        subject: '¡Gracias por elegir 9 Rocks Tours! 🌟',
        from: 'reservas@9rocks.pt',
        content: `Hola {{customerName}},

¡Muchas gracias por elegir 9 Rocks Tours para tu aventura!

Estamos realmente emocionados de poder brindarte una experiencia única e inolvidable en el {{tourName}} programado para {{tourDate}}.

Nuestro equipo ya está preparando todo hasta el mínimo detalle para garantizar que este tour sea inolvidable. Te contactaremos pronto con más información sobre el punto de encuentro y preparativos.

Para cualquier consulta, puedes contactarnos:
📧 Email: reservas@9rocks.pt
📞 Teléfono: +351 XXX XXX XXX

¡Hasta pronto!
Equipo 9 Rocks Tours 🏔️`,
        delay: 25
      },
      reminder: {
        subject: '¡Mañana es el gran día! Preparativos para {{tourName}} 🎒',
        from: 'tours-es@9rocks.pt',
        content: `Hola {{customerName}},

¡Esperamos que estés tan emocionado como nosotros para el {{tourName}} de mañana!

📍 **Punto de Encuentro:** 
Coordinaremos el lugar exacto por teléfono hoy. Puedes contactarnos al +351 XXX XXX XXX.

👕 **Qué ponerse:**
- Ropa cómoda y adecuada al clima
- Calzado antideslizante (¡muy importante!)
- Chaqueta impermeable (por precaución)
- Protector solar y sombrero

🎒 **Qué llevar:**
- Agua (1.5L mínimo)
- Snacks energéticos
- Cámara fotográfica
- ¡Espíritu de aventura!

📞 **Contactos de emergencia:**
- Email: tours-es@9rocks.pt
- Teléfono: +351 XXX XXX XXX

¡Estamos ansiosos por esta aventura contigo!

Equipo 9 Rocks Tours 🌟`,
        delay: -24
      }
    }
  };

  const testEmailConfig = () => {
    const timestamp = new Date().toLocaleTimeString();
    
    try {
      // 1. Testar obtenção de email por idioma usando sua função
      const emailAddress = getEmailByLanguage(emailType === 'booking_confirmation' ? 'booking' : 'info', selectedLanguage);
      
      // 2. Gerar configuração completa usando sua função
      const config = generateEmailConfig(emailType, selectedLanguage, {
        to: 'teste@example.com',
        subject: `Teste de Email - ${emailTypes.find(t => t.key === emailType)?.name}`
      });

      // 3. Simular tracking usando sua função
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
          priority: config?.priority,
          autoReply: config?.autoReply
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

  // Nova função para testar estratégia de reservas
  const testBookingStrategy = () => {
    if (!bookingStrategy.customerName || !bookingStrategy.tourName || !bookingStrategy.tourDate) {
      alert('Preencha todos os campos da estratégia de reserva');
      return;
    }

    const templates = bookingSequenceTemplates[selectedLanguage];
    const now = new Date();
    const tourDate = new Date(bookingStrategy.tourDate);
    
    // Processar templates
    const processTemplate = (template) => ({
      subject: template.subject.replace(/\{\{(\w+)\}\}/g, (match, key) => bookingStrategy[key] || match),
      content: template.content.replace(/\{\{(\w+)\}\}/g, (match, key) => bookingStrategy[key] || match),
      from: template.from,
      delay: template.delay
    });

    const confirmationEmail = processTemplate(templates.confirmation);
    const reminderEmail = processTemplate(templates.reminder);

    // Calcular horários
    const confirmationTime = new Date(now.getTime() + (confirmationEmail.delay * 60000));
    const reminderTime = new Date(tourDate.getTime() + (reminderEmail.delay * 60 * 60000));

    const emailsScheduled = [
      {
        type: 'confirmation',
        scheduledFor: confirmationTime,
        template: confirmationEmail,
        status: 'agendado',
        language: selectedLanguage
      },
      {
        type: 'reminder',
        scheduledFor: reminderTime,
        template: reminderEmail,
        status: 'agendado',
        language: selectedLanguage
      }
    ];

    setScheduledEmails(prev => [...emailsScheduled, ...prev]);

    // Adicionar aos resultados de teste
    const result = {
      timestamp: new Date().toLocaleTimeString(),
      language: selectedLanguage,
      type: 'booking_strategy',
      success: true,
      strategy: 'Emails sequenciais de reserva',
      emailsScheduled: emailsScheduled.length,
      details: {
        customer: bookingStrategy.customerName,
        tour: bookingStrategy.tourName,
        tourDate: bookingStrategy.tourDate,
        confirmationDelay: '25 minutos',
        reminderTiming: 'Véspera do tour',
        confirmationFrom: confirmationEmail.from,
        reminderFrom: reminderEmail.from
      }
    };

    setTestResults(prev => [result, ...prev.slice(0, 4)]);

    // Track usando sua função
    trackEmailEvent('booking_strategy', selectedLanguage, {
      emails_scheduled: emailsScheduled.length,
      tour_name: bookingStrategy.tourName
    });
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
    setScheduledEmails([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          🧪 Teste de Configuração de Emails
        </h2>
        <p className="text-gray-600 mt-2">
          Teste a configuração de emails personalizados por idioma e estratégia de reservas
        </p>
      </div>

      {/* Toggle para Estratégia de Reservas */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={bookingStrategy.enabled}
            onChange={(e) => setBookingStrategy(prev => ({...prev, enabled: e.target.checked}))}
            className="w-5 h-5 text-blue-600 mr-3"
          />
          <span className="text-lg font-semibold text-gray-900">
            📧 Ativar Estratégia de Emails Sequenciais para Reservas
          </span>
        </label>
        <p className="text-sm text-gray-600 mt-1 ml-8">
          Sistema de emails personalizados: confirmação (25 min) + lembrete (véspera)
        </p>
      </div>

      {/* Campos para Estratégia de Reservas */}
      {bookingStrategy.enabled && (
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Dados da Reserva para Teste:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome do Cliente:
              </label>
              <input
                type="text"
                value={bookingStrategy.customerName}
                onChange={(e) => setBookingStrategy(prev => ({...prev, customerName: e.target.value}))}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Ex: João Silva"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome do Tour:
              </label>
              <input
                type="text"
                value={bookingStrategy.tourName}
                onChange={(e) => setBookingStrategy(prev => ({...prev, tourName: e.target.value}))}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Ex: Levada do Caldeirão Verde"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Data do Tour:
              </label>
              <input
                type="date"
                value={bookingStrategy.tourDate}
                onChange={(e) => setBookingStrategy(prev => ({...prev, tourDate: e.target.value}))}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

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

        {bookingStrategy.enabled && (
          <button
            onClick={testBookingStrategy}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            📧 Testar Estratégia de Reserva
          </button>
        )}
        
        <button
          onClick={clearResults}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
        >
          🗑️ Limpar Resultados
        </button>
      </div>

      {/* Emails Agendados */}
      {scheduledEmails.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Emails Agendados:</h3>
          <div className="space-y-3">
            {scheduledEmails.slice(0, 6).map((email, index) => (
              <div key={index} className="p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">
                      {email.type === 'confirmation' ? '✅' : '🎒'}
                    </span>
                    <div>
                      <span className="font-semibold">
                        {email.type === 'confirmation' ? 'Confirmação' : 'Lembrete'}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        ({languages.find(l => l.code === email.language)?.flag} {email.language.toUpperCase()})
                      </span>
                      <br />
                      <span className="text-xs text-blue-600">
                        📧 {email.template.from}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-700">
                      {email.scheduledFor.toLocaleDateString('pt-PT')} às {email.scheduledFor.toLocaleTimeString('pt-PT', {hour: '2-digit', minute: '2-digit'})}
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {email.status}
                    </span>
                  </div>
                </div>
                
                {/* Preview do email */}
                <div className="mt-3 p-2 bg-white rounded border text-xs">
                  <div className="font-semibold text-gray-700 mb-1">
                    📧 {email.template.subject}
                  </div>
                  <div className="text-gray-600 line-clamp-3">
                    {email.template.content.substring(0, 150)}...
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                        {result.type === 'booking_strategy' ? result.strategy : emailTypes.find(t => t.key === result.type)?.name}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{result.timestamp}</span>
                </div>

                {result.success ? (
                  <div className="space-y-2">
                    {result.type === 'booking_strategy' ? (
                      <div className="text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="font-semibold text-gray-700">Cliente:</span>
                            <br />
                            <span>{result.details?.customer}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Tour:</span>
                            <br />
                            <span>{result.details?.tour}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Emails Agendados:</span>
                            <br />
                            <span>{result.emailsScheduled}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Timing:</span>
                            <br />
                            <span>{result.details?.confirmationDelay} / {result.details?.reminderTiming}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
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
                    )}
                    {result.details?.subject && (
                      <div className="mt-3">
                        <span className="font-semibold text-gray-700">Subject:</span>
                        <br />
                        <div className="bg-white p-2 rounded border">
                          {result.details?.subject}
                        </div>
                      </div>
                    )}
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

      {/* Status da Configuração Atual */}
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
          <li>• <strong>Estratégia de Reserva:</strong> Ative o toggle e teste emails sequenciais personalizados</li>
          <li>• <strong>Verificação:</strong> Confirme se os emails retornados estão corretos</li>
          <li>• <strong>Debug:</strong> Use este componente para diagnosticar problemas de configuração</li>
        </ul>
      </div>
    </div>
  );
};

export default EmailTestComponent;