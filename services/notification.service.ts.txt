// Push notification token management.
// Actual notifications are dispatched by Firebase Cloud Functions —
// this module only handles device token registration.

import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export const registerPushToken = async (
  userId: string,
  token: string
): Promise<void> => {
  try {
    const ref = doc(db, 'pushTokens', userId);
    await setDoc(ref, { token, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error('registerPushToken error:', error);
  }
};

export const unregisterPushToken = async (userId: string): Promise<void> => {
  try {
    const ref = doc(db, 'pushTokens', userId);
    await setDoc(ref, { token: null }, { merge: true });
  } catch (error) {
    console.error('unregisterPushToken error:', error);
  }
};
