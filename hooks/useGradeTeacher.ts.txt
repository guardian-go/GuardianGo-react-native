import { useEffect, useState } from 'react';
import { findGradeTeacher } from '@/services/auth.service';
import { User } from '@/types';

export const useGradeTeacher = (
  schoolId: string | undefined,
  standard: string | undefined
) => {
  const [teacher, setTeacher] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!schoolId && !!standard);

  useEffect(() => {
    if (!schoolId || !standard) {
      setTeacher(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    findGradeTeacher(schoolId, standard).then((t) => {
      if (cancelled) return;
      setTeacher(t);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [schoolId, standard]);

  return { teacher, isLoading };
};
