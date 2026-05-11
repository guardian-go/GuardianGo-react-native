import { create } from 'zustand';
import { Student } from '@/types';

interface StudentState {
  students: Student[];
  isLoading: boolean;
  setStudents: (students: Student[]) => void;
  updateStudentStatus: (id: string, status: Student['status']) => void;
  setLoading: (loading: boolean) => void;
}

export const useStudentStore = create<StudentState>((set) => ({
  students: [],
  isLoading: false,

  setStudents: (students) => set({ students }),
  updateStudentStatus: (id, status) =>
    set((state) => ({
      students: state.students.map((s) =>
        s.id === id ? { ...s, status, statusUpdatedAt: new Date() } : s
      ),
    })),
  setLoading: (isLoading) => set({ isLoading }),
}));