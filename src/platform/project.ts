import type { PlatformState, Session } from '../types';

/**
 * What one signed-in account may read from the shared marketplace. The server
 * sends only this, so a browser never holds other people's applications,
 * messages or documents.
 *
 * - Everyone: sponsors (public organisation info) and funds.
 * - Student: their own applications and everything attached to them, events
 *   addressed to them or to all.
 * - Sponsor: the anonymised candidate pool, applications to their own funds and
 *   everything attached to those, their own decisions and events.
 * - Signed out: sponsors and open funds only.
 */
export function projectFor(state: PlatformState, session: Session | null): PlatformState {
  const sponsors = state.sponsors.map(({ registrationNumber, ...s }) => ({
    ...s,
    // Registration numbers are only shown to the organisation itself.
    registrationNumber: session?.role === 'sponsor' && session.userId === s.id ? registrationNumber : '',
  }));
  const base: PlatformState = { ...state, sponsors, pool: [], applications: [], messages: [], documents: [], decisions: {}, events: [] };

  if (!session) return { ...base, funds: state.funds.filter((f) => f.status === 'open') };

  if (session.role === 'student') {
    const apps = state.applications.filter((a) => a.studentId === session.userId);
    const ids = new Set(apps.map((a) => a.id));
    return {
      ...base,
      pool: state.pool.filter((p) => p.id === session.userId),
      applications: apps,
      messages: state.messages.filter((m) => ids.has(m.applicationId)),
      documents: state.documents.filter((d) => ids.has(d.applicationId)),
      events: state.events.filter((e) => e.audience === 'all' || (e.audience === 'student' && e.studentId === session.userId)),
    };
  }

  const ownFunds = new Set(state.funds.filter((f) => f.sponsorId === session.userId).map((f) => f.id));
  const apps = state.applications.filter((a) => ownFunds.has(a.fundId));
  const ids = new Set(apps.map((a) => a.id));
  return {
    ...base,
    pool: state.pool,
    applications: apps,
    messages: state.messages.filter((m) => ids.has(m.applicationId)),
    documents: state.documents.filter((d) => ids.has(d.applicationId)),
    decisions: state.decisions[session.userId] ? { [session.userId]: state.decisions[session.userId] } : {},
    events: state.events.filter((e) => e.audience === 'all' || (e.audience === 'sponsor' && e.sponsorId === session.userId)),
  };
}
