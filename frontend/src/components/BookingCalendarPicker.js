// frontend/src/components/BookingCalendarPicker.js - NOVO COMPONENTE
import React, { useState, useEffect } from 'react';

const BookingCalendarPicker = ({ 
  availableDates, 
  selectedDate, 
  onDateSelect, 
  language = 'pt',
  className = '' 
}) => {
  const [currentStartMonth, setCurrentStartMonth] = useState(new Date());

  // Conteúdo traduzido
  const content = {
    pt: {
      selectDate: "Escolha a data perfeita para sua aventura",
      monthNames: [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ],
      weekDays: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
      available: "Disponível",
      selected: "Selecionado",
      unavailable: "Indisponível",
      noAvailableDates: "✨ Sem datas específicas definidas",
      noAvailableDatesSubtext: "Este tour aceita reservas para qualquer data futura",
      prevMonths: "Meses anteriores",
      nextMonths: "Próximos meses"
    },
    en: {
      selectDate: "Choose the perfect date for your adventure",
      monthNames: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
      weekDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      available: "Available",
      selected: "Selected",
      unavailable: "Unavailable",
      noAvailableDates: "✨ No specific dates defined",
      noAvailableDatesSubtext: "This tour accepts bookings for any future date",
      prevMonths: "Previous months",
      nextMonths: "Next months"
    },
    es: {
      selectDate: "Elige la fecha perfecta para tu aventura",
      monthNames: [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ],
      weekDays: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
      available: "Disponible",
      selected: "Seleccionado",
      unavailable: "No disponible",
      noAvailableDates: "✨ Sin fechas específicas definidas",
      noAvailableDatesSubtext: "Este tour acepta reservas para cualquier fecha futura",
      prevMonths: "Meses anteriores",
      nextMonths: "Próximos meses"
    }
  };

  const t = content[language];

  // Gerar 3 meses consecutivos
  const generateThreeMonths = () => {
    const months = [];
    const start = new Date(currentStartMonth);
    
    for (let i = 0; i < 3; i++) {
      const monthDate = new Date(start.getFullYear(), start.getMonth() + i, 1);
      months.push(monthDate);
    }
    
    return months;
  };

  const threeMonths = generateThreeMonths();

  // Converter datas disponíveis para Set para busca rápida
  const availableDateStrings = new Set(
    availableDates.map(date => {
      if (typeof date === 'string') return date;
      return date.toISOString().split('T')[0];
    })
  );

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days = [];
    
    // Adicionar dias vazios para alinhar com o primeiro dia da semana
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Adicionar dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dateString = currentDate.toISOString().split('T')[0];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      days.push({
        date: day,
        fullDate: currentDate,
        dateString: dateString,
        isPast: currentDate < today,
        isToday: currentDate.toDateString() === new Date().toDateString(),
        isAvailable: availableDates.length === 0 || availableDateStrings.has(dateString),
        isSelected: selectedDate === dateString
      });
    }
    
    return days;
  };

  const handleDateClick = (day) => {
    if (day.isPast || !day.isAvailable) return;
    onDateSelect(day.dateString);
  };

  const goToPreviousMonths = () => {
    const newStart = new Date(currentStartMonth);
    newStart.setMonth(newStart.getMonth() - 3);
    setCurrentStartMonth(newStart);
  };

  const goToNextMonths = () => {
    const newStart = new Date(currentStartMonth);
    newStart.setMonth(newStart.getMonth() + 3);
    setCurrentStartMonth(newStart);
  };

  // Se não há datas disponíveis específicas, mostrar input de data livre
  if (availableDates.length === 0) {
    return (
      <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-200 rounded-xl p-6 text-center ${className}`}>
        <div className="text-4xl mb-3">🗓️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.noAvailableDates}</h3>
        <p className="text-gray-600 text-sm mb-4">{t.noAvailableDatesSubtext}</p>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateSelect(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full max-w-xs mx-auto px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-medium"
        />
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{t.selectDate}</h3>
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center text-sm">
            <div className="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
            <span className="text-gray-600">{t.selected}</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded-full mr-2"></div>
            <span className="text-gray-600">{t.available}</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-4 h-4 bg-gray-200 rounded-full mr-2"></div>
            <span className="text-gray-600">{t.unavailable}</span>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={goToPreviousMonths}
          className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title={t.prevMonths}
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Anterior</span>
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            {t.monthNames[threeMonths[0].getMonth()]} - {t.monthNames[threeMonths[2].getMonth()]} {threeMonths[0].getFullYear()}
          </p>
        </div>

        <button
          type="button"
          onClick={goToNextMonths}
          className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title={t.nextMonths}
        >
          <span className="text-sm font-medium">Próximo</span>
          <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendários */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {threeMonths.map((month, monthIndex) => {
          const days = getDaysInMonth(month);
          const monthYear = `${t.monthNames[month.getMonth()]} ${month.getFullYear()}`;
          
          return (
            <div key={monthIndex} className="bg-gray-50 rounded-lg p-4">
              {/* Header do mês */}
              <div className="text-center mb-4">
                <h4 className="font-bold text-gray-900 text-lg">{t.monthNames[month.getMonth()]}</h4>
                <p className="text-sm text-gray-500">{month.getFullYear()}</p>
              </div>

              {/* Header dos dias da semana */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {t.weekDays.map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Grade do calendário */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, dayIndex) => {
                  if (!day) {
                    return <div key={dayIndex} className="h-10"></div>;
                  }

                  const isClickable = !day.isPast && day.isAvailable;

                  return (
                    <button
                      key={dayIndex}
                      type="button"
                      onClick={() => handleDateClick(day)}
                      disabled={!isClickable}
                      className={`
                        h-10 w-10 text-sm rounded-lg flex items-center justify-center font-medium transition-all duration-200 relative
                        ${day.isToday ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
                        ${day.isSelected ? 
                          'bg-blue-600 text-white shadow-lg transform scale-105' :
                          day.isAvailable && !day.isPast ? 
                            'bg-green-50 text-green-800 border-2 border-green-200 hover:bg-green-100 hover:border-green-300 cursor-pointer hover:shadow-md hover:scale-105' :
                            'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }
                      `}
                      title={
                        day.isPast ? 'Data já passou' :
                        !day.isAvailable ? 'Data não disponível' :
                        day.isSelected ? 'Data selecionada' : 'Clique para selecionar'
                      }
                    >
                      {day.date}
                      {day.isSelected && (
                        <div className="absolute -top-1 -right-1">
                          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Informação adicional */}
      {selectedDate && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-blue-800 font-medium">
              Data selecionada: {new Date(selectedDate + 'T00:00:00').toLocaleDateString(
                language === 'pt' ? 'pt-PT' : language === 'es' ? 'es-ES' : 'en-GB',
                { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingCalendarPicker;