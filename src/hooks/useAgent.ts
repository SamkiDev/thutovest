import { useCallback, useMemo } from 'react';
import type { AgentItem } from '../types';
import { useStudent } from './useStudent';
import { useToast } from './useToast';
import { usePlatform } from '../platform/PlatformProvider';
import { runAgent } from '../intelligence/agent';
import { opportunityById } from '../data/fundingOpportunities';

/** The student's agent brief plus approve / dismiss handlers that carry out the effect. */
export function useAgent() {
  const { state, engine, dispatch } = useStudent();
  const { platform, dispatchPlatform } = usePlatform();
  const notify = useToast();

  const brief = useMemo(() => runAgent(state, engine, platform), [state, engine, platform]);

  const approve = useCallback(
    (item: AgentItem) => {
      const e = item.effect;
      if (e.type === 'prepareOpportunity') {
        dispatch({ type: 'setOpportunityStatus', id: e.opportunityId, status: 'preparing' });
        notify(`${opportunityById(e.opportunityId)?.name ?? 'Application'} marked as preparing. Your pre-filled details are on the Funding page.`);
      } else if (e.type === 'expressInterest') {
        const fund = platform.funds.find((f) => f.id === e.fundId);
        dispatchPlatform({ type: 'expressInterest', fundId: e.fundId, studentId: state.id, studentName: state.profile.firstName, by: 'agent' });
        dispatch({ type: 'log', text: `Shared your verified profile with ${fund?.name ?? 'a sponsor'}`, kind: 'funding' });
        notify(`Profile shared with ${fund?.name}. The sponsor sees your first name, province, field, gap and verification badges only.`);
      } else if (e.type === 'enableDiscovery') {
        dispatch({ type: 'setDiscoverable', value: true });
        notify('Sponsor discovery is on.');
      } else if (e.type === 'shareDocument') {
        const doc = (state.documents ?? []).find((d) => d.id === e.documentId);
        if (doc) {
          const { id, ...rest } = doc;
          dispatchPlatform({ type: 'shareDocument', shareId: e.shareId, snapshot: { ...rest, documentId: id }, studentName: state.profile.firstName });
          dispatch({ type: 'log', text: `Shared ${doc.fileName} with a sponsor in the app`, kind: 'funding' });
          notify(`${doc.fileName} shared in the app. The sponsor can review it now.`);
        }
      } else if (e.type === 'requestTutor') {
        dispatchPlatform({ type: 'requestTutor', applicationId: e.applicationId, subject: e.subject, note: '', studentName: state.profile.firstName });
        notify(`Tutor request for ${e.subject} sent to your sponsor.`);
      } else if (e.type === 'startTask') {
        dispatch({ type: 'setTaskStatus', taskId: e.taskId, status: 'in-progress' });
      }
      dispatch({ type: 'agentDecision', id: item.id, decision: 'approved' });
    },
    [dispatch, dispatchPlatform, notify, platform.funds, state.id, state.profile.firstName, state.documents],
  );

  const dismiss = useCallback(
    (item: AgentItem) => {
      dispatch({ type: 'agentDecision', id: item.id, decision: 'dismissed' });
      notify('Dismissed. I won’t suggest this again.', 'info');
    },
    [dispatch, notify],
  );

  return { brief, approve, dismiss };
}
