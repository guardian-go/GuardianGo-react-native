import { useEffect, useState } from 'react';
import { subscribeToActivityFeed } from '@/services/record.service';
import { PickupRecord } from '@/types';

const todayKey = () => new Date().toISOString().split('T')[0];

export const useActivityFeed = (
  schoolId: string | undefined,
  standard: string | undefined
) => {
  const [records, setRecords] = useState<PickupRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!!schoolId && !!standard);

  useEffect(() => {
    if (!schoolId || !standard) {
      setRecords([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsubscribe = subscribeToActivityFeed(schoolId, standard, todayKey(), (data) => {
      setRecords(data);
      setIsLoading(false);
    });
    return unsubscribe;
  }, [schoolId, standard]);

  return { records, isLoading };
};
