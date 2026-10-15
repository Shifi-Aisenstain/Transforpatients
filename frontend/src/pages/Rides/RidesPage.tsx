import React, { useEffect, useState, useMemo } from 'react';
import ridesService from '../../services/rides';
import familiesService from '../../services/familiesService';
import { RideRequest, RideStatus } from '../../models/rideRequest';
import { Family } from '../../models/family';
import './RidesPage.css';

const STATUS_LABEL: Record<RideStatus, string> = { 1: 'חדשה', 2: 'בטיפול', 3: 'אושרה' }; const INTERVAL_LABEL: Record<string, string> = { Weekly: 'שבועי', Monthly: 'חודשי' };

const EMPTY: Partial<RideRequest> = {
  familyId: undefined, rideTime: '', status: 1, regularRide: false, recurringInterval: null,
};

const RidesPage: React.FC = () => {
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
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
    Promise.all([ridesService.getRides(), familiesService.getFamilies()])
      .then(([r, f]) => { setRides(r); setFamilies(f); })
      .catch(e => setError(e?.message || 'שגיאה בטעינת נסיעות'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const familyName = (id?: number | null) =>
    id ? (families.find(f => f.id === id)?.lastName ?? `#${id}`) : '—';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rides.filter(r => {
      if (filterStatus && r.status !== filterStatus) return false;
      if (!q) return true;
      return familyName(r.familyId).toLowerCase().includes(q);
    });
  }, [rides, families, search, filterStatus]);

  const openAdd = () => { setEditTarget(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (r: RideRequest) => { setEditTarget(r); setForm({ ...r }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditTarget(null); setForm(EMPTY); };

  const set = (field: keyof RideRequest, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.familyId || !form.rideTime) return;
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

  const canSave = !!form.familyId && !!form.rideTime;

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
              placeholder="חיפוש לפי שם משפחה..."
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
                    {r.volunteerId && (
                      <span className="ride-card__chip">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                        מתנדב שובץ
                      </span>
                    )}
                  </div>
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
              <div className="rides-page__field">
                <label className="rides-page__label">משפחה <span className="rides-page__req">*</span></label>
                <select
                  className="rides-page__input"
                  value={form.familyId ?? ''}
                  onChange={e => set('familyId', Number(e.target.value))}
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
