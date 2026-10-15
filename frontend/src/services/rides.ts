import api from './api';
import { RideRequest } from '../models/rideRequest';

const ridesService = {
  
  async getRides(): Promise<RideRequest[]> {
    const res = await api.get<RideRequest[]>('/Rides');
    return res.data;
  },

  async createRide(payload: Partial<RideRequest>,ft?:string|null,times:number=1): Promise<RideRequest> {
    const params = ft?`?ft=${ft}&times=${times}`:'';
    const res = await api.post<RideRequest>(`/Rides${params}`, payload);
    return res.data;
  },

  async updateRide(payload: Partial<RideRequest>): Promise<RideRequest> {
    const res = await api.put<RideRequest>(`/Rides`, payload);
    return res.data;
  },
    async getRidesByVolunteer(volunteerId: number): Promise<RideRequest[]> {
    const res = await api.get<RideRequest[]>(`/Rides/volunteer/${volunteerId}`);
    return res.data;
  },

  async deleteRide(id: number): Promise<void> {
    await api.delete(`/Rides/${id}`);
  },
};

export default ridesService;