import api from './api';
import { Volunteer } from '../models/volunteer';

const volunteersService = {
  async getVolunteers(): Promise<Volunteer[]> {
    const res = await api.get<Volunteer[]>('/volunteers');
    return res.data;
  },

  async createVolunteer(payload: Partial<Volunteer>): Promise<Volunteer> {
    const res = await api.post<Volunteer>('/volunteers', payload);
    return res.data;
  },

async updateVolunteer(oldPhoneNumber: string, payload: Partial<Volunteer>): Promise<void> {
  await api.put(`/volunteers/${oldPhoneNumber}`, payload);
},

};

export default volunteersService;
