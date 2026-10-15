import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import volunteersService from '../../services/volunteers';
import ridesService from '../../services/rides';
import volunteerFreeTimesService from '../../services/volunteerFreeTimesService';
import { Volunteer } from '../../models/volunteer';
import { RideRequest } from '../../models/rideRequest';
import { Availability } from '../../models/Availability';
import { Family } from '../../models/family';
import familiesService from '../../services/familiesService';
import './VolunteerDetailPage.css';

const VolunteerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const EMPTY_AVAIL: Partial<Availability> = {
    volunteerId: 0, startDateTime: '', endDateTime: ''
  };

  const [editAvailTarget, setEditAvailTarget] = useState<Availability | null>(null);
  const [availModalOpen, setAvailModalOpen] = useState(false);
  const [availForm, setAvailForm] = useState<Partial<Availability>>(EMPTY_AVAIL);
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editAvail, setEditAvail] = useState<Availability | null>(null);
  const [editForm, setEditForm] = useState<Partial<Availability>>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    const numId = Number(id);
    setLoading(true);
    Promise.all([
      volunteersService.getVolunteers(),
      ridesService.getRidesByVolunteer(numId).catch(() => [] as RideRequest[]),
      volunteerFreeTimesService.getAvailabilities(),
      familiesService.getFamilies(),
    ])
      .then(([allVolunteers, rideList, allAvail, familyList]) => {
        setVolunteers(allVolunteers);
        setVolunteer(allVolunteers.find(v => v.id === numId) ?? null);
        setRides(rideList);
        setAvailabilities(allAvail.filter(a => a.volunteerId === numId));
        setFamilies(familyList);
      })
      .catch(() => setError('שגיאה בטעינת נתונים'))
      .finally(() => setLoading(false));
  }, [id]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

  const handleDelete = async () => {
    if (deleteConfirmId === null) return;
    try {
      await volunteerFreeTimesService.deleteAvailability(deleteConfirmId);
      setAvailabilities(prev => prev.filter(a => a.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch {
      alert('שגיאה במחיקה');
    }
  };

  const openAvailAdd = () => { setEditAvailTarget(null); setAvailForm({ ...EMPTY_AVAIL, volunteerId: Number(id) }); setAvailModalOpen(true); };
  const closeAvail = () => { setAvailModalOpen(false); setEditAvailTarget(null); setAvailForm(EMPTY_AVAIL); };
  const openAvailEdit = (a: Availability) => { setEditAvailTarget(a); setAvailForm({ ...a }); setAvailModalOpen(true); };
  const openEdit = (a: Availability) => {
    setEditAvail(a);
    setEditForm({ startDateTime: a.startDateTime, endDateTime: a.endDateTime });
  };

  const setAvail = (field: keyof Availability, value: any) =>
    setAvailForm(prev => ({ ...prev, [field]: value }));

  const closeEdit = () => { setEditAvail(null); setEditForm({}); };

  const handleSaveEdit = async () => {
    if (!editAvail || !editForm.startDateTime || !editForm.endDateTime) return;
    setSaving(true);
    try {
      await volunteerFreeTimesService.updateAvailability(editAvail.id, {
        id: editAvail.id,
        volunteerId: editAvail.volunteerId,
        startDateTime: editForm.startDateTime,
        endDateTime: editForm.endDateTime,
      });
      setAvailabilities(prev => prev.map(a =>
        a.id === editAvail.id ? { ...a, ...editForm } : a
      ));
      closeEdit();
    } catch (e: any) {
      alert(JSON.stringify(e?.response?.data) || e?.message || JSON.stringify(e));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAvail = async () => {
    if (!availForm.volunteerId || !availForm.startDateTime?.trim() || !availForm.endDateTime?.trim()) return;
    setSaving(true);
    try {
      const created = await volunteerFreeTimesService.createAvailability(availForm);
      setAvailabilities(prev => [...prev, created]);
      closeAvail();
    } catch {
      alert('שגיאה בשמירת זמן פנוי');
    } finally {
      setSaving(false);
    }
  };
  const canSaveAvail = !!availForm.volunteerId && !!availForm.startDateTime?.trim() && !!availForm.endDateTime?.trim();

  if (loading) return <div className="vd__loading"><div className="vd__spinner" /><span>טוען...</span></div>;
  if (error) return <div className="vd__error">{error}</div>;
  if (!volunteer) return <div className="vd__error">מתנדב לא נמצא</div>;

  return (
    <div className="vd" dir="rtl">
      <div className="vd__top-bar">
        <button className="vd__back" onClick={() => navigate('/volunteers')}>
          ← חזרה לרשימה
        </button>
        <button className="vd__add-avail-btn" onClick={openAvailAdd}>+ הוספת זמן פנוי</button>
      </div>

      <div className="vd__header-card">
        <div className="vd__avatar">{volunteer.firstName?.[0]}{volunteer.lastName?.[0]}</div>
        <div className="vd__info">
          <div className="vd__name">{volunteer.firstName} {volunteer.lastName}</div>
          <div className="vd__chips">
            <span className="vd__chip">📞 {volunteer.phoneNumber}</span>
            {volunteer.email && <span className="vd__chip">✉️ {volunteer.email}</span>}
            {volunteer.availableSeats != null && <span className="vd__chip">{volunteer.availableSeats} מושבים</span>}
            {volunteer.isCarHandicapped && <span className="vd__chip vd__chip--green">רכב נגיש</span>}
            {volunteer.isBabySeat && <span className="vd__chip vd__chip--green">כיסא ילדים</span>}
          </div>
        </div>
      </div>

      <div className="vd__body">
        <div className="vd__section">
          <div className="vd__section-title">זמנים פנויים</div>
          {availabilities.length === 0
            ? <div className="vd__empty">אין זמנים פנויים</div>
            : availabilities.map(a => (
              <div key={a.id} className="vd__avail-row">
                <div className="vd__avail-dates">
                  <span>{formatDate(a.startDateTime)} {formatTime(a.startDateTime)}</span>
                  <span className="vd__avail-arrow">←</span>
                  <span>{formatDate(a.endDateTime)} {formatTime(a.endDateTime)}</span>
                </div>
                <div className="vd__avail-actions">
                  <button className="vd__btn-edit" onClick={() => openEdit(a)}>✏️ עריכה</button>
                  <button className="vd__btn-delete" onClick={() => setDeleteConfirmId(a.id)}>🗑️ מחיקה</button>
                </div>
              </div>
            ))
          }
        </div>

        <div className="vd__section">
          <div className="vd__section-title">נסיעות שהושלמו</div>
          {rides.length === 0
            ? <div className="vd__empty">אין נסיעות</div>
            : rides.map((r, i) => (
              <div key={i} className="vd__ride-row">
                <div className="vd__ride-date">{formatDate(r.rideTime ?? (r as any).dateTime)}</div>
                <div className="vd__ride-time">{formatTime(r.rideTime ?? (r as any).dateTime)}</div>
                <span className="vd__chip">משפחת {families.find(f => f.id === r.familyId)?.lastName ?? `#${r.familyId}`}</span>
              </div>
            ))
          }
        </div>
      </div>

      {editAvail && (
        <div className="vd__overlay" onClick={closeEdit}>
          <div className="vd__modal" onClick={e => e.stopPropagation()}>
            <div className="vd__modal-header">
              <span>עריכת זמן פנוי</span>
              <button className="vd__close-btn" onClick={closeEdit}>✕</button>
            </div>
            <div className="vd__modal-body">
              <div className="vd__field">
                <label>התחלה</label>
                <input
                  type="datetime-local"
                  className="vd__input"
                  value={editForm.startDateTime?.slice(0, 16) || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, startDateTime: e.target.value }))}
                />
              </div>
              <div className="vd__field">
                <label>סיום</label>
                <input
                  type="datetime-local"
                  className="vd__input"
                  value={editForm.endDateTime?.slice(0, 16) || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, endDateTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="vd__modal-footer">
              <button className="vd__cancel-btn" onClick={closeEdit}>ביטול</button>
              <button className="vd__save-btn" onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'שומר...' : 'שמור'}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteConfirmId !== null && (
        <div className="vd__overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="vd__modal" onClick={e => e.stopPropagation()}>
            <div className="vd__modal-header">
              <span>אישור מחיקה</span>
              <button className="vd__close-btn" onClick={() => setDeleteConfirmId(null)}>✕</button>
            </div>
            <div className="vd__modal-body">
              <p style={{ margin: 0, fontSize: '15px', color: 'var(--text)' }}>האם את בטוחה שברצונך למחוק זמן פנוי זה?</p>
            </div>
            <div className="vd__modal-footer">
              <button className="vd__cancel-btn" onClick={() => setDeleteConfirmId(null)}>ביטול</button>
              <button className="vd__save-btn" style={{ background: 'var(--danger)' }} onClick={handleDelete}>מחק</button>
            </div>
          </div>
        </div>
      )}
            {availModalOpen && (
        <div className="vol-page__overlay" onClick={closeAvail}>
          <div className="vol-page__modal" onClick={e => e.stopPropagation()}>
            <div className="vol-page__modal-header">
              <span className="vol-page__modal-title">
                {editAvailTarget ? 'עדכון זמן פנוי' : 'הוספת זמן פנוי למתנדב'}
              </span>
              <button className="vol-page__close-btn" onClick={closeAvail}>✕</button>
            </div>

            <div className="vol-page__modal-body">
              <div className="vol-page__field">
                <label className="vol-page__label">התחלה <span className="vol-page__req">*</span></label>
                <input className="vol-page__input" type="datetime-local" value={availForm.startDateTime || ''} onChange={e => setAvail('startDateTime', e.target.value)} />
              </div>
              <div className="vol-page__field">
                <label className="vol-page__label">סיום <span className="vol-page__req">*</span></label>
                <input className="vol-page__input" type="datetime-local" value={availForm.endDateTime || ''} onChange={e => setAvail('endDateTime', e.target.value)} />
              </div>
            </div>

            <div className="vol-page__modal-footer">
              <button className="vol-page__cancel-btn" onClick={closeAvail}>ביטול</button>
              <button className="vol-page__save-btn" onClick={handleSaveAvail} disabled={!canSaveAvail || saving}>
                {saving ? 'שומר...' : editAvailTarget ? 'שמור שינויים' : 'הוסף זמן פנוי'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerDetailPage;
