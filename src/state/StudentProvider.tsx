import { createContext, useEffect, useMemo, useReducer, useRef, type Dispatch, type ReactNode } from 'react';
import type { EngineResult, StudentState } from '../types';
import { studentReducer, type StudentAction } from './studentReducer';
import { computeEngine } from '../utils/engine';
import { dataStore, KEYS } from '../platform/dataStore';
import { usePlatform } from '../platform/PlatformProvider';
import { upgradeDemoState } from '../utils/createState';
import { loadStudentState, saveStudentState, subscribeToStudentState } from '../platform/backend';

function loadState(): StudentState | null {
  const parsed = dataStore.load<StudentState>(KEYS.student);
  return valid(parsed) ? upgradeDemoState({ ...parsed, documents: parsed.documents ?? [] }) : null;
}

const valid = (s: StudentState | null | undefined): s is StudentState => s?.version === 1 && Boolean(s.onboarded) && Boolean(s.taskHistory);

export interface StudentContextValue {
  state: StudentState | null;
  engine: EngineResult | null;
  dispatch: Dispatch<StudentAction>;
}

export const StudentContext = createContext<StudentContextValue | null>(null);

export function StudentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(studentReducer, null, loadState);
  const { session, backend } = usePlatform();
  const fromRemote = useRef(false);
  const synced = useRef(false);
  const lastSent = useRef('');
  const cloud = backend && session?.role === 'student';

  // Persist local changes (this device), and to the student's own row when signed in.
  useEffect(() => {
    if (fromRemote.current) {
      fromRemote.current = false;
      return;
    }
    dataStore.save(KEYS.student, state);
    if (!cloud || !synced.current || !state || state.id !== session?.userId) return;
    const t = window.setTimeout(() => {
      const json = JSON.stringify(state);
      if (json === lastSent.current) return;
      lastSent.current = json;
      saveStudentState(state).catch(() => {
        lastSent.current = '';
      });
    }, 800);
    return () => window.clearTimeout(t);
  }, [state, cloud, session?.userId]);

  // Real-time: pick up changes made in another tab of this browser.
  useEffect(
    () =>
      dataStore.subscribe<StudentState>(KEYS.student, (remote) => {
        fromRemote.current = true;
        dispatch({ type: 'hydrate', state: remote?.onboarded ? remote : null });
      }),
    [],
  );

  // Signed-in student: the server copy wins; a first sign-in uploads this device's plan.
  useEffect(() => {
    synced.current = false;
    if (!cloud) return;
    let stop = () => {};
    let cancelled = false;
    loadStudentState<StudentState>()
      .then((saved) => {
        if (cancelled) return;
        if (valid(saved) && saved.id === session?.userId) {
          lastSent.current = JSON.stringify(saved);
          fromRemote.current = true;
          dispatch({ type: 'hydrate', state: upgradeDemoState({ ...saved, documents: saved.documents ?? [] }) });
        }
        synced.current = true;
        // Saves the current plan if the server had none.
        if (!valid(saved)) dispatch({ type: 'log', text: 'Your plan is now saved to your account', kind: 'profile' });
        stop = subscribeToStudentState<StudentState>((next) => {
          const json = JSON.stringify(next);
          if (json === lastSent.current || !valid(next)) return;
          lastSent.current = json;
          fromRemote.current = true;
          dispatch({ type: 'hydrate', state: next });
        });
      })
      .catch(() => {
        // Backend unreachable: keep working on this device.
        synced.current = false;
      });
    return () => {
      cancelled = true;
      stop();
    };
  }, [cloud, session?.userId]);

  const engine = useMemo(() => (state ? computeEngine(state) : null), [state]);
  const value = useMemo(() => ({ state, engine, dispatch }), [state, engine]);

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
}
