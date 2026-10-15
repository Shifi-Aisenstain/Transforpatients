import { Availability } from '../models/Availability';
import { Volunteer } from '../models/volunteer';
import { RideRequest } from '../models/rideRequest';

/** Weights of the match score (max 10). */
export const WEIGHTS = { available: 4, direction: 3, city: 2, seats: 1 } as const;
export const MAX_SCORE = WEIGHTS.available + WEIGHTS.direction + WEIGHTS.city + WEIGHTS.seats;

/** A volunteer who already has a ride within this many hours of the new one is considered busy. */
const BUSY_WINDOW_HOURS = 2;

export interface MatchRide {
  id?: number;
  rideTime: string;
  destination?: string | null;
}

export interface VolunteerMatch {
  volunteer: Volunteer;
  /** The free-time slot that covers the ride time, if any. */
  slot?: Availability;
  availableAtTime: boolean;
  /** The volunteer's direction in that slot matches the ride destination. */
  directionMatch: boolean;
  sameCity: boolean;
  enoughSeats: boolean;
  /** The volunteer already has another ride around the same time. */
  busy: boolean;
  score: number;
  /** Score as a 0-100 percentage. */
  percent: number;
}

const REGIONS: Record<string, string[]> = {
  jerusalem: ['ירושלים', 'הדסה', 'שערי צדק', 'עין כרם', 'הר הצופים'],
  center: ['תל אביב', 'איכילוב', 'שיבא', 'תל השומר', 'רמת גן', 'פתח תקווה', 'בילינסון', 'שניידר', 'בני ברק', 'מרכז', 'שרון', 'כפר סבא', 'מאיר', 'רחובות', 'ראשון לציון'],
  north: ['חיפה', 'רמב"ם', 'רמבם', 'נהריה', 'צפת', 'צפון', 'העמק'],
  south: ['באר שבע', 'סורוקה', 'אשדוד', 'אשקלון', 'ברזילי', 'דרום'],
};

const regionsOf = (text: string): Set<string> => {
  const t = text.toLowerCase();
  const found = new Set<string>();
  Object.entries(REGIONS).forEach(([region, words]) => {
    if (words.some(w => t.includes(w))) found.add(region);
  });
  return found;
};

/** True when the volunteer's direction and the ride destination point to the same place or region. */
export function directionMatches(direction?: string | null, destination?: string | null): boolean {
  if (!direction?.trim() || !destination?.trim()) return false;
  const d = direction.toLowerCase();
  const t = destination.toLowerCase();
  if (d.includes(t) || t.includes(d)) return true;
  const a = regionsOf(d);
  const b = regionsOf(t);
  return Array.from(a).some(r => b.has(r));
}

/** The free-time slot of the volunteer that covers the given time. */
export function slotAt(volunteerId: number, time: string, slots: Availability[]): Availability | undefined {
  const t = new Date(time).getTime();
  if (Number.isNaN(t)) return undefined;
  return slots.find(
    s => s.volunteerId === volunteerId &&
      new Date(s.startDateTime).getTime() <= t &&
      t <= new Date(s.endDateTime).getTime()
  );
}

const isBusy = (volunteerId: number, ride: MatchRide, rides: RideRequest[]): boolean => {
  const t = new Date(ride.rideTime).getTime();
  return rides.some(
    r => r.volunteerId === volunteerId && r.id !== ride.id &&
      Math.abs(new Date(r.rideTime).getTime() - t) < BUSY_WINDOW_HOURS * 3600 * 1000
  );
};

/**
 * Ranks the active volunteers for a ride.
 * Score: free at the ride time (4) + driving in the right direction (3) + same city as the family (2)
 * + enough seats (1). A volunteer who is busy with another ride at that time loses 4 points.
 */
export function rankVolunteers(
  volunteers: Volunteer[],
  slots: Availability[],
  rides: RideRequest[],
  ride: MatchRide | undefined,
  familyCity: string | undefined,
  passengers: number | null | undefined,
): VolunteerMatch[] {
  return volunteers
    .filter(v => v.isActive !== false)
    .map(v => {
      const slot = ride ? slotAt(v.id, ride.rideTime, slots) : undefined;
      const availableAtTime = !!slot;
      const directionMatch = availableAtTime && directionMatches(slot?.destination, ride?.destination);
      const sameCity = !!familyCity && v.address?.city === familyCity;
      const enoughSeats = !passengers || (v.availableSeats ?? 0) >= passengers;
      const busy = !!ride && isBusy(v.id, ride, rides);
      const score = Math.max(
        0,
        (availableAtTime ? WEIGHTS.available : 0) +
          (directionMatch ? WEIGHTS.direction : 0) +
          (sameCity ? WEIGHTS.city : 0) +
          (enoughSeats ? WEIGHTS.seats : 0) -
          (busy ? WEIGHTS.available : 0)
      );
      return { volunteer: v, slot, availableAtTime, directionMatch, sameCity, enoughSeats, busy, score, percent: Math.round((score / MAX_SCORE) * 100) };
    })
    .sort((a, b) => b.score - a.score);
}
