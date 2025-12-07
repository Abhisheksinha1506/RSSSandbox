import { useEffect, useRef } from 'react';

/**
 * Hook that provides an AbortController that is automatically aborted on unmount
 * This prevents memory leaks and unnecessary network requests when components unmount
 * 
 * @returns AbortSignal that can be passed to API calls
 * 
 * @example
 * ```tsx
 * const signal = useAbortController();
 * 
 * const handleSubmit = async () => {
 *   try {
 *     const result = await api.parseFeed(url, signal);
 *     // ...
 *   } catch (error) {
 *     if (error.name === 'AbortError') {
 *       // Request was cancelled, ignore
 *       return;
 *     }
 *     // Handle other errors
 *   }
 * };
 * ```
 */
export function useAbortController(): AbortSignal {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Create new AbortController on mount
    abortControllerRef.current = new AbortController();

    // Cleanup: abort all pending requests on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return abortControllerRef.current?.signal as AbortSignal;
}

