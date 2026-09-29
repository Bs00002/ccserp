import { useEffect, useState } from 'react';
import { realtimeService, RealtimeStatus, ErpEvent } from '../services/websocket';

export function useRealtime(
  eventTypes: string | string[],
  handler: (payload: any, event: ErpEvent) => void
) {
  useEffect(() => {
    const unsubscribe = realtimeService.subscribe(eventTypes, handler);
    return () => {
      unsubscribe();
    };
  }, [Array.isArray(eventTypes) ? eventTypes.join(',') : eventTypes, handler]);
}

export function useRealtimeStatus(): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>(realtimeService.status);

  useEffect(() => {
    const unsubscribe = realtimeService.onStatusChange(setStatus);
    return () => {
      unsubscribe();
    };
  }, []);

  return status;
}

export default useRealtime;
