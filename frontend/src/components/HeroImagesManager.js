// frontend/src/components/HeroImagesManager.js
import React, { useState, useEffect } from 'react';
import { heroImagesService } from '../services/heroImagesService';

const HeroImagesManager = () => {
  const [heroImages, setHeroImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [error, setError] = useState('');

  // ✅ ALTERAÇÃO 1: Adicionados 'duration' e 'showTextOverlay' ao estado inicial
  const [formData, setFormData] = useState({
    title: { pt: '', en: '', es: '' },
    subtitle: { pt: '', en: '', es: '' },
    order: 1,
    active: true,
    duration: 4000, // Valor padrão de 4 segundos (4000 ms)
    showTextOverlay: true // ✅ NOVO CAMPO: Mostrar texto por defeito
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
      console.error('Erro ao carregar hero images:', err);
      setError('Erro ao carregar imagens do Firebase.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!editingImage && !file) {
      alert('Por favor, selecione uma imagem para upload.');
      return;
    }

    if (file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            alert('Tipo de arquivo não suportado. Use JPG, PNG ou WebP.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Arquivo muito grande. Máximo 5MB.');
            return;
        }
    }

    setUploading(true);
    setError('');

    try {
      if (editingImage) {
        await heroImagesService.updateHeroImage(editingImage.id, formData);
        alert('✅ Imagem atualizada no Firebase!');
      } else {
        await heroImagesService.uploadHeroImage(file, formData);
        alert('✅ Imagem enviada para Firebase Storage!');
      }

      resetForm();
      setShowModal(false);
      fetchHeroImages();
    } catch (err) {
      console.error('Erro:', err);
      const errorMessage = err.message || 'Erro ao processar imagem';
      setError(errorMessage);
      alert('❌ Erro: ' + errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (image) => {
    setEditingImage(image);
    // ✅ ALTERAÇÃO 2: Carregar 'duration' e 'showTextOverlay' existentes ao editar
    setFormData({
      title: image.title || { pt: '', en: '', es: '' },
      subtitle: image.subtitle || { pt: '', en: '', es: '' },
      order: image.order || 1,
      active: image.active !== undefined ? image.active : true,
      duration: image.duration || 4000,
      showTextOverlay: image.showTextOverlay !== undefined ? image.showTextOverlay : true
    });
    setShowModal(true);
  };

  const handleDelete = async (image) => {
    if (window.confirm('🗑️ Eliminar esta imagem do Firebase?')) {
      try {
        setLoading(true);
        await heroImagesService.deleteHeroImage(image.id, image.imageUrl, image.fileName);
        alert('✅ Imagem eliminada do Firebase!');
        fetchHeroImages();
      } catch (err) {
        console.error('Erro ao eliminar:', err);
        alert('❌ Erro ao eliminar imagem');
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
      alert('❌ Erro ao alterar status');
    }
  };

  const resetForm = () => {
    // ✅ ALTERAÇÃO 3: Resetar 'duration' e 'showTextOverlay' no formulário
    setFormData({
      title: { pt: '', en: '', es: '' },
      subtitle: { pt: '', en: '', es: '' },
      order: 1,
      active: true,
      duration: 4000,
      showTextOverlay: true
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
      {/* Header Firebase */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-blue-900">
              🔥 Firebase Hero Images Manager
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2">
                <strong>💾 Armazenamento:</strong> Firebase Storage + Firestore Database
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>✅ Imagens guardadas no Firebase Storage</li>
                <li>✅ Metadados guardados no Firestore</li>
                <li>✅ Sincronização automática com a homepage</li>
                <li>✅ Fallback automático se Firebase falhar</li>
                <li>✅ Tamanho recomendado: 1920x1080px (16:9)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Firebase Hero Images</h2>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          disabled={uploading || loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          + Adicionar ao Firebase
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">🚨 {error}</div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">📥 A carregar do Firebase...</p>
        </div>
      )}

      {/* Lista de Imagens */}
      <div className="grid gap-4">
        {heroImages.sort((a, b) => (a.order || 99) - (b.order || 99)).map((image) => (
          <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3">
                <img 
                  src={image.imageUrl} 
                  alt={image.title?.pt || 'Hero Image'}
                  className="h-48 w-full object-cover md:h-full"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f3f4f6"/><text x="200" y="150" text-anchor="middle" fill="%23666">Firebase Error</text></svg>';
                  }}
                />
              </div>

              <div className="md:w-2/3 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-500">🔥 Firebase ID: {image.id}</span>
                      <span className="text-sm font-medium text-gray-500">📊 Ordem: {image.order}</span>
                      <span className="text-sm font-medium text-gray-500">⏱️ Duração: {image.duration || 4000}ms</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        image.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {image.active ? '✅ Ativa' : '❌ Inativa'}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {image.title?.pt || 'Sem título'}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      {image.subtitle?.pt || 'Sem subtítulo'}
                    </p>
                    
                    <div className="text-sm text-gray-500 space-y-1">
                      {image.title?.en && <p><strong>EN:</strong> {image.title.en}</p>}
                      {image.title?.es && <p><strong>ES:</strong> {image.title.es}</p>}
                    </div>
                  </div>

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
            <div className="text-6xl mb-4">🔥</div>
            <h3 className="text-lg font-medium text-gray-900">Firebase vazio</h3>
            <p className="text-gray-500">Adicione a primeira imagem ao Firebase Storage</p>
          </div>
        )}
      </div>

      {/* Modal Firebase Upload */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                🔥 {editingImage ? 'Editar no Firebase' : 'Upload para Firebase'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {!editingImage && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      📁 Selecionar Imagem para Firebase *
                    </label>
                    <input
                      id="heroImageFile"
                      type="file"
                      accept="image/*"
                      className="w-full border rounded px-3 py-2"
                      disabled={uploading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      🔥 Será enviado para Firebase Storage • Máx: 5MB • Recomendado: 1920x1080px
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">🏷️ Títulos *</label>
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

                <div>
                  <label className="block text-sm font-medium mb-2">📝 Subtítulos</label>
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
                
                {/* ✅ ALTERAÇÃO 4: Adicionados os novos campos aqui no modal */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">📊 Ordem</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({...formData, order: parseInt(e.target.value, 10) || 1})}
                      min="1"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">⏱️ Duração (ms)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value, 10) || 4000})}
                      min="1000"
                      step="500"
                      className="w-full border rounded px-3 py-2"
                      placeholder="Ex: 4000"
                    />
                     <p className="text-xs text-gray-500 mt-1">1000ms = 1 segundo</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">🔘 Status</label>
                    <select
                      value={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.value === 'true'})}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="true">✅ Ativa</option>
                      <option value="false">❌ Inativa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">👁️ Visibilidade do Texto</label>
                    <div className="flex items-center p-2 border rounded-md h-[42px]">
                      <input
                        type="checkbox"
                        id="showTextOverlay"
                        name="showTextOverlay"
                        checked={formData.showTextOverlay}
                        onChange={(e) => setFormData({...formData, showTextOverlay: e.target.checked})}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="showTextOverlay" className="ml-2 text-sm text-gray-700">Mostrar texto</label>
                    </div>
                  </div>
                </div>

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
                        🔥 Enviando para Firebase...
                      </div>
                    ) : (
                      `🔥 ${editingImage ? 'Atualizar' : 'Enviar'} Firebase`
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