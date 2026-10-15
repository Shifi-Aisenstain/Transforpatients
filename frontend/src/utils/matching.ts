import { Availability } from '../models/Availability';
import { Volunteer } from '../models/volunteer';

export interface VolunteerMatch {
  volunteer: Volunteer;
  availableAtTime: boolean;
  sameCity: boolean;
  enoughSeats: boolean;
  score: number;
}

/** True if the volunteer has a free-time slot that covers the given ride time. */
export function isAvailableAt(volunteerId: number, rideTime: string, slots: Availability[]): boolean {
  const t = new Date(rideTime).getTime();
  if (Number.isNaN(t)) return false;
  return slots.some(
    s => s.volunteerId === volunteerId &&
      new Date(s.startDateTime).getTime() <= t &&
      t <= new Date(s.endDateTime).getTime()
  );
}

/**
 * Ranks active volunteers for a ride: available at the ride time first,
 * then volunteers living in the family's city, then those with enough seats.
 */
export function rankVolunteers(
  volunteers: Volunteer[],
  slots: Availability[],
  rideTime: string | undefined,
  familyCity: string | undefined,
  passengers: number | null | undefined,
): VolunteerMatch[] {
  return volunteers
    .filter(v => v.isActive !== false)
    .map(v => {
      const availableAtTime = !!rideTime && isAvailableAt(v.id, rideTime, slots);
      const sameCity = !!familyCity && v.address?.city === familyCity;
      const enoughSeats = !passengers || (v.availableSeats ?? 0) >= passengers;
      const score = (availableAtTime ? 4 : 0) + (sameCity ? 2 : 0) + (enoughSeats ? 1 : 0);
      return { volunteer: v, availableAtTime, sameCity, enoughSeats, score };
    })
    .sort((a, b) => b.score - a.score);
}
