// src/App.js
import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import TourDetails from "./pages/TourDetails";
import AdminPanel from "./pages/AdminPanel";
import ToursPage from "./pages/ToursPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<><Header /><HomePage /></>} />
          <Route path="/tour/:id" element={<><Header /><TourDetails /></>} />
          <Route path="/tours" element={<><Header /><ToursPage /></>} />
          <Route path="/about" element={<><Header /><AboutPage /></>} />
          <Route path="/contact" element={<><Header /><ContactPage /></>} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/booking-success" element={<><Header /><BookingSuccess /></>} />
          <Route path="/payment/success" element={<><Header /><PaymentSuccess /></>} />
          <Route path="/payment/cancel" element={<><Header /><PaymentCancel /></>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

// Componentes de página temporários
const AboutPage = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Sobre a 9 Rocks Tours</h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Somos especialistas em tours gastronômicos e culturais por Portugal. 
        A nossa missão é mostrar-lhe os tesouros escondidos do nosso belo país.
      </p>
    </div>
  </div>
);

const ContactPage = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Contacte-nos</h1>
      <div className="space-y-4 text-lg text-gray-600">
        <p>Email: ninerockstours@gmail.com</p>
        <p>Telefone: +351 96 3366 458</p>
        <p>Morada: Lisboa, Portugal</p>
      </div>
    </div>
  </div>
);

const BookingSuccess = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Reserva Confirmada!</h1>
      <p className="text-lg text-gray-600 mb-8">
        Obrigado pela sua reserva. Receberá um email de confirmação em breve.
      </p>
      <a href="/" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700">
        Voltar ao Início
      </a>
    </div>
  </div>
);

const PaymentSuccess = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Pagamento Realizado!</h1>
      <p className="text-lg text-gray-600 mb-8">
        O seu pagamento foi processado com sucesso. A sua reserva está confirmada.
      </p>
      <a href="/" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700">
        Voltar ao Início
      </a>
    </div>
  </div>
);

const PaymentCancel = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Pagamento Cancelado</h1>
      <p className="text-lg text-gray-600 mb-8">
        O pagamento foi cancelado. Pode tentar novamente quando estiver pronto.
      </p>
      <a href="/" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700">
        Voltar ao Início
      </a>
    </div>
  </div>
);

export default App;
