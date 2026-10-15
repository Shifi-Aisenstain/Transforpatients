import api from './api';
import { Availability } from '../models/Availability';

const volunteerFreeTimesService = {
  async getAvailabilities(): Promise<Availability[]> {
    const res = await api.get<Availability[]>('/VolunteerFreeTime');
    return res.data;
  },

  async getAvailability(id: number): Promise<Availability> {
    const res = await api.get<Availability>(`/VolunteerFreeTime/${id}`);
    return res.data;
  },

  async createAvailability(payload: Partial<Availability>): Promise<Availability> {
    const res = await api.post<Availability>('/VolunteerFreeTime', payload);
    return res.data;
  },

  async updateAvailability(id: number, payload: Partial<Availability>): Promise<Availability> {
    const res = await api.put<Availability>('/VolunteerFreeTime', payload);
    return res.data;
  },

  async deleteAvailability(id: number): Promise<void> {
    await api.delete(`/VolunteerFreeTime/${id}`);
  },
};

export default volunteerFreeTimesService;
