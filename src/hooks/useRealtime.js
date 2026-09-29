import { useEffect, useState, useRef } from 'react';
import { realtimeService } from 'services/websocket';
import useAuth from 'hooks/useAuth';

/**
 * Hook to listen for real-time ERP events.
 * 
 * Usage:
 * useRealtime('order.created', (payload) => {
 *   console.log('New order received:', payload);
 *   fetchOrders();
 * });
 * 
 * Or multiple:
 * useRealtime(['order.created', 'order.updated', 'order.approved'], () => {
 *   fetchOrders();
 * });
 */
export function useRealtime(eventTypes, handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Connect if not already connected
    realtimeService.connect();

    const listener = (payload, fullEvent) => {
      if (handlerRef.current) {
        handlerRef.current(payload, fullEvent);
      }
    };

    const unsubscribe = realtimeService.subscribe(eventTypes, listener);

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, Array.isArray(eventTypes) ? eventTypes.join(',') : eventTypes]);
}

/**
 * Hook to monitor real-time connection status.
 */
export function useRealtimeStatus() {
  const [status, setStatus] = useState(realtimeService.status);

  useEffect(() => {
    return realtimeService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });
  }, []);

  return status;
}

export default useRealtime;
