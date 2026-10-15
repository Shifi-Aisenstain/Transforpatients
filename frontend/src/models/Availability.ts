export interface Availability {
  id: number;
  volunteerId: number;
  startDateTime: string;
  endDateTime: string;
  destination?: string | null;
}
