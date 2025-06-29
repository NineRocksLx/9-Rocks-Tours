// frontend/src/components/CalendarDatePicker.js - NOVO COMPONENTE
import React, { useState, useEffect } from 'react';

const CalendarDatePicker = ({ selectedDates, onDatesChange, className = '' }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tempSelectedDates, setTempSelectedDates] = useState(new Set(selectedDates));

  useEffect(() => {
    setTempSelectedDates(new Set(selectedDates));
  }, [selectedDates]);

  // Gerar 6 meses a partir da data atual
  const generateSixMonths = () => {
    const months = [];
    const today = new Date();
    
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      months.push(monthDate);
    }
    
    return months;
  };

  const sixMonths = generateSixMonths();

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const days = [];
    
    // Adicionar dias vazios para começar na segunda-feira (1)
    const startDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Adicionar dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dayOfWeek = currentDate.getDay();
      
      days.push({
        date: day,
        fullDate: currentDate,
        dateString: formatDateString(currentDate),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6, // Domingo ou Sábado
        isPast: currentDate < new Date().setHours(0, 0, 0, 0),
        isToday: currentDate.toDateString() === new Date().toDateString()
      });
    }
    
    return days;
  };

  const formatDateString = (date) => {
    return date.toISOString().split('T')[0];
  };

  const toggleDate = (dateString, isWeekend, isPast) => {
    if (isWeekend || isPast) return; // Não permitir fins de semana ou datas passadas
    
    const newSet = new Set(tempSelectedDates);
    if (newSet.has(dateString)) {
      newSet.delete(dateString);
    } else {
      newSet.add(dateString);
    }
    setTempSelectedDates(newSet);
  };

  const selectAllWeekdays = (month) => {
    const days = getDaysInMonth(month);
    const newSet = new Set(tempSelectedDates);
    
    days.forEach(day => {
      if (day && !day.isWeekend && !day.isPast) {
        newSet.add(day.dateString);
      }
    });
    
    setTempSelectedDates(newSet);
  };

  const clearMonth = (month) => {
    const days = getDaysInMonth(month);
    const newSet = new Set(tempSelectedDates);
    
    days.forEach(day => {
      if (day) {
        newSet.delete(day.dateString);
      }
    });
    
    setTempSelectedDates(newSet);
  };

  const applyChanges = () => {
    const sortedDates = Array.from(tempSelectedDates).sort();
    onDatesChange(sortedDates);
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className={`border rounded-lg p-4 bg-white ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Selecionar Datas Disponíveis</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={applyChanges}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            Aplicar ({tempSelectedDates.size} datas)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sixMonths.map((month, monthIndex) => {
          const days = getDaysInMonth(month);
          const monthYear = `${monthNames[month.getMonth()]} ${month.getFullYear()}`;
          
          return (
            <div key={monthIndex} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{monthYear}</h4>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => selectAllWeekdays(month)}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    title="Selecionar todos os dias úteis"
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => clearMonth(month)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    title="Limpar mês"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              {/* Header dos dias da semana */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-xs font-medium text-gray-500 text-center p-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendário */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, dayIndex) => {
                  if (!day) {
                    return <div key={dayIndex} className="h-8"></div>;
                  }

                  const isSelected = tempSelectedDates.has(day.dateString);
                  const isClickable = !day.isWeekend && !day.isPast;

                  return (
                    <button
                      key={dayIndex}
                      type="button"
                      onClick={() => toggleDate(day.dateString, day.isWeekend, day.isPast)}
                      disabled={!isClickable}
                      className={`
                        h-8 w-8 text-xs rounded flex items-center justify-center transition-colors
                        ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                        ${!isClickable ? 'text-gray-300 cursor-not-allowed' : 
                          isSelected ? 'bg-green-600 text-white hover:bg-green-700' :
                          'text-gray-700 hover:bg-gray-100 border border-gray-200'}
                      `}
                      title={
                        day.isWeekend ? 'Fins de semana não disponíveis' :
                        day.isPast ? 'Data já passou' :
                        isSelected ? 'Clique para remover' : 'Clique para adicionar'
                      }
                    >
                      {day.date}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-600 rounded mr-2"></div>
            <span>Selecionado</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
            <span>Disponível</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 text-gray-300 rounded mr-2 flex items-center justify-center text-xs">
              ×
            </div>
            <span>Fins de semana</span>
          </div>
        </div>
        
        <p className="mt-2">
          <strong>Dica:</strong> Use "Todos" para selecionar todos os dias úteis de um mês, 
          ou clique em dias individuais. Fins de semana estão desabilitados por defeito.
        </p>
      </div>
    </div>
  );
};

export default CalendarDatePicker;