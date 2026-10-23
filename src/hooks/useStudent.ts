import { useContext } from 'react';
import { StudentContext } from '../state/StudentProvider';

/** Raw access — state may be null before onboarding. */
export function useStudentContext() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useStudentContext must be used inside <StudentProvider>');
  return ctx;
}

/** For screens inside the app shell, which only render once a profile exists. */
export function useStudent() {
  const { state, engine, dispatch } = useStudentContext();
  if (!state || !engine) throw new Error('useStudent requires an onboarded student');
  return { state, engine, dispatch };
}
