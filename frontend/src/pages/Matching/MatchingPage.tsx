import React, { useEffect, useMemo, useState } from 'react';
import ridesService from '../../services/rides';
import familiesService from '../../services/familiesService';
import volunteersService from '../../services/volunteers';
import volunteerFreeTimesService from '../../services/volunteerFreeTimesService';
import { RideRequest } from '../../models/rideRequest';
import { Family } from '../../models/family';
import { Volunteer } from '../../models/volunteer';
import { Availability } from '../../models/Availability';
import { rankVolunteers, VolunteerMatch, MAX_SCORE, WEIGHTS } from '../../utils/matching';
import AiMatchHelper from '../../components/Matching/AiMatchHelper';
import './MatchingPage.css';

type Tab = 'waiting' | 'pending' | 'approved';

const time = (iso: string) => new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
const day = (iso: string) => new Date(iso).toLocaleDateString('he-IL', { weekday: 'long', day: '2-digit', month: '2-digit' });
const fullName = (v?: Volunteer | null) => (v ? `${v.firstName ?? ''} ${v.lastName}`.trim() : '');

const scoreClass = (percent: number) => (percent >= 80 ? 'high' : percent >= 50 ? 'mid' : 'low');

const MatchingPage: React.FC = () => {
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [slots, setSlots] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('waiting');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = () =>
    Promise.all([ridesService.getRides(), familiesService.getFamilies(), volunteersService.getVolunteers(), volunteerFreeTimesService.getAvailabilities()])
      .then(([r, f, v, a]) => { setRides(r); setFamilies(f); setVolunteers(v); setSlots(a); })
      .catch(e => setError(e?.message || 'שגיאה בטעינת הנתונים'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const byTime = (a: RideRequest, b: RideRequest) => new Date(a.rideTime).getTime() - new Date(b.rideTime).getTime();
  const upcoming = useMemo(() => [...rides].sort(byTime), [rides]);
  const waiting = upcoming.filter(r => !r.volunteerId);
  const pending = upcoming.filter(r => !!r.volunteerId && r.status !== 3);
  const approved = upcoming.filter(r => !!r.volunteerId && r.status === 3);
  const list = tab === 'waiting' ? waiting : tab === 'pending' ? pending : approved;

  // keep a valid selection when the list or the tab changes
  useEffect(() => {
    if (!list.some(r => r.id === selectedId)) setSelectedId(list[0]?.id ?? null);
  }, [tab, rides]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = rides.find(r => r.id === selectedId) ?? null;
  const family = (id?: number) => families.find(f => f.id === id);
  const selectedFamily = family(selected?.familyId);
  const selectedVolunteer = volunteers.find(v => v.id === selected?.volunteerId);

  const matches = useMemo(
    () => selected
      ? rankVolunteers(volunteers, slots, rides, selected, selectedFamily?.address?.city, selectedFamily?.numberOfPeople)
      : [],
    [selected, volunteers, slots, rides, selectedFamily]
  );

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  };

  const assign = async (ride: RideRequest, volunteerId: number | null) => {
    setBusyId(volunteerId ?? -1);
    try {
      // a newly proposed volunteer always starts as "in progress" (waiting for the volunteer's answer)
      const status = volunteerId ? 2 : 1;
      await ridesService.updateRide({ ...ride, volunteerId, status });
      const v = volunteers.find(x => x.id === volunteerId);
      showToast(volunteerId
        ? `${fullName(v)} נבחר/ה לנסיעה של משפחת ${family(ride.familyId)?.lastName} - הנסיעה בטיפול עד לאישור המתנדב`
        : 'השיבוץ הוסר והנסיעה חזרה להמתנה');
      setTab(volunteerId ? 'pending' : 'waiting');
      await load();
    } catch {
      showToast('שגיאה בשמירת השיבוץ');
    } finally {
      setBusyId(null);
    }
  };

  const approve = async (ride: RideRequest) => {
    setBusyId(-2);
    try {
      await ridesService.updateRide({ ...ride, status: 3 });
      showToast(`הנסיעה של משפחת ${family(ride.familyId)?.lastName} אושרה`);
      setTab('approved');
      await load();
    } catch {
      showToast('שגיאה באישור הנסיעה');
    } finally {
      setBusyId(null);
    }
  };

  const mailLink = (v: Volunteer, ride: RideRequest) => {
    const f = family(ride.familyId);
    const subject = `בקשה לנסיעה - ${day(ride.rideTime)} ${time(ride.rideTime)}`;
    const body =
      `שלום ${v.firstName ?? ''},\n\nאנחנו מחפשים מתנדב לנסיעה:\n` +
      `משפחת ${f?.lastName ?? ''} (${f?.numberOfPeople ?? '?'} נוסעים)\n` +
      `מתי: ${day(ride.rideTime)} ${time(ride.rideTime)}\n` +
      `מוצא: ${ride.origin ?? ''}\nיעד: ${ride.destination ?? ''}\n\n` +
      `האם תוכל/י לקחת את הנסיעה? נשמח לתשובה.\nתודה!`;
    return `mailto:${v.email ?? ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const autoAssign = () => {
    if (selected && matches[0] && matches[0].score > 0) assign(selected, matches[0].volunteer.id);
  };

  const reasons = (m: VolunteerMatch) => [
    m.availableAtTime
      ? { ok: true, text: `פנוי/ה בשעה זו (${time(m.slot!.startDateTime)}–${time(m.slot!.endDateTime)})` }
      : { ok: false, text: 'לא הזין/ה זמינות בשעה זו' },
    m.availableAtTime && m.directionMatch
      ? { ok: true, text: `נוסע/ת לכיוון ${m.slot?.destination}` }
      : { ok: false, text: m.slot?.destination ? `נוסע/ת לכיוון ${m.slot.destination}` : 'כיוון לא ידוע' },
    m.sameCity ? { ok: true, text: `גר/ה ב${m.volunteer.address?.city} (עיר המשפחה)` } : { ok: false, text: `גר/ה ב${m.volunteer.address?.city ?? '—'}` },
    m.enoughSeats ? { ok: true, text: `${m.volunteer.availableSeats ?? 0} מושבים פנויים` } : { ok: false, text: `${m.volunteer.availableSeats ?? 0} מושבים - לא מספיק` },
    ...(m.busy ? [{ ok: false, text: 'כבר משובץ/ת לנסיעה אחרת באותו זמן' }] : []),
  ];

  return (
    <div className="match-page" dir="rtl">
      <div className="match-page__header">
        <div>
          <h1 className="match-page__title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--teal-mid)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" /></svg>
            מרכז ההתאמות
          </h1>
          <p className="match-page__subtitle">התאמת מתנדבים לנסיעות לפי זמינות, כיוון נסיעה, עיר ומקומות</p>
        </div>
        <div className="match-page__stats">
          <div className="match-stat match-stat--warn"><b>{waiting.length}</b><span>ממתינות לשיבוץ</span></div>
          <div className="match-stat"><b>{pending.length}</b><span>בטיפול - ממתינות למתנדב</span></div>
          <div className="match-stat match-stat--ok"><b>{approved.length}</b><span>אושרו</span></div>
          <div className="match-stat"><b>{volunteers.filter(v => v.isActive !== false).length}</b><span>מתנדבים פעילים</span></div>
        </div>
      </div>

      {loading && <div className="match-page__state">טוען נתונים...</div>}
      {error && <div className="match-page__state match-page__state--error">{error}</div>}

      {!loading && !error && (
        <div className="match-page__layout">
          <aside className="match-rides">
            <div className="match-tabs">
              <button className={tab === 'waiting' ? 'active' : ''} onClick={() => setTab('waiting')}>ממתינות ({waiting.length})</button>
              <button className={tab === 'pending' ? 'active' : ''} onClick={() => setTab('pending')}>בטיפול ({pending.length})</button>
              <button className={tab === 'approved' ? 'active' : ''} onClick={() => setTab('approved')}>אושרו ({approved.length})</button>
            </div>
            <div className="match-rides__list">
              {list.length === 0 && <div className="match-rides__empty">{tab === 'waiting' ? 'כל הנסיעות שובצו' : tab === 'pending' ? 'אין נסיעות שממתינות לאישור מתנדב' : 'אין נסיעות מאושרות'}</div>}
              {list.map(r => (
                <button key={r.id} className={`match-ride${r.id === selectedId ? ' selected' : ''}`} onClick={() => setSelectedId(r.id)}>
                  <div className="match-ride__when"><b>{time(r.rideTime)}</b><span>{day(r.rideTime)}</span></div>
                  <div className="match-ride__info">
                    <div className="match-ride__family">משפחת {family(r.familyId)?.lastName ?? `#${r.familyId}`}</div>
                    <div className="match-ride__dest">← {r.destination || 'יעד לא צוין'}</div>
                    {r.volunteerId ? <div className="match-ride__vol">{r.status === 3 ? '✓ ' : '⏳ '}{fullName(volunteers.find(v => v.id === r.volunteerId))}</div> : null}
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="match-main">
            {!selected ? (
              <div className="match-main__empty">בחרי נסיעה מהרשימה כדי לראות את ההתאמות</div>
            ) : (
              <>
                <div className="match-trip">
                  <div className="match-trip__meta">
                    <div className="match-trip__family">משפחת {selectedFamily?.lastName} · {selectedFamily?.numberOfPeople ?? '?'} נוסעים</div>
                    <div className="match-trip__time">{day(selected.rideTime)} · {time(selected.rideTime)}</div>
                  </div>
                  <div className="match-trip__route">
                    <div className="match-trip__point"><span>מוצא</span><b>{selected.origin || 'לא צוין'}</b></div>
                    <div className="match-trip__line"><i /><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg><i /></div>
                    <div className="match-trip__point"><span>יעד</span><b>{selected.destination || 'לא צוין'}</b></div>
                  </div>
                  {selectedVolunteer && (
                    <div className={`match-contact match-contact--${selected.status === 3 ? 'approved' : 'pending'}`}>
                      <div className="match-contact__title">
                        {selected.status === 3 ? '✓ הנסיעה אושרה' : '⏳ בטיפול - ממתינה לתשובת המתנדב'}
                        <b>{fullName(selectedVolunteer)}</b>
                      </div>
                      <div className="match-contact__links">
                        <a href={`tel:${selectedVolunteer.phoneNumber}`}>📞 {selectedVolunteer.phoneNumber}</a>
                        {selectedVolunteer.email && <a href={mailLink(selectedVolunteer, selected)}>✉️ {selectedVolunteer.email}</a>}
                      </div>
                    </div>
                  )}
                  <div className="match-trip__actions">
                    {selected.volunteerId ? (
                      <>
                        {selected.status !== 3 && (
                          <button className="match-btn match-btn--approve" onClick={() => approve(selected)} disabled={busyId !== null}>✓ המתנדב אישר - אשרי נסיעה</button>
                        )}
                        <button className="match-btn match-btn--ghost" onClick={() => assign(selected, null)} disabled={busyId !== null}>
                          {selected.status === 3 ? 'בטלי אישור והסירי מתנדב' : 'המתנדב לא אישר - הסירי שיבוץ'}
                        </button>
                      </>
                    ) : (
                      <button className="match-btn match-btn--magic" onClick={autoAssign} disabled={busyId !== null || !matches[0] || matches[0].score === 0}>
                        שבצי את ההתאמה הטובה ביותר
                      </button>
                    )}
                  </div>
                </div>

                <div className="match-legend">
                  ציון ההתאמה (מתוך {MAX_SCORE}): פנוי בשעה {WEIGHTS.available} · כיוון נסיעה {WEIGHTS.direction} · אותה עיר {WEIGHTS.city} · מקומות {WEIGHTS.seats} · תפוס בנסיעה אחרת -{WEIGHTS.available}
                </div>

                {!selected.volunteerId && (
                  <AiMatchHelper key={selected.id} ride={selected} passengers={selectedFamily?.numberOfPeople} matches={matches} />
                )}

                <div className="match-vols">
                  {matches.map((m, i) => {
                    const current = selected.volunteerId === m.volunteer.id;
                    return (
                      <div key={m.volunteer.id} className={`match-vol match-vol--${scoreClass(m.percent)}${current ? ' current' : ''}`}>
                        <div className="match-vol__rank">{i + 1}</div>
                        <div className="match-vol__score" style={{ ['--p' as string]: `${m.percent}` }}>
                          <span>{m.percent}%</span>
                        </div>
                        <div className="match-vol__body">
                          <div className="match-vol__name">
                            {fullName(m.volunteer)}
                            {m.volunteer.isBabySeat && <em>כיסא ילדים</em>}
                            {m.volunteer.isCarHandicapped && <em>רכב נגיש</em>}
                            {i === 0 && m.score > 0 && !selected.volunteerId && <strong>התאמה מומלצת</strong>}
                            {current && <strong className="match-vol__current">משובץ/ת</strong>}
                          </div>
                          <div className="match-vol__contact">
                            <a href={`tel:${m.volunteer.phoneNumber}`}>📞 {m.volunteer.phoneNumber}</a>
                            {m.volunteer.email && <a href={mailLink(m.volunteer, selected)}>✉️ שליחת מייל עם פרטי הנסיעה</a>}
                          </div>
                          <ul className="match-vol__reasons">
                            {reasons(m).map((r, k) => (
                              <li key={k} className={r.ok ? 'ok' : 'no'}>{r.ok ? '✓' : '✕'} {r.text}</li>
                            ))}
                          </ul>
                        </div>
                        <button
                          className="match-btn match-btn--assign"
                          disabled={busyId !== null || current}
                          onClick={() => assign(selected, m.volunteer.id)}
                        >
                          {current ? 'נבחר/ה' : busyId === m.volunteer.id ? 'שומר...' : 'הצעי לו/ה'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {toast && <div className="match-toast">{toast}</div>}
    </div>
  );
};

export default MatchingPage;
