import { useEffect, useState } from 'react';
import { useStudentStore } from '@/store/student.store';
import { subscribeToStudent, subscribeToStudents } from '@/services/student.service';
import { useAuth } from './useAuth';
import { Student } from '@/types';

export const useStudents = () => {
  const { user } = useAuth();
  const { students, isLoading, setStudents, setLoading } = useStudentStore();

  useEffect(() => {
    if (!user?.standard || !user?.schoolId) {
      setStudents([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const unsubscribe = subscribeToStudents(
      user.standard,
      user.schoolId,
      (data) => {
        setStudents(data);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.standard, user?.schoolId]);

  return { students, isLoading };
};

// Original single-child hook — kept for backward compat
export const useChildStudent = (studentId: string | undefined) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!studentId);

  useEffect(() => {
    if (!studentId) {
      setStudent(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsubscribe = subscribeToStudent(studentId, (s) => {
      setStudent(s);
      setIsLoading(false);
    });
    return unsubscribe;
  }, [studentId]);

  return { student, isLoading };
};

// NEW: subscribe to ALL children for a parent
export const useChildrenStudents = (childIds: string[] | undefined) => {
  const [children, setChildren] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(
    !!childIds && childIds.length > 0
  );

  useEffect(() => {
    if (!childIds || childIds.length === 0) {
      setChildren([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Subscribe to each child individually, merge results
    const results = new Map<string, Student>();
    const unsubs: (() => void)[] = [];

    childIds.forEach((id) => {
      const unsub = subscribeToStudent(id, (s) => {
        if (s) {
          results.set(id, s);
        } else {
          results.delete(id);
        }
        // Preserve order of childIds
        setChildren(childIds.flatMap((cid) => {
          const child = results.get(cid);
          return child ? [child] : [];
        }));
        setIsLoading(false);
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach((u) => u());
  }, [JSON.stringify(childIds)]);

  return { children, isLoading };
};
