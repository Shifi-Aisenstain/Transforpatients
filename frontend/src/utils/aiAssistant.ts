import { VolunteerMatch } from './matching';
import { ExplainRequest } from '../models/rideAssistant';

/** Israeli phone number to the international form used in WhatsApp links (0501234567 -> 972501234567). */
export function toWhatsAppNumber(phone?: string | null): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('972')) return digits;
  return digits.startsWith('0') ? `972${digits.slice(1)}` : digits;
}

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

/** The reasons of a match, split into what speaks for the volunteer and what speaks against. */
export function describeMatch(m: VolunteerMatch): { pros: string[]; cons: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];

  if (m.availableAtTime && m.slot) pros.push(`פנוי/ה בשעה זו (${hhmm(m.slot.startDateTime)}–${hhmm(m.slot.endDateTime)})`);
  else cons.push('לא הזין/ה זמינות בשעה זו');

  if (m.availableAtTime && m.directionMatch) pros.push(`נוסע/ת לכיוון ${m.slot?.destination}`);
  else if (m.slot?.destination) cons.push(`נוסע/ת לכיוון ${m.slot.destination}, שאינו תואם ליעד`);
  else cons.push('כיוון הנסיעה לא ידוע');

  if (m.sameCity) pros.push(`גר/ה ב${m.volunteer.address?.city} (עיר המשפחה)`);

  const seats = m.volunteer.availableSeats ?? 0;
  if (m.enoughSeats) pros.push(`${seats} מושבים פנויים`);
  else cons.push(`${seats} מושבים, לא מספיק`);

  if (m.busy) cons.push('כבר משובץ/ת לנסיעה אחרת באותו זמן');

  return { pros, cons };
}

/**
 * The request for the explanation: the best volunteers that have a positive score, in the order of the ranking.
 * Only first names and reasons are sent. The server never receives phone numbers or family names.
 */
export function buildExplainRequest(
  ride: { rideTime: string; origin?: string | null; destination?: string | null },
  passengers: number | null | undefined,
  matches: VolunteerMatch[],
  top = 3,
): ExplainRequest {
  return {
    ride: {
      start: ride.rideTime,
      origin: ride.origin,
      destination: ride.destination,
      passengers: Math.max(1, passengers ?? 1),
    },
    candidates: matches
      .filter(m => m.score > 0)
      .slice(0, top)
      .map(m => ({
        firstName: m.volunteer.firstName?.trim() || m.volunteer.lastName,
        percent: m.percent,
        ...describeMatch(m),
      })),
  };
}
