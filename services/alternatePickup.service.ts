import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { AlternatePickup } from '@/types';
import { Config } from '@/constants/config';

const col = Config.firestore.collections.alternatePickups;

async function uploadPhoto(localUri: string, storagePath: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

export const addAlternatePickup = async (input: {
  parentId: string;
  studentId: string;
  schoolId: string;
  fullName: string;
  email: string;
  photoUri: string;
  idPhotoUri?: string;
}): Promise<string> => {
  const ts = Date.now();
  const base = `alternatePickups/${input.parentId}`;

  const photoUrl = await uploadPhoto(input.photoUri, `${base}/${ts}_photo.jpg`);
  const idPhotoUrl = input.idPhotoUri
    ? await uploadPhoto(input.idPhotoUri, `${base}/${ts}_id.jpg`)
    : undefined;

  const data: any = {
    parentId: input.parentId,
    studentId: input.studentId,
    schoolId: input.schoolId,
    fullName: input.fullName,
    email: input.email,
    photoUrl,
    createdAt: serverTimestamp(),
  };
  if (idPhotoUrl) data.idPhotoUrl = idPhotoUrl;

  const docRef = await addDoc(collection(db, col), data);
  return docRef.id;
};

export const getAlternatePickups = async (parentId: string): Promise<AlternatePickup[]> => {
  const q = query(collection(db, col), where('parentId', '==', parentId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      parentId: data.parentId,
      studentId: data.studentId,
      schoolId: data.schoolId,
      fullName: data.fullName,
      email: data.email,
      photoUrl: data.photoUrl,
      idPhotoUrl: data.idPhotoUrl,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    } as AlternatePickup;
  });
};

export const deleteAlternatePickup = async (pickup: AlternatePickup): Promise<void> => {
  await deleteDoc(doc(db, col, pickup.id));

  const photoRef = ref(storage, pickup.photoUrl);
  await deleteObject(photoRef).catch(() => null);

  if (pickup.idPhotoUrl) {
    const idRef = ref(storage, pickup.idPhotoUrl);
    await deleteObject(idRef).catch(() => null);
  }
};
