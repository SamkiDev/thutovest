import { useMemo } from 'react';
import { usePlatform } from '../platform/PlatformProvider';
import { useStudentContext } from './useStudent';
import { allCandidates } from '../intelligence/marketplace';
import { sponsorBrief } from '../intelligence/sponsorInsights';
import { sponsorVerified } from '../utils/trust';

/** Everything the sponsor dashboard needs, for the signed-in sponsor. */
export function useSponsor() {
  const { platform, dispatchPlatform, session, backend } = usePlatform();
  const { state: student } = useStudentContext();
  const sponsor = platform.sponsors.find((s) => s.id === session?.userId) ?? null;

  // On the backend the live student arrives through the server's anonymised pool, never this browser's storage.
  const local = backend ? null : student;
  const candidates = useMemo(() => allCandidates(platform, local), [platform, local]);
  const brief = useMemo(() => (sponsor ? sponsorBrief(sponsor, platform, candidates) : null), [sponsor, platform, candidates]);
  const funds = useMemo(() => platform.funds.filter((f) => f.sponsorId === sponsor?.id), [platform.funds, sponsor]);
  const applications = useMemo(
    () => platform.applications.filter((a) => funds.some((f) => f.id === a.fundId)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [platform.applications, funds],
  );

  return {
    platform,
    dispatchPlatform,
    sponsor,
    verified: sponsor ? sponsorVerified(sponsor) : false,
    candidates,
    brief,
    funds,
    applications,
    candidateById: (id: string) => candidates.find((c) => c.id === id),
  };
}
