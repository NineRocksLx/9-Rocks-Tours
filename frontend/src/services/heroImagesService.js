// frontend/src/services/heroImagesService.js - VERSÃO SEM ÍNDICES COMPOSTOS
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
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';

class HeroImagesService {
  constructor() {
    this.collectionName = 'heroImages';
    this.storageFolder = 'hero-images';
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

  // CORRIGIDO: Buscar hero images ativas (SEM índice composto)
  async getActiveHeroImages() {
    const cacheKey = this._getCacheKey('getActiveHeroImages');
    const cached = this._getCache(cacheKey);
    if (cached) {
      console.log('Retornando hero images do cache');
      return cached;
    }

    try {
      console.log('Buscando hero images ativas do Firestore...');
      
      // Query simples: apenas buscar documentos ativos (sem orderBy)
      const q = query(
        collection(db, this.collectionName),
        where('active', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const heroImages = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        heroImages.push({
          id: doc.id,
          ...data,
          // Converter timestamps se necessário
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        });
      });

      // ORDENAR NO CLIENTE (evita necessidade de índice composto)
      heroImages.sort((a, b) => (a.order || 0) - (b.order || 0));

      console.log(`${heroImages.length} hero images ativas encontradas`);
      
      // Cache do resultado
      this._setCache(cacheKey, heroImages);
      
      return heroImages;
    } catch (error) {
      console.error('Erro ao buscar hero images ativas:', error);
      
      // Verificar se é erro de conectividade
      if (error.code === 'unavailable') {
        throw new Error('Firebase indisponível. Verifique sua conexão com a internet.');
      } else if (error.code === 'permission-denied') {
        throw new Error('Permissão negada. Verifique as regras do Firestore.');
      }
      
      throw error;
    }
  }

  // CORRIGIDO: Buscar todas as hero images (SEM índice composto)
  async getAllHeroImages() {
    const cacheKey = this._getCacheKey('getAllHeroImages');
    const cached = this._getCache(cacheKey);
    if (cached) {
      console.log('Retornando todas as hero images do cache');
      return cached;
    }

    try {
      console.log('Buscando todas as hero images do Firestore...');
      
      // Query simples: buscar todos os documentos (sem orderBy)
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      const heroImages = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        heroImages.push({
          id: doc.id,
          ...data,
          // Converter timestamps se necessário
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        });
      });

      // ORDENAR NO CLIENTE (evita necessidade de índice)
      heroImages.sort((a, b) => (a.order || 0) - (b.order || 0));

      console.log(`${heroImages.length} hero images encontradas (total)`);
      
      // Cache do resultado
      this._setCache(cacheKey, heroImages);
      
      return heroImages;
    } catch (error) {
      console.error('Erro ao buscar todas as hero images:', error);
      throw error;
    }
  }

  // Upload de nova hero image
  async uploadHeroImage(file, imageData) {
    try {
      console.log('Iniciando upload de hero image:', file.name);
      
      // Validações
      if (!file) {
        throw new Error('Nenhum arquivo fornecido');
      }
      
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não suportado. Use JPG, PNG ou WebP.');
      }
      
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Máximo 5MB.');
      }

      // 1. Upload da imagem para Storage
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${randomId}_${cleanFileName}`;
      
      console.log('Fazendo upload para Storage:', fileName);
      
      const storageRef = ref(storage, `${this.storageFolder}/${fileName}`);
      
      // Upload com metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      };
      
      const snapshot = await uploadBytes(storageRef, file, metadata);
      console.log('Upload concluído:', snapshot);
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('URL obtida:', downloadURL);

      // 2. Salvar metadados no Firestore
      const docData = {
        ...imageData,
        imageUrl: downloadURL,
        fileName: fileName,
        fileSize: file.size,
        fileType: file.type,
        originalName: file.name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('Salvando metadados no Firestore...');
      const docRef = await addDoc(collection(db, this.collectionName), docData);
      
      console.log('Hero image criada com sucesso:', docRef.id);
      
      // Limpar cache
      this._clearCache();
      
      return {
        id: docRef.id,
        ...docData,
        imageUrl: downloadURL
      };
    } catch (error) {
      console.error('Erro detalhado no upload da hero image:', error);
      
      // Mensagens de erro mais específicas
      if (error.code === 'storage/unauthorized') {
        throw new Error('Sem permissão para upload. Verifique as regras do Firebase Storage.');
      } else if (error.code === 'storage/canceled') {
        throw new Error('Upload cancelado pelo usuário.');
      } else if (error.code === 'storage/unknown') {
        throw new Error('Erro desconhecido no Firebase Storage.');
      }
      
      throw error;
    }
  }

  // Atualizar hero image
  async updateHeroImage(imageId, updateData) {
    try {
      console.log('Atualizando hero image:', imageId);
      
      const docRef = doc(db, this.collectionName, imageId);
      const dataToUpdate = {
        ...updateData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, dataToUpdate);
      
      console.log('Hero image atualizada com sucesso');
      
      // Limpar cache
      this._clearCache();
      
      return { id: imageId, ...dataToUpdate };
    } catch (error) {
      console.error('Erro ao atualizar hero image:', error);
      throw error;
    }
  }

  // Deletar hero image
  async deleteHeroImage(imageId, imageUrl, fileName) {
    try {
      console.log('Deletando hero image:', imageId);
      
      // 1. Deletar do Firestore
      await deleteDoc(doc(db, this.collectionName, imageId));
      console.log('Documento removido do Firestore');
      
      // 2. Deletar do Storage
      if (fileName) {
        try {
          const imageRef = ref(storage, `${this.storageFolder}/${fileName}`);
          await deleteObject(imageRef);
          console.log('Arquivo removido do Storage');
        } catch (storageError) {
          console.warn('Erro ao deletar do Storage (arquivo pode não existir):', storageError);
          // Não falhar se o arquivo não existir no Storage
        }
      }
      
      // Limpar cache
      this._clearCache();
      
      console.log('Hero image deletada com sucesso');
    } catch (error) {
      console.error('Erro ao deletar hero image:', error);
      throw error;
    }
  }

  // Limpar cache
  _clearCache() {
    this.cache.clear();
    console.log('Cache de hero images limpo');
  }

  // Teste de conectividade
  async testConnection() {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      return true;
    } catch (error) {
      console.error('Teste de conectividade falhou:', error);
      return false;
    }
  }

  // Estatísticas
  async getStats() {
    try {
      const allImages = await this.getAllHeroImages();
      const activeImages = allImages.filter(img => img.active);
      
      return {
        total: allImages.length,
        active: activeImages.length,
        inactive: allImages.length - activeImages.length,
        totalSize: allImages.reduce((sum, img) => sum + (img.fileSize || 0), 0)
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }
}

// Exportar instância única
export const heroImagesService = new HeroImagesService();

// Exportar classe para testes
export { HeroImagesService };