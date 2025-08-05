import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import AdminTourManager from '../components/AdminTourManager';
import HeroImagesManager from '../components/HeroImagesManager';
import TourFiltersManager from '../components/TourFiltersManager';
import { generateEmailConfig, getEmailByLanguage, trackEmailEvent } from '../config/emailConfig';
import { BACKEND_URL } from '../config/appConfig';

const AdminPanel = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentView, setCurrentView] = useState('tours');
    const [tours, setTours] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [authLoading, setAuthLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [editingTour, setEditingTour] = useState(null);
    const [payments, setPayments] = useState([]);
    const [paypalStats, setPaypalStats] = useState({
        total_transactions: 0,
        completed_payments: 0,
        pending_payments: 0,
        total_revenue: 0,
        paypal_count: 0,
        google_pay_count: 0,
        last_updated: null
    });

    const [emailStrategy, setEmailStrategy] = useState({
        enabled: false,
        selectedBookings: [],
        emailType: 'booking_confirmation'
    });

    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setAuthLoading(true);
            
            if (user) {
                try {
                    const token = await user.getIdToken();
                    setUser(user);
                    setIsLoggedIn(true);
                    localStorage.setItem('admin_token', token);
                    localStorage.setItem('admin_uid', user.uid);
                } catch (error) {
                    setError('Erro de autenticação');
                    handleLogout();
                }
            } else {
                setUser(null);
                setIsLoggedIn(false);
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_uid');
            }
            
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (isLoggedIn) {
            if (currentView === 'tours' && !editingTour) {
                fetchTours();
            } else if (currentView === 'bookings') {
                fetchBookings();
            } else if (currentView === 'payments') {
                fetchPayments();
            } else if (currentView === 'stats') {
                fetchStats();
                fetchPayments();
            }
        }
    }, [currentView, isLoggedIn, editingTour]);

    const fetchTours = async () => {
        if (!isLoggedIn) return;
        
        setLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('admin_token');
            
            if (!token) {
                setError('Token de autenticação não encontrado');
                handleLogout();
                return;
            }

            const response = await axios.get(`${BACKEND_URL}/api/tours/`, {
                 params: { active_only: false },
                 headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                 }
            });

            setTours(response.data || []);
            
        } catch (err) {
            if (err.response?.status === 401) {
                setError('Sessão expirada. Faça login novamente.');
                handleLogout();
            } else if (err.response?.status === 403) {
                setError('Permissão negada. Verifique suas credenciais.');
            } else {
                setError(err.response?.data?.message || 'Erro ao carregar tours');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchBookings = async () => {
        if (!isLoggedIn) return;
        
        setLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('admin_token');
            const response = await axios.get(`${BACKEND_URL}/api/bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(response.data || []);
        } catch (err) {
            if (err.response?.status === 401) {
                setError('Sessão expirada. Faça login novamente.');
                handleLogout();
            } else {
                setError('Erro ao carregar reservas');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        if (!isLoggedIn) return;
        
        setLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('admin_token');
            const [statsResponse, toursResponse] = await Promise.all([
                axios.get(`${BACKEND_URL}/api/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${BACKEND_URL}/api/tours?active_only=false`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            
            setStats(statsResponse.data);
            setTours(toursResponse.data || []);
        } catch (err) {
            if (err.response?.status === 401) {
                setError('Sessão expirada. Faça login novamente.');
                handleLogout();
            } else {
                setError('Erro ao carregar estatísticas');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchPayments = async () => {
        if (!isLoggedIn) return;
        
        setLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('admin_token');
            const response = await axios.get(`${BACKEND_URL}/api/admin/payments/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const paymentsData = response.data.payments || response.data || [];
            setPayments(paymentsData);
            
            const completedPayments = paymentsData.filter(p => p.status === 'completed' || p.status === 'succeeded');
            const pendingPayments = paymentsData.filter(p => p.status === 'created' || p.status === 'pending');
            const paypalPayments = paymentsData.filter(p => p.payment_method === 'paypal');
            const googlePayPayments = paymentsData.filter(p => p.payment_method === 'google_pay');
            const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
            
            setPaypalStats({
                total_transactions: paymentsData.length,
                completed_payments: completedPayments.length,
                pending_payments: pendingPayments.length,
                total_revenue: totalRevenue,
                paypal_count: paypalPayments.length,
                google_pay_count: googlePayPayments.length,
                last_updated: new Date().toISOString()
            });
            
        } catch (err) {
            if (err.response?.status === 401) {
                setError('Sessão expirada. Faça login novamente.');
                handleLogout();
            } else {
                setError('Erro ao carregar pagamentos');
            }
        } finally {
            setLoading(false);
        }
    };

    const sendBookingEmail = async (booking, emailType = 'booking_confirmation') => {
        try {
            const language = booking.language || 'pt';
            const emailConfig = generateEmailConfig(emailType, language, {
                to: booking.customer_email,
                customerName: booking.customer_name || `${booking.first_name} ${booking.last_name}`,
                tourName: booking.tour_name,
                tourDate: new Date(booking.tour_date).toLocaleDateString('pt-PT'),
                bookingId: booking.id
            });
            
            const response = await axios.post(`${BACKEND_URL}/api/admin/send-email`, {
                booking_id: booking.id,
                email_type: emailType,
                email_config: emailConfig,
                language: language
            }, {
                headers: { 
                    Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.success) {
                trackEmailEvent(emailType, language, {
                    booking_id: booking.id,
                    customer_email: booking.customer_email,
                    admin_action: true
                });
                
                alert(`✅ Email enviado com sucesso para ${booking.customer_email}`);
                
                if (emailType === 'booking_confirmation') {
                    await updateBookingStatus(booking.id, 'confirmed');
                }
            }
        } catch (error) {
            console.error('❌ Erro ao enviar email:', error);
            alert('❌ Erro ao enviar email: ' + (error.response?.data?.message || error.message));
        }
    };

    const sendBookingStrategy = async (booking) => {
        try {
            const language = booking.language || 'pt';
            const confirmationConfig = generateEmailConfig('booking_confirmation', language, {
                to: booking.customer_email,
                customerName: booking.customer_name || `${booking.first_name} ${booking.last_name}`,
                tourName: booking.tour_name,
                tourDate: new Date(booking.tour_date).toLocaleDateString('pt-PT')
            });
            
            const response = await axios.post(`${BACKEND_URL}/api/admin/schedule-booking-emails`, {
                booking_id: booking.id,
                confirmation_config: confirmationConfig,
                language: language,
                tour_date: booking.tour_date
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            
            if (response.data.success) {
                alert(`✅ Estratégia de emails agendada para ${booking.customer_email}`);
                fetchBookings();
            }
        } catch (error) {
            console.error('❌ Erro ao agendar emails:', error);
            alert('❌ Erro ao agendar estratégia de emails');
        }
    };

    const updateBookingStatus = async (bookingId, status) => {
        try {
            const token = localStorage.getItem('admin_token');
            await axios.put(`${BACKEND_URL}/api/bookings/${bookingId}/status`, {
                status: status
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('❌ Erro ao atualizar status:', error);
        }
    };

    const handleDeleteTour = async (tourId) => {
        if (!window.confirm('Tem certeza que deseja excluir este tour?')) return;
        
        try {
            const token = localStorage.getItem('admin_token');
            await axios.delete(`${BACKEND_URL}/api/tours/${tourId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            fetchTours();
        } catch (err) {
            setError('Erro ao excluir o tour');
        }
    };

    const handleAddNewTour = () => {
        setEditingTour({});
        setError('');
    };

    const handleEditTour = (tour) => {
        setEditingTour(tour);
        setError('');
    };

    const handleCloseForm = () => {
        setEditingTour(null);
        setError('');
        fetchTours();
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(
                auth, 
                credentials.email, 
                credentials.password
            );
        } catch (error) {
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

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setCredentials({ email: '', password: '' });
            setCurrentView('tours');
            setEditingTour(null);
            setTours([]);
            setBookings([]);
            setStats(null);
            setPayments([]);
            setPaypalStats({
                total_transactions: 0,
                completed_payments: 0,
                pending_payments: 0,
                total_revenue: 0,
                paypal_count: 0,
                google_pay_count: 0,
                last_updated: null
            });
            setEmailStrategy({
                enabled: false,
                selectedBookings: [],
                emailType: 'booking_confirmation'
            });
            setError('');
        } catch (error) {
            setError('Erro ao fazer logout');
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-PT');
    };

    const getTourName = (tourId) => {
        const tour = tours.find(t => t.id === tourId);
        return tour ? tour.name.pt : tourId;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const exportBookings = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await axios.get(`${BACKEND_URL}/api/admin/export/bookings`, {
                responseType: 'blob',
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'reservas.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError('Erro ao exportar dados');
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">A verificar autenticação...</p>
                </div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">9 Rocks Tours</h1>
                        <p className="text-gray-600 mt-2">Painel de Administração</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                            <div className="flex">
                                <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div className="text-red-800">{error}</div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email do Administrador
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={credentials.email}
                                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="ninerockstours@gmail.com"
                                disabled={loading}
                            />
                        </div>

                        <div className="mb-6">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={credentials.password}
                                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-md hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    A entrar...
                                </div>
                            ) : (
                                'Entrar'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                9 Rocks Tours - Admin
                            </h1>
                            {user && (
                                <p className="text-sm text-gray-600 mt-1">
                                    Conectado como: {user.email}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <nav className="flex space-x-8 overflow-x-auto">
                        <button
                            onClick={() => setCurrentView('tours')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                                currentView === 'tours'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Tours
                        </button>
                        <button
                            onClick={() => setCurrentView('hero_images')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                                currentView === 'hero_images'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Hero Images
                        </button>
                        <button
                            onClick={() => setCurrentView('tour_filters')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                                currentView === 'tour_filters'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Filtros
                        </button>
                        <button
                            onClick={() => setCurrentView('bookings')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                                currentView === 'bookings'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Reservas
                        </button>
                        <button
                            onClick={() => setCurrentView('payments')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                                currentView === 'payments'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            💳 Pagamentos
                        </button>
                        <button
                            onClick={() => setCurrentView('stats')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                                currentView === 'stats'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Estatísticas
                        </button>
                    </nav>
                </div>

                {currentView === 'tours' && (
                    <>
                        {editingTour ? (
                            <AdminTourManager
                                tourToEdit={editingTour}
                                onFormClose={handleCloseForm}
                            />
                        ) : (
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-800">Gerir Tours</h2>
                                    <button
                                        onClick={handleAddNewTour}
                                        className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Adicionar Novo Tour
                                    </button>
                                </div>

                                {loading && (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                                        <p className="text-gray-600">A carregar tours...</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                                        <div className="flex">
                                            <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <div className="text-red-800">{error}</div>
                                        </div>
                                    </div>
                                )}
                                
                                {!loading && tours.length === 0 && !error && (
                                    <div className="text-center py-12">
                                        <div className="text-gray-500 text-lg mb-4">
                                            Nenhum tour encontrado
                                        </div>
                                        <button
                                            onClick={handleAddNewTour}
                                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Criar o primeiro tour
                                        </button>
                                    </div>
                                )}

                                {!loading && tours.length > 0 && (
                                    <div className="space-y-4">
                                        {tours.map((tour) => (
                                            <div key={tour.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                                                <div className="flex-grow">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {tour.name?.pt || 'Tour sem nome'}
                                                    </h3>
                                                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                                        <span>ID: {tour.id}</span>
                                                        <span>•</span>
                                                        <span>
                                                            Status: {tour.active ? 
                                                                <span className="text-green-600 font-medium">Ativo</span> : 
                                                                <span className="text-red-600 font-medium">Inativo</span>
                                                            }
                                                        </span>
                                                        <span>•</span>
                                                        <span>Preço: {formatPrice(tour.price || 0)}</span>
                                                        <span>•</span>
                                                        <span>Duração: {tour.duration_hours || 0}h</span>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={() => handleEditTour(tour)}
                                                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTour(tour.id)}
                                                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors flex items-center"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Excluir
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {currentView === 'hero_images' && <HeroImagesManager />}
                {currentView === 'tour_filters' && <TourFiltersManager />}
                
                {currentView === 'bookings' && !loading && (
                    <div>
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={emailStrategy.enabled}
                                    onChange={(e) => setEmailStrategy(prev => ({...prev, enabled: e.target.checked}))}
                                    className="w-5 h-5 text-blue-600 mr-3"
                                />
                                <span className="text-lg font-semibold text-gray-900">
                                    📧 Ativar Funcionalidades Avançadas de Email
                                </span>
                            </label>
                            <p className="text-sm text-gray-600 mt-1 ml-8">
                                Envio de emails personalizados e estratégia sequencial para reservas
                            </p>
                        </div>

                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">📋 Gestão de Reservas</h2>
                            <button
                                onClick={exportBookings}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center transition-colors duration-200"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Exportar CSV
                            </button>
                        </div>

                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Cliente
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tour
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Data
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Participantes
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Valor
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Idioma
                                            </th>
                                            {emailStrategy.enabled && (
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Emails
                                                </th>
                                            )}
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Data Criação
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {bookings.length === 0 ? (
                                            <tr>
                                                <td colSpan={emailStrategy.enabled ? "9" : "8"} className="px-6 py-12 text-center text-gray-500">
                                                    <div className="text-4xl mb-4">📋</div>
                                                    <div>Nenhuma reserva encontrada</div>
                                                </td>
                                            </tr>
                                        ) : (
                                            bookings.map((booking) => (
                                                <tr key={booking.id} className="hover:bg-gray-50 transition-colors duration-200">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {booking.customer_name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {booking.customer_email}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {getTourName(booking.tour_id)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {formatDate(booking.selected_date)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {booking.participants}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {formatPrice(booking.total_amount)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                                                            {booking.status === 'confirmed' ? 'Confirmada' :
                                                            booking.status === 'pending' ? 'Pendente' :
                                                            booking.status === 'cancelled' ? 'Cancelada' :
                                                            booking.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <span className="font-medium">
                                                            {booking.language === 'pt' ? '🇵🇹 PT' : 
                                                             booking.language === 'en' ? '🇬🇧 EN' : 
                                                             booking.language === 'es' ? '🇪🇸 ES' : '🇵🇹 PT'}
                                                        </span>
                                                    </td>
                                                    {emailStrategy.enabled && (
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex space-x-1">
                                                                <button
                                                                    onClick={() => sendBookingEmail(booking, 'booking_confirmation')}
                                                                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
                                                                    title="Enviar Confirmação"
                                                                >
                                                                    📧
                                                                </button>
                                                                <button
                                                                    onClick={() => sendBookingEmail(booking, 'booking_reminder')}
                                                                    className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200"
                                                                    title="Enviar Lembrete"
                                                                >
                                                                    🎒
                                                                </button>
                                                                <button
                                                                    onClick={() => sendBookingStrategy(booking)}
                                                                    className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded hover:bg-purple-200"
                                                                    title="Estratégia Completa"
                                                                >
                                                                    ⚡
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(booking.created_at)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {emailStrategy.enabled && (
                            <div className="mt-6 bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">📨 Controle de Emails em Massa</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tipo de Email:
                                        </label>
                                        <select
                                            value={emailStrategy.emailType}
                                            onChange={(e) => setEmailStrategy(prev => ({...prev, emailType: e.target.value}))}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="booking_confirmation">📧 Confirmação</option>
                                            <option value="booking_reminder">🎒 Lembrete</option>
                                            <option value="tour_inquiry">🎯 Informações</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Filtrar por Status:
                                        </label>
                                        <select className="w-full p-2 border border-gray-300 rounded-lg">
                                            <option value="">Todos</option>
                                            <option value="pending">Pendentes</option>
                                            <option value="confirmed">Confirmadas</option>
                                        </select>
                                    </div>
                                    
                                    <div className="flex items-end">
                                        <button
                                            onClick={() => {
                                                const selectedBookings = bookings.filter(b => b.status === 'pending');
                                                selectedBookings.forEach(booking => {
                                                    setTimeout(() => sendBookingEmail(booking, emailStrategy.emailType), 
                                                              Math.random() * 2000);
                                                });
                                            }}
                                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            📧 Enviar para Pendentes
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                                    <p>💡 <strong>Como usar a estratégia de emails:</strong></p>
                                    <ul className="mt-2 space-y-1">
                                        <li>• <strong>📧 Confirmação:</strong> Email de agradecimento enviado 25 min após reserva</li>
                                        <li>• <strong>🎒 Lembrete:</strong> Email com preparativos enviado na véspera do tour</li>
                                        <li>• <strong>⚡ Estratégia Completa:</strong> Agenda automaticamente ambos os emails</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {currentView === 'payments' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">💳 Gestão de Pagamentos</h2>
                                <p className="text-gray-600 mt-1">
                                    Monitorize todas as transações PayPal e Google Pay
                                </p>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => window.open('https://www.paypal.com/merchantapps/appcenter/acceptpayments/home', '_blank')}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center transition-colors duration-200"
                                >
                                    PayPal Dashboard
                                </button>
                                <button
                                    onClick={fetchPayments}
                                    disabled={loading}
                                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center transition-colors duration-200 disabled:opacity-50"
                                >
                                    {loading ? 'Atualizando...' : 'Atualizar'}
                                </button>
                            </div>
                        </div>

                        {loading && (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                                <p className="text-gray-600">A carregar pagamentos...</p>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                                <div className="flex">
                                    <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-red-800">{error}</div>
                                </div>
                            </div>
                        )}

                        {!loading && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
                                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-3xl font-bold">
                                                    {paypalStats.completed_payments}
                                                </div>
                                                <div className="text-sm opacity-90 mt-1">Confirmados</div>
                                            </div>
                                            <div className="text-4xl opacity-80">✅</div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-3xl font-bold">
                                                    {formatPrice(paypalStats.total_revenue)}
                                                </div>
                                                <div className="text-sm opacity-90 mt-1">Receita Total</div>
                                            </div>
                                            <div className="text-4xl opacity-80">💰</div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6 rounded-xl shadow-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-3xl font-bold">
                                                    {paypalStats.pending_payments}
                                                </div>
                                                <div className="text-sm opacity-90 mt-1">Pendentes</div>
                                            </div>
                                            <div className="text-4xl opacity-80">⏳</div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-3xl font-bold">
                                                    {paypalStats.total_transactions}
                                                </div>
                                                <div className="text-sm opacity-90 mt-1">Total</div>
                                            </div>
                                            <div className="text-4xl opacity-80">📊</div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-3xl font-bold">
                                                    {paypalStats.paypal_count || 0}
                                                </div>
                                                <div className="text-sm opacity-90 mt-1">PayPal</div>
                                            </div>
                                            <div className="text-4xl opacity-80">💙</div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-6 rounded-xl shadow-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-3xl font-bold">
                                                    {paypalStats.google_pay_count || 0}
                                                </div>
                                                <div className="text-sm opacity-90 mt-1">Google Pay</div>
                                            </div>
                                            <div className="text-4xl opacity-80">🅖</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white shadow-lg overflow-hidden sm:rounded-xl">
                                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                        <h3 className="text-lg font-medium text-gray-900">Histórico de Transações</h3>
                                    </div>
                                    
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Payment ID
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Cliente
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Valor
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Data
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {payments.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                            <div className="text-6xl mb-4">💳</div>
                                                            <div className="text-lg font-medium mb-2">Nenhum pagamento encontrado</div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    payments
                                                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                                        .map((payment) => (
                                                        <tr key={payment.id} className="hover:bg-gray-50 transition-colors duration-200">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-mono text-gray-900">
                                                                    {payment.payment_id ? payment.payment_id.substring(0, 12) + '...' : 'N/A'}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900">
                                                                    {payment.customer_email || 'N/A'}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {formatPrice(payment.amount || 0)}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                    payment.status === 'completed' || payment.status === 'succeeded' 
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : payment.status === 'pending' || payment.status === 'created'
                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {payment.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {formatDate(payment.created_at)}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {currentView === 'stats' && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Estatísticas do Sistema</h2>
                        
                        {loading && (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                                <p className="text-gray-600">A carregar estatísticas...</p>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                                <div className="flex">
                                    <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-red-800">{error}</div>
                                </div>
                            </div>
                        )}

                        {!loading && stats && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-lg shadow">
                                    <div className="text-3xl font-bold text-blue-600">{stats.total_bookings || 0}</div>
                                    <div className="text-gray-600">Total de Reservas</div>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow">
                                    <div className="text-3xl font-bold text-green-600">{formatPrice(stats.total_revenue || 0)}</div>
                                    <div className="text-gray-600">Receita Total</div>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow">
                                    <div className="text-3xl font-bold text-yellow-600">{stats.pending_bookings || 0}</div>
                                    <div className="text-gray-600">Reservas Pendentes</div>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow">
                                    <div className="text-3xl font-bold text-purple-600">{tours.length}</div>
                                    <div className="text-gray-600">Tours Ativos</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;