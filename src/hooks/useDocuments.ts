import { useCallback, useMemo } from 'react';
import type { DocumentShare, RiskAlert, VaultDocument } from '../types';
import { useStudent } from './useStudent';
import { useToast } from './useToast';
import { usePlatform } from '../platform/PlatformProvider';
import { DOCUMENT_INFO } from '../data/documents';
import { daysUntil, formatDate } from '../utils/dates';

export interface RequestView {
  share: DocumentShare;
  sponsorName: string;
  fundName: string;
  vaultDoc?: VaultDocument;
}

/** Sponsor document requests for the signed-in student, plus one-tap in-app sharing. */
export function useDocuments() {
  const { state, dispatch } = useStudent();
  const { platform, dispatchPlatform } = usePlatform();
  const notify = useToast();

  const myAppIds = useMemo(() => new Set(platform.applications.filter((a) => a.studentId === state.id).map((a) => a.id)), [platform.applications, state.id]);

  const requests: RequestView[] = useMemo(
    () =>
      platform.documents
        .filter((d) => myAppIds.has(d.applicationId))
        .map((share) => {
          const app = platform.applications.find((a) => a.id === share.applicationId)!;
          const fund = platform.funds.find((f) => f.id === app.fundId);
          const sponsor = platform.sponsors.find((s) => s.id === fund?.sponsorId);
          return {
            share,
            sponsorName: sponsor?.name ?? 'Sponsor',
            fundName: fund?.name ?? '',
            vaultDoc: (state.documents ?? []).find((v) => v.kind === share.kind && v.check.status !== 'failed'),
          };
        }),
    [platform, myAppIds, state.documents],
  );

  /** Requests the student can act on now: only after they've accepted an offer. */
  const open = requests.filter((r) => {
    const app = platform.applications.find((a) => a.id === r.share.applicationId);
    return (r.share.status === 'requested' || r.share.status === 'resubmit') && (app?.status === 'accepted' || app?.status === 'approved' || app?.status === 'paid');
  });

  const share = useCallback(
    (shareId: string, doc: VaultDocument) => {
      const { id, ...rest } = doc;
      const req = requests.find((r) => r.share.id === shareId);
      dispatchPlatform({ type: 'shareDocument', shareId, snapshot: { ...rest, documentId: id }, studentName: state.profile.firstName });
      dispatch({ type: 'log', text: `Shared ${doc.fileName} with ${req?.sponsorName ?? 'a sponsor'} in the app`, kind: 'funding' });
      notify(`Shared with ${req?.sponsorName ?? 'the sponsor'}. Only they can see it, and only for this award.`);
    },
    [requests, dispatchPlatform, dispatch, notify, state.profile.firstName],
  );

  return { requests, open, share, vault: state.documents ?? [] };
}

/** Sponsor document requests as Risk Radar alerts, so they sit alongside deadlines. */
export function sponsorDocumentAlerts(open: RequestView[]): RiskAlert[] {
  return open.map((r) => {
    const days = daysUntil(r.share.dueOn);
    const label = DOCUMENT_INFO[r.share.kind].label;
    return {
      id: `sponsor-doc-${r.share.id}`,
      category: 'document',
      severity: days <= 5 || r.share.status === 'resubmit' ? 'urgent' : 'soon',
      title: r.share.status === 'resubmit' ? 'Sponsor needs a new document' : 'Sponsor document request',
      subject: `${label} for ${r.sponsorName}`,
      impact: 'Your award is only paid to your institution once the sponsor approves every required document.',
      why: `Flagged because ${r.sponsorName} requested your ${label.toLowerCase()} in the app and it hasn’t been ${r.share.status === 'resubmit' ? 're-shared' : 'shared'} yet. Due ${formatDate(r.share.dueOn)}.${r.share.reviewNote ? ` Sponsor’s note: “${r.share.reviewNote}”` : ''}`,
      recommendedAction: r.vaultDoc ? `Share the ${label.toLowerCase()} already in your vault.` : `Upload your ${label.toLowerCase()} to your vault, then share it.`,
      dueDate: r.share.dueOn,
      daysLeft: days,
      route: '/app/documents',
      routeLabel: 'Open documents',
    } satisfies RiskAlert;
  });
}

/** Risk Radar alerts from the engine plus sponsor document requests, in one sorted list. */
export function useAllAlerts(): RiskAlert[] {
  const { engine } = useStudent();
  const { open } = useDocuments();
  return useMemo(() => {
    const order = { urgent: 0, soon: 1, watch: 2 };
    return [...sponsorDocumentAlerts(open), ...engine.alerts].sort((a, b) => order[a.severity] - order[b.severity] || (a.daysLeft ?? 999) - (b.daysLeft ?? 999));
  }, [open, engine.alerts]);
}
