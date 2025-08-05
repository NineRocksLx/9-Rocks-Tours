import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';

const AdminLogin = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    email: 'geral@9rocks.pt',
    password: 'RochasUnidos+Fortes'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // USAR EXATAMENTE COMO NO ADMINPANEL ORIGINAL
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        credentials.email, 
        credentials.password
      );
      
      // O onAuthStateChanged do App.js vai detectar automaticamente
      // e fazer setUser(user) - não precisamos fazer nada aqui!
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Usar a mesma lógica de erro do AdminPanel original
      let errorMessage = 'Credenciais inválidas';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Utilizador não encontrado';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Password incorreta';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
          break;
        default:
          errorMessage = `Erro: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">9 Rocks Tours</h1>
          <p className="text-gray-600">Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar no Admin'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>✅ Credenciais pré-preenchidas</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;