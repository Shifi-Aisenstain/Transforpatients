import { Address } from './address';

export interface Family {
  id: number;
  lastName: string;
  phoneNumber: string;
  email?: string | null;
  addressId?: number | null;
  numberOfPeople?: number | null;
  address?: Partial<Address> | null;
}
