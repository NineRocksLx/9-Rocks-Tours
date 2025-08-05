import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';

// Componentes públicos EXISTENTES
import Header from './components/Header';
import HomePage from './pages/HomePage';
import ToursPage from './pages/ToursPage';
import TourDetails from './pages/TourDetails';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import TestPayment from './pages/TestPayment';

// SÓ o Admin NOVO modular
import AdminLayout from './pages/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';

import './App.css';

const ProtectedRoute = ({ children, user }) => {
    if (!user) {
        return <AdminLogin />;
    }
    return children;
};

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setLoading(false);
            
            if (user) {
                try {
                    const token = await user.getIdToken();
                    localStorage.setItem('admin_token', token);
                    localStorage.setItem('admin_uid', user.uid);
                    console.log('👤 Admin autenticado:', user.email);
                } catch (error) {
                    console.error('Erro ao obter token:', error);
                }
            } else {
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_uid');
                console.log('👤 Admin desconectado');
            }
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await auth.signOut(); // ← CORREÇÃO: Logout do Firebase
            setUser(null);
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_uid');
            console.log('👤 Admin desconectado com sucesso');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando 9 Rocks Tours...</p>
                </div>
            </div>
        );
    }

    return (
        <Router>
            <div className="App min-h-screen flex flex-col">
                <Routes>
                    {/* Rotas Públicas */}
                    <Route path="/" element={
                        <>
                            <Header />
                            <main className="flex-grow">
                                <HomePage />
                            </main>
                        </>
                    } />
                    
                    <Route path="/tours" element={
                        <>
                            <Header />
                            <main className="flex-grow">
                                <ToursPage />
                            </main>
                        </>
                    } />
                    
                    <Route path="/tours/:id" element={
                        <>
                            <Header />
                            <main className="flex-grow">
                                <TourDetails />
                            </main>
                        </>
                    } />
                    
                    <Route path="/payment/success" element={
                        <>
                            <Header />
                            <main className="flex-grow">
                                <TourDetails />
                            </main>
                        </>
                    } />
                    
                    <Route path="/test-payment" element={
                        <>
                            <Header />
                            <main className="flex-grow">
                                <TestPayment />
                            </main>
                        </>
                    } />

                    {/* SÓ Admin NOVO - Sistema Modular */}
                    <Route path="/admin/*" element={
                        <ProtectedRoute user={user}>
                            <AdminLayout user={user} onLogout={handleLogout} />
                        </ProtectedRoute>
                    } />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;