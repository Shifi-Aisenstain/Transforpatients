import api from './api';
import { Family } from '../models/family';

const familiesService = {
  async getFamilies(): Promise<Family[]> {
    const res = await api.get<Family[]>('/families/');
    return res.data;
  },

  async getFamily(id: number): Promise<Family> {
    const res = await api.get<Family>(`/families/${id}`);
    return res.data;
  },

  async createFamily(payload: Partial<Family>): Promise<Family> {
    const res = await api.post<Family>('/families/', payload);
    return res.data;
  },

  async updateFamily(oldPhoneNumber: string, payload: Partial<Family>): Promise<Family> {
  const res = await api.put<Family>(`/Families/${oldPhoneNumber}`, payload);
  return res.data;
},


  async deleteFamily(id: number): Promise<void> {
    await api.delete(`/families/${id}`);
  },
};

export default familiesService;
