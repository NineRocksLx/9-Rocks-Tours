// ✅ CORREÇÃO DEFINITIVA PARA FORÇAR HTTPS
const rawUrl = process.env.REACT_APP_BACKEND_URL || 'https://ninerocks-backend-742946187892.europe-west1.run.app';

// Garante que o URL é sempre HTTPS e não tem barras no final
export const BACKEND_URL = rawUrl.replace(/^http:\/\//i, 'https://').replace(/\/$/, '');

// Log para verificar o URL final em produção
console.log(`[AppConfig] Backend URL a ser usado: ${BACKEND_URL}`);