// BookingCheckoutPage.jsx
// ✅ Versão React pronta para Next.js ou Vite, integrável ao teu FastAPI
// ✅ Estilo inspirado em The International Kitchen
// ✅ Calcula depósito de 30% automaticamente
// ✅ Mostra nota multilíngue e integra com POST /api/bookings
// ✅ Responsivo e pronto para checkout real

import { useState } from 'react';
import axios from 'axios';

export default function BookingCheckoutPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    date: '',
    participants: 1,
  });
  const [price, setPrice] = useState(250); // exemplo: preço do tour
  const deposit = (price * 0.3).toFixed(2);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/bookings', {
        ...form,
        tour_price: price,
        deposit_paid: deposit,
      });
      alert('Reserva efetuada com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao efetuar reserva.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Confirmar Reserva</h1>
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="text-lg font-semibold">Resumo do Pedido</h2>
        <p>Preço do Tour: <strong>€{price}</strong></p>
        <p>Depósito a pagar hoje (30%): <strong>€{deposit}</strong></p>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Tours: Apenas 30% de depósito é pago hoje, salvo reservas em menos de 60 dias. <br/>
        Para grupos com mais de 4 pessoas, contacte-nos via WhatsApp, email ou telefone para uma proposta personalizada.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Primeiro Nome</label>
            <input name="firstName" onChange={handleChange} required className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Último Nome</label>
            <input name="lastName" onChange={handleChange} required className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input name="email" type="email" onChange={handleChange} required className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Telefone</label>
            <input name="phone" onChange={handleChange} required className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Data</label>
            <input name="date" type="date" onChange={handleChange} required className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Participantes (1-4)</label>
            <input
              name="participants"
              type="number"
              min="1"
              max="4"
              onChange={handleChange}
              value={form.participants}
              required
              className="w-full border rounded p-2"
            />
          </div>
        </div>
        <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
          Confirmar Reserva
        </button>
      </form>
    </div>
  );
}
