import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import AdminBookings from './AdminBookings';
import AdminStats from './AdminStats';
import AdminSettings from './AdminSettings';

const AdminLayout = ({ user, onLogout }) => {
    const navigate = useNavigate();

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: '🎯', exact: true },
        { name: 'Reservas', href: '/admin/bookings', icon: '📋' },
        { name: 'Estatísticas', href: '/admin/stats', icon: '📊' },
        { name: 'Configurações', href: '/admin/settings', icon: '⚙️' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        onLogout();
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                🏔️ 9 Rocks Tours - Admin
                            </h1>
                            {user && (
                                <p className="text-sm text-gray-600 mt-1">
                                    Conectado como: {user.email}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center shadow-sm"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-1 overflow-x-auto py-2">
                        {navigation.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                end={item.exact}
                                className={({ isActive }) =>
                                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                                        isActive
                                            ? 'bg-blue-100 text-blue-700 shadow-sm border border-blue-200'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`
                                }
                            >
                                <span className="mr-2 text-lg">{item.icon}</span>
                                {item.name}
                            </NavLink>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Routes>
                    <Route index element={<AdminDashboard />} />
                    <Route path="bookings" element={<AdminBookings />} />
                    <Route path="stats" element={<AdminStats />} />
                    <Route path="settings" element={<AdminSettings />} />
                </Routes>
            </main>
        </div>
    );
};

export default AdminLayout;