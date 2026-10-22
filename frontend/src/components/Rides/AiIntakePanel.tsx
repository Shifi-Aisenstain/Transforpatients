import React, { useState } from 'react';
import rideAssistantService from '../../services/rideAssistant';
import { ParsedRideRequest } from '../../models/rideAssistant';
import './AiIntakePanel.css';

interface Props {
  /** Applies the extracted fields to the form. Returns notices to show (for example a family that was not found). */
  onParsed: (parsed: ParsedRideRequest) => string[];
}

/** Fills the new-ride form from a free-text message (for example from WhatsApp). The coordinator reviews the result. */
const AiIntakePanel: React.FC<Props> = ({ onParsed }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedRideRequest | null>(null);
  const [notices, setNotices] = useState<string[]>([]);

  const run = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await rideAssistantService.parseRequest(text);
      setParsed(result);
      setNotices(onParsed(result));
    } catch (e: any) {
      setParsed(null);
      setNotices([]);
      setError(e?.message || 'לא הצלחנו לנתח את ההודעה');
    } finally {
      setLoading(false);
    }
  };

  // the origin is not asked for: it defaults to the address of the family
  const missing = (parsed?.missingFields ?? []).filter(f => f in MISSING_LABEL);

  return (
    <div className="ai-intake">
      <label className="ai-intake__label">✨ הדביקי הודעה (למשל מוואטסאפ) והמערכת תמלא את הטופס</label>
      <textarea
        className="ai-intake__text"
        rows={3}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="למשל: משפחת כהן צריכה מחר ב-8 מרמת גן לשיבא, ילד קטן"
        dir="rtl"
      />
      <div className="ai-intake__actions">
        <button type="button" className="ai-intake__btn" onClick={run} disabled={loading || !text.trim()}>
          {loading ? 'מנתח...' : 'מלאי מההודעה'}
        </button>
      </div>

      {error && <div className="ai-intake__error">{error}</div>}

      {parsed && (
        <div className="ai-intake__result">
          <div className="ai-intake__chips">
            {parsed.passengers != null && <span>{parsed.passengers} נוסעים</span>}
            {parsed.needsBabySeat && <span>כיסא תינוק</span>}
            {parsed.needsHandicapAccess && <span>רכב נגיש</span>}
            {parsed.isRecurring && <span>נסיעה חוזרת{parsed.occurrences ? ` · ${parsed.occurrences} פעמים` : ''}</span>}
          </div>
          {notices.map(n => <div key={n} className="ai-intake__notice">{n}</div>)}
          {parsed.warnings.map(w => <div key={w} className="ai-intake__notice">{w}</div>)}
          {missing.length > 0 && (
            <div className="ai-intake__notice">לא זוהו בהודעה: {missing.map(f => MISSING_LABEL[f]).join(', ')} - נא להשלים.</div>
          )}
          <div className="ai-intake__hint">בדקי את השדות לפני השמירה.</div>
        </div>
      )}
    </div>
  );
};

const MISSING_LABEL: Record<string, string> = {
  FamilyLastName: 'שם המשפחה',
  Destination: 'היעד',
  Start: 'תאריך ושעה',
};

export default AiIntakePanel;
