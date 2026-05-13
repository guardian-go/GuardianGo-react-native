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
