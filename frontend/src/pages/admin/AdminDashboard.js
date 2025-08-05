import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchQuickStats();
    }, []);

    const fetchQuickStats = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('admin_token');
            const response = await axios.get(`${BACKEND_URL}/api/admin/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
            console.log('📊 Stats carregadas:', response.data);
        } catch (error) {
            console.error('Erro ao carregar stats:', error);
            setError('Erro ao carregar estatísticas');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR'
        }).format(price || 0);
    };

    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleDateString('pt-PT');
        } catch {
            return dateStr;
        }
    };

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-xl shadow-lg animate-pulse">
                    <div className="h-8 bg-blue-300 rounded mb-2"></div>
                    <div className="h-4 bg-blue-300 rounded w-1/2"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                            <div className="h-8 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center">
                    <span className="text-2xl mr-3">❌</span>
                    <div>
                        <h3 className="text-red-800 font-semibold">Erro ao carregar dashboard</h3>
                        <p className="text-red-600">{error}</p>
                        <button 
                            onClick={fetchQuickStats}
                            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        >
                            Tentar novamente
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header Hero */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold mb-2">🎯 Dashboard 9 Rocks Tours</h1>
                <p className="text-blue-100 text-lg">Visão geral do seu negócio de aventuras na Madeira</p>
                {stats?.last_updated && (
                    <p className="text-blue-200 text-sm mt-2">
                        Última atualização: {formatDate(stats.last_updated)}
                    </p>
                )}
            </div>

            {/* Quick Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Reservas"
                        value={stats.total_bookings}
                        icon="📋"
                        color="blue"
                        subtitle={`${stats.pending_bookings || 0} pendentes`}
                    />
                    <StatCard
                        title="Receita Total"
                        value={formatPrice(stats.total_revenue)}
                        icon="💰"
                        color="green"
                        subtitle={`Média: ${formatPrice(stats.average_booking_value || 0)}`}
                    />
                    <StatCard
                        title="Taxa Conversão"
                        value={`${stats.conversion_rate || 0}%`}
                        icon="📈"
                        color="purple"
                        subtitle={`${stats.completed_bookings || 0} confirmadas`}
                    />
                    <StatCard
                        title="Tours Ativos"
                        value={stats.active_tours}
                        icon="🏔️"
                        color="orange"
                        subtitle={`${stats.cancelled_bookings || 0} canceladas`}
                    />
                </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-bold mb-6 flex items-center">
                    <span className="mr-2">⚡</span>
                    Ações Rápidas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <QuickAction
                        title="Gerir Reservas"
                        description="Ver e gerir todas as reservas"
                        icon="📋"
                        href="/admin/bookings"
                        color="blue"
                        badge={stats?.pending_bookings > 0 ? stats.pending_bookings : null}
                    />
                    <QuickAction
                        title="Estatísticas"
                        description="Analytics e relatórios detalhados"
                        icon="📊"
                        href="/admin/stats"
                        color="green"
                    />
                    <QuickAction
                        title="Configurações"
                        description="Tours, imagens e filtros"
                        icon="⚙️"
                        href="/admin/settings"
                        color="purple"
                    />
                    <QuickAction
                        title="Ver Site"
                        description="Abrir site público"
                        icon="🌐"
                        href="https://9rocks.pt"
                        color="gray"
                        external={true}
                    />
                </div>
            </div>

            {/* Recent Activity & Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Bookings */}
                {stats?.bookings_by_date && Object.keys(stats.bookings_by_date).length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-xl font-bold mb-4 flex items-center">
                            <span className="mr-2">📈</span>
                            Atividade Recente (30 dias)
                        </h2>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {Object.entries(stats.bookings_by_date)
                                .sort(([a], [b]) => new Date(b) - new Date(a))
                                .slice(0, 10)
                                .map(([date, count]) => (
                                <div key={date} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-700 font-medium">{formatDate(date)}</span>
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-semibold">
                                        {count} reserva{count !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Status Overview */}
                {stats?.bookings_by_status && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-xl font-bold mb-4 flex items-center">
                            <span className="mr-2">📊</span>
                            Status das Reservas
                        </h2>
                        <div className="space-y-3">
                            {Object.entries(stats.bookings_by_status).map(([status, count]) => {
                                const statusInfo = getStatusInfo(status);
                                return (
                                    <div key={status} className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <span className="mr-2">{statusInfo.icon}</span>
                                            <span className="capitalize font-medium">{statusInfo.label}</span>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.bgColor}`}>
                                            {count}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Performance Insights */}
            {stats?.bookings_by_tour && Object.keys(stats.bookings_by_tour).length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                        <span className="mr-2">🏆</span>
                        Tours Mais Populares
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(stats.bookings_by_tour)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 6)
                            .map(([tourId, count], index) => (
                            <div key={tourId} className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-medium text-gray-900 truncate">{tourId}</h3>
                                        <p className="text-sm text-gray-600">{count} reservas</p>
                                    </div>
                                    <div className="text-2xl">
                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏔️'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, icon, color, subtitle }) => {
    const colors = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-orange-600'
    };

    return (
        <div className={`bg-gradient-to-r ${colors[color]} text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="text-2xl font-bold mb-1">{value}</div>
                    <div className="text-sm opacity-90 font-medium">{title}</div>
                    {subtitle && (
                        <div className="text-xs opacity-75 mt-1">{subtitle}</div>
                    )}
                </div>
                <div className="text-3xl opacity-80 ml-4">{icon}</div>
            </div>
        </div>
    );
};

const QuickAction = ({ title, description, icon, href, color, external = false, badge = null }) => {
    const colors = {
        blue: 'hover:bg-blue-50 border-blue-200 hover:border-blue-300',
        green: 'hover:bg-green-50 border-green-200 hover:border-green-300',
        purple: 'hover:bg-purple-50 border-purple-200 hover:border-purple-300',
        gray: 'hover:bg-gray-50 border-gray-200 hover:border-gray-300'
    };

    const ActionComponent = external ? 'a' : Link;
    const actionProps = external 
        ? { href, target: '_blank', rel: 'noopener noreferrer' }
        : { to: href };

    return (
        <ActionComponent
            {...actionProps}
            className={`relative block p-4 border-2 rounded-lg transition-all duration-200 ${colors[color]} group`}
        >
            {badge && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                    {badge}
                </span>
            )}
            <div className="flex items-center mb-2">
                <span className="text-2xl mr-3 group-hover:scale-110 transition-transform duration-200">{icon}</span>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                {external && (
                    <svg className="w-4 h-4 ml-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                )}
            </div>
            <p className="text-sm text-gray-600">{description}</p>
        </ActionComponent>
    );
};

const getStatusInfo = (status) => {
    const statusMap = {
        'confirmed': { icon: '✅', label: 'Confirmadas', bgColor: 'bg-green-100 text-green-800' },
        'pending': { icon: '⏳', label: 'Pendentes', bgColor: 'bg-yellow-100 text-yellow-800' },
        'cancelled': { icon: '❌', label: 'Canceladas', bgColor: 'bg-red-100 text-red-800' },
        'completed': { icon: '🎉', label: 'Concluídas', bgColor: 'bg-blue-100 text-blue-800' }
    };
    
    return statusMap[status] || { icon: '❓', label: status, bgColor: 'bg-gray-100 text-gray-800' };
};

export default AdminDashboard;