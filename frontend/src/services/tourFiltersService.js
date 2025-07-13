// frontend/src/services/tourFiltersService.js - VERSÃO CORRIGIDA

// NOVAS IMPORTAÇÕES PARA FAZER PEDIDOS À API
import axios from 'axios';
import { BACKEND_URL } from '../config/appConfig';

// Importações do Firebase mantidas para as funções de administração
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

class TourFiltersService {
  constructor() {
    this.collectionName = 'tourFilters';
    // A cache será menos usada para o público, mas mantida para a estrutura
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // Funções de cache (mantidas para consistência)
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

  // ✅ FUNÇÃO DE FILTROS PADRÃO (MANTIDA)
  // Usada como fallback caso a API falhe.
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

  // ✅ FUNÇÃO getActiveFilters TOTALMENTE SUBSTITUÍDA
  // Agora usa o backend em vez de aceder diretamente ao Firestore.
  async getActiveFilters() {
    console.log("Buscando filtros do Backend...");
    try {
      // A chamada agora é para a nossa API segura
      const response = await axios.get(`${BACKEND_URL}/api/config/tour-filters`);

      // Adiciona o filtro "Todos os Tours" no início, se não vier da API
      const hasAllFilter = response.data.some(f => f.key === 'all');
      const allFilter = this.getDefaultFilters().find(f => f.key === 'all');
      
      const finalFilters = hasAllFilter ? response.data : [allFilter, ...response.data];

      // Ordenar novamente para garantir que "Todos" fica em primeiro
      finalFilters.sort((a, b) => (a.order || 0) - (b.order || 0));

      return finalFilters;

    } catch (error) {
      console.error('Erro ao buscar filtros do backend, usando padrão:', error);
      // O fallback para os filtros padrão é mantido
      return this.getDefaultFilters();
    }
  }

  // ===================================================================
  // FUNÇÕES DE ADMINISTRAÇÃO (MANTIDAS COMO ESTAVAM)
  // Estas funções continuarão a ser usadas pelo painel de administração.
  // ===================================================================

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

      if (filters.length === 0) {
        console.log('Criando filtros padrão...');
        await this.createDefaultFilters();
        return this.getDefaultFilters();
      }

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
        if (filter.isDefault) { // Só cria os filtros padrão
          const { id, ...filterData } = filter;
          await addDoc(collection(db, this.collectionName), {
            ...filterData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
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

  // Testar conexão
  async testFirebaseConnection() {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      return { success: true, documentsFound: querySnapshot.size };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        code: error.code || 'unknown'
      };
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