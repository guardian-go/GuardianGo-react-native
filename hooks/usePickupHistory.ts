import { useEffect, useState } from 'react';
import { subscribeToPickupRecordsByParent } from '@/services/record.service';
import { PickupRecord } from '@/types';

export const usePickupHistory = (parentId: string | undefined) => {
  const [records, setRecords] = useState<PickupRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!!parentId);

  useEffect(() => {
    if (!parentId) {
      setRecords([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsubscribe = subscribeToPickupRecordsByParent(parentId, (data) => {
      setRecords(data);
      setIsLoading(false);
    });
    return unsubscribe;
  }, [parentId]);

  return { records, isLoading };
};
