import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  onEnter?: () => void;
  label?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, onEnter, label, inputRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);
  const [localInputValue, setLocalInputValue] = useState('');
  const [viewDate, setViewDate] = useState(value ? new Date(value.slice(0, 10) + 'T12:00:00') : new Date());
  const [dropUp, setDropUp] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const isSelectingRef = useRef(false);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Update coordinates and dropUp direction when opening
  const updatePosition = () => {
    if (inputContainerRef.current) {
      const rect = inputContainerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const calendarHeight = 350;

      // If there's no space below but there is space above, drop up
      if (spaceBelow < calendarHeight && spaceAbove > spaceBelow) {
        setDropUp(true);
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width
        });
      } else {
        setDropUp(false);
        setCoords({
          top: rect.bottom,
          left: rect.left,
          width: rect.width
        });
      }
      setIsPositioned(true);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Force immediate position update before next paint
      updatePosition();
      
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    } else {
      setIsPositioned(false);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Format YYYY-MM-DD to DD/MM/YYYY
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    // Garantir que pegamos apenas a parte da data caso receba ISO completo
    const [datePart] = dateStr.split('T');
    const [year, month, day] = datePart.split('-');
    
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  };

  // Sync local input with prop value
  useEffect(() => {
    if (value) {
      setLocalInputValue(formatDateDisplay(value));
      const datePart = value.split('T')[0];
      const newDate = new Date(datePart + 'T12:00:00');
      if (!isNaN(newDate.getTime())) {
        setViewDate(newDate);
      }
    } else {
      setLocalInputValue('');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click was outside the input container AND outside the portal
      const isOutsideInput = containerRef.current && !containerRef.current.contains(target);
      const isOutsidePortal = portalRef.current && !portalRef.current.contains(target);
      
      if (isOutsideInput && isOutsidePortal) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Small delay to allow click events on calendar to process before closing
    setTimeout(() => {
      const activeElement = document.activeElement;
      const isInsideInput = containerRef.current && containerRef.current.contains(activeElement);
      const isInsidePortal = portalRef.current && portalRef.current.contains(activeElement);
      
      if (!isInsideInput && !isInsidePortal) {
        setIsOpen(false);
      }
    }, 150);
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${d}`);
    
    // Set selecting flag to prevent onFocus from reopening
    isSelectingRef.current = true;
    setIsOpen(false);
    
    // Focus back to input after selection to keep the flow
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }

    // Reset flag after a short delay
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 200);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (val.length > 8) val = val.slice(0, 8);

    // Apply mask DD/MM/YYYY
    let formatted = val;
    if (val.length > 2) formatted = val.slice(0, 2) + '/' + val.slice(2);
    if (val.length > 4) formatted = formatted.slice(0, 5) + '/' + val.slice(4);

    setLocalInputValue(formatted);

    // If complete, validate and update parent
    if (val.length === 8) {
      validateAndConfirm(val);
    }
  };

  const validateAndConfirm = (val: string) => {
    const d = parseInt(val.slice(0, 2));
    const m = parseInt(val.slice(2, 4)) - 1;
    const y = parseInt(val.slice(4, 8));
    const date = new Date(y, m, d);

    if (date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) {
      const isoDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      onChange(isoDate);
      return true;
    }
    return false;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = localInputValue.replace(/\D/g, '');
      if (val.length === 8) {
        if (validateAndConfirm(val)) {
          setIsOpen(false);
          if (onEnter) onEnter();
        }
      } else if (val.length === 0) {
        onChange('');
        setIsOpen(false);
        if (onEnter) onEnter();
      } else if (onEnter && !isOpen) {
        // If calendar is closed and there is an entry or partial entry, try to save
        onEnter();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty cells for days of previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = value === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(day)}
          className={`p-2 text-sm rounded-lg transition-all hover:bg-primary/20 hover:text-white
            ${isSelected ? 'bg-primary text-white font-bold' : 'text-gray-300'}
            ${isToday && !isSelected ? 'border border-primary/50 text-primary' : ''}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="relative flex flex-col flex-1" ref={containerRef}>
      {label && <span className="text-white text-sm font-medium pb-2">{label}</span>}
      <div className="relative w-full h-14 group" ref={inputContainerRef}>
        <div 
          className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center cursor-pointer z-10 text-text-muted hover:text-primary transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <CalendarIcon className={`size-5 transition-colors ${isOpen ? 'text-primary' : ''}`} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={localInputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (!isSelectingRef.current) {
              setIsOpen(true);
            }
          }}
          onBlur={handleBlur}
          placeholder="DD/MM/YYYY"
          className="w-full h-full bg-card-dark border border-border-dark rounded-xl pl-12 pr-10 text-white text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-text-muted/30"
        />

        <div 
          className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center cursor-pointer text-text-muted/40 hover:text-primary transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="material-symbols-outlined text-lg">expand_more</span>
        </div>
      </div>

      {isOpen && createPortal(
        <div 
          ref={portalRef}
          className={`fixed w-72 bg-[#1a1e32] border border-border-dark rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[9999] p-4 transition-opacity duration-300 ease-out ${
            isPositioned ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            top: dropUp ? coords.top - 4 : coords.top + 4,
            left: coords.left,
            transform: dropUp ? 'translateY(-100%)' : 'none',
            pointerEvents: isPositioned ? 'auto' : 'none'
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-white/5 rounded-lg text-text-muted hover:text-white">
              <ChevronLeft className="size-5" />
            </button>
            <div className="text-sm font-bold text-white">
              {months[viewDate.getMonth()]} {viewDate.getFullYear()}
            </div>
            <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-white/5 rounded-lg text-text-muted hover:text-white">
              <ChevronRight className="size-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map(day => (
              <div key={day} className="text-[10px] font-bold text-text-muted text-center uppercase tracking-tighter py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>

          <div className="mt-4 pt-4 border-t border-border-dark flex justify-between">
            <button 
              type="button"
              onClick={() => {
                const today = new Date();
                setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
                handleDateSelect(today.getDate());
              }}
              className="text-[10px] font-bold text-primary uppercase hover:underline"
            >
              Hoje
            </button>
            <button 
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="text-[10px] font-bold text-danger uppercase hover:underline"
            >
              Limpar
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
