import React, { useEffect, useState, useMemo } from 'react';
import ridesService from '../../services/rides';
import familiesService from '../../services/familiesService';
import volunteersService from '../../services/volunteers';
import volunteerFreeTimesService from '../../services/volunteerFreeTimesService';
import { rankVolunteers } from '../../utils/matching';
import { RideRequest, RideStatus } from '../../models/rideRequest';
import { Family } from '../../models/family';
import { Volunteer } from '../../models/volunteer';
import { Availability } from '../../models/Availability';
import { ParsedRideRequest } from '../../models/rideAssistant';
import AiIntakePanel from '../../components/Rides/AiIntakePanel';
import './RidesPage.css';

const STATUS_LABEL: Record<RideStatus, string> = { 1: 'חדשה', 2: 'בטיפול', 3: 'אושרה' }; const INTERVAL_LABEL: Record<string, string> = { Weekly: 'שבועי', Monthly: 'חודשי' };

const EMPTY: Partial<RideRequest> = {
  familyId: undefined, rideTime: '', status: 1, regularRide: false, recurringInterval: null,
};

const RidesPage: React.FC = () => {
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [slots, setSlots] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<RideStatus | 0>(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RideRequest | null>(null);
  const [form, setForm] = useState<Partial<RideRequest>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([ridesService.getRides(), familiesService.getFamilies(), volunteersService.getVolunteers(), volunteerFreeTimesService.getAvailabilities()])
      .then(([r, f, v, a]) => { setRides(r); setFamilies(f); setVolunteers(v); setSlots(a); })
      .catch(e => setError(e?.message || 'שגיאה בטעינת נסיעות'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const familyName = (id?: number | null) =>
    id ? (families.find(f => f.id === id)?.lastName ?? `#${id}`) : '—';

  const volunteerName = (id?: number | null) => {
    const v = id ? volunteers.find(x => x.id === id) : undefined;
    return v ? `${v.firstName ?? ''} ${v.lastName}`.trim() : null;
  };

  const familyAddress = (f?: Family) =>
    f?.address
      ? [f.address.city, f.address.street && `${f.address.street} ${f.address.houseNumber ?? ''}`.trim()].filter(Boolean).join(', ')
      : '';

  const selectedFamily = families.find(f => f.id === form.familyId);
  const matches = useMemo(
    () => rankVolunteers(
      volunteers, slots, rides,
      form.rideTime ? { id: form.id, rideTime: form.rideTime, destination: form.destination } : undefined,
      selectedFamily?.address?.city, selectedFamily?.numberOfPeople
    ),
    [volunteers, slots, rides, form.id, form.rideTime, form.destination, selectedFamily]
  );

  // Fills the form from a message parsed by the AI. The coordinator reviews and completes it before saving.
  const applyParsed = (p: ParsedRideRequest): string[] => {
    const notices: string[] = [];
    const wanted = p.familyLastName?.trim();
    const family = wanted ? families.find(f => f.lastName.trim() === wanted) : undefined;
    if (wanted && !family) notices.push(`לא נמצאה במערכת משפחת ${wanted} - נא לבחור משפחה ידנית.`);

    const parsedOrigin = [p.fromStreet, p.fromNeighborhood, p.fromCity].filter(Boolean).join(', ');
    // an exact pickup address in the message wins; otherwise the family's address is the default
    const origin = p.fromStreet ? parsedOrigin : (family ? familyAddress(family) : '') || parsedOrigin;

    setForm(prev => ({
      ...prev,
      familyId: family ? family.id : prev.familyId,
      rideTime: p.start ? p.start.slice(0, 16) : prev.rideTime,
      origin: origin || prev.origin,
      destination: p.destination ?? prev.destination,
      regularRide: p.isRecurring,
      // the select of this page uses the server values Weekly / Monthly, although the model type says lowercase
      recurringInterval: (p.isRecurring ? p.frequency ?? null : null) as any,
      times: p.isRecurring ? p.occurrences ?? 1 : 1,
    }));
    return notices;
  };

  const onFamilyChange = (id: number) => {
    const fam = families.find(f => f.id === id);
    setForm(prev => ({ ...prev, familyId: id, origin: prev.origin || familyAddress(fam) }));
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rides.filter(r => {
      if (filterStatus && r.status !== filterStatus) return false;
      if (!q) return true;
      return familyName(r.familyId).toLowerCase().includes(q) || (r.destination ?? '').toLowerCase().includes(q);
    });
  }, [rides, families, search, filterStatus]);

  const openAdd = () => { setEditTarget(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (r: RideRequest) => { setEditTarget(r); setForm({ ...r }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditTarget(null); setForm(EMPTY); };

  const set = (field: keyof RideRequest, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.familyId || !form.rideTime || !form.destination?.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        const updated = await ridesService.updateRide(form);
        setRides(prev => prev.map(r => r.id === updated.id ? updated : r));
      } else {
        await ridesService.createRide(form, form.recurringInterval ?? null, form.times ?? 1);
        load();
      }
      closeModal();
    } catch {
      alert('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmId === null) return;
    try {
      await ridesService.deleteRide(deleteConfirmId);
      setRides(prev => prev.filter(r => r.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch {
      alert('שגיאה במחיקה');
    }
  };

  const canSave = !!form.familyId && !!form.rideTime && !!form.destination?.trim();

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="rides-page" dir="rtl">
      <div className="rides-page__header">
        <div>
          <h1 className="rides-page__title"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--teal-mid)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 11l2-5h10l2 5" /><rect x="2" y="11" width="20" height="7" rx="2" /><circle cx="7" cy="18" r="1.5" /><circle cx="17" cy="18" r="1.5" /></svg>ניהול נסיעות</h1>
          <p className="rides-page__subtitle">תיאום ומעקב אחר בקשות הסעה לטיפולים</p>
        </div>
        <button className="rides-page__add-btn" onClick={openAdd}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          הוספת נסיעה
        </button>
      </div>

      <div className="rides-page__card">
        <div className="rides-page__card-header">
          <div className="rides-page__card-header-title">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 11l2-5h10l2 5" />
              <rect x="2" y="11" width="20" height="7" rx="2" />
              <circle cx="7" cy="18" r="1.5" />
              <circle cx="17" cy="18" r="1.5" />
            </svg>
            רשימת נסיעות
          </div>
        </div>

        <div className="rides-page__toolbar">
          <div className="rides-page__search-wrap">
            <svg className="rides-page__search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              className="rides-page__search-input"
              placeholder="חיפוש לפי שם משפחה או יעד..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              dir="rtl"
            />
          </div>

          <div className="rides-page__filters">
            {([0, 1, 2, 3] as const).map(s => (
              <button
                key={s}
                className={`rides-page__filter-btn filter-btn--status-${s}${filterStatus === s ? ' active' : ''}`}
                onClick={() => setFilterStatus(s)}
              >
                {s === 0 ? 'הכל' : STATUS_LABEL[s as RideStatus]}
              </button>
            ))}
          </div>

          <div className="rides-page__count-badge">{filtered.length} נסיעות</div>
        </div>

        {loading && (
          <div className="rides-page__loading">
            <div className="rides-page__spinner" />
            <span>טוען נתונים...</span>
          </div>
        )}
        {error && (
          <div className="rides-page__error">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="rides-page__empty">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
              <path d="M5 11l2-5h10l2 5" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
              <rect x="2" y="11" width="20" height="7" rx="2" stroke="#cbd5e1" strokeWidth="1.5" />
              <circle cx="7" cy="18" r="1.5" stroke="#cbd5e1" strokeWidth="1.5" />
              <circle cx="17" cy="18" r="1.5" stroke="#cbd5e1" strokeWidth="1.5" />
            </svg>
            <p>לא נמצאו נסיעות</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="rides-page__list">
            {filtered.map((r, i) => (
              <div key={r.id ?? i} className="ride-card">
<div className={`ride-card__date-col ride-card__date-col--status-${r.status}`}>                  <div className="ride-card__date">{formatDate(r.rideTime)}</div>
                  <div className="ride-card__time">{formatTime(r.rideTime)}</div>
                </div>

                <div className="ride-card__info">
                  <div className="ride-card__family">משפחת {familyName(r.familyId)}</div>
                  <div className="ride-card__chips">
                    {r.regularRide && (
                      <span className="ride-card__chip ride-card__chip--recurring">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                          <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" />
                        </svg>
                        {r.recurringInterval ? INTERVAL_LABEL[r.recurringInterval] : 'נסיעה חוזרת'}
                      </span>
                    )}
                    {r.volunteerId ? (
                      <span className="ride-card__chip">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                        {volunteerName(r.volunteerId) ?? 'מתנדב שובץ'}
                      </span>
                    ) : (
                      <span className="ride-card__chip ride-card__chip--unassigned">ממתינה לשיבוץ מתנדב</span>
                    )}
                  </div>
                  {(r.origin || r.destination) && (
                    <div className="ride-card__route">
                      <span>{r.origin || '—'}</span>
                      <span className="ride-card__route-arrow">←</span>
                      <span>{r.destination || '—'}</span>
                    </div>
                  )}
                </div>

                <button className="ride-card__edit-btn" onClick={() => openEdit(r)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  עדכון
                </button>
                <button className="ride-card__delete-btn" onClick={e => { e.stopPropagation(); setDeleteConfirmId(r.id); }}>
                  🗑️ מחיקה
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="rides-page__overlay" onClick={closeModal}>
          <div className="rides-page__modal" onClick={e => e.stopPropagation()}>
            <div className="rides-page__modal-header">
              <span className="rides-page__modal-title">
                {editTarget ? 'עדכון פרטי נסיעה' : 'הוספת נסיעה חדשה'}
              </span>
              <button className="rides-page__close-btn" onClick={closeModal}>✕</button>
            </div>

            <div className="rides-page__modal-body">
              {!editTarget && <AiIntakePanel onParsed={applyParsed} />}
              <div className="rides-page__field">
                <label className="rides-page__label">משפחה <span className="rides-page__req">*</span></label>
                <select
                  className="rides-page__input"
                  value={form.familyId ?? ''}
                  onChange={e => onFamilyChange(Number(e.target.value))}
                  dir="rtl"
                >
                  <option value="">בחר משפחה...</option>
                  {families.map(f => (
                    <option key={f.id} value={f.id}>משפחת {f.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="rides-page__field">
                <label className="rides-page__label">תאריך ושעה <span className="rides-page__req">*</span></label>
                <input
                  className="rides-page__input"
                  type="datetime-local"
                  value={form.rideTime ? form.rideTime.slice(0, 16) : ''}
                  onChange={e => set('rideTime', e.target.value)}
                  dir="ltr"
                />
              </div>

              <div className="rides-page__field">
                <label className="rides-page__label">מוצא</label>
                <input
                  className="rides-page__input"
                  value={form.origin ?? ''}
                  onChange={e => set('origin', e.target.value)}
                  placeholder="כתובת האיסוף (ברירת מחדל: כתובת המשפחה)"
                  dir="rtl"
                />
              </div>

              <div className="rides-page__field">
                <label className="rides-page__label">יעד <span className="rides-page__req">*</span></label>
                <input
                  className="rides-page__input"
                  value={form.destination ?? ''}
                  onChange={e => set('destination', e.target.value)}
                  placeholder="למשל: הדסה עין כרם, מחלקה אונקולוגית"
                  dir="rtl"
                />
              </div>

              {editTarget && (
                <>
                  <div className="rides-page__field">
                    <label className="rides-page__label">סטטוס</label>
                    <select
                      className="rides-page__input"
                      value={form.status ?? 1}
                      onChange={e => set('status', Number(e.target.value))}
                      dir="rtl"
                    >
                      {([1, 2, 3] as const).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                  </div>

                  <div className="rides-page__field">
                    <label className="rides-page__label">שיבוץ מתנדב</label>
                    <select
                      className="rides-page__input"
                      value={form.volunteerId ?? ''}
                      onChange={e => set('volunteerId', e.target.value ? Number(e.target.value) : null)}
                      dir="rtl"
                    >
                      <option value="">ללא מתנדב</option>
                      {matches.map(m => (
                        <option key={m.volunteer.id} value={m.volunteer.id}>
                          {`${m.volunteer.firstName ?? ''} ${m.volunteer.lastName}`.trim()}
                          {` — ${m.availableAtTime ? 'פנוי/ה בשעה זו' : 'לא פנוי/ה בשעה זו'}`}
                          {m.directionMatch ? ' · בכיוון הנסיעה' : ''}
                          {m.sameCity ? ' · אותה עיר' : ''}
                          {m.busy ? ' · תפוס/ה בנסיעה אחרת' : ''}
                          {` · ${m.volunteer.availableSeats ?? 0} מושבים`}
                          {m.enoughSeats ? '' : ' (לא מספיק)'}
                        </option>
                      ))}
                    </select>
                    {!matches.some(m => m.availableAtTime) && (
                      <span className="rides-page__hint">אין מתנדב שהזין זמינות בשעה זו. המתנדבים ממוינים לפי עיר ומספר מושבים.</span>
                    )}
                  </div>
                </>
              )}

              {!editTarget && (<>
                <div className="rides-page__field">
                  <label className="rides-page__checkbox-label">
                    <input
                      type="checkbox"
                      checked={!!form.regularRide}
                      onChange={e => set('regularRide', e.target.checked)}
                    />
                    נסיעה חוזרת
                  </label>
                </div>
                {form.regularRide && (
                  <>
                    <div className="rides-page__field">
                      <label className="rides-page__label">תדירות</label>
                      <select
                        className="rides-page__input"
                        value={form.recurringInterval ?? ''}
                        onChange={e => set('recurringInterval', e.target.value || null)}
                        dir="rtl"
                      >
                        <option value="">בחר תדירות...</option>
                        <option value="Weekly">שבועי</option>
                        <option value="Monthly">חודשי</option>
                      </select>
                    </div>

                    <div className="rides-page__field">
                      <label className="rides-page__label">כמה פעמים</label>
                      <input
                        className="rides-page__input"
                        type="number"
                        min={1}
                        value={form.times ?? 1}
                        onChange={e => set('times', Number(e.target.value))}
                        dir="rtl"
                      />
                    </div>
                  </>
                )}
              </>)}
            </div>

            <div className="rides-page__modal-footer">
              <button className="rides-page__cancel-btn" onClick={closeModal}>ביטול</button>
              <button className="rides-page__save-btn" onClick={handleSave} disabled={!canSave || saving}>
                {saving ? (
                  'שומר...'
                ) : editTarget ? (
                  'שמור שינויים'
                ) : form.regularRide && form.times && form.times > 1 ? (
                  `הוסף ${form.times} נסיעות`
                ) : (
                  'הוסף נסיעה'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteConfirmId !== null && (
        <div className="rides-page__overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="rides-page__modal" onClick={e => e.stopPropagation()}>
            <div className="rides-page__modal-header">
              <span className="rides-page__modal-title">אישור מחיקה</span>
              <button className="rides-page__close-btn" onClick={() => setDeleteConfirmId(null)}>✕</button>
            </div>
            <div className="rides-page__modal-body">
              <p style={{ margin: 0, fontSize: '15px', color: 'var(--text)' }}>האם את בטוחה שברצונך למחוק נסיעה זו?</p>
            </div>
            <div className="rides-page__modal-footer">
              <button className="rides-page__cancel-btn" onClick={() => setDeleteConfirmId(null)}>ביטול</button>
              <button className="rides-page__save-btn" style={{ background: 'var(--danger)' }} onClick={handleDelete}>מחק</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RidesPage;
