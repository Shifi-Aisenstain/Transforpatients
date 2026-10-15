import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const HomeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
);

const FamilyIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="3"/>
    <circle cx="17" cy="8" r="2.5"/>
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
    <path d="M17 14c1.7 0 4 1.3 4 4"/>
  </svg>
);

const VolunteerIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);

const RideIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 11l2-5h10l2 5"/>
    <rect x="2" y="11" width="20" height="7" rx="2"/>
    <circle cx="7" cy="18" r="1.5"/>
    <circle cx="17" cy="18" r="1.5"/>
  </svg>
);

const links = [
  { to: '/', icon: <HomeIcon />, label: 'דף הבית', end: true },
  { to: '/families', icon: <FamilyIcon />, label: 'משפחות', end: false },
  { to: '/volunteers', icon: <VolunteerIcon />, label: 'מתנדבים', end: false },
  { to: '/rides', icon: <RideIcon />, label: 'נסיעות', end: false },
];

const Sidebar: React.FC = () => (
  <aside className="sidebar">
    <div className="sidebar__nav">
      {links.map(({ to, icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `sidebar__link${isActive ? ' active' : ''}`}
        >
          <span className="sidebar__icon-wrap">{icon}</span>
          {label}
        </NavLink>
      ))}
    </div>

    <div className="sidebar__bottom">
      <div className="sidebar__bottom-logo">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 11l2-5h14l2 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="1" y="11" width="22" height="7" rx="2" stroke="white" strokeWidth="1.8"/>
          <circle cx="7" cy="18" r="1.8" fill="white"/>
          <circle cx="17" cy="18" r="1.8" fill="white"/>
        </svg>
      </div>
      <div className="sidebar__bottom-text">
        <span className="sidebar__bottom-name">Transforpatients</span>
        <span className="sidebar__bottom-sub">הסעות לחולים בהתנדבות</span>
      </div>
    </div>
  </aside>
);

export default Sidebar;
