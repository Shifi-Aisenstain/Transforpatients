import React from 'react';
import { Family } from '../../models/family';
import { Address } from '../../models/address';
import './FamilyCard.css';

interface FamilyCardProps {
  family: Family;
  address?: Address;
  onEdit: (family: Family) => void;
}

const FamilyCard: React.FC<FamilyCardProps> = ({ family, address, onEdit }) => {
  const initials = family.lastName?.slice(0, 2) || '??';

  return (
    <div className="family-card">
      <div className="family-card__avatar">{initials}</div>

      <div className="family-card__info">
        <div className="family-card__name">משפחת {family.lastName}</div>
        <div className="family-card__details">

          <span className="family-card__chip">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
            {family.phoneNumber}
          </span>

          {family.address?.city && (
            <span className="family-card__chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {family.address.city}{family.address.street ? `, ${family.address.street} ${family.address.houseNumber}` : ''}
            </span>
          )}

          {family.numberOfPeople != null && (
            <span className="family-card__chip family-card__chip--passengers">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
              {family.numberOfPeople} נוסעים
            </span>
          )}

        </div>
      </div>

      <button className="family-card__edit-btn" onClick={() => onEdit(family)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        עדכון
      </button>
    </div>
  );
};

export default FamilyCard;
