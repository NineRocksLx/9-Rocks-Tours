// ============================================================================
// 🔧 EXTENSÃO PARA O TEU AdminPanel.js - ADICIONAR SECÇÃO PAGAMENTOS PAYPAL
// ============================================================================

// 📋 INSTRUÇÕES DE IMPLEMENTAÇÃO:
// 1. Adicionar novo estado para payments
// 2. Adicionar nova tab "Pagamentos" 
// 3. Adicionar função fetchPayments
// 4. Adicionar renderização da secção de pagamentos
// 5. Melhorar estatísticas para incluir dados PayPal

// ============================================================================
// 🆕 NOVOS ESTADOS A ADICIONAR (no início do componente)
// ============================================================================

const [payments, setPayments] = useState([]); // 🆕 ADICIONAR ESTE ESTADO

// ============================================================================
// 🆕 NOVA FUNÇÃO PARA BUSCAR PAGAMENTOS (adicionar após fetchStats)
// ============================================================================

const fetchPayments = async () => {
    if (!isLoggedIn) return;
    
    setLoading(true);
    setError('');
    
    try {
        const token = localStorage.getItem('admin_token');
        const response = await axios.get(`${BACKEND_URL}/api/admin/payments`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setPayments(response.data || []);
        console.log('💳 Pagamentos carregados:', response.data?.length || 0);
    } catch (err) {
        if (err.response?.status === 401) {
            setError('Sessão expirada. Faça login novamente.');
            handleLogout();
        } else {
            setError('Erro ao carregar pagamentos');
            console.error('Erro pagamentos:', err);
        }
    } finally {
        setLoading(false);
    }
};

// ============================================================================
// 🔧 MODIFICAR useEffect EXISTENTE (adicionar payments na condição)
// ============================================================================

useEffect(() => {
    if (isLoggedIn) {
        if (currentView === 'tours' && !editingTour) {
            fetchTours();
        } else if (currentView === 'bookings') {
            fetchBookings();
        } else if (currentView === 'payments') {  // 🆕 ADICIONAR ESTA LINHA
            fetchPayments();
        } else if (currentView === 'stats') {
            fetchStats();
        }
    }
}, [currentView, isLoggedIn, editingTour]);

// ============================================================================
// 🆕 ADICIONAR NOVA TAB "Pagamentos" (na navegação existente)
// ============================================================================

// Encontrar a secção <nav className="flex space-x-8 overflow-x-auto">
// e adicionar este botão ANTES de "Estatísticas":

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

// ============================================================================
// 🆕 NOVA SECÇÃO DE PAGAMENTOS (adicionar após {currentView === 'bookings' && ...})
// ============================================================================

{currentView === 'payments' && !loading && (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">💳 Gestão de Pagamentos PayPal</h2>
            <div className="flex space-x-3">
                <button
                    onClick={() => window.open('https://developer.paypal.com/', '_blank')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center transition-colors duration-200"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M7 7h10M7 7v10M17 7v2" />
                    </svg>
                    PayPal Dashboard
                </button>
                <button
                    onClick={fetchPayments}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center transition-colors duration-200"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Atualizar
                </button>
            </div>
        </div>

        {/* Estatísticas Rápidas de Pagamentos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                <div className="text-2xl font-bold">
                    {payments.filter(p => p.status === 'completed').length}
                </div>
                <div className="text-sm opacity-90">Pagamentos Confirmados</div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                <div className="text-2xl font-bold">
                    €{payments.filter(p => p.status === 'completed')
                        .reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
                </div>
                <div className="text-sm opacity-90">Receita PayPal Total</div>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-4 rounded-lg">
                <div className="text-2xl font-bold">
                    {payments.filter(p => p.status === 'created' || p.status === 'pending').length}
                </div>
                <div className="text-sm opacity-90">Pagamentos Pendentes</div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                <div className="text-2xl font-bold">
                    {payments.length}
                </div>
                <div className="text-sm opacity-90">Total Transações</div>
            </div>
        </div>

        {/* Tabela de Pagamentos */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
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
                                Transaction ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Data
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {payments.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                    <div className="text-4xl mb-4">💳</div>
                                    <div>Nenhum pagamento encontrado</div>
                                    <div className="text-sm mt-2">
                                        Os pagamentos aparecerão aqui quando os clientes efetuarem reservas
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            payments
                                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                .map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-50 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-mono text-gray-900">
                                            {payment.payment_id ? (
                                                <span title={payment.payment_id}>
                                                    {payment.payment_id.substring(0, 15)}...
                                                </span>
                                            ) : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <div className="text-sm font-medium text-gray-900">
                                                {payment.customer_name || 'N/A'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {payment.customer_email || 'N/A'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">
                                            €{(payment.amount || 0).toFixed(2)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {payment.currency || 'EUR'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            payment.status === 'created' ? 'bg-blue-100 text-blue-800' :
                                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {payment.status === 'completed' ? '✅ Pago' :
                                            payment.status === 'created' ? '🔄 Criado' :
                                            payment.status === 'pending' ? '⏳ Pendente' :
                                            payment.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-mono text-gray-900">
                                            {payment.transaction_id ? (
                                                <span title={payment.transaction_id}>
                                                    {payment.transaction_id.substring(0, 12)}...
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">Aguardando</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {payment.created_at ? formatDate(payment.created_at) : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            {payment.booking_id && (
                                                <button
                                                    onClick={() => {
                                                        // Ir para a tab de reservas e highlight a reserva
                                                        setCurrentView('bookings');
                                                        // Optional: filtrar por booking_id
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 text-xs bg-blue-50 px-2 py-1 rounded"
                                                    title="Ver reserva relacionada"
                                                >
                                                    📋 Reserva
                                                </button>
                                            )}
                                            {payment.payment_id && (
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(payment.payment_id);
                                                        alert('Payment ID copiado!');
                                                    }}
                                                    className="text-gray-600 hover:text-gray-900 text-xs bg-gray-50 px-2 py-1 rounded"
                                                    title="Copiar Payment ID"
                                                >
                                                    📋 Copy
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Informações Úteis */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Informações sobre Pagamentos PayPal</h3>
            <div className="text-sm text-blue-800 space-y-1">
                <p><strong>✅ Completed:</strong> Pagamento confirmado e processado com sucesso</p>
                <p><strong>🔄 Created:</strong> Pagamento criado, aguardando aprovação do cliente</p>
                <p><strong>⏳ Pending:</strong> Pagamento em processamento</p>
                <p><strong>💡 Dica:</strong> Pagamentos "Created" expiram se não forem completados em 3 horas</p>
            </div>
        </div>
    </div>
)}

// ============================================================================
// 🔧 MELHORAR ESTATÍSTICAS EXISTENTES (na secção stats)
// ============================================================================

// Na secção {currentView === 'stats' && !loading && stats && (...)}
// Adicionar este card ANTES dos cards existentes:

<div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-lg mb-6">
    <div className="flex items-center justify-between">
        <div>
            <h3 className="text-lg font-semibold mb-2">💳 Resumo PayPal</h3>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="text-2xl font-bold">
                        {payments.filter(p => p.status === 'completed').length}
                    </div>
                    <div className="text-sm opacity-90">Pagamentos Confirmados</div>
                </div>
                <div>
                    <div className="text-2xl font-bold">
                        €{payments.filter(p => p.status === 'completed')
                            .reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
                    </div>
                    <div className="text-sm opacity-90">Receita PayPal</div>
                </div>
            </div>
        </div>
        <div className="text-4xl opacity-80">💳</div>
    </div>
</div>