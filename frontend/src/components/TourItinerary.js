// frontend/src/components/TourItinerary.js - Igual ao Preview do Admin
import React from 'react';

const TourItinerary = ({ tour }) => {
  const getCurrentLanguage = () => localStorage.getItem('9rocks_language') || 'pt';
  const currentLang = getCurrentLanguage();

  const itineraryText = tour?.route_description?.[currentLang] || tour?.route_description?.pt || '';
  const location = tour?.location || 'Portugal';

  // USAR A MESMA FUNÇÃO DO PREVIEW DO ADMIN
  const parseItineraryPreview = (text) => {
    if (!text) return [];
    
    const timeRegex = /(\d{1,2}[:h]\d{2}|\d{1,2}h)/gi;
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    const timeBlocks = [];
    let currentBlock = null;
    
    lines.forEach((line) => {
      const timeMatch = line.match(timeRegex);
      
      if (timeMatch) {
        if (currentBlock) {
          timeBlocks.push(currentBlock);
        }
        
        const time = timeMatch[0].replace('h', ':');
        const cleanText = line.replace(timeRegex, '').replace(':', '').trim();
        
        currentBlock = {
          time: time,
          title: cleanText || `Atividade às ${time}`,
          description: ''
        };
      } else if (currentBlock && line.trim() !== '') {
        // Adicionar linha à descrição
        if (currentBlock.description) {
          currentBlock.description += '\n' + line.trim();
        } else {
          currentBlock.description = line.trim();
        }
      }
    });
    
    if (currentBlock) {
      timeBlocks.push(currentBlock);
    }
    
    return timeBlocks;
  };

  const finalItinerary = parseItineraryPreview(itineraryText);

  // Se não há itinerário, mostrar fallback
  if (finalItinerary.length === 0) {
    return (
      <div className="w-full">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">🗓️ Itinerário por Horários</h3>
          <p className="text-gray-600">1 atividade • Duração: 3-4 horas</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3 w-full">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-6">✅ Programa Detalhado (1 atividade)</h4>
              
              <div className="border-l-4 border-indigo-500 pl-6 py-4">
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-lg font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">10:00</span>
                  <div className="flex-1">
                    <h5 className="text-lg font-semibold text-gray-900 mb-2">Tour em {location}</h5>
                    <p className="text-gray-600 italic mb-3">Experiência única pelos pontos de interesse</p>
                  </div>
                </div>
                <div className="ml-16">
                  <div className="text-gray-700 leading-relaxed">
                    Visita guiada pelos principais locais<br/>
                    Histórias e curiosidades locais<br/>
                    Tempo para fotografias
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-1/3 w-full">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-4">⏰ Resumo dos Horários (1)</h4>
              <div className="flex items-start justify-between py-2">
                <span className="font-medium text-indigo-600">10:00</span>
                <span className="text-gray-700 text-right text-xs">Tour em {location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calcular duração
  const calculateDuration = (blocks) => {
    if (blocks.length < 2) return '3-4 horas';
    
    const parseTime = (timeStr) => {
      const cleaned = timeStr.replace('h', ':');
      const [hours, minutes] = cleaned.split(':').map(Number);
      return hours * 60 + (minutes || 0);
    };
    
    const firstTime = blocks[0].time;
    const lastTime = blocks[blocks.length - 1].time;
    
    const duration = parseTime(lastTime) - parseTime(firstTime) + 60;
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(location + ', Portugal')}&output=embed`;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">🗓️ Itinerário por Horários</h3>
            <p className="text-gray-600">{finalItinerary.length} atividades • Duração: {calculateDuration(finalItinerary)}</p>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Paradas principais</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
              <span className="text-gray-600">Outras paradas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Layout Principal */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Coluna Itinerário */}
        <div className="lg:w-2/3 w-full">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-900 mb-6">
              ✅ Programa Detalhado ({finalItinerary.length} atividades)
            </h4>
            
            {/* FORMATO EXATO DO PREVIEW DO ADMIN */}
            <div className="space-y-6">
              {finalItinerary.map((block, index) => (
                <div key={index} className="mb-4">
                  <div className="flex items-start gap-3">
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-sm min-w-[50px] text-center">
                      {block.time}
                    </span>
                    <div className="flex-1">
                      <span className="text-gray-800 font-medium">
                        {block.title}
                      </span>
                      {block.description && (
                        <div className="mt-2 text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                          {block.description}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Separador entre blocos */}
                  {index < finalItinerary.length - 1 && (
                    <div className="mt-4 pt-4 border-b border-gray-100"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna Lateral */}
        <div className="lg:w-1/3 w-full space-y-6">
          {/* Mapa */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-semibold text-gray-900">📍 Região do Tour</h4>
            </div>
            <div className="h-64">
              <iframe 
                src={mapSrc} 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                title={`Mapa de ${location}`}
              ></iframe>
            </div>
          </div>
          
          {/* Resumo dos horários */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-4">
              ⏰ Resumo dos Horários ({finalItinerary.length})
            </h4>
            <div className="space-y-2 text-sm">
              {finalItinerary.map((block, index) => (
                <div key={index} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <span className="font-medium text-indigo-600 mr-3 flex-shrink-0">
                    {block.time}
                  </span>
                  <span className="text-gray-700 text-right text-xs leading-tight">
                    {block.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Informações do Tour */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-4">ℹ️ Informações do Tour</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">👥</span>
                <span className="text-gray-700">Grupo pequeno (máx. {tour?.max_participants || 4} pessoas)</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">🕒</span>
                <span className="text-gray-700">Duração: {tour?.duration_hours || 4} horas</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">📍</span>
                <span className="text-gray-700">Ponto de encontro confirmado 24h antes</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">📱</span>
                <span className="text-gray-700">Guia contactável via WhatsApp</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">⏰</span>
                <span className="text-gray-700">Horários flexíveis conforme ritmo do grupo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourItinerary;