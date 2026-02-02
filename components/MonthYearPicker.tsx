import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface MonthYearPickerProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
  variant?: 'compact' | 'full';
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ 
  month, 
  year, 
  onChange,
  variant = 'full'
}) => {
  const handlePrevMonth = () => {
    if (month === 0) {
      onChange(11, year - 1);
    } else {
      onChange(month - 1, year);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      onChange(0, year + 1);
    } else {
      onChange(month + 1, year);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(parseInt(e.target.value), year);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(month, parseInt(e.target.value));
  };

  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

  return (
    <div className={`flex items-center gap-2 bg-surface-dark/50 p-1.5 rounded-2xl border border-border-dark shadow-lg backdrop-blur-sm ${variant === 'compact' ? 'scale-90' : ''}`}>
      <button
        onClick={handlePrevMonth}
        className="p-2 hover:bg-white/10 rounded-xl transition-all active:scale-90 text-text-muted hover:text-white"
        title="Mês Anterior"
      >
        <ChevronLeft className="size-5" />
      </button>

      <div className="flex items-center gap-1 px-1">
        <div className="relative group">
          <select
            value={month}
            onChange={handleMonthChange}
            className="appearance-none bg-transparent pl-3 pr-8 py-2 text-sm font-black text-white cursor-pointer outline-none hover:bg-white/5 rounded-lg transition-colors capitalize"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i} className="bg-surface-dark text-white">{m}</option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-white transition-colors">
            <ChevronRight className="size-3 rotate-90" />
          </div>
        </div>

        <div className="w-px h-4 bg-white/10 mx-1"></div>

        <div className="relative group">
          <select
            value={year}
            onChange={handleYearChange}
            className="appearance-none bg-transparent pl-3 pr-8 py-2 text-sm font-black text-white cursor-pointer outline-none hover:bg-white/5 rounded-lg transition-colors"
          >
            {years.map(y => (
              <option key={y} value={y} className="bg-surface-dark text-white">{y}</option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-white transition-colors">
            <ChevronRight className="size-3 rotate-90" />
          </div>
        </div>
      </div>

      <button
        onClick={handleNextMonth}
        className="p-2 hover:bg-white/10 rounded-xl transition-all active:scale-90 text-text-muted hover:text-white"
        title="Próximo Mês"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
};
