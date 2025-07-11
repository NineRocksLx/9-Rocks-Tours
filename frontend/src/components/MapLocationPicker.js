import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  gestureHandling: 'cooperative',
  language: 'pt-PT',
  region: 'PT'
};

const PORTUGAL_CENTER = { lat: 39.5, lng: -8.0 };
const PORTUGAL_BOUNDS = {
  north: 42.154,
  south: 36.838,
  east: -6.189,
  west: -9.526
};

const PORTUGAL_CITIES = {
  lisboa: { lat: 38.7223, lng: -9.1393, name: 'Lisboa' },
  porto: { lat: 41.1579, lng: -8.6291, name: 'Porto' },
  coimbra: { lat: 40.2033, lng: -8.4103, name: 'Coimbra' },
  braga: { lat: 41.5518, lng: -8.4219, name: 'Braga' },
  sintra: { lat: 38.8029, lng: -9.3817, name: 'Sintra' },
  cascais: { lat: 38.6967, lng: -9.4206, name: 'Cascais' },
  óbidos: { lat: 39.3605, lng: -9.1567, name: 'Óbidos' },
  evora: { lat: 38.5664, lng: -7.9077, name: 'Évora' }
};

const MapLocationPicker = ({ value = '', onChange, isMapLoaded, mapLoadError }) => {
  const [locations, setLocations] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  
  const geocoderRef = useRef(null);
  const initTimeoutRef = useRef(null);
  const mapRef = useRef(null);
  const lastValueRef = useRef('');
  const updateInProgress = useRef(false);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const parseLocations = useCallback((valueStr) => {
    if (!valueStr || !valueStr.trim()) return [];
    
    try {
      const lines = valueStr.split('\n').filter(line => line.trim() !== '');
      
      return lines.map((line, index) => {
        const parts = line.split(',').map(item => item.trim());
        
        if (parts.length >= 3) {
          const [name, lat, lng] = parts;
          const latitude = parseFloat(lat);
          const longitude = parseFloat(lng);
          
          if (!isNaN(latitude) && !isNaN(longitude) && 
              latitude >= PORTUGAL_BOUNDS.south && latitude <= PORTUGAL_BOUNDS.north &&
              longitude >= PORTUGAL_BOUNDS.west && longitude <= PORTUGAL_BOUNDS.east) {
            return {
              id: `loc-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              name,
              lat: latitude,
              lng: longitude
            };
          }
        }
        return null;
      }).filter(loc => loc !== null);
    } catch (error) {
      return [];
    }
  }, []);

  // Inicializar Google Maps Services - APENAS UMA VEZ
  useEffect(() => {
    if (!isMapLoaded || !window.google || mapsReady) return;

    const initServices = () => {
      try {
        if (window.google.maps.Geocoder && !geocoderRef.current) {
          geocoderRef.current = new window.google.maps.Geocoder();
        }
        setMapsReady(true);
      } catch (error) {
        setSearchError('Erro ao inicializar Google Maps');
      }
    };

    initTimeoutRef.current = setTimeout(initServices, 200);

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [isMapLoaded, mapsReady]);

  // Processar valor inicial APENAS quando realmente muda
  useEffect(() => {
    if (updateInProgress.current || lastValueRef.current === value) return;
    
    lastValueRef.current = value;
    const parsedLocations = parseLocations(value);
    setLocations(parsedLocations);
    
    // Atualizar mapa apenas se necessário
    if (mapRef.current && parsedLocations.length > 0) {
      const avgLat = parsedLocations.reduce((sum, loc) => sum + loc.lat, 0) / parsedLocations.length;
      const avgLng = parsedLocations.reduce((sum, loc) => sum + loc.lng, 0) / parsedLocations.length;
      mapRef.current.panTo({ lat: avgLat, lng: avgLng });
      mapRef.current.setZoom(parsedLocations.length === 1 ? 12 : 8);
    }
  }, [value, parseLocations]);

  // Função para notificar mudanças - CONTROLADA
  const notifyChange = useCallback((newLocations) => {
    if (!onChange || updateInProgress.current) return;
    
    updateInProgress.current = true;
    
    const formattedValue = newLocations.map(loc => 
      `${loc.name}, ${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`
    ).join('\n');

    if (formattedValue !== lastValueRef.current) {
      lastValueRef.current = formattedValue;
      onChange(formattedValue);
    }
    
    // Liberar o lock após um pequeno delay
    setTimeout(() => {
      updateInProgress.current = false;
    }, 50);
  }, [onChange]);

  const addLocation = useCallback((name, lat, lng) => {
    const existingLocation = locations.find(loc => 
      Math.abs(loc.lat - lat) < 0.0001 && Math.abs(loc.lng - lng) < 0.0001
    );

    if (existingLocation) {
      setSearchError('Este local já foi adicionado');
      return;
    }

    const newLocation = {
      id: `loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      lat,
      lng
    };

    const newLocations = [...locations, newLocation];
    setLocations(newLocations);
    setSearchError('');
    
    // Notificar mudança de forma controlada
    setTimeout(() => notifyChange(newLocations), 10);
  }, [locations, notifyChange]);

  const searchPlace = useCallback(async (query) => {
    if (!query.trim() || !geocoderRef.current || !mapsReady) {
      if (!mapsReady) {
        setSearchError('Google Maps ainda não está pronto');
      }
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      const request = {
        address: query,
        componentRestrictions: { country: 'PT' },
        bounds: new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(PORTUGAL_BOUNDS.south, PORTUGAL_BOUNDS.west),
          new window.google.maps.LatLng(PORTUGAL_BOUNDS.north, PORTUGAL_BOUNDS.east)
        )
      };

      geocoderRef.current.geocode(request, (results, status) => {
        setIsSearching(false);
        
        if (status === 'OK' && results && results.length > 0) {
          const result = results[0];
          const location = result.geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          
          if (lat >= PORTUGAL_BOUNDS.south && lat <= PORTUGAL_BOUNDS.north &&
              lng >= PORTUGAL_BOUNDS.west && lng <= PORTUGAL_BOUNDS.east) {
            
            const placeName = result.formatted_address?.split(',')[0] || query;
            addLocation(placeName, lat, lng);
            setSearchInput('');
          } else {
            setSearchError('Local fora de Portugal');
          }
        } else {
          setSearchError('Nenhum local encontrado');
        }
      });
    } catch (error) {
      setSearchError('Erro na pesquisa');
      setIsSearching(false);
    }
  }, [mapsReady, addLocation]);

  const handleMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    if (lat < PORTUGAL_BOUNDS.south || lat > PORTUGAL_BOUNDS.north ||
        lng < PORTUGAL_BOUNDS.west || lng > PORTUGAL_BOUNDS.east) {
      setSearchError('Clique dentro do território português');
      return;
    }
    
    addLocation(`Local ${locations.length + 1}`, lat, lng);
  }, [locations.length, addLocation]);

  const testLocation = useCallback((cityKey) => {
    const coords = PORTUGAL_CITIES[cityKey];
    if (coords) {
      addLocation(coords.name, coords.lat, coords.lng);
    }
  }, [addLocation]);

  const removeLocation = useCallback((locationId) => {
    const newLocations = locations.filter(loc => loc.id !== locationId);
    setLocations(newLocations);
    setSearchError('');
    
    // Notificar mudança de forma controlada
    setTimeout(() => notifyChange(newLocations), 10);
  }, [locations, notifyChange]);

  const editLocationName = useCallback((locationId, newName) => {
    if (!newName.trim()) {
      setSearchError('Nome não pode estar vazio');
      return;
    }
    
    const newLocations = locations.map(loc => 
      loc.id === locationId ? { ...loc, name: newName.trim() } : loc
    );
    
    setLocations(newLocations);
    setSearchError('');
    
    // Notificar mudança de forma controlada
    setTimeout(() => notifyChange(newLocations), 10);
  }, [locations, notifyChange]);

  const clearAllLocations = useCallback(() => {
    if (window.confirm('Tem certeza que deseja remover todas as localizações?')) {
      setLocations([]);
      setSearchError('');
      
      // Notificar mudança de forma controlada
      setTimeout(() => notifyChange([]), 10);
    }
  }, [notifyChange]);

  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      searchPlace(searchInput.trim());
    }
  }, [searchInput, searchPlace]);

  if (mapLoadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">
          <strong>Erro ao carregar Google Maps:</strong> {mapLoadError.message}
        </div>
      </div>
    );
  }

  if (!isMapLoaded) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-blue-800">Carregando Google Maps...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="text-green-800 font-semibold mb-2">Seletor de Localizações - Portugal</h4>
        <ul className="text-green-700 text-sm space-y-1">
          <li>• Pesquise locais específicos em Portugal</li>
          <li>• Clique no mapa para adicionar pontos personalizados</li>
          <li>• Use os botões de teste para cidades principais</li>
        </ul>
      </div>

      <form onSubmit={handleSearchSubmit}>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Ex: Mercado do Bolhão Porto, Palácio da Pena Sintra..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSearching || !mapsReady}
          />
          <button
            type="submit"
            disabled={!searchInput.trim() || isSearching || !mapsReady}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Procurando...' : 'Procurar'}
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        <p className="text-sm text-gray-600 w-full">Teste rápido:</p>
        {Object.entries(PORTUGAL_CITIES).map(([key, city]) => (
          <button
            key={key}
            onClick={() => testLocation(key)}
            disabled={!mapsReady}
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 disabled:opacity-50"
          >
            {city.name}
          </button>
        ))}
      </div>

      {locations.length > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {locations.length} localização{locations.length !== 1 ? 'ões' : ''} adicionada{locations.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={clearAllLocations}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Limpar Tudo
          </button>
        </div>
      )}

      {searchError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <span className="text-yellow-800 text-sm">{searchError}</span>
        </div>
      )}

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={PORTUGAL_CENTER}
        zoom={7}
        options={mapOptions}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
        onClick={handleMapClick}
      >
        {locations.map((location, index) => (
          <MarkerF
            key={location.id}
            position={{ lat: location.lat, lng: location.lng }}
            title={location.name}
            label={{
              text: (index + 1).toString(),
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        ))}
      </GoogleMap>

      {locations.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Localizações ({locations.length})
          </h4>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {locations.map((location, index) => (
              <div key={location.id} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={location.name}
                    onChange={(e) => editLocationName(location.id, e.target.value)}
                    className="flex-1 text-sm border-0 bg-transparent focus:ring-0 p-0 font-medium text-gray-900"
                    placeholder="Nome da localização"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 font-mono">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLocation(location.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {locations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm">Nenhuma localização adicionada ainda</p>
        </div>
      )}
    </div>
  );
};

export default MapLocationPicker;