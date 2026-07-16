import { useEffect, useState } from 'react';
import { subscribeToActivityFeed } from '@/services/record.service';
import { PickupRecord } from '@/types';

const dateKeysForRange = (days: number): string[] => {
  const keys: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(d.toISOString().split('T')[0]);
  }
  return keys;
};

export const useActivityFeed = (
  schoolId: string | undefined,
  standard: string | undefined,
  days: number = 1,
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
    const unsubscribe = subscribeToActivityFeed(schoolId, standard, dateKeysForRange(days), (data) => {
      setRecords(data);
      setIsLoading(false);
    });
    return unsubscribe;
  }, [schoolId, standard, days]);

  return { records, isLoading };
};
