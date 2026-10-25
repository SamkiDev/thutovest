/**
 * Demo data for the live bot while the full database is being built.
 * Mirrors the in-app demo student, Tatenda. Dates are relative to "now",
 * so the demo never goes stale. Clearly fictional: no real person.
 */
import type { BotSnapshot } from './bot.ts';

const iso = (now: Date, addDays: number) => new Date(now.getTime() + addDays * 86_400_000).toISOString().slice(0, 10);

export function demoSnapshot(now = new Date()): BotSnapshot {
  return {
    studentId: 'stu-tatenda',
    firstName: 'Tatenda',
    generatedAt: now.toISOString(),
    activeTime: 'weekday evenings',
    deadlines: [
      { id: 'submit-first-choice', title: 'Submit your first-choice application', dueDate: iso(now, 6), daysLeft: 6, status: 'in-progress', where: 'university-site' },
      { id: 'upload-results', title: 'Upload your latest school results', dueDate: iso(now, 6), daysLeft: 6, status: 'todo', where: 'app' },
      { id: 'isfap-apply', title: 'Complete your ISFAP application', dueDate: iso(now, 12), daysLeft: 12, status: 'todo', where: 'university-site' },
      { id: 'residence', title: 'Apply for residence', dueDate: iso(now, 20), daysLeft: 20, status: 'todo', where: 'university-site' },
    ],
    offers: [
      { id: 'app-demo-1', sponsor: 'Ridgeline Technologies', fund: 'Future Developers Bursary 2027', amount: 60000, status: 'offered', institution: 'UJ', docsApproved: 0, docsRequired: 3 },
    ],
    documents: [
      { id: 'doc-demo-1', label: 'Admission letter', sponsor: 'Ridgeline Technologies', status: 'requested', dueInDays: 14 },
      { id: 'doc-demo-2', label: 'Latest school results', sponsor: 'Ridgeline Technologies', status: 'requested', dueInDays: 14 },
    ],
    funding: { totalCost: 116900, identified: 24500, gap: 92400 },
    sponsorMessages: 1,
    updates: [
      { id: 'u1', at: now.toISOString(), text: 'New offer: R60,000 from Ridgeline Technologies' },
      { id: 'u2', at: now.toISOString(), text: 'Ridgeline Technologies requested your admission letter' },
      { id: 'u3', at: now.toISOString(), text: 'Blocked a payment request and suspended QuickBursary SA' },
    ],
  };
}
