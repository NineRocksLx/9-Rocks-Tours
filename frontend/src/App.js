// src/App.js - VERSÃO CORRIGIDA
import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import TourDetails from "./pages/TourDetails";
import AdminPanel from "./pages/AdminPanel";
import ToursPage from "./pages/ToursPage";
import TestPayment from "./pages/TestPayment";
import { useTranslation } from "./utils/useTranslation";
import BookingForm from "./components/BookingForm";
import PaymentSuccessPage from './pages/PaymentSuccessPage';

function App() {
  return (
    <HelmetProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            {/* Português (existente) */}
            <Route path="/" element={<><Header /><HomePage lang="pt" /></>} />
            <Route path="/tours" element={<><Header /><ToursPage lang="pt" /></>} />
            <Route path="/tour/:id" element={<><Header /><TourDetails lang="pt" /></>} />
            <Route path="/reservar" element={<><Header /><BookingForm lang="pt" /></>} />
            <Route path="/admin" element={<AdminPanel />} />
            
            {/* Teste de Pagamento */}
            <Route path="/test-payment" element={<TestPayment />} />
            
            {/* English */}
            <Route path="/en/" element={<><Header /><HomePage lang="en" /></>} />
            <Route path="/en/tours" element={<><Header /><ToursPage lang="en" /></>} />
            <Route path="/en/tour/:id" element={<><Header /><TourDetails lang="en" /></>} />
            <Route path="/en/reservar" element={<><Header /><BookingForm lang="en" /></>} />
            
            {/* Español */}
            <Route path="/es/" element={<><Header /><HomePage lang="es" /></>} />
            <Route path="/es/tours" element={<><Header /><ToursPage lang="es" /></>} />
            <Route path="/es/tour/:id" element={<><Header /><TourDetails lang="es" /></>} />
            <Route path="/es/reservar" element={<><Header /><BookingForm lang="es" /></>} />
            
            {/* Outras páginas */}
            <Route path="/about" element={<><Header /><AboutPage /></>} />
            <Route path="/contact" element={<><Header /><ContactPage /></>} />
            <Route path="/booking-success" element={<><Header /><BookingSuccess /></>} />
            
            {/* ✅ Páginas de Pagamento - CORRIGIDAS */}
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/cancel" element={<><Header /><PaymentCancelPage /></>} />
          </Routes>
        </BrowserRouter>
      </div>
    </HelmetProvider>
  );
}

// Componentes de página com traduções
const AboutPage = () => {
  const { t } = useTranslation();
 
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('about_page_title')}</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('about_page_description')}
        </p>
      </div>
    </div>
  );
};

const ContactPage = () => {
  const { t } = useTranslation();
 
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('contact_page_title')}</h1>
        <div className="space-y-4 text-lg text-gray-600">
          <p>Email: ninerockstours@gmail.com</p>
          <p>{t('contact_phone')}: +351 96 3366 458</p>
          <p>{t('contact_address')}: Lisboa, Portugal</p>
        </div>
      </div>
    </div>
  );
};

const BookingSuccess = () => {
  const { t } = useTranslation();
 
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('booking_success_title')}</h1>
        <p className="text-lg text-gray-600 mb-8">
          {t('booking_success_description')}
        </p>
        <a href="/" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700">
          {t('back_to_home')}
        </a>
      </div>
    </div>
  );
};

// Componente simples de cancelamento de pagamento
const PaymentCancelPage = () => {
  const { t } = useTranslation();
 
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pagamento Cancelado</h1>
          <p className="text-gray-600 mb-6">
            O seu pagamento foi cancelado. A reserva não foi confirmada.
          </p>
          <div className="space-y-3">
            <a
              href="/"
              className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Voltar à Página Inicial
            </a>
            <a
              href="/tours"
              className="block w-full text-blue-600 py-2 font-medium hover:text-blue-700"
            >
              Ver Tours
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;