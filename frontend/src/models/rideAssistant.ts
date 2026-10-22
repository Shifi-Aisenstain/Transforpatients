/** A ride request extracted from a free-text message. Whatever the message does not say is null. */
export interface ParsedRideRequest {
  familyLastName?: string | null;
  fromCity?: string | null;
  fromNeighborhood?: string | null;
  fromStreet?: string | null;
  destination?: string | null;
  /** Local date and time, for example 2026-10-23T08:00:00 */
  start?: string | null;
  passengers?: number | null;
  needsBabySeat: boolean;
  needsHandicapAccess: boolean;
  isRecurring: boolean;
  frequency?: 'Weekly' | 'Monthly' | null;
  occurrences?: number | null;
  missingFields: string[];
  warnings: string[];
}

export interface ExplainCandidate {
  firstName: string;
  percent: number;
  /** Reasons in favour of the volunteer, as shown on the matching screen. */
  pros: string[];
  /** Reasons against, or missing requirements. */
  cons: string[];
}

export interface ExplainRequest {
  ride: {
    start: string;
    origin?: string | null;
    destination?: string | null;
    passengers: number;
  };
  candidates: ExplainCandidate[];
}

export interface Explanation {
  summary: string;
  volunteerMessage: string;
  /** false when the text was built from a template (no AI key, or the AI service failed) */
  fromLlm: boolean;
}
