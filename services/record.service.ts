import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  serverTimestamp,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { PickupRecord, Student, User } from '@/types';
import { Config } from '@/constants/config';

const todayKey = () => new Date().toISOString().split('T')[0];

const fromDoc = (id: string, data: any): PickupRecord => ({
  id,
  studentId: data.studentId,
  studentName: data.studentName,
  parentId: data.parentId,
  parentName: data.parentName,
  teacherId: data.teacherId,
  schoolId: data.schoolId,
  standard: data.standard,
  arrivedAt: data.arrivedAt instanceof Timestamp ? data.arrivedAt.toDate() : data.arrivedAt,
  releasedAt: data.releasedAt instanceof Timestamp ? data.releasedAt.toDate() : data.releasedAt,
  confirmedAt: data.confirmedAt instanceof Timestamp ? data.confirmedAt.toDate() : data.confirmedAt,
  date: data.date,
});

export const createPickupRecord = async (
  student: Student,
  parent: User
): Promise<string> => {
  const ref = await addDoc(collection(db, Config.firestore.collections.pickupRecords), {
    studentId: student.id,
    studentName: student.name,
    parentId: parent.id,
    parentName: parent.name,
    schoolId: student.schoolId,
    standard: student.standard,
    arrivedAt: serverTimestamp(),
    date: todayKey(),
  });
  return ref.id;
};

const findActiveRecord = async (
  studentId: string,
  date: string,
  filter: 'open' | 'released'
): Promise<{ ref: ReturnType<typeof doc>; data: PickupRecord } | null> => {
  const q = query(
    collection(db, Config.firestore.collections.pickupRecords),
    where('studentId', '==', studentId),
    where('date', '==', date),
    limit(10)
  );
  const snap = await getDocs(q);
  const sorted = snap.docs.slice().sort((a, b) => {
    const aMs = (a.data().arrivedAt as Timestamp)?.toMillis?.() ?? 0;
    const bMs = (b.data().arrivedAt as Timestamp)?.toMillis?.() ?? 0;
    return bMs - aMs;
  });
  for (const d of sorted) {
    const data = d.data();
    if (filter === 'open' && !data.releasedAt) {
      return { ref: d.ref, data: fromDoc(d.id, data) };
    }
    if (filter === 'released' && data.releasedAt && !data.confirmedAt) {
      return { ref: d.ref, data: fromDoc(d.id, data) };
    }
  }
  return null;
};

export const releasePickupRecord = async (
  studentId: string,
  teacherId: string
): Promise<void> => {
  const found = await findActiveRecord(studentId, todayKey(), 'open');
  if (!found) return;
  await updateDoc(found.ref, { releasedAt: serverTimestamp(), teacherId });
};

export const confirmPickupRecord = async (studentId: string): Promise<void> => {
  const found = await findActiveRecord(studentId, todayKey(), 'released');
  if (!found) return;
  await updateDoc(found.ref, { confirmedAt: serverTimestamp() });
};

export const subscribeToPickupRecordsByParent = (
  parentId: string,
  callback: (records: PickupRecord[]) => void
) => {
  const q = query(
    collection(db, Config.firestore.collections.pickupRecords),
    where('parentId', '==', parentId),
    orderBy('arrivedAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => fromDoc(d.id, d.data())));
  });
};

export const subscribeToActivityFeed = (
  schoolId: string,
  standard: string,
  date: string,
  callback: (records: PickupRecord[]) => void
) => {
  const q = query(
    collection(db, Config.firestore.collections.pickupRecords),
    where('schoolId', '==', schoolId),
    where('standard', '==', standard),
    where('date', '==', date),
    orderBy('arrivedAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => fromDoc(d.id, d.data())));
  });
};

export const updatePickupRecord = async (
  recordId: string,
  data: Partial<PickupRecord>
): Promise<void> => {
  const ref = doc(db, Config.firestore.collections.pickupRecords, recordId);
  await updateDoc(ref, { ...data });
};
