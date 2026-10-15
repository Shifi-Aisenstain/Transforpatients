import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import '../../assets/styles/variables.css';
import './AppLayout.css';

const AppLayout: React.FC = () => (
  <div className="app-layout">
    <Header />
    <div className="app-layout__body">
      <Sidebar />
      <main className="app-layout__main">
        <Outlet />
      </main>
    </div>
    <footer className="app-footer">
      <div className="app-footer__inner">
        <div className="app-footer__brand">
          <div className="app-footer__logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 11l2-5h14l2 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="1" y="11" width="22" height="7" rx="2" stroke="white" strokeWidth="1.8"/>
              <circle cx="7" cy="18" r="1.8" fill="white"/>
              <circle cx="17" cy="18" r="1.8" fill="white"/>
            </svg>
          </div>
          <span className="app-footer__name">Transforpatients</span>
        </div>
        <span className="app-footer__copy">© {new Date().getFullYear()} הסעות לחולים בהתנדבות — כל הזכויות שמורות</span>
        <div className="app-footer__links">
          <span>פרטיות</span>
          <span>תמיכה</span>
          <span>v1.0</span>
        </div>
      </div>
    </footer>
  </div>
);

export default AppLayout;
