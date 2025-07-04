import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import TourDetails from "./pages/TourDetails";
import ToursPage from "./pages/ToursPage";
import AdminPanel from "./pages/AdminPanel";

function App() {
  return (
    <HelmetProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            {/* 🇵🇹 ROTAS PORTUGUÊS (PADRÃO) */}
            <Route path="/" element={<><Header /><HomePage /></>} />
            <Route path="/tours" element={<><Header /><ToursPage /></>} />
            <Route path="/tours/:slug" element={<><Header /><TourDetails /></>} />
            <Route path="/about" element={<><Header /><AboutPage /></>} />
            <Route path="/contact" element={<><Header /><ContactPage /></>} />
            <Route path="/reservar" element={<><Header /><BookingPage /></>} />
            
            {/* 🇬🇧 ROTAS INGLÊS */}
            <Route path="/en" element={<><Header /><HomePage /></>} />
            <Route path="/en/tours" element={<><Header /><ToursPage /></>} />
            <Route path="/en/tours/:slug" element={<><Header /><TourDetails /></>} />
            <Route path="/en/about" element={<><Header /><AboutPage /></>} />
            <Route path="/en/contact" element={<><Header /><ContactPage /></>} />
            <Route path="/en/book" element={<><Header /><BookingPage /></>} />
            
            {/* 🇪🇸 ROTAS ESPANHOL */}
            <Route path="/es" element={<><Header /><HomePage /></>} />
            <Route path="/es/tours" element={<><Header /><ToursPage /></>} />
            <Route path="/es/tours/:slug" element={<><Header /><TourDetails /></>} />
            <Route path="/es/about" element={<><Header /><AboutPage /></>} />
            <Route path="/es/contact" element={<><Header /><ContactPage /></>} />
            <Route path="/es/reservar" element={<><Header /><BookingPage /></>} />

            {/* 🔧 ADMIN E OUTRAS ROTAS */}
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/booking-success" element={<><Header /><BookingSuccess /></>} />
            <Route path="/payment/success" element={<><Header /><PaymentSuccess /></>} />
            <Route path="/payment/cancel" element={<><Header /><PaymentCancel /></>} />
          </Routes>
        </BrowserRouter>
      </div>
    </HelmetProvider>
  );
}

// 📄 COMPONENTES DE PÁGINA BÁSICOS (mantenha os existentes)
const AboutPage = () => <div>About Page</div>;
const ContactPage = () => <div>Contact Page</div>;
const BookingPage = () => <div>Booking Page</div>;
const BookingSuccess = () => <div>Booking Success</div>;
const PaymentSuccess = () => <div>Payment Success</div>;
const PaymentCancel = () => <div>Payment Cancel</div>;

export default App;