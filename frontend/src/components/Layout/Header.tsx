import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { he } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import './Header.css';

const Header: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showCal, setShowCal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const calRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const dateStr = selectedDate.toLocaleDateString('he-IL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node))
        setShowCal(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toInputValue = (d: Date) => d.toISOString().split('T')[0];

  return (
    <header className="header">
      <div className="header__inner">
      <div className="header__logo-wrap" onClick={() => navigate('/')} title="דף הבית">
        <div className="header__logo-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 11l2-5h14l2 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="1" y="11" width="22" height="7" rx="2" stroke="white" strokeWidth="1.8"/>
            <circle cx="7" cy="18" r="2" fill="white"/>
            <circle cx="17" cy="18" r="2" fill="white"/>
            <path d="M10 8.5c0-1 .7-1.5 1.5-1.5S13 7.8 13 8.5c0 1.5-2.5 3-2.5 3S8 10 8 8.5C8 7.5 8.7 7 9.5 7S10 7.5 10 8.5z" fill="white" opacity="0.85"/>
          </svg>
        </div>
        <div>
          <span className="header__logo-text">Transfor</span>
          <span className="header__logo-accent">patients</span>
        </div>
      </div>

      <div className="header__date-wrap" ref={calRef}>
        <button className="header__date-badge" onClick={() => setShowCal(v => !v)}>
          <div className="header__date-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="17" rx="3" stroke="white" strokeWidth="2"/>
              <path d="M3 9h18" stroke="white" strokeWidth="2"/>
              <path d="M8 2v4M16 2v4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="header__date-text">{dateStr}</span>
        </button>
        {showCal && (
          <div className="header__cal-popover">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(d) => { if (d) { setSelectedDate(d); setShowCal(false); } }}
              locale={he}
              className="header__daypicker"
            />
          </div>
        )}
      </div>
      </div>
    </header>
  );
};

export default Header;
