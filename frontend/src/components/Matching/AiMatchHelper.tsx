import React, { useState } from 'react';
import rideAssistantService from '../../services/rideAssistant';
import { Explanation } from '../../models/rideAssistant';
import { VolunteerMatch } from '../../utils/matching';
import { buildExplainRequest, toWhatsAppNumber } from '../../utils/aiAssistant';
import './AiMatchHelper.css';

interface Props {
  ride: { rideTime: string; origin?: string | null; destination?: string | null };
  passengers?: number | null;
  /** The ranking shown on the matching screen. The AI only explains it, it never changes it. */
  matches: VolunteerMatch[];
}

/** Explains why the top volunteer fits and drafts a message to send to them. */
const AiMatchHelper: React.FC<Props> = ({ ride, passengers, matches }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Explanation | null>(null);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const top = matches.find(m => m.score > 0);
  if (!top) return null;

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const explanation = await rideAssistantService.explainMatch(buildExplainRequest(ride, passengers, matches));
      setResult(explanation);
      setMessage(explanation.volunteerMessage);
    } catch (e: any) {
      setError(e?.message || 'לא הצלחנו להכין הסבר');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the text stays selectable in the box */
    }
  };

  const phone = toWhatsAppNumber(top.volunteer.phoneNumber);

  return (
    <div className="ai-match">
      <div className="ai-match__head">
        <span className="ai-match__title">✨ הסבר והודעה מוכנה למתנדב המומלץ</span>
        <button className="ai-match__btn" onClick={run} disabled={loading}>
          {loading ? 'מכין...' : result ? 'הכיני מחדש' : 'הכיני הסבר והודעה'}
        </button>
      </div>

      {error && <div className="ai-match__error">{error}</div>}

      {result && (
        <>
          <div className="ai-match__summary">
            <span className={`ai-match__badge${result.fromLlm ? ' ai-match__badge--ai' : ''}`}>
              {result.fromLlm ? '✨ הוסבר על ידי AI' : 'הסבר אוטומטי'}
            </span>
            <p>{result.summary}</p>
          </div>
          <label className="ai-match__label">טיוטת הודעה ל{top.volunteer.firstName || top.volunteer.lastName} (אפשר לערוך)</label>
          <textarea className="ai-match__text" rows={3} value={message} onChange={e => setMessage(e.target.value)} dir="rtl" />
          <div className="ai-match__actions">
            <button className="ai-match__btn ai-match__btn--ghost" onClick={copy}>{copied ? 'הועתק ✓' : 'העתקה'}</button>
            {phone && (
              <a
                className="ai-match__btn"
                href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                פתיחה בוואטסאפ
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AiMatchHelper;
