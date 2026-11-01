/**
 * MongoDB / Document Schema Definition for Delivery Personnel
 * Dedicated delivery person model with credentials, vehicle info, and activity status.
 */
export interface IDeliveryPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'DELIVERY_PERSON';
  vehicleNumber: string;
  vehicleType: 'Motorcycle' | 'Electric Scooter' | 'Delivery Van' | 'Bicycle' | string;
  isActive: boolean;
  isBlocked: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
    updatedAt: Date;
  };
  totalDeliveriesCompleted: number;
  activeOrdersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const DeliveryPersonMongoSchema = {
  name: 'DeliveryPerson',
  indexes: [
    { email: 1, unique: true },
    { phone: 1, unique: true },
    { role: 1 },
    { isActive: 1 },
  ],
};

