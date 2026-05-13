import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Config } from '@/constants/config';
import { DismissalCycle } from '@/types';
import { getTodayKey } from '@/utils/formatTime';
import { resetClassStudentStatuses } from './student.service';

export const buildCycleId = (
  schoolId: string,
  standard: string,
  date: string = getTodayKey(),
) => `${schoolId}__${standard}__${date}`;

const toDate = (v: any): Date | undefined =>
  v?.toDate?.() ?? (v instanceof Date ? v : v ? new Date(v) : undefined);

export const subscribeToDismissalCycle = (
  schoolId: string,
  standard: string,
  callback: (cycle: DismissalCycle | null) => void,
) => {
  const id = buildCycleId(schoolId, standard);
  const ref = doc(db, Config.firestore.collections.dismissalCycles, id);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    const data = snap.data();
    const today = getTodayKey();
    if (data.date !== today) {
      callback(null);
      return;
    }
    callback({
      id: snap.id,
      schoolId: data.schoolId,
      standard: data.standard,
      date: data.date,
      active: !!data.active,
      dismissalTime: toDate(data.dismissalTime),
      activatedAt: toDate(data.activatedAt),
      activatedBy: data.activatedBy,
    });
  });
};

export const setDismissalCycle = async (input: {
  schoolId: string;
  standard: string;
  active: boolean;
  dismissalTime?: Date;
  teacherId: string;
}): Promise<{ resetStudents: number }> => {
  const date = getTodayKey();
  const id = buildCycleId(input.schoolId, input.standard, date);
  const ref = doc(db, Config.firestore.collections.dismissalCycles, id);

  const existing = await getDoc(ref);
  const isFirstActivationToday = input.active && !existing.exists();

  await setDoc(
    ref,
    {
      schoolId: input.schoolId,
      standard: input.standard,
      date,
      active: input.active,
      dismissalTime: input.dismissalTime ?? null,
      activatedAt: input.active ? serverTimestamp() : null,
      activatedBy: input.active ? input.teacherId : null,
      resetAt: isFirstActivationToday ? serverTimestamp() : existing.data()?.resetAt ?? null,
    },
    { merge: true },
  );

  let resetStudents = 0;
  if (isFirstActivationToday) {
    resetStudents = await resetClassStudentStatuses(input.schoolId, input.standard);
  }
  return { resetStudents };
};
