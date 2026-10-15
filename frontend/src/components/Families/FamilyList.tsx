import React, { useState, useMemo } from 'react';
import { Family } from '../../models/family';
import FamilyCard from './FamilyCard';
import './FamilyList.css';

type SortKey = 'lastName' | 'passengersCount';

interface FamilyListProps {
  families: Family[];
  onEdit: (family: Family) => void;
  loading?: boolean;
  error?: string | null;
}

const FamilyList: React.FC<FamilyListProps> = ({ families, onEdit, loading, error }) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('lastName');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...families]
      .filter(f => !q || f.lastName?.toLowerCase().includes(q) || f.phoneNumber?.includes(q))
      .sort((a, b) => {
        if (sortBy === 'lastName') return (a.lastName ?? '').localeCompare(b.lastName ?? '', 'he');
        return (b.numberOfPeople ?? 0) - (a.numberOfPeople ?? 0);
      });
  }, [families, search, sortBy]);

  return (
    <div className="family-list">

      <div className="family-list__header">
        <div className="family-list__header-title">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="6" r="3"/>
            <circle cx="17" cy="7" r="2.5"/>
            <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
            <path d="M17 13c1.7 0 4 1.3 4 4"/>
          </svg>
          רשימת משפחות
        </div>
        <div className="family-list__sort-wrap">
          <span className="family-list__sort-label">מיון:</span>
          {([
            { value: 'lastName' as SortKey, label: 'שם משפחה' },
            { value: 'passengersCount' as SortKey, label: 'מספר נוסעים' },
          ]).map(opt => (
            <button
              key={opt.value}
              className={`family-list__sort-btn${sortBy === opt.value ? ' active' : ''}`}
              onClick={() => setSortBy(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="family-list__toolbar">
        <div className="family-list__search-wrap">
          <svg className="family-list__search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            className="family-list__search-input"
            placeholder="חיפוש לפי שם או טלפון..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            dir="rtl"
          />
        </div>
        <div className="family-list__count-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
          {filtered.length} משפחות
        </div>
      </div>

      {loading && (
        <div className="family-list__loading">
          <div className="family-list__spinner" />
          טוען נתונים...
        </div>
      )}

      {error && !loading && (
        <div className="family-list__error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="family-list__empty">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#b2e4ed" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="9" cy="7" r="4" stroke="#b2e4ed" strokeWidth="1.5"/>
          </svg>
          <p>לא נמצאו משפחות</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="family-list__list">
          {filtered.map(f => <FamilyCard key={f.id} family={f} onEdit={onEdit} />)}
        </div>
      )}

    </div>
  );
};

export default FamilyList;
