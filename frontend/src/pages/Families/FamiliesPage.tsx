import React, { useEffect, useState } from 'react';
import familiesService from '../../services/familiesService';
import { Family } from '../../models/family';
import FamilyList from '../../components/Families/FamilyList';
import './FamiliesPage.css';

const EMPTY_FORM: Partial<Family> = {
  lastName: '', phoneNumber: '', email: '', numberOfPeople: undefined,
  address: { city: '', neighborhood: '', street: '', houseNumber: '' },
};


const FamiliesPage: React.FC = () => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Family | null>(null);
  const [form, setForm] = useState<Partial<Family>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    familiesService.getFamilies()
      .then(setFamilies)
      .catch(e => setError(e?.message || 'שגיאה בטעינת משפחות'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (f: Family) => { setEditTarget(f); setForm({ ...f }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditTarget(null); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.lastName?.trim() || !form.phoneNumber?.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await familiesService.updateFamily(editTarget.phoneNumber, form);
        setFamilies(prev => prev.map(f => f.phoneNumber === editTarget.phoneNumber ? { ...f, ...form } : f));
      } else {
        const created = await familiesService.createFamily(form);
        load();
        // setFamilies(prev => [created, ...prev]);
      }
      closeModal();
    } catch {
      alert('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const set = (field: keyof Family, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="families-page" dir="rtl">
      <div className="families-page__header">
        <div>
          <h1 className="families-page__title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="7" r="3" />
              <circle cx="17" cy="8" r="2.5" />
              <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
              <path d="M17 14c1.7 0 4 1.3 4 4" />
            </svg>
            ניהול משפחות
          </h1>
          <p className="families-page__subtitle">רשימת המשפחות הרשומות במערכת</p>
        </div>
        <button className="families-page__add-btn" onClick={openAdd}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          הוספת משפחה
        </button>
      </div>

      <div className="families-page__card">
        <FamilyList families={families} onEdit={openEdit} loading={loading} error={error} />
      </div>

      {modalOpen && (
        <div className="families-page__overlay" onClick={closeModal}>
          <div className="families-page__modal" onClick={e => e.stopPropagation()}>
            <div className="families-page__modal-header">
              <div className="families-page__modal-title">
                {editTarget ? 'עדכון פרטי משפחה' : 'הוספת משפחה חדשה'}
              </div>
              <button className="families-page__close-btn" onClick={closeModal}>✕</button>
            </div>

            <div className="families-page__modal-body">
              <div className="families-page__field">
                <label className="families-page__field-label">
                  שם משפחה <span className="families-page__field-required">*</span>
                </label>
                <input
                  className="families-page__input"
                  placeholder="הכנס שם משפחה"
                  value={form.lastName || ''}
                  onChange={e => set('lastName', e.target.value)}
                  dir="rtl"
                />
              </div>
              <div className="families-page__field">
                <label className="families-page__field-label">
                  מספר טלפון <span className="families-page__field-required">*</span>
                </label>
                <input
                  className="families-page__input"
                  placeholder="05X-XXXXXXX"
                  value={form.phoneNumber || ''}
                  onChange={e => set('phoneNumber', e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="families-page__field">
                <label className="families-page__field-label">כתובת אימייל</label>
                <input
                  className="families-page__input"
                  placeholder="example@email.com"
                  value={form.email || ''}
                  onChange={e => set('email', e.target.value)}
                  dir="ltr"
                  type="email"
                />
              </div>
              <div className="families-page__field">
                <label className="families-page__field-label">מספר נפשות לנסיעה</label>
                <input
                  className="families-page__input"
                  placeholder="מספר נוסעים"
                  type="number"
                  min={1}
                  value={form.numberOfPeople ?? ''}
                  onChange={e => set('numberOfPeople', e.target.value ? Number(e.target.value) : undefined)}
                  dir="rtl"
                />
              </div>
              <div className="families-page__field">
                <label className="families-page__field-label">עיר</label>
                <input className="families-page__input" placeholder="עיר" value={form.address?.city || ''} onChange={e => set('address', { ...form.address, city: e.target.value })} dir="rtl" />
              </div>
              <div className="families-page__field">
                <label className="families-page__field-label">שכונה</label>
                <input className="families-page__input" placeholder="שכונה" value={form.address?.neighborhood || ''} onChange={e => set('address', { ...form.address, neighborhood: e.target.value })} dir="rtl" />
              </div>
              <div className="families-page__field">
                <label className="families-page__field-label">רחוב</label>
                <input className="families-page__input" placeholder="רחוב" value={form.address?.street || ''} onChange={e => set('address', { ...form.address, street: e.target.value })} dir="rtl" />
              </div>
              <div className="families-page__field">
                <label className="families-page__field-label">מספר בית</label>
                <input className="families-page__input" type="number" placeholder="מספר בית" value={form.address?.houseNumber ?? ''} onChange={e => set('address', { ...form.address, houseNumber: e.target.value ? Number(e.target.value) : '' })} dir="rtl" />
              </div>

            </div>

            <div className="families-page__modal-footer">
              <button className="families-page__cancel-btn" onClick={closeModal}>ביטול</button>
              <button
                className="families-page__save-btn"
                onClick={handleSave}
                disabled={!form.lastName?.trim() || !form.phoneNumber?.trim() || saving}
              >
                {saving ? 'שומר...' : editTarget ? 'שמור שינויים' : 'הוסף משפחה'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamiliesPage;
