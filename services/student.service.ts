import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  addDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { Student, PickupStatus } from '@/types';
import { Config } from '@/constants/config';

export const getStudent = async (studentId: string): Promise<Student | null> => {
  const snap = await getDoc(doc(db, Config.firestore.collections.students, studentId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Student;
};

export const updateStudentPhoto = async (
  parentId: string,
  studentId: string,
  localUri: string
): Promise<string> => {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const storageRef = ref(storage, `students/${parentId}/${studentId}.jpg`);
  await uploadBytes(storageRef, blob);
  const photoUrl = await getDownloadURL(storageRef);
  await updateDoc(doc(db, Config.firestore.collections.students, studentId), { photoUrl });
  return photoUrl;
};

export const subscribeToStudents = (
  standard: string,
  schoolId: string,
  callback: (students: Student[]) => void
) => {
  const q = query(
    collection(db, Config.firestore.collections.students),
    where('standard', '==', standard),
    where('schoolId', '==', schoolId)
  );

  return onSnapshot(q, (snapshot) => {
    const students = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Student[];
    callback(students);
  });
};

export const subscribeToStudent = (
  studentId: string,
  callback: (student: Student | null) => void
) => {
  const ref = doc(db, Config.firestore.collections.students, studentId);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() } as Student);
  });
};

export const createStudent = async (data: {
  name: string;
  standard: string;
  parentId: string;
  schoolId: string;
  parentName?: string;
}): Promise<string> => {
  const ref = await addDoc(collection(db, Config.firestore.collections.students), {
    ...data,
    status: 'in_school' as PickupStatus,
    statusUpdatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateStudentStatus = async (
  studentId: string,
  status: PickupStatus
): Promise<void> => {
  const ref = doc(db, Config.firestore.collections.students, studentId);
  await updateDoc(ref, { status, statusUpdatedAt: serverTimestamp() });
};

export const resetClassStudentStatuses = async (
  schoolId: string,
  standard: string,
): Promise<number> => {
  const q = query(
    collection(db, Config.firestore.collections.students),
    where('schoolId', '==', schoolId),
    where('standard', '==', standard),
  );
  const snap = await getDocs(q);
  const stale = snap.docs.filter((d) => d.data().status !== 'in_school');
  if (stale.length === 0) return 0;
  const batch = writeBatch(db);
  stale.forEach((d) => {
    batch.update(d.ref, {
      status: 'in_school' as PickupStatus,
      statusUpdatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
  return stale.length;
};
