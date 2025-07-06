// frontend/src/services/mockServices.js
// MOCK temporário para testar sem Firebase

export const mockHeroImagesService = {
  getActiveHeroImages: async () => {
    return [
      {
        id: 'mock_1',
        title: { pt: 'Sintra Mágica', en: 'Magical Sintra', es: 'Sintra Mágica' },
        subtitle: { pt: 'Descubra palácios encantados', en: 'Discover enchanted palaces', es: 'Descubre palacios encantados' },
        imageUrl: 'https://images.unsplash.com/photo-1555881400-69e38bb0c85f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        order: 1,
        active: true
      }
    ];
  }
};

export const mockTourFiltersService = {
  getActiveFilters: async () => {
    return [
      { key: 'all', labels: { pt: 'Todos os Tours', en: 'All Tours', es: 'Todos los Tours' }, order: 0, active: true },
      { key: 'gastronomic', labels: { pt: 'Gastronómico', en: 'Gastronomic', es: 'Gastronómico' }, order: 1, active: true },
      { key: 'cultural', labels: { pt: 'Cultural', en: 'Cultural', es: 'Cultural' }, order: 2, active: true },
      { key: 'mixed', labels: { pt: 'Misto', en: 'Mixed', es: 'Mixto' }, order: 3, active: true }
    ];
  },
  
  getDefaultFilters: () => {
    return [
      { key: 'all', labels: { pt: 'Todos os Tours', en: 'All Tours', es: 'Todos los Tours' }, order: 0, active: true },
      { key: 'gastronomic', labels: { pt: 'Gastronómico', en: 'Gastronomic', es: 'Gastronómico' }, order: 1, active: true }
    ];
  }
};