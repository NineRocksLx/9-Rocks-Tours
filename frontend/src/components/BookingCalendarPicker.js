// frontend/src/components/BookingCalendarPicker.js - CORREÇÃO DEFINITIVA
import React, { useState, useEffect } from 'react';

const BookingCalendarPicker = ({ 
  availableDates, 
  occupiedDates = [], 
  selectedDate, 
  onDateSelect, 
  language = 'pt', 
  className = '',
  isDateAvailable 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthNames = {
    pt: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
         'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    en: ['January', 'February', 'March', 'April', 'May', 'June',
         'July', 'August', 'September', 'October', 'November', 'December'],
    es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  };

  const weekDays = {
    pt: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  };

  const content = {
    pt: {
      selectDate: 'Selecione uma data disponível',
      noAvailableDates: 'Sem datas disponíveis para este tour',
      weekendsNotAvailable: 'Fins de semana não disponíveis',
      dateOccupied: 'Data já reservada',
      datePassed: 'Data já passou',
      nextMonth: 'Próximo mês',
      prevMonth: 'Mês anterior',
      selected: 'Selecionado',
      available: 'Disponível',
      booked: 'Já reservado',
      weekend: 'Fim de semana'
    },
    en: {
      selectDate: 'Select an available date',
      noAvailableDates: 'No available dates for this tour',
      weekendsNotAvailable: 'Weekends not available',
      dateOccupied: 'Date already booked',
      datePassed: 'Date has passed',
      nextMonth: 'Next month',
      prevMonth: 'Previous month',
      selected: 'Selected',
      available: 'Available',
      booked: 'Already booked',
      weekend: 'Weekend'
    },
    es: {
      selectDate: 'Selecciona una fecha disponible',
      noAvailableDates: 'Sin fechas disponibles para este tour',
      weekendsNotAvailable: 'Fines de semana no disponibles',
      dateOccupied: 'Fecha ya reservada',
      datePassed: 'Fecha ya pasó',
      nextMonth: 'Mes siguiente',
      prevMonth: 'Mes anterior',
      selected: 'Seleccionado',
      available: 'Disponible',
      booked: 'Ya reservado',
      weekend: 'Fin de semana'
    }
  };

  const t = content[language] || content.pt;

  // ===================================================================
  // 🎯 FUNÇÃO CORRIGIDA - SEM PROBLEMAS DE TIMEZONE
  // ===================================================================
  const formatDateString = (year, month, day) => {
    // CORREÇÃO: Gera string YYYY-MM-DD diretamente, SEM conversões UTC
    const yearStr = year.toString();
    const monthStr = (month + 1).toString().padStart(2, '0'); // month é 0-based
    const dayStr = day.toString().padStart(2, '0');
    return `${yearStr}-${monthStr}-${dayStr}`;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Adicionar dias vazios para começar no domingo
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Adicionar dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      
      // 🎯 CORREÇÃO CRÍTICA: Usa função que não depende de timezone
      const dateString = formatDateString(year, month, day);
      
      const dayOfWeek = currentDate.getDay();
      
      console.log(`📅 Gerando dia ${day}: dateString=${dateString}`);
      
      days.push({
        date: day,
        fullDate: currentDate,
        dateString,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isPast: currentDate < new Date().setHours(0, 0, 0, 0),
        isToday: currentDate.toDateString() === new Date().toDateString(),
        isOccupied: occupiedDates.includes(dateString),
        isAvailable: isDateAvailable ? isDateAvailable(dateString) : !occupiedDates.includes(dateString)
      });
    }
    
    return days;
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleDateClick = (day) => {
    if (!day.isAvailable) return;
    
    console.log(`🗓️ Calendário clicado: ${day.dateString} (dia ${day.date})`);
    onDateSelect(day.dateString);
  };

  const getDateButtonClass = (day) => {
    if (!day.isAvailable) {
      if (day.isWeekend) {
        return 'bg-red-50 text-red-300 cursor-not-allowed border border-red-100';
      }
      if (day.isOccupied) {
        return 'bg-red-600 text-white cursor-not-allowed border border-red-700 font-bold line-through';
      }
      if (day.isPast) {
        return 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100';
      }
      return 'bg-gray-400 text-white cursor-not-allowed border border-gray-500 font-bold';
    }

    if (selectedDate === day.dateString) {
      return 'bg-blue-600 text-white font-bold border-2 border-blue-700 shadow-lg';
    }

    return 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-300 cursor-pointer';
  };

  const getDateTooltip = (day) => {
    if (day.isWeekend) return t.weekendsNotAvailable;
    if (day.isOccupied) return t.dateOccupied;
    if (day.isPast) return t.datePassed;
    if (selectedDate === day.dateString) return t.selected;
    return day.isAvailable ? 'Clique para selecionar' : 'Data não disponível';
  };

  const days = getDaysInMonth(currentMonth);
  const monthYear = `${monthNames[language][currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{t.selectDate}</h3>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title={t.prevMonth}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center px-4 py-2 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-900">{monthYear}</span>
          </div>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title={t.nextMonth}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Header dos dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays[language].map(day => (
          <div key={day} className="text-sm font-medium text-gray-500 text-center p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendário */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className="h-10"></div>;
          }

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateClick(day)}
              disabled={!day.isAvailable}
              className={`
                h-10 w-full text-sm rounded-lg flex items-center justify-center transition-all duration-200
                ${getDateButtonClass(day)}
                ${day.isToday ? 'ring-2 ring-blue-400' : ''}
              `}
              title={getDateTooltip(day)}
            >
              {day.date}
            </button>
          );
        })}
      </div>

      {/* Legenda - CORRIGIDA COM IDIOMAS */}
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
          <span className="text-gray-600">{t.selected}</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-white border border-gray-200 rounded mr-2"></div>
          <span className="text-gray-600">{t.available}</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-orange-50 border border-orange-200 rounded mr-2"></div>
          <span className="text-gray-600">{t.booked}</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-50 border border-red-100 rounded mr-2"></div>
          <span className="text-gray-600">{t.weekend}</span>
        </div>
      </div>

      {/* Mensagem se não há datas disponíveis */}
      {availableDates.length === 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm text-center">
            {t.noAvailableDates}
          </p>
        </div>
      )}
    </div>
  );
};

export default BookingCalendarPicker;