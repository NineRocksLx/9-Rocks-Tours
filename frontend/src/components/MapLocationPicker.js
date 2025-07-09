import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem',
  border: '1px solid #e2e8f0'
};

const mapOptions = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  zoomControl: true,
  gestureHandling: 'cooperative'
};

// Coordenadas de Lisboa, Portugal
const LISBOA_CENTER = { lat: 38.7223, lng: -9.1393 };
const DEFAULT_ZOOM = 7; // Zoom adequado para mostrar Portugal

const MapLocationPicker = ({ value = '', onChange, isLoaded, loadError }) => {
  const [locations, setLocations] = useState([]);
  const [mapCenter, setMapCenter] = useState(LISBOA_CENTER);
  const autocompleteRef = useRef(null);

  // Carrega localizações do valor inicial
  useEffect(() => {
    if (value) {
      const parsedLocations = value.split('\n').map(line => {
        const [name, lat, lng] = line.split(', ');
        return {
          id: `loc-${Math.random().toString(36).substr(2, 9)}`,
          name,
          lat: parseFloat(lat),
          lng: parseFloat(lng)
        };
      }).filter(loc => !isNaN(loc.lat) && !isNaN(loc.lng));
      
      setLocations(parsedLocations);
      
      // Se existem localizações, centra no primeiro local, senão mantém Lisboa
      if (parsedLocations.length > 0) {
        setMapCenter({ lat: parsedLocations[0].lat, lng: parsedLocations[0].lng });
      }
    }
  }, [value]);

  // Atualiza o valor quando as localizações mudam
  useEffect(() => {
    const formattedValue = locations
      .map(loc => `${loc.name}, ${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`)
      .join('\n');
    onChange(formattedValue);
  }, [locations, onChange]);

  // Configura o autocomplete quando o mapa carrega
  useEffect(() => {
    if (isLoaded && !autocompleteRef.current) {
      const input = document.getElementById('place-search-input');
      if (input) {
        const autocomplete = new window.google.maps.places.Autocomplete(input, {
          fields: ['place_id', 'name', 'geometry'],
          types: ['establishment', 'geocode'],
          componentRestrictions: { country: 'pt' } // Restringir a Portugal
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) {
            console.log('Local não encontrado');
            return;
          }
          
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const newLocation = {
            id: `loc-${Date.now()}`,
            name: place.name || `Local ${locations.length + 1}`,
            lat,
            lng
          };
          
          setLocations(prev => [...prev, newLocation]);
          setMapCenter({ lat, lng });
        });

        autocompleteRef.current = autocomplete;
      }
    }
  }, [isLoaded, locations.length]);

  // Adiciona marcador ao clicar no mapa
  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    const newLocation = {
      id: `loc-${Date.now()}`,
      name: `Local ${locations.length + 1}`,
      lat,
      lng
    };
    setLocations(prev => [...prev, newLocation]);
  };

  // Remove localização
  const removeLocation = (locationId) => {
    setLocations(prev => prev.filter(loc => loc.id !== locationId));
  };

  // Edita nome da localização
  const editLocationName = (locationId, newName) => {
    setLocations(prev => prev.map(loc => 
      loc.id === locationId ? { ...loc, name: newName } : loc
    ));
  };

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="text-red-800 font-bold">❌ Erro ao carregar o Google Maps</h4>
        <p className="text-red-600 text-sm mt-2">
          Verifique a chave da API e as configurações no Google Cloud Console.
        </p>
        <p className="text-red-600 text-xs mt-1">
          Detalhes: {loadError.message || JSON.stringify(loadError)}
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-blue-800">Carregando mapa...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Campo de pesquisa */}
      <div className="relative">
        <input
          id="place-search-input"
          type="text"
          placeholder="Pesquisar local em Portugal (ex: Castelo da Pena, Sintra)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Mapa */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={DEFAULT_ZOOM}
        options={mapOptions}
        onClick={handleMapClick}
      >
        {locations.map((location, index) => (
          <MarkerF
            key={location.id}
            position={{ lat: location.lat, lng: location.lng }}
            title={location.name}
            label={(index + 1).toString()}
          />
        ))}
      </GoogleMap>

      {/* Lista de localizações */}
      {locations.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Localizações Selecionadas ({locations.length})
          </h4>
          <div className="space-y-2">
            {locations.map((location, index) => (
              <div key={location.id} className="flex items-center justify-between bg-white p-3 rounded-md">
                <div className="flex items-center space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={location.name}
                    onChange={(e) => editLocationName(location.id, e.target.value)}
                    className="flex-1 text-sm border-0 bg-transparent focus:ring-0 p-0"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </span>
                  <button
                    onClick={() => removeLocation(location.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remover localização"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            💡 Dica: Clique no mapa para adicionar mais localizações ou use a pesquisa acima
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLocationPicker;