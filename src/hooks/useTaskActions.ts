import { useCallback } from 'react';
import type { TaskStatus } from '../types';
import { useStudent } from './useStudent';
import { useToast } from './useToast';
import { studentReducer } from '../state/studentReducer';
import { computeEngine } from '../utils/engine';
import { taskById } from '../data/journey';

/**
 * Changes a task's status and tells the student what the engine changed
 * as a result (alerts resolved or raised, progress).
 */
export function useTaskActions() {
  const { state, engine, dispatch } = useStudent();
  const notify = useToast();

  const setStatus = useCallback(
    (taskId: string, status: TaskStatus) => {
      const action = { type: 'setTaskStatus' as const, taskId, status };
      const next = studentReducer(state, action);
      if (!next) return;
      const after = computeEngine(next);
      const before = new Set(engine.alerts.map((a) => a.id));
      const afterIds = new Set(after.alerts.map((a) => a.id));
      const resolved = [...before].filter((id) => !afterIds.has(id)).length;
      const raised = [...afterIds].filter((id) => !before.has(id)).length;
      dispatch(action);

      const title = taskById(taskId)?.title ?? 'Task';
      const pct = Math.round(after.progress.ratio * 100);
      let msg =
        status === 'completed'
          ? `Done: “${title}”. Journey ${pct}% complete.`
          : status === 'in-progress'
            ? `“${title}” is in progress.`
            : `Reopened “${title}”.`;
      if (resolved > 0) msg += ` ${resolved} risk ${resolved === 1 ? 'alert' : 'alerts'} resolved.`;
      if (raised > 0) msg += ` ${raised} risk ${raised === 1 ? 'alert' : 'alerts'} back on your radar.`;
      notify(msg, status === 'completed' ? 'success' : 'info');
    },
    [state, engine, dispatch, notify],
  );

  return { setStatus };
}
