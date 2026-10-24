import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type Dispatch, type ReactNode } from 'react';
import type { PlatformEvent, PlatformState, Session } from '../types';
import { platformReducer, type PlatformAction } from './platformReducer';
import { authorize, isPlatformState } from './authorize';
import { createPlatformSeed } from '../data/platformSeed';
import { dataStore, KEYS, sessionStore } from './dataStore';
import { actOnPlatform, backendEnabled, loadPlatform as loadRemote, SessionExpiredError, signOutOfBackend, subscribeToTicks, watchBackendSession, type PlatformReply } from './backend';

interface PlatformContextValue {
  platform: PlatformState;
  dispatchPlatform: Dispatch<PlatformAction>;
  session: Session | null;
  signIn: (s: Session) => void;
  signOut: () => void;
  /** Events that arrived from another tab or the backend (not this tab's own actions). */
  incoming: { seq: number; events: PlatformEvent[] };
  /** True when this tab is signed in to the shared backend rather than running in the browser only. */
  backend: boolean;
  /** The role whose login ended on its own (expired or revoked); the UI asks them to sign in again. */
  sessionLost: Session['role'] | null;
  clearSessionLost: () => void;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

function loadPlatform(): PlatformState {
  const saved = dataStore.load<unknown>(KEYS.platform);
  // Anything that isn't a complete, current-version state (older demos, edited storage) is replaced with the seed.
  return isPlatformState(saved) ? saved : createPlatformSeed();
}

/** Every action passes the authorization and whitelist check against the state it will change. */
function guardedReducer(state: PlatformState, msg: { action: PlatformAction; session: Session | null }): PlatformState {
  const allowed = authorize(state, msg.action, msg.session);
  if (!allowed) {
    console.warn(`Blocked ${msg.action.type}: not permitted for this account`);
    return state;
  }
  return platformReducer(state, allowed);
}

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [platform, dispatchGuarded] = useReducer(guardedReducer, undefined, loadPlatform);
  const [session, setSession] = useState<Session | null>(() => sessionStore.load<Session>(KEYS.session));
  const sessionRef = useRef(session);
  const remote = Boolean(backendEnabled && session?.backend);
  const remoteRef = useRef(remote);
  remoteRef.current = remote;
  const fromRemote = useRef(false);
  const current = useRef(platform);
  current.current = platform;
  const [incoming, setIncoming] = useState<{ seq: number; events: PlatformEvent[] }>({ seq: 0, events: [] });
  const [sessionLost, setSessionLost] = useState<Session['role'] | null>(null);

  /** The login ended without the user signing out: drop this tab's session and say so. */
  const loseSession = useCallback(() => {
    if (!sessionRef.current?.backend) return;
    const role = sessionRef.current.role;
    sessionStore.save(KEYS.session, null);
    sessionRef.current = null;
    setSession(null);
    setSessionLost(role);
  }, []);

  // Backend bookkeeping: the last version applied, this tab's own events, and requests in flight.
  const version = useRef(0);
  const ownEvents = useRef(new Set<string>());
  const inFlight = useRef(0);
  const reloadAfter = useRef(false);

  const hydrate = useCallback((state: PlatformState) => {
    fromRemote.current = true;
    dispatchGuarded({ action: { type: 'hydrate', state }, session: sessionRef.current });
  }, []);

  /** Toast only events that came from someone else. */
  const announce = useCallback((next: PlatformState) => {
    const seen = new Set(current.current.events.map((e) => e.id));
    const fresh = next.events.filter((e) => !seen.has(e.id) && !ownEvents.current.has(e.id));
    if (fresh.length) setIncoming((i) => ({ seq: i.seq + 1, events: fresh }));
  }, []);

  const applyReply = useCallback(
    (reply: PlatformReply, own: boolean) => {
      if (!remoteRef.current || !isPlatformState(reply.state) || reply.version < version.current) return;
      version.current = reply.version;
      reply.ownEventIds?.forEach((id) => ownEvents.current.add(id));
      if (!own) announce(reply.state);
      hydrate(reply.state);
    },
    [announce, hydrate],
  );

  const reload = useCallback(() => {
    if (inFlight.current > 0) {
      reloadAfter.current = true;
      return;
    }
    loadRemote().then(
      (r) => applyReply(r, false),
      (e) => (e instanceof SessionExpiredError ? loseSession() : undefined),
    );
  }, [applyReply, loseSession]);

  const dispatchPlatform = useCallback<Dispatch<PlatformAction>>(
    (action) => {
      // Instant feedback in this tab, checked by the same rules the server runs.
      dispatchGuarded({ action, session: sessionRef.current });
      // Read the session ref, not render state, so an action right after sign-out never goes to the server.
      if (!backendEnabled || !sessionRef.current?.backend || action.type === 'hydrate') return;
      inFlight.current++;
      actOnPlatform(action)
        .then((r) => applyReply(r, true))
        .catch((e) => {
          if (e instanceof SessionExpiredError) return loseSession();
          // Network trouble: fall back to whatever the server has.
          reloadAfter.current = true;
        })
        .finally(() => {
          inFlight.current--;
          if (inFlight.current === 0 && reloadAfter.current) {
            reloadAfter.current = false;
            reload();
          }
        });
    },
    [applyReply, reload, loseSession],
  );

  // Browser-only mode: persist, and sync other tabs through localStorage.
  useEffect(() => {
    if (fromRemote.current) {
      fromRemote.current = false;
      return;
    }
    if (!remoteRef.current) dataStore.save(KEYS.platform, platform);
  }, [platform]);

  useEffect(
    () =>
      dataStore.subscribe<PlatformState>(KEYS.platform, (other) => {
        if (remoteRef.current) return;
        if (isPlatformState(other)) announce(other);
        hydrate(isPlatformState(other) ? other : createPlatformSeed());
      }),
    [announce, hydrate],
  );

  // Backend mode: load this account's view, then follow the shared version counter.
  useEffect(() => {
    if (!remote) {
      hydrate(loadPlatform());
      return;
    }
    version.current = 0;
    reload();
    const stop = subscribeToTicks((v) => {
      if (v > version.current) reload();
    });
    return stop;
  }, [remote, session?.userId, hydrate, reload]);

  // Backend mode: notice if the login ends while this tab is open.
  useEffect(() => (remote ? watchBackendSession(loseSession) : undefined), [remote, loseSession]);

  const signIn = useCallback((s: Session) => {
    sessionStore.save(KEYS.session, s);
    sessionRef.current = s;
    setSession(s);
    setSessionLost(null);
  }, []);
  const clearSessionLost = useCallback(() => setSessionLost(null), []);
  const signOut = useCallback(() => {
    if (sessionRef.current?.backend) void signOutOfBackend();
    sessionStore.save(KEYS.session, null);
    sessionRef.current = null;
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ platform, dispatchPlatform, session, signIn, signOut, incoming, backend: remote, sessionLost, clearSessionLost }),
    [platform, dispatchPlatform, session, signIn, signOut, incoming, remote, sessionLost, clearSessionLost],
  );
  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used inside <PlatformProvider>');
  return ctx;
}
