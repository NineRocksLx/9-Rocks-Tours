import React from 'react';

const TourItinerary = ({ itineraryText, location }) => {
  // Divide o texto do itinerário em passos individuais por cada quebra de linha
  const itinerarySteps = itineraryText?.split('\n').filter(step => step.trim() !== '') || [];

  // Gera um URL para incorporar o Google Maps. Usa a localização do tour.
  const mapSrc = `https://maps.google.com/maps?q=${encodeURI(location)}&output=embed`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Coluna do Itinerário (Timeline) */}
      <div className="lg:col-span-3">
        <div className="relative border-l-2 border-indigo-200 ml-4 py-4">
          {itinerarySteps.length > 0 ? (
            itinerarySteps.map((step, index) => (
              <div key={index} className="mb-8 pl-10 relative">
                {/* Ponto na timeline */}
                <div className="absolute -left-4 top-1 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold ring-8 ring-gray-50">
                  {index + 1}
                </div>
                
                {/* Conteúdo do passo */}
                <div>
                  <p className="text-gray-800 leading-relaxed">
                    {step}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="pl-10">
              <p className="text-gray-500">O itinerário detalhado para este tour não está disponível de momento.</p>
            </div>
          )}
        </div>
      </div>

      {/* Coluna do Mapa */}
      <div className="lg:col-span-2">
        <div className="sticky top-24">
          <div className="rounded-xl overflow-hidden shadow-lg h-96 lg:h-[500px]">
            <iframe
              src={mapSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Mapa de ${location}`}
            ></iframe>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            O mapa mostra a região geral do tour. O ponto de encontro exato será fornecido após a reserva.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TourItinerary;