import type { FundingOpportunity } from '../types';

/**
 * Funding opportunities shown in the Funding Gap Solver.
 *
 * - Fictional sponsors live in the verified marketplace (data/platformSeed.ts),
 *   not here. This list is external, real-world funding routes only.
 * - Records with an `officialUrl` point to the provider's official homepage.
 *   Eligibility summaries are simplified; criteria change every year and must
 *   be confirmed with the provider. ThutoVest never states that a student
 *   qualifies.
 */
export const FUNDING_OPPORTUNITIES: FundingOpportunity[] = [
  {
    id: 'nsfas',
    name: 'NSFAS Bursary',
    provider: 'National Student Financial Aid Scheme',
    type: 'Government bursary',
    summary: 'Government bursary for public universities and TVET colleges.',
    eligibilitySummary:
      'Published criteria have included South African citizenship and a combined household income of up to R350,000 a year (R600,000 for students with disabilities). Confirm the current rules and closing date on the NSFAS website.',
    officialUrl: 'https://www.nsfas.org.za',
    isDemoRecord: false,
    planningValueNote: 'Value depends on your institution and approved allowances.',
    typicallyCovers: ['tuition', 'accommodation', 'books', 'transport'],
    fields: 'all',
    incomeBands: ['under-350k'],
    institutionTypes: ['university', 'university-of-technology', 'tvet'],
  },
  {
    id: 'isfap',
    name: 'ISFAP Funding',
    provider: 'Ikusasa Student Financial Aid Programme',
    type: 'Bursary',
    summary: 'Funding and mentoring for high-demand careers.',
    eligibilitySummary:
      'Has focused on "missing middle" households that earn above NSFAS thresholds, in selected scarce-skills fields. Fields, partner institutions and income limits change, so check the ISFAP website.',
    officialUrl: 'https://www.isfap.org.za',
    isDemoRecord: false,
    planningValueNote: 'Cover varies by programme and year.',
    typicallyCovers: ['tuition', 'accommodation', 'books'],
    fields: ['computing', 'engineering', 'commerce', 'health', 'science'],
    incomeBands: ['350k-600k'],
    institutionTypes: ['university', 'university-of-technology'],
  },
  {
    id: 'funza',
    name: 'Funza Lushaka Bursary',
    provider: 'Department of Basic Education',
    type: 'Government bursary',
    summary: 'Bursary for future teachers, who then teach in public schools.',
    eligibilitySummary:
      'For initial teacher-education qualifications such as a BEd. Priority subjects, academic requirements and service conditions apply. Confirm on the official Funza Lushaka website.',
    officialUrl: 'https://www.funzalushaka.doe.gov.za',
    isDemoRecord: false,
    planningValueNote: 'Typically covers fees and some living costs; confirm current terms.',
    typicallyCovers: ['tuition', 'accommodation', 'books'],
    fields: ['education'],
    incomeBands: 'all',
    institutionTypes: ['university'],
  },
  {
    id: 'institution-aid',
    name: 'Institutional financial aid & merit awards',
    provider: 'Your chosen institution',
    type: 'Institutional aid',
    summary: 'Needs-based support, merit awards and emergency funds.',
    eligibilitySummary:
      'Rules differ per institution. Look for the financial aid or bursaries page on your institution’s official website.',
    isDemoRecord: false,
    planningValueNote: 'Amounts vary widely.',
    typicallyCovers: [],
    fields: 'all',
    incomeBands: 'all',
    institutionTypes: 'all',
  },
  {
    id: 'bank-loan',
    name: 'Bank student loan',
    provider: 'Various South African banks',
    type: 'Loan',
    summary: 'Repaid with interest. Usually needs a parent as surety.',
    eligibilitySummary:
      'Banks run affordability and credit checks on the surety. Compare interest rates and repayment terms across providers before committing.',
    isDemoRecord: false,
    planningValueNote: 'Must be repaid. Treat it as a last resort after bursaries.',
    typicallyCovers: ['tuition'],
    fields: 'all',
    incomeBands: 'all',
    institutionTypes: 'all',
  },
];

export const opportunityById = (id: string) => FUNDING_OPPORTUNITIES.find((o) => o.id === id);
