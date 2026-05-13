import { useEffect, useState } from 'react';
import { subscribeToDismissalCycle } from '@/services/dismissal.service';
import { DismissalCycle } from '@/types';
import { getTodayKey } from '@/utils/formatTime';

export const useDismissalCycle = (
  schoolId: string | undefined,
  standard: string | undefined,
) => {
  const [cycle, setCycle] = useState<DismissalCycle | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!schoolId && !!standard);
  const [todayKey, setTodayKey] = useState<string>(getTodayKey());

  useEffect(() => {
    const tick = setInterval(() => {
      const next = getTodayKey();
      setTodayKey((prev) => (prev === next ? prev : next));
    }, 60_000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!schoolId || !standard) {
      setCycle(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsubscribe = subscribeToDismissalCycle(schoolId, standard, (c) => {
      setCycle(c);
      setIsLoading(false);
    });
    return unsubscribe;
  }, [schoolId, standard, todayKey]);

  return {
    cycle,
    isActive: !!cycle?.active && cycle.date === todayKey,
    isLoading,
  };
};
