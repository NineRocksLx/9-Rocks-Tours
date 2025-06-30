// frontend/src/components/TourItinerary.js - 100% TRADUZIDO
import React from 'react';
import { useTranslation } from '../utils/useTranslation';

const TourItinerary = ({ tour }) => {
  const { t, getCurrentLanguage } = useTranslation();
  const currentLang = getCurrentLanguage();

  const itineraryText = tour?.route_description?.[currentLang] || tour?.route_description?.pt || '';
  const location = tour?.location || 'Portugal';

  // USAR A MESMA FUNÇÃO DO PREVIEW DO ADMIN - EXATAMENTE IGUAL
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
          title: cleanText || t('itinerary_activity_at', { time }),
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
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            🗓️ {t('itinerary_tour_schedule')}
          </h3>
          <p className="text-gray-600">
            {t('itinerary_duration')}: {tour?.duration_hours || 4} {t('common_hours')} • {tour?.location}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            📋 {t('itinerary_tour_program')}
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
              <span className="text-lg font-bold text-indigo-600 bg-white px-3 py-2 rounded-lg shadow-sm min-w-[80px] text-center">
                10:00
              </span>
              <div className="flex-1">
                <h5 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('itinerary_tour_in')} {location}
                </h5>
                <p className="text-gray-600 italic mb-2">
                  {t('itinerary_unique_experience')}
                </p>
                <div className="text-gray-700 leading-relaxed space-y-1">
                  <div>• {t('itinerary_guided_visit')}</div>
                  <div>• {t('itinerary_local_stories')}</div>
                  <div>• {t('itinerary_photo_time')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calcular duração
  const calculateDuration = (blocks) => {
    if (blocks.length < 2) return `${tour?.duration_hours || 4}h`;
    
    const parseTime = (timeStr) => {
      const cleaned = timeStr.replace('h', ':');
      const [hours, minutes] = cleaned.split(':').map(Number);
      return hours * 60 + (minutes || 0);
    };
    
    try {
      const firstTime = blocks[0].time;
      const lastTime = blocks[blocks.length - 1].time;
      
      const duration = parseTime(lastTime) - parseTime(firstTime) + 60;
      const hours = Math.floor(duration / 60);
      const mins = duration % 60;
      
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    } catch (error) {
      return `${tour?.duration_hours || 4}h`;
    }
  };

  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(location + ', Portugal')}&output=embed`;

  return (
    <div className="w-full">
      {/* Header COM TODAS AS TRADUÇÕES */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              🗓️ {t('itinerary_detailed_schedule')}
            </h3>
            <p className="text-gray-600">
              {finalItinerary.length} {t('itinerary_activities')} • {t('itinerary_duration')}: {calculateDuration(finalItinerary)}
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-gray-600">{t('itinerary_main_stops')}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
              <span className="text-gray-600">{t('itinerary_other_stops')}</span>
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
              ✅ {t('itinerary_detailed_program')} ({finalItinerary.length} {t('itinerary_activities')})
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
              <h4 className="font-semibold text-gray-900">
                📍 {t('itinerary_tour_region')}
              </h4>
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
          
          {/* Informações do Tour COM TODAS AS TRADUÇÕES */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-4">
              ℹ️ {t('itinerary_tour_info')}
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">👥</span>
                <span className="text-gray-700">
                  {t('itinerary_small_group')} ({t('itinerary_max')} {tour?.max_participants || 4} {t('itinerary_people')})
                </span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">🕒</span>
                <span className="text-gray-700">
                  {t('itinerary_duration')}: {tour?.duration_hours || 4} {t('common_hours')}
                </span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">📍</span>
                <span className="text-gray-700">
                  {t('itinerary_meeting_point')}
                </span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">📱</span>
                <span className="text-gray-700">
                  {t('itinerary_whatsapp_contact')}
                </span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">⏰</span>
                <span className="text-gray-700">
                  {t('itinerary_flexible_schedule')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourItinerary;