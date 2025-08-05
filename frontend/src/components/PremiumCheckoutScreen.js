// PremiumCheckoutScreen.js - 9 Rocks Tours - Checkout Premium com Pagamento Imediato
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Switch
} from 'react-native';
import { usePremiumEmbeddedPayment } from './hooks/usePremiumEmbeddedPayment';

const PremiumCheckoutScreen = ({ route, navigation }) => {
  const { bookingData } = route.params;
  
  // Estados locais para interface
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  // ✨ CONFIGURAÇÕES PREMIUM
  const [premiumSettings, setPremiumSettings] = useState({
    enableFormSheetAction: true,    // Pagamento imediato na planilha
    enableGooglePay: true,          // Google Pay habilitado
    formSheetActionType: 'confirm', // Tipo de ação na planilha
    autoNavigateOnSuccess: true     // Navegar automaticamente no sucesso
  });

  // 🚀 USAR O HOOK PREMIUM
  const {
    // Estados principais
    isInitialized,
    isProcessing,
    bookingId,
    currentAmount,
    originalAmount,

    // Componentes do Stripe
    embeddedPaymentElementView,
    paymentOption,
    loadingError,

    // Métodos principais
    confirmPaymentManual,
    applyDiscountCode,
    removeDiscount,

    // ✨ NOVOS: Estados do Form Sheet
    formSheetPaymentResult,
    lastPaymentAttempt,

    // ✨ NOVOS: Configurações Premium
    enableFormSheetAction,
    enableGooglePay,

    // Funcionalidades de desconto
    discountApplied,

    // Status helpers
    isReady,
    hasError,
    canPay,
    hasDiscount,
    savings,
    formatCurrency,

    // Debug
    getDebugInfo
  } = usePremiumEmbeddedPayment(bookingData, {
    ...premiumSettings,
    onPaymentComplete: handlePaymentComplete // Callback customizado
  });

  // 🎉 CALLBACK PERSONALIZADO PARA SUCESSO
  function handlePaymentComplete(result) {
    console.log('🎉 Payment Complete Callback:', result);

    if (result.success) {
      // Navegar para tela de sucesso com dados completos
      navigation.replace('BookingSuccess', {
        bookingId: result.bookingId,
        paymentIntentId: result.paymentIntent?.id,
        amount: result.amount,
        savings: result.savings || 0,
        paymentMethod: result.method,
        isFormSheetPayment: result.method === 'form_sheet'
      });
    }
  }

  // 💳 PROCESSAR PAGAMENTO MANUAL (QUANDO FORM SHEET ESTÁ DESABILITADO)
  const handleManualPayment = useCallback(async () => {
    try {
      const result = await confirmPaymentManual();

      if (result.success && result.status === 'completed') {
        // Navegar para sucesso
        navigation.replace('BookingSuccess', {
          bookingId: result.bookingId,
          paymentIntentId: result.paymentIntent?.id,
          amount: currentAmount,
          savings: hasDiscount ? savings : 0,
          paymentMethod: 'manual'
        });
      } else if (result.status === 'failed') {
        Alert.alert(
          'Erro no Pagamento',
          result.error || 'Ocorreu um erro durante o processamento.',
          [{ text: 'Tentar Novamente' }]
        );
      }

    } catch (error) {
      Alert.alert('Erro Inesperado', 'Tente novamente ou entre em contato conosco.');
    }
  }, [confirmPaymentManual, currentAmount, hasDiscount, savings, navigation]);

  // 🎁 APLICAR CÓDIGO DE DESCONTO
  const handleApplyDiscount = useCallback(async () => {
    if (!discountCodeInput.trim()) {
      Alert.alert('Atenção', 'Digite um código de desconto');
      return;
    }

    try {
      setApplyingDiscount(true);

      const result = await applyDiscountCode(discountCodeInput);

      if (result.success) {
        Alert.alert(
          '🎉 Desconto Aplicado!',
          `Desconto de ${formatCurrency(result.savings)} aplicado!\n\nNovo valor: ${formatCurrency(result.newAmount)}`,
          [{ text: 'OK' }]
        );
        setDiscountCodeInput('');
        setShowDiscountInput(false);
      } else {
        Alert.alert(
          'Código Inválido',
          result.error || 'Este código não é válido ou expirou.',
          [{ text: 'OK' }]
        );
      }

    } finally {
      setApplyingDiscount(false);
    }
  }, [discountCodeInput, applyDiscountCode, formatCurrency]);

  // 🗑️ REMOVER DESCONTO
  const handleRemoveDiscount = useCallback(async () => {
    Alert.alert(
      'Remover Desconto',
      'Tem certeza que deseja remover o desconto aplicado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const result = await removeDiscount();
            if (result.success) {
              Alert.alert('Desconto Removido', 'O desconto foi removido.');
            }
          }
        }
      ]
    );
  }, [removeDiscount]);

  // ⚙️ ATUALIZAR CONFIGURAÇÕES PREMIUM
  const updatePremiumSetting = useCallback((key, value) => {
    setPremiumSettings(prev => ({ ...prev, [key]: value }));
    Alert.alert(
      'Configuração Alterada',
      'A mudança será aplicada na próxima inicialização.',
      [{ text: 'OK' }]
    );
  }, []);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* HEADER PREMIUM */}
      <View style={styles.header}>
        <Text style={styles.title}>💎 Checkout Premium</Text>
        <Text style={styles.subtitle}>
          {hasDiscount ? (
            <>
              <Text style={styles.originalPrice}>{formatCurrency(originalAmount)}</Text>
              {' → '}
              <Text style={styles.discountedPrice}>{formatCurrency(currentAmount)}</Text>
            </>
          ) : (
            formatCurrency(currentAmount)
          )}
        </Text>
        {hasDiscount && (
          <Text style={styles.savingsText}>
            💰 Economizando {formatCurrency(savings)}!
          </Text>
        )}
        
        {/* INDICADORES DE FUNCIONALIDADES ATIVAS */}
        <View style={styles.featuresIndicator}>
          {enableFormSheetAction && (
            <Text style={styles.featureText}>⚡ Pagamento Imediato</Text>
          )}
          {enableGooglePay && (
            <Text style={styles.featureText}>📱 Google Pay</Text>
          )}
        </View>
      </View>

      {/* ⚙️ CONFIGURAÇÕES PREMIUM (APENAS EM DESENVOLVIMENTO) */}
      {__DEV__ && (
        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>⚙️ Configurações Premium</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>⚡ Pagamento Imediato na Planilha</Text>
            <Switch
              value={premiumSettings.enableFormSheetAction}
              onValueChange={(value) => updatePremiumSetting('enableFormSheetAction', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>📱 Google Pay</Text>
            <Switch
              value={premiumSettings.enableGooglePay}
              onValueChange={(value) => updatePremiumSetting('enableGooglePay', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>🚀 Auto-navegação no Sucesso</Text>
            <Switch
              value={premiumSettings.autoNavigateOnSuccess}
              onValueChange={(value) => updatePremiumSetting('autoNavigateOnSuccess', value)}
            />
          </View>
        </View>
      )}

      {/* RESUMO DA RESERVA */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>📋 Resumo da Reserva</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tour:</Text>
          <Text style={styles.summaryValue} numberOfLines={2}>
            {bookingData.tour.name?.pt || bookingData.tour.name}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Data:</Text>
          <Text style={styles.summaryValue}>
            {formatDate(bookingData.date)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Participantes:</Text>
          <Text style={styles.summaryValue}>
            {bookingData.numberOfPeople} pessoa{bookingData.numberOfPeople > 1 ? 's' : ''}
          </Text>
        </View>

        {/* BREAKDOWN DE PREÇOS */}
        <View style={[styles.summaryRow, styles.priceBreakdown]}>
          <Text style={styles.priceLabel}>Valor original:</Text>
          <Text style={[styles.priceValue, hasDiscount && styles.strikethrough]}>
            {formatCurrency(originalAmount)}
          </Text>
        </View>

        {hasDiscount && (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.discountLabel}>
                Desconto ({discountApplied.code}):
              </Text>
              <Text style={styles.discountValue}>
                -{formatCurrency(savings)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total a pagar:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(currentAmount)}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* SEÇÃO DE CÓDIGO DE DESCONTO */}
      <View style={styles.discountCard}>
        <Text style={styles.cardTitle}>🎁 Código de Desconto</Text>
        
        {!hasDiscount ? (
          !showDiscountInput ? (
            <TouchableOpacity
              style={styles.discountButton}
              onPress={() => setShowDiscountInput(true)}
            >
              <Text style={styles.discountButtonText}>
                ✨ Tenho um código de desconto
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.discountInputContainer}>
              <TextInput
                style={styles.discountInput}
                placeholder="Digite seu código"
                value={discountCodeInput}
                onChangeText={setDiscountCodeInput}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleApplyDiscount}
              />
              <View style={styles.discountActions}>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={handleApplyDiscount}
                  disabled={applyingDiscount || !discountCodeInput.trim()}
                >
                  {applyingDiscount ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.applyButtonText}>Aplicar</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowDiscountInput(false);
                    setDiscountCodeInput('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        ) : (
          <View style={styles.appliedDiscountContainer}>
            <Text style={styles.appliedDiscountText}>
              ✅ Código "{discountApplied.code}" aplicado
            </Text>
            <Text style={styles.appliedDiscountDescription}>
              {discountApplied.description}
            </Text>
            <TouchableOpacity
              style={styles.removeDiscountButton}
              onPress={handleRemoveDiscount}
            >
              <Text style={styles.removeDiscountText}>🗑️ Remover desconto</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* EMBEDDED PAYMENT ELEMENT PREMIUM */}
      <View style={styles.paymentCard}>
        <Text style={styles.cardTitle}>
          {enableFormSheetAction ? '⚡ Pagamento Imediato' : '🔒 Dados de Pagamento'}
        </Text>
        
        {/* EXPLICAÇÃO DO MODO ATIVO */}
        {enableFormSheetAction ? (
          <View style={styles.formSheetInfo}>
            <Text style={styles.formSheetTitle}>⚡ Pagamento Imediato Ativado</Text>
            <Text style={styles.formSheetDescription}>
              Selecione um método de pagamento abaixo e complete o pagamento diretamente na planilha. 
              Não é necessário botão adicional de confirmação!
            </Text>
          </View>
        ) : (
          <View style={styles.manualInfo}>
            <Text style={styles.manualTitle}>🔒 Modo Manual</Text>
            <Text style={styles.manualDescription}>
              Selecione um método e clique no botão "Confirmar Pagamento" para processar.
            </Text>
          </View>
        )}

        {/* LOADING ERROR */}
        {hasError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>⚠️ Erro de Carregamento</Text>
            <Text style={styles.errorText}>
              {loadingError?.message || 'Erro ao carregar formulário de pagamento'}
            </Text>
          </View>
        )}

        {/* EMBEDDED PAYMENT VIEW */}
        {isReady ? (
          <View style={styles.embeddedContainer}>
            {embeddedPaymentElementView}
          </View>
        ) : !hasError ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Carregando formulário premium...</Text>
          </View>
        ) : null}

        {/* PAYMENT OPTION INFO */}
        {paymentOption && (
          <View style={styles.paymentOptionContainer}>
            <Text style={styles.paymentOptionTitle}>✅ Método Selecionado:</Text>
            <Text style={styles.paymentOptionText}>{paymentOption.label}</Text>
          </View>
        )}

        {/* FORM SHEET RESULT INFO */}
        {formSheetPaymentResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>📊 Último Resultado:</Text>
            <Text style={styles.resultText}>
              Status: {formSheetPaymentResult.status}
            </Text>
            {lastPaymentAttempt && (
              <Text style={styles.resultTime}>
                {new Date(lastPaymentAttempt).toLocaleTimeString('pt-PT')}
              </Text>
            )}
          </View>
        )}

        {/* BOTÃO DE CONFIRMAÇÃO MANUAL (APENAS SE FORM SHEET DESABILITADO) */}
        {isReady && !enableFormSheetAction && (
          <TouchableOpacity
            style={[
              styles.confirmButton,
              !canPay && styles.confirmButtonDisabled
            ]}
            onPress={handleManualPayment}
            disabled={!canPay}
          >
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.confirmButtonText}>Processando...</Text>
              </View>
            ) : (
              <Text style={styles.confirmButtonText}>
                🔒 Confirmar Pagamento {formatCurrency(currentAmount)}
                {hasDiscount && (
                  <Text style={styles.savingsInButton}>
                    {'\n'}💰 Economizando {formatCurrency(savings)}
                  </Text>
                )}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* TRUST INDICATORS PREMIUM */}
      <View style={styles.trustContainer}>
        <Text style={styles.trustText}>🔒 Pagamento 100% seguro</Text>
        <Text style={styles.trustText}>⚡ Confirmação instantânea</Text>
        <Text style={styles.trustText}>🛡️ Dados protegidos SSL</Text>
        <Text style={styles.trustText}>💳 Cartão, MB WAY e Google Pay</Text>
        {enableFormSheetAction && (
          <Text style={styles.trustText}>⚡ Pagamento imediato na planilha</Text>
        )}
      </View>

      {/* BOTÃO VOLTAR */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        disabled={isProcessing}
      >
        <Text style={styles.backButtonText}>← Voltar aos Dados</Text>
      </TouchableOpacity>

      {/* DEBUG BUTTON (apenas em desenvolvimento) */}
      {__DEV__ && (
        <TouchableOpacity
          style={styles.debugButton}
          onPress={() => {
            const debugInfo = getDebugInfo();
            console.log('🔍 Debug Info Premium:', debugInfo);
            Alert.alert(
              'Debug Premium',
              `Estado: ${isReady ? 'Pronto' : 'Carregando'}\n` +
              `Form Sheet: ${enableFormSheetAction ? 'Ativado' : 'Desativado'}\n` +
              `Google Pay: ${enableGooglePay ? 'Ativado' : 'Desativado'}\n` +
              `Booking ID: ${bookingId || 'N/A'}\n` +
              `Último Pagamento: ${lastPaymentAttempt ? new Date(lastPaymentAttempt).toLocaleTimeString() : 'N/A'}`
            );
          }}
        >
          <Text style={styles.debugButtonText}>🔍 Debug Premium</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

// 🎨 FUNÇÕES DE FORMATAÇÃO
const formatDate = (dateString) => {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
};

// 🎨 ESTILOS PREMIUM
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Fallback
    backgroundColor: '#2563eb',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#bfdbfe',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    color: '#f87171',
  },
  discountedPrice: {
    color: '#34d399',
    fontWeight: 'bold',
  },
  savingsText: {
    fontSize: 16,
    color: '#34d399',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  featuresIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  featureText: {
    fontSize: 12,
    color: '#bfdbfe',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  settingsCard: {
    backgroundColor: '#fef3c7',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 14,
    color: '#92400e',
    flex: 1,
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  discountCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  formSheetInfo: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  formSheetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0369a1',
    marginBottom: 8,
  },
  formSheetDescription: {
    fontSize: 14,
    color: '#075985',
    lineHeight: 20,
  },
  manualInfo: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  manualTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  manualDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6b7280',
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  priceBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  priceValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  discountLabel: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
  },
  discountValue: {
    fontSize: 16,
    color: '#059669',
    fontWeight: 'bold',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#2563eb',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  discountButton: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#bae6fd',
    borderStyle: 'dashed',
  },
  discountButtonText: {
    color: '#0369a1',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  discountInputContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
  },
  discountInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  discountActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  applyButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  appliedDiscountContainer: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  appliedDiscountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  appliedDiscountDescription: {
    fontSize: 14,
    color: '#065f46',
    marginBottom: 12,
  },
  removeDiscountButton: {
    alignSelf: 'flex-start',
  },
  removeDiscountText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#7f1d1d',
  },
  embeddedContainer: {
    minHeight: 200,
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  paymentOptionContainer: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 16,
  },
  paymentOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 4,
  },
  paymentOptionText: {
    fontSize: 16,
    color: '#1e40af',
    fontWeight: '500',
  },
  resultContainer: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  resultText: {
    fontSize: 14,
    color: '#6b7280',
  },
  resultTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  confirmButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  savingsInButton: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34d399',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustContainer: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
  },
  trustText: {
    fontSize: 14,
    color: '#059669',
    textAlign: 'center',
    marginBottom: 4,
  },
  backButton: {
    margin: 16,
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '500',
  },
  debugButton: {
    margin: 16,
    marginTop: 0,
    padding: 12,
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    alignItems: 'center',
  },
  debugButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default PremiumCheckoutScreen;