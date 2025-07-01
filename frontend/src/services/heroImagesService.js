// ============================================
// 1. SERVIÇO HERO IMAGES (criar como services/heroImagesService.js)
// ============================================

// services/heroImagesService.js
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
  }

  // Buscar todas as hero images ativas
  async getActiveHeroImages() {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('active', '==', true),
        orderBy('order', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const heroImages = [];
      
      querySnapshot.forEach((doc) => {
        heroImages.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return heroImages;
    } catch (error) {
      console.error('Erro ao buscar hero images:', error);
      throw error;
    }
  }

  // Buscar todas as hero images (incluindo inativas)
  async getAllHeroImages() {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('order', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const heroImages = [];
      
      querySnapshot.forEach((doc) => {
        heroImages.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return heroImages;
    } catch (error) {
      console.error('Erro ao buscar todas as hero images:', error);
      throw error;
    }
  }

  // Upload de nova imagem
  async uploadHeroImage(file, imageData) {
    try {
      // 1. Upload da imagem para Storage
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storageRef = ref(storage, `${this.storageFolder}/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 2. Salvar metadados no Firestore
      const docData = {
        ...imageData,
        imageUrl: downloadURL,
        fileName: fileName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collectionName), docData);
      
      return {
        id: docRef.id,
        ...docData,
        imageUrl: downloadURL
      };
    } catch (error) {
      console.error('Erro ao fazer upload da hero image:', error);
      throw error;
    }
  }

  // Atualizar hero image
  async updateHeroImage(imageId, updateData) {
    try {
      const docRef = doc(db, this.collectionName, imageId);
      const dataToUpdate = {
        ...updateData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, dataToUpdate);
      
      return { id: imageId, ...dataToUpdate };
    } catch (error) {
      console.error('Erro ao atualizar hero image:', error);
      throw error;
    }
  }

  // Deletar hero image
  async deleteHeroImage(imageId, imageUrl, fileName) {
    try {
      // 1. Deletar do Firestore
      await deleteDoc(doc(db, this.collectionName, imageId));
      
      // 2. Deletar do Storage
      if (fileName) {
        const imageRef = ref(storage, `${this.storageFolder}/${fileName}`);
        await deleteObject(imageRef);
      }
    } catch (error) {
      console.error('Erro ao deletar hero image:', error);
      throw error;
    }
  }
}

export const heroImagesService = new HeroImagesService();

// ============================================
// 2. ADMINPANEL.JS ATUALIZADO (adicionar nova aba)
// ============================================

// No AdminPanel.js, adicionar esta seção no navigation:

/*
// Dentro do AdminPanel component, atualizar o navigation para incluir 'hero_images':

<button
  onClick={() => setCurrentView('hero_images')}
  className={`py-2 px-1 border-b-2 font-medium text-sm ${
    currentView === 'hero_images'
      ? 'border-indigo-500 text-indigo-600'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
  }`}
>
  Imagens Homepage
</button>

// E adicionar esta seção no final, antes do </div> de fechamento:

{currentView === 'hero_images' && <HeroImagesManager />}
*/

// ============================================
// 3. HERO IMAGES MANAGER COMPONENT (adicionar ao AdminPanel.js ou criar separado)
// ============================================

import React, { useState, useEffect } from 'react';
import { heroImagesService } from '../services/heroImagesService'; // Ajustar path se necessário

const HeroImagesManager = () => {
  const [heroImages, setHeroImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: { pt: '', en: '', es: '' },
    subtitle: { pt: '', en: '', es: '' },
    order: 1,
    active: true
  });

  useEffect(() => {
    fetchHeroImages();
  }, []);

  const fetchHeroImages = async () => {
    try {
      setLoading(true);
      const images = await heroImagesService.getAllHeroImages();
      setHeroImages(images);
    } catch (err) {
      setError('Erro ao carregar imagens');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    // Validações
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Tipo de arquivo não suportado. Use JPG, PNG ou WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 5MB.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      if (editingImage) {
        // Atualizar imagem existente
        await heroImagesService.updateHeroImage(editingImage.id, formData);
        alert('Imagem atualizada com sucesso!');
      } else {
        // Nova imagem
        await heroImagesService.uploadHeroImage(file, formData);
        alert('Imagem adicionada com sucesso!');
      }

      resetForm();
      setShowModal(false);
      fetchHeroImages();
    } catch (err) {
      console.error('Erro:', err);
      setError(err.message || 'Erro ao processar imagem');
      alert('Erro ao processar imagem: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (image) => {
    setEditingImage(image);
    setFormData({
      title: image.title || { pt: '', en: '', es: '' },
      subtitle: image.subtitle || { pt: '', en: '', es: '' },
      order: image.order || 1,
      active: image.active !== undefined ? image.active : true
    });
    setShowModal(true);
  };

  const handleDelete = async (image) => {
    if (window.confirm('Tem certeza que deseja eliminar esta imagem?')) {
      try {
        setLoading(true);
        await heroImagesService.deleteHeroImage(image.id, image.imageUrl, image.fileName);
        alert('Imagem eliminada com sucesso!');
        fetchHeroImages();
      } catch (err) {
        console.error('Erro ao eliminar:', err);
        alert('Erro ao eliminar imagem');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleStatus = async (image) => {
    try {
      await heroImagesService.updateHeroImage(image.id, { active: !image.active });
      fetchHeroImages();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      alert('Erro ao alterar status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: { pt: '', en: '', es: '' },
      subtitle: { pt: '', en: '', es: '' },
      order: 1,
      active: true
    });
    setEditingImage(null);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('heroImageFile');
    const file = fileInput?.files[0];

    if (!editingImage && !file) {
      alert('Por favor, selecione uma imagem');
      return;
    }

    if (!formData.title.pt.trim()) {
      alert('Por favor, preencha pelo menos o título em português');
      return;
    }

    handleImageUpload(file);
  };

  return (
    <div className="space-y-6">
      {/* Header com informação */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-blue-900">
              🏠 Gestão de Imagens da Homepage
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2">
                <strong>Funcionalidade Exclusiva:</strong> Apenas você tem acesso a esta seção para gerir as imagens 
                que aparecem no carousel da página inicial do site.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>As imagens são exibidas em rotação automática na homepage</li>
                <li>Cada imagem pode ter título e subtítulo traduzidos</li>
                <li>Use a ordem para controlar a sequência de exibição</li>
                <li>Apenas imagens ativas são mostradas aos visitantes</li>
                <li>Tamanho recomendado: 1920x1080px (16:9) para melhor qualidade</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Botão Adicionar */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Imagens do Carousel Principal</h2>
        <button
          onClick={() => setShowModal(true)}
          disabled={uploading || loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          + Adicionar Imagem
        </button>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">A carregar imagens...</p>
        </div>
      )}

      {/* Lista de Imagens */}
      <div className="grid gap-4">
        {heroImages.map((image) => (
          <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="md:flex">
              {/* Imagem */}
              <div className="md:w-1/3">
                <img 
                  src={image.imageUrl} 
                  alt={image.title?.pt || 'Hero Image'}
                  className="h-48 w-full object-cover md:h-full"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f3f4f6"/><text x="200" y="150" text-anchor="middle" fill="%23666">Erro ao carregar</text></svg>';
                  }}
                />
              </div>

              {/* Conteúdo */}
              <div className="md:w-2/3 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-500">Ordem: {image.order}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        image.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {image.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {image.title?.pt || 'Sem título'}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      {image.subtitle?.pt || 'Sem subtítulo'}
                    </p>
                    
                    {/* Traduções */}
                    <div className="text-sm text-gray-500 space-y-1">
                      {image.title?.en && (
                        <p><strong>EN:</strong> {image.title.en} • {image.subtitle?.en}</p>
                      )}
                      {image.title?.es && (
                        <p><strong>ES:</strong> {image.title.es} • {image.subtitle?.es}</p>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleStatus(image)}
                      className={`px-3 py-1 rounded text-sm ${
                        image.active 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      disabled={loading}
                    >
                      {image.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => handleEdit(image)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(image)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                      disabled={loading}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {heroImages.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma imagem</h3>
            <p className="mt-1 text-sm text-gray-500">Comece adicionando a primeira imagem do carousel.</p>
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                {editingImage ? 'Editar Imagem' : 'Nova Imagem do Carousel'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Upload de Imagem */}
                {!editingImage && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Selecionar Imagem *
                    </label>
                    <input
                      id="heroImageFile"
                      type="file"
                      accept="image/*"
                      required
                      className="w-full border rounded px-3 py-2"
                      disabled={uploading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Formatos: JPG, PNG, WebP • Tamanho máximo: 5MB • Recomendado: 1920x1080px
                    </p>
                  </div>
                )}

                {/* Títulos */}
                <div>
                  <label className="block text-sm font-medium mb-2">Título *</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {['pt', 'en', 'es'].map(lang => (
                      <div key={lang}>
                        <label className="text-xs text-gray-500">{lang.toUpperCase()}</label>
                        <input
                          type="text"
                          value={formData.title[lang]}
                          onChange={(e) => setFormData({
                            ...formData,
                            title: { ...formData.title, [lang]: e.target.value }
                          })}
                          required={lang === 'pt'}
                          className="w-full border rounded px-3 py-2"
                          placeholder={lang === 'pt' ? 'Obrigatório' : 'Opcional'}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtítulos */}
                <div>
                  <label className="block text-sm font-medium mb-2">Subtítulo</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {['pt', 'en', 'es'].map(lang => (
                      <div key={lang}>
                        <label className="text-xs text-gray-500">{lang.toUpperCase()}</label>
                        <input
                          type="text"
                          value={formData.subtitle[lang]}
                          onChange={(e) => setFormData({
                            ...formData,
                            subtitle: { ...formData.subtitle, [lang]: e.target.value }
                          })}
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ordem e Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Ordem de Exibição</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                      min="1"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select
                      value={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.value === 'true'})}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="true">Ativa</option>
                      <option value="false">Inativa</option>
                    </select>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    disabled={uploading}
                    className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        A processar...
                      </div>
                    ) : (
                      editingImage ? 'Atualizar' : 'Adicionar'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroImagesManager;