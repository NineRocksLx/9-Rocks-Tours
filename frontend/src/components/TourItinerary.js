import React from 'react';

const TourItinerary = ({ itinerary, currentLanguage = 'pt' }) => {
  if (!itinerary || !itinerary[currentLanguage] || itinerary[currentLanguage].length === 0) {
    return <p>Itinerário não disponível neste idioma.</p>;
  }

  const stops = itinerary[currentLanguage];

  const getStopIcon = (type) => {
    const icons = { visit: '🏛️', meal: '🍽️', transport: '🚐', activity: '🎯', view: '📸' };
    return icons[type] || '📍';
  };

  return (
    <div className="space-y-6">
      {stops.map((stop, index) => (
        <div key={index} className="relative flex items-start">
          {/* Linha de conexão e ícone */}
          <div className="flex flex-col items-center mr-4">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold z-10">
              {getStopIcon(stop.type)}
            </div>
            {index < stops.length - 1 && (
              <div className="w-px h-full bg-gray-300 mt-2"></div>
            )}
          </div>
          
          {/* Conteúdo da paragem */}
          <div className="pt-1">
            {/* Título com tamanho de texto reduzido */}
            <h4 className="text-base font-semibold text-gray-800">
              {stop.title}
            </h4>
            {/* Duração com tamanho de texto reduzido */}
            <p className="text-sm text-gray-500 mt-1">
              {stop.duration}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TourItinerary;