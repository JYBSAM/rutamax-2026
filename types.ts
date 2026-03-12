
export enum Role {
  ADMIN = 'admin',
  DRIVER = 'driver',
  OWNER = 'owner',
  SUPER_MONITOR = 'super_monitor'
}

export interface User {
  id: string;
  name: string;
  email: string;
  rut: string;
  phone: string;
  role: Role;
  companyId: string;
  avatarUrl?: string;
  passwordSet: boolean;
  onboardingComplete?: boolean;
  trialStartDate?: string;
  subscriptionStatus?: 'trial' | 'active' | 'expired';
  companyData?: {
    businessName: string;
    businessRut: string;
    address: string;
    giro: string;
  };
}

export interface Truck {
  id: string;
  companyId: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  vin: string;
  fuelType: 'Diesel' | 'GNC' | 'Electric' | 'Hybrid';
  axles: number;
  maxLoadKg: number;
  status: 'available' | 'on-trip' | 'maintenance' | 'out-of-service';
  currentOdometer: number;
  techReviewExpiry: string;
  circulationPermitExpiry: string;
  soapExpiry: string;
  cameraUrl?: string;
  hasVoice?: boolean;
}

export interface Trailer {
  id: string;
  companyId: string;
  plate: string;
  type: string;
  brand: string;
  year: number;
  axles: number;
  capacityKg: number;
  status: 'available' | 'on-trip' | 'maintenance';
  revExpiry: string;
}

export interface Driver {
  id: string;
  companyId: string;
  name: string;
  rut: string;
  phone: string;
  email: string;
  licenseType: 'A2' | 'A4' | 'A5';
  licenseExpiry: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodType: string;
  status: 'active' | 'on-leave' | 'inactive';
  performanceRating?: number;
  admonishments?: {
    id: string;
    date: string;
    reason: string;
    severity: 'warning' | 'critical';
    speed?: number;
    limit?: number;
  }[];
  isLocked?: boolean;
}

export interface Tariff {
  id: string;
  companyId: string;
  originId: string;
  destinationId: string;
  loadType: string;
  amount: number;
  currency: string;
}

export interface Trip {
  id: string;
  companyId: string;
  otNumber: string;
  originId: string;
  destinationId: string;
  truckId: string;
  trailerId: string;
  driverId: string;
  status: 'pending' | 'loading' | 'in-transit' | 'unloading' | 'delivered' | 'cancelled' | 'suspended';
  loadType: string;
  weightKg: number;
  sealNumber: string;
  scheduledStart: string;
  actualStart?: string;
  actualEnd?: string;
  fleteNeto: number;
  fuelVoucher?: string;
}

// Added missing RealtimeMessage interface used by the RealtimeService
export interface RealtimeMessage {
  type: 'NOTIFICATION' | 'LOCATION_UPDATE' | string;
  payload: any;
  senderId: string;
  timestamp: number;
}
