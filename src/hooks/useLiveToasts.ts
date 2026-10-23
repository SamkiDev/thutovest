import { useEffect, useRef } from 'react';
import type { PlatformEvent } from '../types';
import { usePlatform } from '../platform/PlatformProvider';
import { useToast } from './useToast';

/** Shows a toast when something relevant happens in another tab (or, later, on the server). */
export function useLiveToasts(isMine: (e: PlatformEvent) => boolean) {
  const { incoming } = usePlatform();
  const notify = useToast();
  const filter = useRef(isMine);
  filter.current = isMine;

  useEffect(() => {
    if (!incoming.seq) return;
    incoming.events.filter((e) => filter.current(e)).slice(0, 2).forEach((e) => notify(`Live: ${e.text}`, e.kind === 'safety' ? 'info' : 'success'));
  }, [incoming, notify]);
}
