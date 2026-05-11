export type UserRole = 'teacher' | 'parent' | 'admin';

export type PickupStatus =
  | 'in_school'
  | 'parent_arrived'
  | 'released'
  | 'picked_up';

export type SubscriptionPlan = 'trial' | 'basic' | 'standard' | 'premium';

export interface Student {
  id: string;
  name: string;
  photoUrl?: string;
  standard: string;
  parentId: string;
  schoolId: string;
  status: PickupStatus;
  statusUpdatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  childId?: string;
  standard?: string;
}

export interface School {
  id: string;
  name: string;
  city: string;
  province: 'ON';
  postalCode: string;
  adminId: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'cancelled';
  trialEndsAt: Date;
  billingEmail: string;
  stripeCustomerId?: string;
  dataRegion: 'northamerica-northeast1';
}

export interface PickupRecord {
  id: string;
  studentId: string;
  studentName: string;
  parentId: string;
  parentName: string;
  teacherId?: string;
  schoolId: string;
  standard: string;
  arrivedAt: Date;
  releasedAt?: Date;
  confirmedAt?: Date;
  date: string;
}

export interface ConsentRecord {
  parentId: string;
  studentId: string;
  consentGivenAt: Date;
  consentVersion: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
}
