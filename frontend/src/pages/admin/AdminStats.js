import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, Title, Tooltip, Legend, PointElement, ArcElement } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const AdminStats = () => {
    const [stats, setStats] = useState(null);
    const [basicStats, setBasicStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [period, setPeriod] = useState('last_6_months');

    useEffect(() => {
        fetchStats();
    }, [period]);

    const fetchStats = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('admin_token');
            
            // Buscar stats básicas e avançadas em paralelo
            const [basicResponse, advancedResponse] = await Promise.all([
                axios.get(`${BACKEND_URL}/api/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${BACKEND_URL}/api/admin/advanced-stats`, {
                    params: { period },
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setBasicStats(basicResponse.data);
            setStats(advancedResponse.data);
            console.log('📊 Stats avançadas carregadas:', advancedResponse.data);
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            setError('Erro ao carregar estatísticas avançadas');
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
            const date = new Date(dateStr);
            return date.toLocaleDateString('pt-PT', { 
                year: 'numeric', 
                month: 'short' 
            });
        } catch {
            return dateStr;
        }
    };

    // Configuração dos gráficos
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
                }
            },
            x: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
                }
            }
        }
    };

    // Dados para gráfico de receitas por mês
    const revenueChartData = stats?.revenue_by_month ? {
        labels: Object.keys(stats.revenue_by_month).sort().map(month => formatDate(month + '-01')),
        datasets: [
            {
                label: 'Receita (€)',
                data: Object.keys(stats.revenue_by_month).sort().map(month => stats.revenue_by_month[month]),
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 2,
                borderRadius: 4,
            }
        ]
    } : null;

    // Dados para gráfico de reservas por mês
    const bookingsChartData = stats?.bookings_by_month ? {
        labels: Object.keys(stats.bookings_by_month).sort().map(month => formatDate(month + '-01')),
        datasets: [
            {
                label: 'Reservas',
                data: Object.keys(stats.bookings_by_month).sort().map(month => stats.bookings_by_month[month]),
                fill: true,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 3,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: 'white',
                pointBorderWidth: 2,
                pointRadius: 6,
                tension: 0.4,
            }
        ]
    } : null;

    // Dados para gráfico de idiomas
    const languageChartData = stats?.demographics?.languages ? {
        labels: Object.keys(stats.demographics.languages).map(lang => lang.toUpperCase()),
        datasets: [
            {
                data: Object.values(stats.demographics.languages),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',   // Azul para PT
                    'rgba(34, 197, 94, 0.8)',    // Verde para EN
                    'rgba(251, 191, 36, 0.8)',   // Amarelo para ES
                    'rgba(168, 85, 247, 0.8)',   // Roxo para outros
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(34, 197, 94, 1)',
                    'rgba(251, 191, 36, 1)',
                    'rgba(168, 85, 247, 1)',
                ],
                borderWidth: 2,
            }
        ]
    } : null;

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg shadow-lg animate-pulse">
                    <div className="h-8 bg-purple-300 rounded mb-2"></div>
                    <div className="h-4 bg-purple-300 rounded w-1/2"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                            <div className="h-8 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1,2].map(i => (
                        <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                            <div className="h-64 bg-gray-200 rounded"></div>
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
                        <h3 className="text-red-800 font-semibold">Erro ao carregar estatísticas</h3>
                        <p className="text-red-600">{error}</p>
                        <button 
                            onClick={fetchStats}
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
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">📊 Analytics & Estatísticas</h1>
                        <p className="text-purple-100 text-lg">Insights detalhados do seu negócio</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                        <label className="block text-sm font-medium text-purple-100 mb-2">Período de Análise</label>
                        <select 
                            value={period} 
                            onChange={(e) => setPeriod(e.target.value)}
                            className="bg-white text-gray-900 border-0 rounded-md px-3 py-2 text-sm font-medium"
                        >
                            <option value="last_30_days">Últimos 30 dias</option>
                            <option value="last_6_months">Últimos 6 meses</option>
                            <option value="this_year">Este ano</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* KPIs Principais */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard
                        title="Receita do Período"
                        value={formatPrice(stats.total_revenue)}
                        subtitle={`${stats.total_bookings} reservas`}
                        icon="💰"
                        color="green"
                        trend={stats.conversion_metrics?.avg_booking_value ? `Média: ${formatPrice(stats.conversion_metrics.avg_booking_value)}` : null}
                    />
                    <KPICard
                        title="Taxa de Conversão"
                        value={`${stats.conversion_metrics?.booking_to_payment || 0}%`}
                        subtitle="Reserva → Pagamento"
                        icon="📈"
                        color="blue"
                        trend={stats.conversion_metrics?.booking_to_payment > 70 ? "Excelente" : stats.conversion_metrics?.booking_to_payment > 50 ? "Bom" : "Melhorar"}
                    />
                    <KPICard
                        title="Emails Enviados"
                        value={stats.email_stats?.total_sent || 0}
                        subtitle="No período"
                        icon="📧"
                        color="purple"
                        trend={Object.values(stats.email_stats?.by_type || {}).length > 0 ? `${Object.keys(stats.email_stats.by_type).length} tipos` : null}
                    />
                    <KPICard
                        title="Grupo Médio"
                        value={`${stats.demographics?.avg_group_size || 0} pessoas`}
                        subtitle={`${stats.demographics?.total_participants || 0} total`}
                        icon="👥"
                        color="orange"
                        trend={stats.demographics?.avg_group_size > 2 ? "Grupos grandes" : "Individual"}
                    />
                </div>
            )}

            {/* Gráficos Principais */}
            {stats && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Receita por Mês */}
                    {revenueChartData && (
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="mr-2">💰</span>
                                Receita por Mês
                            </h3>
                            <div className="h-64">
                                <Bar data={revenueChartData} options={chartOptions} />
                            </div>
                        </div>
                    )}

                    {/* Reservas por Mês */}
                    {bookingsChartData && (
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="mr-2">📋</span>
                                Reservas por Mês
                            </h3>
                            <div className="h-64">
                                <Line data={bookingsChartData} options={chartOptions} />
                            </div>
                        </div>
                    )}

                    {/* Demografia - Idiomas */}
                    {languageChartData && (
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="mr-2">🌍</span>
                                Distribuição por Idioma
                            </h3>
                            <div className="h-64">
                                <Doughnut 
                                    data={languageChartData} 
                                    options={{
                                        ...chartOptions,
                                        scales: undefined,
                                        plugins: {
                                            ...chartOptions.plugins,
                                            legend: {
                                                position: 'bottom'
                                            }
                                        }
                                    }} 
                                />
                            </div>
                        </div>
                    )}

                    {/* Performance de Tours */}
                    {stats.tour_performance && Object.keys(stats.tour_performance).length > 0 && (
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="mr-2">🏔️</span>
                                Performance dos Tours
                            </h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {Object.entries(stats.tour_performance)
                                    .sort(([,a], [,b]) => b.bookings - a.bookings)
                                    .slice(0, 10)
                                    .map(([tourId, data], index) => (
                                    <div key={tourId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center">
                                            <span className="text-lg mr-3">
                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏔️'}
                                            </span>
                                            <div>
                                                <div className="font-medium text-gray-900 truncate max-w-40">{tourId}</div>
                                                <div className="text-sm text-gray-500">{data.bookings} reservas</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-green-600">{formatPrice(data.revenue)}</div>
                                            <div className="text-xs text-gray-500">receita</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Estatísticas de Email */}
            {stats?.email_stats && Object.keys(stats.email_stats.by_type || {}).length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="mr-2">📧</span>
                        Estatísticas de Email
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Emails por Tipo */}
                        <div>
                            <h4 className="font-medium text-gray-700 mb-3">Por Tipo</h4>
                            <div className="space-y-2">
                                {Object.entries(stats.email_stats.by_type).map(([type, count]) => (
                                    <div key={type} className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 capitalize">
                                            {type === 'booking_confirmation' ? '📧 Confirmação' : 
                                             type === 'booking_reminder' ? '🎒 Lembrete' : type}
                                        </span>
                                        <span className="font-semibold text-blue-600">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Emails por Idioma */}
                        <div>
                            <h4 className="font-medium text-gray-700 mb-3">Por Idioma</h4>
                            <div className="space-y-2">
                                {Object.entries(stats.email_stats.by_language).map(([lang, count]) => (
                                    <div key={lang} className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">{lang.toUpperCase()}</span>
                                        <span className="font-semibold text-green-600">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Resumo */}
                        <div>
                            <h4 className="font-medium text-gray-700 mb-3">Resumo</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Total Enviados</span>
                                    <span className="font-semibold text-purple-600">{stats.email_stats.total_sent}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Período</span>
                                    <span className="text-sm text-gray-500">{period.replace('_', ' ')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Comparação com Stats Básicas */}
            {basicStats && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="mr-2">📊</span>
                        Comparação: Período vs Total
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ComparisonCard
                            title="Reservas"
                            periodValue={stats?.total_bookings || 0}
                            totalValue={basicStats.total_bookings}
                            formatter={(val) => val.toString()}
                        />
                        <ComparisonCard
                            title="Receita"
                            periodValue={stats?.total_revenue || 0}
                            totalValue={basicStats.total_revenue}
                            formatter={formatPrice}
                        />
                        <ComparisonCard
                            title="Taxa de Conversão"
                            periodValue={stats?.conversion_metrics?.booking_to_payment || 0}
                            totalValue={basicStats.conversion_rate}
                            formatter={(val) => `${val}%`}
                        />
                    </div>
                </div>
            )}

            {/* Insights */}
            {stats && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="mr-2">💡</span>
                        Insights Automáticos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InsightCard
                            icon="🎯"
                            title="Tour Mais Popular"
                            content={Object.entries(stats.tour_performance || {})
                                .sort(([,a], [,b]) => b.bookings - a.bookings)[0]?.[0] || 'N/A'}
                        />
                        <InsightCard
                            icon="🌍"
                            title="Mercado Principal"
                            content={Object.entries(stats.demographics?.languages || {})
                                .sort(([,a], [,b]) => b - a)[0]?.[0]?.toUpperCase() || 'N/A'}
                        />
                        <InsightCard
                            icon="📈"
                            title="Performance"
                            content={stats.conversion_metrics?.booking_to_payment > 70 ? 'Excelente conversão!' : 
                                    stats.conversion_metrics?.booking_to_payment > 50 ? 'Boa conversão' : 
                                    'Pode melhorar conversão'}
                        />
                        <InsightCard
                            icon="📧"
                            title="Email Marketing"
                            content={stats.email_stats?.total_sent > 0 ? 
                                    `${stats.email_stats.total_sent} emails enviados` : 
                                    'Considere usar email marketing'}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const KPICard = ({ title, value, subtitle, icon, color, trend }) => {
    const colors = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-orange-600'
    };

    return (
        <div className={`bg-gradient-to-r ${colors[color]} text-white p-6 rounded-lg shadow-lg`}>
            <div className="flex items-center justify-between mb-2">
                <div className="text-3xl opacity-80">{icon}</div>
                <div className="text-right">
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-sm opacity-90">{subtitle}</div>
                </div>
            </div>
            <div className="text-sm font-medium opacity-90">{title}</div>
            {trend && (
                <div className="text-xs opacity-75 mt-1">{trend}</div>
            )}
        </div>
    );
};

const ComparisonCard = ({ title, periodValue, totalValue, formatter }) => {
    const percentage = totalValue > 0 ? Math.round((periodValue / totalValue) * 100) : 0;
    
    return (
        <div className="text-center">
            <h4 className="font-medium text-gray-700 mb-2">{title}</h4>
            <div className="text-2xl font-bold text-blue-600 mb-1">{formatter(periodValue)}</div>
            <div className="text-sm text-gray-500">de {formatter(totalValue)} total</div>
            <div className="text-xs text-purple-600 font-medium">{percentage}% do total</div>
        </div>
    );
};

const InsightCard = ({ icon, title, content }) => (
    <div className="bg-white p-4 rounded-lg border border-blue-200">
        <div className="flex items-center mb-2">
            <span className="text-xl mr-2">{icon}</span>
            <h4 className="font-medium text-gray-900">{title}</h4>
        </div>
        <p className="text-sm text-gray-600">{content}</p>
    </div>
);

export default AdminStats;