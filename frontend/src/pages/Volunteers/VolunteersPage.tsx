import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // ← הוסיפי
import volunteersService from '../../services/volunteers';
import volunteerFreeTimesService from '../../services/volunteerFreeTimesService';
import { Volunteer } from '../../models/volunteer';
import './VolunteersPage.css';
import { Availability } from '../../models';



const EMPTY: Partial<Volunteer> = {
  firstName: '', lastName: '', phoneNumber: '', email: '',
  isCarHandicapped: false, availableSeats: undefined, isBabySeat: false,
  address: { city: '', neighborhood: '', street: '', houseNumber: 0 },
};


const BADGE_LABELS: Record<string, string> = {
  isCarHandicapped: 'רכב נגיש',
  isBabySeat: 'כיסא ילדים',
};


const VolunteersPage: React.FC = () => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [slots, setSlots] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Volunteer | null>(null);
  const [form, setForm] = useState<Partial<Volunteer>>(EMPTY);

  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    Promise.all([volunteersService.getVolunteers(), volunteerFreeTimesService.getAvailabilities()])
      .then(([v, a]) => { setVolunteers(v); setSlots(a); })
      .catch(e => setError(e?.message || 'שגיאה בטעינת מתנדבים'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return volunteers.filter(v =>
      !q ||
      `${v.firstName} ${v.lastName}`.toLowerCase().includes(q) ||
      v.phoneNumber.includes(q)
    );
  }, [volunteers, search]);

  const upcomingSlots = (volunteerId: number) => {
    const now = Date.now();
    return slots
      .filter(s => s.volunteerId === volunteerId && new Date(s.endDateTime).getTime() >= now)
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  };

  const formatSlot = (s: Availability) => {
    const start = new Date(s.startDateTime);
    const end = new Date(s.endDateTime);
    const day = start.toLocaleDateString('he-IL', { weekday: 'short', day: '2-digit', month: '2-digit' });
    const time = (d: Date) => d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    return `${day} ⁦${time(start)}–${time(end)}⁩${s.destination ? ` ← ${s.destination}` : ''}`;
  };

  const openAdd = () => { setEditTarget(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (v: Volunteer) => {
    setEditTarget(v);
    setForm({
      ...v,
      address: v.address ?? { city: '', neighborhood: '', street: '', houseNumber: 0 },
    });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditTarget(null); setForm(EMPTY); };


  const set = (field: keyof Volunteer, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));


  const handleSave = async () => {
    if (!form.firstName?.trim() || !form.lastName?.trim() || !form.phoneNumber?.trim()) return;
    setSaving(true);
    const payload: Partial<Volunteer> = { ...form };
    if (!payload.address?.city?.trim() && !payload.address?.street?.trim() && !payload.address?.neighborhood?.trim()) {
      delete payload.address;
    }
    try {
      if (editTarget) {
        await volunteersService.updateVolunteer(editTarget.phoneNumber, payload);
        setVolunteers(prev => prev.map(v => v.phoneNumber === editTarget.phoneNumber ? { ...v, ...payload } : v));
      } else {
        await volunteersService.createVolunteer(payload);
        load();
      }
      closeModal();
    } catch {
      alert('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };


  const canSave = !!form.firstName?.trim() && !!form.lastName?.trim() && !!form.phoneNumber?.trim();

  return (
    <div className="vol-page" dir="rtl">
      <div className="vol-page__header">
        <div>
          <h1 className="vol-page__title"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>ניהול מתנדבים</h1>
          <p className="vol-page__subtitle">רשימת המתנדבים הפעילים במערכת</p>
        </div>
        <button className="vol-page__add-btn" onClick={openAdd}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          הוספת מתנדב
        </button>
      </div>

      <div className="vol-page__card">
        <div className="vol-page__card-header">
          <div className="vol-page__card-header-title">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            רשימת מתנדבים
          </div>
        </div>

        <div className="vol-page__toolbar">
          <div className="vol-page__search-wrap">
            <svg className="vol-page__search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              className="vol-page__search-input"
              placeholder="חיפוש לפי שם או טלפון..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              dir="rtl"
            />
          </div>
          <div className="vol-page__count-badge">{filtered.length} מתנדבים</div>
        </div>

        {loading && (
          <div className="vol-page__loading">
            <div className="vol-page__spinner" />
            <span>טוען נתונים...</span>
          </div>
        )}
        {error && (
          <div className="vol-page__error">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="vol-page__empty">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="#cbd5e1" strokeWidth="1.5" />
            </svg>
            <p>לא נמצאו מתנדבים</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="vol-page__list">
            {filtered.map(v => (
              <div key={v.id} className="vol-card" onClick={() => navigate(`/volunteers/${v.id}`)} style={{ cursor: 'pointer' }}>
                <div className="vol-card__avatar">
                  {v.firstName?.[0]}{v.lastName?.[0]}
                </div>
                <div className="vol-card__info">
                  <div className="vol-card__name">{v.firstName} {v.lastName}</div>
                  <div className="vol-card__chips">
                    <span className="vol-card__chip">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" /></svg>
                      {v.phoneNumber}
                    </span>
                    {v.availableSeats != null && (
                      <span className="vol-card__chip vol-card__chip--seats">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
                        {v.availableSeats} מושבים
                      </span>
                    )}
                    {v.address?.city && (
                      <span className="vol-card__chip">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {v.address.city}{v.address.street ? `, ${v.address.street} ${v.address.houseNumber}` : ''}
                      </span>
                    )}
                    {v.isCarHandicapped && (
                      <span className="vol-card__chip vol-card__chip--feature">{BADGE_LABELS.isCarHandicapped}</span>
                    )}
                    {v.isBabySeat && (
                      <span className="vol-card__chip vol-card__chip--feature">{BADGE_LABELS.isBabySeat}</span>
                    )}
                  </div>
                  <div className="vol-card__availability">
                    <span className="vol-card__availability-title">זמינות קרובה:</span>
                    {upcomingSlots(v.id).length === 0 ? (
                      <span className="vol-card__availability-empty">לא הוזנה זמינות</span>
                    ) : (
                      <>
                        {upcomingSlots(v.id).slice(0, 3).map(s => (
                          <span key={s.id} className="vol-card__slot">{formatSlot(s)}</span>
                        ))}
                        {upcomingSlots(v.id).length > 3 && (
                          <span className="vol-card__availability-empty">ועוד {upcomingSlots(v.id).length - 3}</span>
                        )}
                      </>
                    )}
                    <span className="vol-card__details-link">לניהול הזמינות ←</span>
                  </div>
                </div>
                <button className="vol-card__edit-btn" onClick={(e) => { e.stopPropagation(); openEdit(v); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  עדכון
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="vol-page__overlay" onClick={closeModal}>
          <div className="vol-page__modal" onClick={e => e.stopPropagation()}>
            <div className="vol-page__modal-header">
              <span className="vol-page__modal-title">
                {editTarget ? 'עדכון פרטי מתנדב' : 'הוספת מתנדב חדש'}
              </span>
              <button className="vol-page__close-btn" onClick={closeModal}>✕</button>
            </div>

            <div className="vol-page__modal-body">
              <div className="vol-page__row">
                <div className="vol-page__field">
                  <label className="vol-page__label">שם פרטי <span className="vol-page__req">*</span></label>
                  <input className="vol-page__input" placeholder="שם פרטי" value={form.firstName || ''} onChange={e => set('firstName', e.target.value)} dir="rtl" />
                </div>
                <div className="vol-page__field">
                  <label className="vol-page__label">שם משפחה <span className="vol-page__req">*</span></label>
                  <input className="vol-page__input" placeholder="שם משפחה" value={form.lastName || ''} onChange={e => set('lastName', e.target.value)} dir="rtl" />
                </div>
              </div>
              <div className="vol-page__field">
                <label className="vol-page__label">טלפון <span className="vol-page__req">*</span></label>
                <input className="vol-page__input" placeholder="05X-XXXXXXX" value={form.phoneNumber || ''} onChange={e => set('phoneNumber', e.target.value)} dir="ltr" />
              </div>
              <div className="vol-page__field">
                <label className="vol-page__label">אימייל</label>
                <input className="vol-page__input" placeholder="example@email.com" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} dir="ltr" />
              </div>
              <div className="vol-page__field">
                <label className="vol-page__label">עיר</label>
                <input className="vol-page__input" placeholder="עיר" value={form.address?.city || ''} onChange={e => set('address', { ...form.address, city: e.target.value })} dir="rtl" />
              </div>
              <div className="vol-page__field">
                <label className="vol-page__label">שכונה</label>
                <input className="vol-page__input" placeholder="שכונה" value={form.address?.neighborhood || ''} onChange={e => set('address', { ...form.address, neighborhood: e.target.value })} dir="rtl" />
              </div>
              <div className="vol-page__field">
                <label className="vol-page__label">רחוב</label>
                <input className="vol-page__input" placeholder="רחוב" value={form.address?.street || ''} onChange={e => set('address', { ...form.address, street: e.target.value })} dir="rtl" />
              </div>
              <div className="vol-page__field">
                <label className="vol-page__label">מספר בית</label>
                <input className="vol-page__input" type="number" placeholder="מספר בית" value={form.address?.houseNumber ?? ''} onChange={e => set('address', { ...form.address, houseNumber: e.target.value ? Number(e.target.value) : 0 })} dir="rtl" />
              </div>

              <div className="vol-page__field">
                <label className="vol-page__label">מספר מושבים פנויים</label>
                <input className="vol-page__input" type="number" min={1} max={8} placeholder="מספר מושבים" value={form.availableSeats ?? ''} onChange={e => set('availableSeats', e.target.value ? Number(e.target.value) : undefined)} dir="rtl" />
              </div>
              <div className="vol-page__checkboxes">
                <label className="vol-page__checkbox-label">
                  <input type="checkbox" checked={!!form.isCarHandicapped} onChange={e => set('isCarHandicapped', e.target.checked)} />
                  רכב נגיש לנכים
                </label>
                <label className="vol-page__checkbox-label">
                  <input type="checkbox" checked={!!form.isBabySeat} onChange={e => set('isBabySeat', e.target.checked)} />
                  כיסא בטיחות לילדים
                </label>
              </div>
            </div>

            <div className="vol-page__modal-footer">
              <button className="vol-page__cancel-btn" onClick={closeModal}>ביטול</button>
              <button className="vol-page__save-btn" onClick={handleSave} disabled={!canSave || saving}>
                {saving ? 'שומר...' : editTarget ? 'שמור שינויים' : 'הוסף מתנדב'}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default VolunteersPage;
