import React from 'react';
import { useNavigate } from 'react-router-dom';
import ridesService from '../../services/rides';
import './HomePage.css';

const pages = [
  {
    path: '/families',
    label: 'משפחות',
    desc: 'ניהול פרטי המשפחות הזקוקות להסעה לטיפולים',
    gradient: 'linear-gradient(135deg, #2a9db5 0%, #1e7d94 100%)',
    shadow: 'rgba(42,157,181,0.22)',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="6" r="3"/>
        <circle cx="17" cy="7" r="2.5"/>
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
        <path d="M17 13c1.7 0 4 1.3 4 4"/>
      </svg>
    ),
  },
  {
    path: '/volunteers',
    label: 'מתנדבים',
    desc: 'ניהול המתנדבים, זמינותם ופרטי הקשר שלהם',
    gradient: 'linear-gradient(135deg, #2baa9e 0%, #1f8a7f 100%)',
    shadow: 'rgba(43,170,158,0.22)',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
    ),
  },
  {
    path: '/rides',
    label: 'נסיעות',
    desc: 'תיאום ומעקב אחר בקשות הסעה לטיפולים',
    gradient: 'linear-gradient(135deg, #4bbecf 0%, #2a9db5 100%)',
    shadow: 'rgba(75,190,207,0.22)',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 11l2-5h10l2 5"/>
        <rect x="2" y="11" width="20" height="7" rx="2"/>
        <circle cx="7" cy="18" r="1.8"/>
        <circle cx="17" cy="18" r="1.8"/>
      </svg>
    ),
  },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [waiting, setWaiting] = React.useState<number | null>(null);

  React.useEffect(() => {
    ridesService.getRides().then(r => setWaiting(r.filter(x => !x.volunteerId).length)).catch(() => setWaiting(null));
  }, []);

  return (
    <div className="home-page">
      <div className="home-page__hero">
        <div>
          <h1 className="home-page__title">שלום, מזכירה</h1>
          <p className="home-page__subtitle">מערכת ניהול הסעות לחולים — תיאום, מעקב וסיוע בהתנדבות</p>
        </div>
        <div className="home-page__hero-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      <div className="home-page__match" onClick={() => navigate('/matching')} role="button">
        <div className="home-page__match-glow" />
        <div className="home-page__match-text">
          <span className="home-page__match-tag">חדש · מרכז ההתאמות</span>
          <h2>התאמה חכמה בין נסיעות למתנדבים</h2>
          <p>
            המערכת מדרגת את המתנדבים לכל נסיעה לפי זמינות בשעה, כיוון הנסיעה, עיר מגורים ומספר מקומות,
            ומזהה מתנדב שכבר תפוס. שיבוץ בלחיצה אחת.
          </p>
          <span className="home-page__match-cta">
            {waiting === null ? 'לשיבוץ נסיעות' : `${waiting} נסיעות ממתינות לשיבוץ`} ←
          </span>
        </div>
        <div className="home-page__match-demo" aria-hidden>
          <div className="demo-row"><i style={{ width: '92%' }} /><b>92%</b></div>
          <div className="demo-row"><i style={{ width: '70%' }} /><b>70%</b></div>
          <div className="demo-row"><i style={{ width: '40%' }} /><b>40%</b></div>
        </div>
      </div>

      <div className="home-page__grid">
        {pages.map(p => (
          <div
            key={p.path}
            className="home-page__card"
            style={{ '--card-gradient': p.gradient, '--card-shadow': p.shadow } as React.CSSProperties}
            onClick={() => navigate(p.path)}
          >
            <div className="home-page__card-icon-wrap">{p.icon}</div>
            <div className="home-page__card-body">
              <div className="home-page__card-label">{p.label}</div>
              <div className="home-page__card-desc">{p.desc}</div>
            </div>
            <div className="home-page__card-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
