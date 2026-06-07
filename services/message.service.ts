import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

interface BroadcastInput {
  schoolId: string;
  standard: string;
  teacherId: string;
  teacherName: string;
  title: string;
  body: string;
}

export const sendBroadcastMessage = async (input: BroadcastInput): Promise<void> => {
  await addDoc(collection(db, 'broadcastMessages'), {
    ...input,
    createdAt: serverTimestamp(),
    readBy: [],
  });
};
