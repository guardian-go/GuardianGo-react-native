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
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const tick = setInterval(() => {
      setNow(new Date());
      const next = getTodayKey();
      setTodayKey((prev) => (prev === next ? prev : next));
    }, 30_000);
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

  const isActive = !!cycle?.active && cycle.date === todayKey;
  const dismissalTimeReached = !cycle?.dismissalTime || now >= cycle.dismissalTime;

  return {
    cycle,
    isActive,
    // Gate for parent-facing actions: cycle must be active AND the scheduled
    // dismissal time (if any) must have already passed.
    isLive: isActive && dismissalTimeReached,
    hasActivatedToday: !!cycle?.resetAt && cycle.date === todayKey,
    isLoading,
  };
};
