import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  limit,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, UserRole } from '@/types';
import { Config } from '@/constants/config';

export const getUserProfile = async (uid: string): Promise<User | null> => {
  const ref = doc(db, Config.firestore.collections.users, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as User;
};

export const signIn = async (email: string, password: string): Promise<User> => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getUserProfile(user.uid);
  if (!profile) throw new Error('User profile not found');
  return profile;
};

export const registerUser = async (
  email: string,
  password: string,
  name: string,
  role: UserRole
): Promise<User> => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  const profile: User = { id: user.uid, name, email, role };
  await setDoc(doc(db, Config.firestore.collections.users, user.uid), profile);
  return profile;
};

export const updateUserProfile = async (
  uid: string,
  data: Partial<Omit<User, 'id' | 'email' | 'role'>>
): Promise<void> => {
  const ref = doc(db, Config.firestore.collections.users, uid);
  await updateDoc(ref, data);
};

export const findGradeTeacher = async (
  schoolId: string,
  standard: string
): Promise<User | null> => {
  const q = query(
    collection(db, Config.firestore.collections.users),
    where('role', '==', 'teacher'),
    where('schoolId', '==', schoolId),
    where('standard', '==', standard),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as User;
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const subscribeToAuthState = (
  callback: (user: FirebaseUser | null) => void
) => onAuthStateChanged(auth, callback);
