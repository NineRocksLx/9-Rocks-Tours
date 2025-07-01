// frontend/src/services/tourFiltersService.js
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

class TourFiltersService {
  constructor() {
    this.collectionName = 'tourFilters';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // Cache inteligente
  _getCacheKey(method, params = '') {
    return `${method}_${params}`;
  }

  _isCacheValid(cacheEntry) {
    return Date.now() - cacheEntry.timestamp < this.cacheTimeout;
  }

  _setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  _getCache(key) {
    const cacheEntry = this.cache.get(key);
    if (cacheEntry && this._isCacheValid(cacheEntry)) {
      return cacheEntry.data;
    }
    this.cache.delete(key);
    return null;
  }

  // Filtros padrão (fallback)
  getDefaultFilters() {
    return [
      {
        id: 'all',
        key: 'all',
        labels: {
          pt: 'Todos os Tours',
          en: 'All Tours', 
          es: 'Todos los Tours'
        },
        order: 0,
        active: true,
        isDefault: true
      },
      {
        id: 'gastronomic',
        key: 'gastronomic',
        labels: {
          pt: 'Gastronómico',
          en: 'Gastronomic',
          es: 'Gastronómico'
        },
        order: 1,
        active: true,
        isDefault: true
      },
      {
        id: 'cultural',
        key: 'cultural', 
        labels: {
          pt: 'Cultural',
          en: 'Cultural',
          es: 'Cultural'
        },
        order: 2,
        active: true,
        isDefault: true
      },
      {
        id: 'mixed',
        key: 'mixed',
        labels: {
          pt: 'Misto',
          en: 'Mixed',
          es: 'Mixto'
        },
        order: 3,
        active: true,
        isDefault: true
      }
    ];
  }

  // Buscar filtros ativos (para homepage)
  async getActiveFilters() {
    const cacheKey = this._getCacheKey('getActiveFilters');
    const cached = this._getCache(cacheKey);
    if (cached) {
      console.log('Retornando filtros do cache');
      return cached;
    }

    try {
      console.log('Buscando filtros do Firestore...');
      
      const q = query(
        collection(db, this.collectionName),
        where('active', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const filters = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        filters.push({
          id: doc.id,
          ...data
        });
      });

      // Se não há filtros no Firestore, usar padrão
      if (filters.length === 0) {
        console.log('Nenhum filtro encontrado, usando padrão');
        const defaultFilters = this.getDefaultFilters();
        this._setCache(cacheKey, defaultFilters);
        return defaultFilters;
      }

      // Ordenar por ordem
      filters.sort((a, b) => (a.order || 0) - (b.order || 0));

      console.log(`${filters.length} filtros encontrados`);
      this._setCache(cacheKey, filters);
      
      return filters;
    } catch (error) {
      console.error('Erro ao buscar filtros, usando padrão:', error);
      return this.getDefaultFilters();
    }
  }

  // Buscar todos os filtros (para admin)
  async getAllFilters() {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      const filters = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        filters.push({
          id: doc.id,
          ...data
        });
      });

      // Se não há filtros, criar padrão
      if (filters.length === 0) {
        console.log('Criando filtros padrão...');
        await this.createDefaultFilters();
        return this.getDefaultFilters();
      }

      // Ordenar por ordem
      filters.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      return filters;
    } catch (error) {
      console.error('Erro ao buscar todos os filtros:', error);
      return this.getDefaultFilters();
    }
  }

  // Criar filtros padrão no Firestore
  async createDefaultFilters() {
    try {
      const defaultFilters = this.getDefaultFilters();
      
      for (const filter of defaultFilters) {
        const { id, ...filterData } = filter;
        await addDoc(collection(db, this.collectionName), {
          ...filterData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      console.log('Filtros padrão criados no Firestore');
      this._clearCache();
    } catch (error) {
      console.error('Erro ao criar filtros padrão:', error);
      throw error;
    }
  }

  // Criar novo filtro
  async createFilter(filterData) {
    try {
      const docData = {
        ...filterData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collectionName), docData);
      
      console.log('Filtro criado:', docRef.id);
      this._clearCache();
      
      return {
        id: docRef.id,
        ...docData
      };
    } catch (error) {
      console.error('Erro ao criar filtro:', error);
      throw error;
    }
  }

  // Atualizar filtro
  async updateFilter(filterId, updateData) {
    try {
      const docRef = doc(db, this.collectionName, filterId);
      const dataToUpdate = {
        ...updateData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, dataToUpdate);
      
      console.log('Filtro atualizado:', filterId);
      this._clearCache();
      
      return { id: filterId, ...dataToUpdate };
    } catch (error) {
      console.error('Erro ao atualizar filtro:', error);
      throw error;
    }
  }

  // Deletar filtro
  async deleteFilter(filterId) {
    try {
      await deleteDoc(doc(db, this.collectionName, filterId));
      
      console.log('Filtro deletado:', filterId);
      this._clearCache();
    } catch (error) {
      console.error('Erro ao deletar filtro:', error);
      throw error;
    }
  }

  // Limpar cache
  _clearCache() {
    this.cache.clear();
    console.log('Cache de filtros limpo');
  }
}

export const tourFiltersService = new TourFiltersService();