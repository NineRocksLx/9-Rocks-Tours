// Ficheiro: frontend/src/config/appConfig.js

// Exporta a variável de ambiente para o URL do backend.
// Adiciona um URL de fallback para o ambiente de desenvolvimento local, caso a variável de ambiente não esteja definida.
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

// No futuro, pode adicionar outras configurações globais da sua aplicação aqui.