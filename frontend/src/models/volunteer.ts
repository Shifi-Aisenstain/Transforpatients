export interface Volunteer {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string | null;
  addressId?: number | null;
  isCarHandicapped: boolean;
  availableSeats?: number | null;
  isBabySeat: boolean;
  isActive?: boolean;
  address?: {
    city: string;
    neighborhood: string;
    street: string;
    houseNumber: number;
  } | null;
}
