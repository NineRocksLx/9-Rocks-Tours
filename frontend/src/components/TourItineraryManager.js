import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';

const TourItineraryManager = () => {
  const [tours, setTours] = useState([]);
  const [selectedTour, setSelectedTour] = useState(null);
  const [itinerary, setItinerary] = useState({
    pt: [],
    en: [],
    es: []
  });
  const [activeLanguage, setActiveLanguage] = useState('pt');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carregar tours disponíveis
  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'tours'));
      const toursData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTours(toursData);
    } catch (error) {
      console.error('Erro ao carregar tours:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar itinerário do tour selecionado
  const loadTourItinerary = async (tourId) => {
    try {
      setLoading(true);
      const tourDoc = await getDoc(doc(db, 'tours', tourId));
      
      if (tourDoc.exists()) {
        const tourData = tourDoc.data();
        const existingItinerary = tourData.itinerary || {
          pt: [],
          en: [],
          es: []
        };
        
        setItinerary(existingItinerary);
        setSelectedTour({ id: tourId, ...tourData });
      }
    } catch (error) {
      console.error('Erro ao carregar itinerário:', error);
    } finally {
      setLoading(false);
    }
  };

  // Criar template de paragem
  const createStopTemplate = () => ({
    stop: itinerary[activeLanguage].length + 1,
    title: '',
    duration: '30 min',
    description: '',
    transport: 'Van',
    transport_duration: '15 min',
    type: 'visit', // 'visit', 'meal', 'transport', 'activity'
    coordinates: { lat: 0, lng: 0 },
    optional_cost: false,
    cost_description: ''
  });

  // Adicionar nova paragem
  const addStop = () => {
    const newStop = createStopTemplate();
    setItinerary(prev => ({
      ...prev,
      [activeLanguage]: [...prev[activeLanguage], newStop]
    }));
  };

  // Remover paragem
  const removeStop = (index) => {
    setItinerary(prev => ({
      ...prev,
      [activeLanguage]: prev[activeLanguage].filter((_, i) => i !== index)
        .map((stop, i) => ({ ...stop, stop: i + 1 })) // Renumerar
    }));
  };

  // Atualizar paragem
  const updateStop = (index, field, value) => {
    setItinerary(prev => ({
      ...prev,
      [activeLanguage]: prev[activeLanguage].map((stop, i) => 
        i === index ? { ...stop, [field]: value } : stop
      )
    }));
  };

  // Mover paragem para cima/baixo
  const moveStop = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= itinerary[activeLanguage].length) return;

    const newStops = [...itinerary[activeLanguage]];
    [newStops[index], newStops[newIndex]] = [newStops[newIndex], newStops[index]];
    
    // Renumerar as paragens
    newStops.forEach((stop, i) => {
      stop.stop = i + 1;
    });

    setItinerary(prev => ({
      ...prev,
      [activeLanguage]: newStops
    }));
  };

  // Copiar de outro idioma
  const copyFromLanguage = (fromLang) => {
    if (!itinerary[fromLang] || itinerary[fromLang].length === 0) {
      alert(`Não há dados em ${fromLang} para copiar`);
      return;
    }

    const translationMap = {
      'pt-en': {
        'Van': 'Van',
        'A pé': 'Walking',
        'Visita': 'Visit',
        'Refeição': 'Meal',
        'Atividade': 'Activity'
      },
      'pt-es': {
        'Van': 'Furgoneta',
        'A pé': 'Caminando',
        'Visita': 'Visita',
        'Refeição': 'Comida',
        'Atividade': 'Actividad'
      }
    };

    const copiedStops = itinerary[fromLang].map(stop => ({
      ...stop,
      title: `[TRADUZIR] ${stop.title}`,
      description: `[TRADUZIR] ${stop.description}`,
      transport: translationMap[`${fromLang}-${activeLanguage}`]?.[stop.transport] || stop.transport
    }));

    setItinerary(prev => ({
      ...prev,
      [activeLanguage]: copiedStops
    }));
  };

  // Salvar itinerário
  const saveItinerary = async () => {
    if (!selectedTour) {
      alert('Seleciona um tour primeiro');
      return;
    }

    try {
      setSaving(true);
      const tourRef = doc(db, 'tours', selectedTour.id);
      
      await updateDoc(tourRef, {
        itinerary: itinerary,
        updated_at: new Date()
      });

      alert('Itinerário salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar itinerário');
    } finally {
      setSaving(false);
    }
  };

  // Função para obter ícone baseado no tipo
  const getStopIcon = (type) => {
    const icons = {
      visit: '🏛️',
      meal: '🍽️',
      transport: '🚐',
      activity: '🎯',
      view: '📸'
    };
    return icons[type] || '📍';
  };

  // Função para obter cor baseada no tipo
  const getStopColor = (type) => {
    const colors = {
      visit: 'bg-blue-100 border-blue-300',
      meal: 'bg-orange-100 border-orange-300',
      transport: 'bg-gray-100 border-gray-300',
      activity: 'bg-green-100 border-green-300',
      view: 'bg-purple-100 border-purple-300'
    };
    return colors[type] || 'bg-gray-100 border-gray-300';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🗺️ Gestor de Itinerários
          </h2>
          
          {/* Seletor de Tour */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Tour:
            </label>
            <select
              value={selectedTour?.id || ''}
              onChange={(e) => e.target.value && loadTourItinerary(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Escolhe um tour...</option>
              {tours.map(tour => (
                <option key={tour.id} value={tour.id}>
                  {tour.name?.pt || `Tour ${tour.id}`}
                </option>
              ))}
            </select>
          </div>

          {selectedTour && (
            <>
              {/* Seletor de Idioma */}
              <div className="mb-6">
                <div className="flex space-x-2">
                  {['pt', 'en', 'es'].map(lang => (
                    <button
                      key={lang}
                      onClick={() => setActiveLanguage(lang)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeLanguage === lang
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {lang.toUpperCase()}
                      {itinerary[lang]?.length > 0 && (
                        <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                          {itinerary[lang].length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Botões de Cópia */}
                <div className="mt-3 flex gap-2">
                  {['pt', 'en', 'es'].filter(lang => lang !== activeLanguage).map(lang => (
                    <button
                      key={lang}
                      onClick={() => copyFromLanguage(lang)}
                      disabled={!itinerary[lang] || itinerary[lang].length === 0}
                      className="text-sm px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Copiar de {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {selectedTour && (
          <div className="p-6">
            {/* Lista de Paragens */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Paragens do Itinerário ({activeLanguage.toUpperCase()})
                </h3>
                <button
                  onClick={addStop}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ➕ Adicionar Paragem
                </button>
              </div>

              {itinerary[activeLanguage].length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="text-gray-500 text-lg mb-4">🗺️</div>
                  <p className="text-gray-600">Nenhuma paragem criada ainda</p>
                  <button
                    onClick={addStop}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Criar Primeira Paragem
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {itinerary[activeLanguage].map((stop, index) => (
                    <div
                      key={index}
                      className={`border-2 rounded-lg p-4 ${getStopColor(stop.type)}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full border-2 border-gray-300 font-bold text-sm">
                            {stop.stop}
                          </div>
                          <span className="text-2xl">{getStopIcon(stop.type)}</span>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => moveStop(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                          >
                            ⬆️
                          </button>
                          <button
                            onClick={() => moveStop(index, 'down')}
                            disabled={index === itinerary[activeLanguage].length - 1}
                            className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                          >
                            ⬇️
                          </button>
                          <button
                            onClick={() => removeStop(index)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Título */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Título da Paragem:
                          </label>
                          <input
                            type="text"
                            value={stop.title}
                            onChange={(e) => updateStop(index, 'title', e.target.value)}
                            placeholder="Ex: Castelo de Chambord"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Tipo de Paragem */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo:
                          </label>
                          <select
                            value={stop.type}
                            onChange={(e) => updateStop(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="visit">🏛️ Visita</option>
                            <option value="meal">🍽️ Refeição</option>
                            <option value="activity">🎯 Atividade</option>
                            <option value="view">📸 Miradouro</option>
                            <option value="transport">🚐 Transporte</option>
                          </select>
                        </div>

                        {/* Duração */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duração:
                          </label>
                          <input
                            type="text"
                            value={stop.duration}
                            onChange={(e) => updateStop(index, 'duration', e.target.value)}
                            placeholder="Ex: 1h 30min"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Transporte */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Transporte até aqui:
                          </label>
                          <select
                            value={stop.transport}
                            onChange={(e) => updateStop(index, 'transport', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Van">🚐 Van</option>
                            <option value="A pé">🚶 A pé</option>
                            <option value="Barco">⛵ Barco</option>
                            <option value="Comboio">🚂 Comboio</option>
                          </select>
                        </div>
                      </div>

                      {/* Descrição */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descrição:
                        </label>
                        <textarea
                          value={stop.description}
                          onChange={(e) => updateStop(index, 'description', e.target.value)}
                          placeholder="Descreve o que os visitantes vão fazer/ver nesta paragem..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Custo Opcional */}
                      <div className="mt-4 flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={stop.optional_cost}
                            onChange={(e) => updateStop(index, 'optional_cost', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Custo adicional</span>
                        </label>
                        
                        {stop.optional_cost && (
                          <input
                            type="text"
                            value={stop.cost_description || ''}
                            onChange={(e) => updateStop(index, 'cost_description', e.target.value)}
                            placeholder="Ex: Entrada €15 (não incluído)"
                            className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            {selectedTour && (
              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Total de paragens: {itinerary[activeLanguage].length}
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setItinerary({ pt: [], en: [], es: [] });
                      setSelectedTour(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    onClick={saveItinerary}
                    disabled={saving || itinerary[activeLanguage].length === 0}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? 'A guardar...' : '💾 Guardar Itinerário'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TourItineraryManager;