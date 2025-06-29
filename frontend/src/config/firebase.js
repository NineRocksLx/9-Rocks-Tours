// frontend/src/config/firebase.js - VERSÃO CORRIGIDA COMPLETA
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD80GYkjPKfIbVW747zb3s7jXSuVfBJTe4",
  authDomain: "tours-81516-acfbc.firebaseapp.com",
  projectId: "tours-81516-acfbc",
  storageBucket: "tours-81516-acfbc.firebasestorage.app",
  messagingSenderId: "742946187892",
  appId: "1:742946187892:web:2b0d2bcb974d4564327f21",
  measurementId: "G-36FC6SS4WD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
let analytics;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.log('Analytics not available:', error);
}

export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);

// CORRIGIDO: Helper function com melhor tratamento de erros
export const uploadImageToStorage = async (file, path) => {
  try {
    console.log('Iniciando upload:', file.name, 'para:', path);
    
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
    
    // Criar referência única
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}_${randomString}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const fullPath = `tours/${fileName}`;
    
    console.log('Caminho do arquivo:', fullPath);
    
    // Upload para Firebase Storage
    const storageRef = ref(storage, fullPath);
    
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
    
    // Obter URL de download
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('URL obtida:', downloadURL);
    
    return downloadURL;
    
  } catch (error) {
    console.error('Erro detalhado no upload:', error);
    
    // Mensagens de erro mais específicas
    if (error.code === 'storage/unauthorized') {
      throw new Error('Sem permissão para upload. Verifique as regras do Firebase.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload cancelado pelo usuário.');
    } else if (error.code === 'storage/unknown') {
      throw new Error('Erro desconhecido no Firebase Storage.');
    } else if (error.code === 'storage/invalid-format') {
      throw new Error('Formato de arquivo inválido.');
    } else if (error.code === 'storage/invalid-argument') {
      throw new Error('Argumentos inválidos no upload.');
    }
    
    throw error;
  }
};

export { analytics };
export default app;