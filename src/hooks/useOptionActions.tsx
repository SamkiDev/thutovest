import { useCallback, useState } from 'react';
import type { StudyMatch } from '../types';
import { useStudent } from './useStudent';
import { useToast } from './useToast';
import { OptionDetailModal } from '../components/study-options/OptionDetailModal';
import { formatZAR } from '../utils/format';

/** Save / compare / detail / use-for-costs actions shared by Dashboard and Explorer. */
export function useOptionActions() {
  const { state, engine, dispatch } = useStudent();
  const notify = useToast();
  const [detailId, setDetailId] = useState<string | null>(null);

  const isSaved = useCallback((id: string) => state.savedOptionIds.includes(id), [state.savedOptionIds]);

  const toggleSave = useCallback(
    (m: StudyMatch) => {
      const saved = state.savedOptionIds.includes(m.option.id);
      const willComplete = !saved && state.savedOptionIds.length === 2 && state.taskStatus['t-shortlist'] !== 'completed';
      dispatch({ type: 'toggleSaved', optionId: m.option.id });
      notify(
        saved
          ? `Removed ${m.option.qualification} from your shortlist.`
          : willComplete
            ? `Saved ${m.option.qualification}. That’s three, so “Shortlist three study options” is now done.`
            : `Saved ${m.option.qualification} to your shortlist.`,
        saved ? 'info' : 'success',
      );
    },
    [state.savedOptionIds, state.taskStatus, dispatch, notify],
  );

  const toggleCompare = useCallback(
    (m: StudyMatch) => {
      if (!state.compareIds.includes(m.option.id) && state.compareIds.length >= 3) {
        notify('You can compare up to three options. Remove one first.', 'info');
        return;
      }
      dispatch({ type: 'toggleCompare', optionId: m.option.id });
    },
    [state.compareIds, dispatch, notify],
  );

  const detail = detailId ? engine.matches.find((m) => m.option.id === detailId) ?? null : null;

  const modal = (
    <OptionDetailModal
      match={detail}
      saved={detail ? isSaved(detail.option.id) : false}
      isTuitionSource={detail ? state.costs.tuition === detail.option.indicativeTuition : false}
      onClose={() => setDetailId(null)}
      onToggleSave={() => detail && toggleSave(detail)}
      onUseForCosts={() => {
        if (!detail) return;
        const diff = detail.option.indicativeTuition - state.costs.tuition;
        dispatch({ type: 'useOptionForCosts', optionId: detail.option.id });
        const after = Math.max(0, engine.funding.totalCost + diff - engine.funding.identifiedFunding);
        notify(`Tuition set to ${formatZAR(detail.option.indicativeTuition)}. Estimated funding gap is now ${formatZAR(after)}.`);
      }}
    />
  );

  return { isSaved, toggleSave, toggleCompare, openDetail: setDetailId, modal };
}
