export type RideStatus = 1 | 2 | 3;

export interface RideRequest {
  id: number;
  familyId: number;
  volunteerId?: number | null;
  rideTime: string;
  dateTime?: string;
  status: RideStatus;
  regularRide: boolean;
  origin?: string | null;
  destination?: string | null;
  isRecurring?: boolean;
  frequencyRegularRideId?: string | null;
  recurringInterval?: 'weekly' | 'monthly' | null;
  times?:number;
}
