import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { db } from '../../config/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const AdminBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dataSource, setDataSource] = useState('firebase'); // 'firebase' ou 'backend'
    const [filters, setFilters] = useState({
        status: 'all',
        search: '',
        dateFrom: '',
        dateTo: '',
        tour: 'all'
    });
    
    // Estado para sistema de emails
    const [emailStrategy, setEmailStrategy] = useState({
        enabled: false,
        selectedBookings: [],
        emailType: 'booking_confirmation'
    });
    
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailSuccess, setEmailSuccess] = useState('');

    useEffect(() => {
        fetchBookings();
    }, [dataSource]);

    // ✅ NOVA FUNÇÃO: Buscar reservas do Firebase
    const fetchBookingsFromFirebase = async () => {
        setLoading(true);
        setError('');
        
        try {
            console.log('🔥 Buscando reservas do Firebase...');
            
            const bookingsRef = collection(db, 'bookings');
            const q = query(bookingsRef, orderBy('created_at', 'desc'));
            const querySnapshot = await getDocs(q);
            
            const bookingsData = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                bookingsData.push({
                    id: doc.id,
                    ...data,
                    // Normalizar campos para compatibilidade
                    customer_name: data.customer_name || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                    customer_email: data.customer_email || data.email,
                    customer_phone: data.customer_phone || data.phone,
                    tour_date: data.selected_date || data.date,
                    participants: data.participants || data.numberOfPeople || 1,
                    tour_name: data.tour_name || data.tour_id,
                    language: data.language || 'pt',
                    status: data.status || 'pending',
                    total_amount: data.total_amount || 0
                });
            });
            
            console.log(`✅ ${bookingsData.length} reservas carregadas do Firebase`);
            setBookings(bookingsData);
            
            if (bookingsData.length === 0) {
                setError('Nenhuma reserva encontrada no Firebase. Crie uma reserva de teste primeiro.');
            }
            
        } catch (error) {
            console.error('❌ Erro ao buscar reservas do Firebase:', error);
            setError(`Erro ao conectar com Firebase: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // ✅ FUNÇÃO ORIGINAL: Buscar do Backend (mantida para compatibilidade)
    const fetchBookingsFromBackend = async () => {
        setLoading(true);
        setError('');
        try {
            console.log('🌐 Buscando reservas do Backend...');
            const token = localStorage.getItem('admin_token');
            const response = await axios.get(`${BACKEND_URL}/api/admin/bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(response.data.bookings || []);
            console.log('📋 Reservas carregadas do Backend:', response.data.bookings?.length);
        } catch (error) {
            console.error('❌ Erro ao carregar reservas do Backend:', error);
            setError('Erro ao carregar reservas do Backend');
        } finally {
            setLoading(false);
        }
    };

    // ✅ FUNÇÃO UNIFICADA
    const fetchBookings = () => {
        if (dataSource === 'firebase') {
            fetchBookingsFromFirebase();
        } else {
            fetchBookingsFromBackend();
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const filteredBookings = bookings.filter(booking => {
        if (filters.status !== 'all' && booking.status !== filters.status) return false;
        if (filters.search && !Object.values(booking).some(val => 
            String(val).toLowerCase().includes(filters.search.toLowerCase())
        )) return false;
        if (filters.tour !== 'all' && booking.tour_id !== filters.tour) return false;
        return true;
    });

    const handleEmailToggle = (bookingId) => {
        setEmailStrategy(prev => ({
            ...prev,
            selectedBookings: prev.selectedBookings.includes(bookingId)
                ? prev.selectedBookings.filter(id => id !== bookingId)
                : [...prev.selectedBookings, bookingId]
        }));
    };

    const sendIndividualEmail = async (booking, emailType) => {
        setEmailLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            
            const emailConfig = {
                to: booking.customer_email,
                customerName: booking.customer_name,
                tourName: booking.tour_name || booking.tour_id,
                tourDate: formatDate(booking.tour_date),
                bookingId: booking.id,
                from: getEmailByLanguage(booking.language || 'pt')
            };

            const response = await axios.post(`${BACKEND_URL}/api/admin/send-email`, {
                booking_id: booking.id,
                email_config: emailConfig,
                email_type: emailType,
                language: booking.language || 'pt'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setEmailSuccess(`✅ Email ${emailType} enviado para ${booking.customer_name}`);
            setTimeout(() => setEmailSuccess(''), 3000);
            
            console.log('📧 Email enviado:', response.data);
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            setError(`Erro ao enviar email: ${error.response?.data?.detail || error.message}`);
        } finally {
            setEmailLoading(false);
        }
    };

    const scheduleEmailStrategy = async (booking) => {
        setEmailLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            
            const confirmationConfig = {
                to: booking.customer_email,
                customerName: booking.customer_name,
                tourName: booking.tour_name || booking.tour_id,
                tourDate: formatDate(booking.tour_date),
                bookingId: booking.id,
                from: getEmailByLanguage(booking.language || 'pt')
            };

            const response = await axios.post(`${BACKEND_URL}/api/admin/schedule-booking-emails`, {
                booking_id: booking.id,
                confirmation_config: confirmationConfig,
                language: booking.language || 'pt',
                tour_date: booking.tour_date
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setEmailSuccess(`🎯 Estratégia de emails agendada para ${booking.customer_name}`);
            setTimeout(() => setEmailSuccess(''), 4000);
            
            console.log('⚡ Estratégia agendada:', response.data);
        } catch (error) {
            console.error('Erro ao agendar emails:', error);
            setError(`Erro ao agendar emails: ${error.response?.data?.detail || error.message}`);
        } finally {
            setEmailLoading(false);
        }
    };

    const sendBulkEmails = async () => {
        if (emailStrategy.selectedBookings.length === 0) {
            setError('Selecione pelo menos uma reserva');
            return;
        }

        setEmailLoading(true);
        let successCount = 0;
        let errorCount = 0;

        for (const bookingId of emailStrategy.selectedBookings) {
            const booking = bookings.find(b => b.id === bookingId);
            if (booking) {
                try {
                    await sendIndividualEmail(booking, emailStrategy.emailType);
                    successCount++;
                } catch (error) {
                    errorCount++;
                }
                // Delay entre emails para evitar spam
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        setEmailSuccess(`📧 Emails enviados: ${successCount} sucessos, ${errorCount} erros`);
        setEmailStrategy(prev => ({ ...prev, selectedBookings: [] }));
        setEmailLoading(false);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            // Se for timestamp do Firestore
            if (dateStr.seconds) {
                return new Date(dateStr.seconds * 1000).toLocaleDateString('pt-PT');
            }
            // Se for string ISO
            return new Date(dateStr).toLocaleDateString('pt-PT');
        } catch {
            return dateStr;
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR'
        }).format(price || 0);
    };

    const getEmailByLanguage = (language) => {
        const emails = {
            'pt': 'reserva@9rocks.pt',
            'en': 'booking@9rocks.pt',
            'es': 'reservas@9rocks.pt'
        };
        return emails[language] || emails['pt'];
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'confirmed': { bg: 'bg-green-100 text-green-800', label: 'Confirmada' },
            'pending': { bg: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
            'cancelled': { bg: 'bg-red-100 text-red-800', label: 'Cancelada' },
            'completed': { bg: 'bg-blue-100 text-blue-800', label: 'Concluída' }
        };
        
        const info = statusMap[status] || { bg: 'bg-gray-100 text-gray-800', label: status };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.bg}`}>
                {info.label}
            </span>
        );
    };

    const uniqueTours = [...new Set(bookings.map(b => b.tour_id).filter(Boolean))];

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-3">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className="h-16 bg-gray-100 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-2">📋 Gestão de Reservas</h1>
                <p className="text-blue-100">Gerir todas as reservas e sistema de emails</p>
            </div>

            {/* ✅ NOVO: Seletor de Fonte de Dados */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900">📊 Fonte de Dados</h3>
                        <p className="text-sm text-gray-600">Escolha onde buscar as reservas</p>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setDataSource('firebase')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                dataSource === 'firebase'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            🔥 Firebase
                        </button>
                        <button
                            onClick={() => setDataSource('backend')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                dataSource === 'backend'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            🌐 Backend API
                        </button>
                        <button
                            onClick={fetchBookings}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                        >
                            🔄 Atualizar
                        </button>
                    </div>
                </div>
            </div>

            {/* Email Success/Error Messages */}
            {emailSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                    {emailSuccess}
                </div>
            )}
            
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    {error}
                    <button 
                        onClick={() => setError('')}
                        className="ml-2 text-red-600 hover:text-red-800"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Filters & Email Controls */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Filtros */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">🔍 Filtros</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select 
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                >
                                    <option value="all">Todos</option>
                                    <option value="pending">Pendentes</option>
                                    <option value="confirmed">Confirmadas</option>
                                    <option value="cancelled">Canceladas</option>
                                    <option value="completed">Concluídas</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tour</label>
                                <select 
                                    value={filters.tour}
                                    onChange={(e) => handleFilterChange('tour', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                >
                                    <option value="all">Todos os tours</option>
                                    {uniqueTours.map(tour => (
                                        <option key={tour} value={tour}>{tour}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pesquisar</label>
                                <input
                                    type="text"
                                    placeholder="Nome, email, tour..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email Strategy Controls */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">📧 Sistema de Emails</h3>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={emailStrategy.enabled}
                                    onChange={(e) => setEmailStrategy(prev => ({ ...prev, enabled: e.target.checked }))}
                                    className="mr-2"
                                />
                                <span className="text-sm">Ativar funcionalidades avançadas</span>
                            </label>
                        </div>

                        {emailStrategy.enabled && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Email</label>
                                    <select 
                                        value={emailStrategy.emailType}
                                        onChange={(e) => setEmailStrategy(prev => ({ ...prev, emailType: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                    >
                                        <option value="booking_confirmation">📧 Confirmação</option>
                                        <option value="booking_reminder">🎒 Lembrete</option>
                                    </select>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={sendBulkEmails}
                                        disabled={emailLoading || emailStrategy.selectedBookings.length === 0}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center"
                                    >
                                        {emailLoading ? '⏳' : '📧'} 
                                        <span className="ml-1">
                                            Enviar para Selecionadas ({emailStrategy.selectedBookings.length})
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="text-2xl font-bold text-blue-600">{filteredBookings.length}</div>
                    <div className="text-sm text-gray-600">Reservas Filtradas</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="text-2xl font-bold text-yellow-600">
                        {filteredBookings.filter(b => b.status === 'pending').length}
                    </div>
                    <div className="text-sm text-gray-600">Pendentes</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="text-2xl font-bold text-green-600">
                        {filteredBookings.filter(b => b.status === 'confirmed').length}
                    </div>
                    <div className="text-sm text-gray-600">Confirmadas</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="text-2xl font-bold text-purple-600">
                        {formatPrice(filteredBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0))}
                    </div>
                    <div className="text-sm text-gray-600">Receita Filtrada</div>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {emailStrategy.enabled && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <input
                                            type="checkbox"
                                            checked={emailStrategy.selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                                            onChange={(e) => {
                                                setEmailStrategy(prev => ({
                                                    ...prev,
                                                    selectedBookings: e.target.checked ? filteredBookings.map(b => b.id) : []
                                                }));
                                            }}
                                        />
                                    </th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tour</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredBookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50">
                                    {emailStrategy.enabled && (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={emailStrategy.selectedBookings.includes(booking.id)}
                                                onChange={() => handleEmailToggle(booking.id)}
                                            />
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{booking.customer_name}</div>
                                            <div className="text-sm text-gray-500">{booking.customer_email}</div>
                                            <div className="text-xs text-gray-400">
                                                {booking.language && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
                                                        {booking.language.toUpperCase()}
                                                    </span>
                                                )}
                                                {booking.test_booking && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 ml-1">
                                                        🧪 TESTE
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{booking.tour_name || booking.tour_id}</div>
                                        <div className="text-xs text-gray-500">Participantes: {booking.participants || 1}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(booking.tour_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(booking.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatPrice(booking.total_amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-y-1">
                                        {emailStrategy.enabled ? (
                                            <div className="flex flex-wrap gap-1">
                                                <button
                                                    onClick={() => sendIndividualEmail(booking, 'booking_confirmation')}
                                                    disabled={emailLoading}
                                                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs hover:bg-blue-200 disabled:opacity-50"
                                                    title="Enviar email de confirmação"
                                                >
                                                    📧
                                                </button>
                                                <button
                                                    onClick={() => sendIndividualEmail(booking, 'booking_reminder')}
                                                    disabled={emailLoading}
                                                    className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs hover:bg-orange-200 disabled:opacity-50"
                                                    title="Enviar email de lembrete"
                                                >
                                                    🎒
                                                </button>
                                                <button
                                                    onClick={() => scheduleEmailStrategy(booking)}
                                                    disabled={emailLoading}
                                                    className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs hover:bg-purple-200 disabled:opacity-50"
                                                    title="Agendar estratégia completa"
                                                >
                                                    ⚡
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-500">
                                                Ative emails para ver ações
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredBookings.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-lg mb-2">📭</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma reserva encontrada</h3>
                        <p className="text-gray-500">
                            {dataSource === 'firebase' 
                                ? 'Tente criar uma reserva de teste no Firebase ou verificar se há reservas na coleção "bookings".' 
                                : 'Tente ajustar os filtros ou verificar se há reservas na base de dados.'
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminBookings;