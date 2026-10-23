import type { OfficialLink, Province } from '../types';

/**
 * Official accommodation sources. Checked on 23 October 2026.
 *
 * - NSFAS rules come from "NSFAS Eligibility Criteria and Conditions for
 *   Financial Aid, 2026 Academic Year" (Annexure A of the 2026 Bursary
 *   Guidelines) and the NSFAS Student Accommodation page. Clause numbers are
 *   kept so anyone can check the wording.
 * - The portal for each institution comes from the NSFAS "Private Accommodation
 *   Application for Providers and Beneficiaries" page, which maps every public
 *   university and TVET college to one of four NSFAS accommodation portals.
 * - Residence pages are each university's own page.
 *
 * Accommodation cap amounts are published by NSFAS each year. They are not
 * shown here because no official 2026 figure could be confirmed.
 */
export const ACCOMMODATION_CHECKED_ON = '23 October 2026';

export const NSFAS_SOURCES = {
  guidelines: {
    label: 'NSFAS 2026 eligibility criteria (PDF)',
    url: 'https://www.nsfas.org.za/content/downloads/Annexure%20A_NSFAS%202026%20Bursary%20Guidelines.pdf',
  },
  accommodation: { label: 'NSFAS student accommodation', url: 'https://www.nsfas.org.za/content/studentacom.html' },
  portalChooser: { label: 'NSFAS accommodation portal finder', url: 'https://www.nsfas.org.za/content/accommodationprovider.html' },
} satisfies Record<string, OfficialLink>;

export type NsfasPortalId = 'profprod' | 'ndtprod' | 'xgprod' | 'tymprod';

/** The four NSFAS accommodation portals, as linked from nsfas.org.za. */
export const NSFAS_PORTALS: Record<NsfasPortalId, { host: string; url: string }> = {
  profprod: { host: 'profprod.nsfas.org.za', url: 'https://profprod.nsfas.org.za/login' },
  ndtprod: { host: 'ap.ndtprod-nsfas.org.za', url: 'https://ap.ndtprod-nsfas.org.za/login' },
  xgprod: { host: 'xgprod.nsfas.org.za', url: 'https://xgprod.nsfas.org.za/' },
  tymprod: { host: 'tymprod.nsfas.org.za', url: 'https://tymprod.nsfas.org.za/login' },
};

/** Official residence application pages for the universities in institutions.ts. UNISA is distance learning. */
export const RESIDENCE_PAGES: Record<string, { link: OfficialLink; portal: NsfasPortalId } | undefined> = {
  wits: { link: { label: 'Wits residence applications', url: 'https://www.wits.ac.za/accommodation/applications/' }, portal: 'ndtprod' },
  uj: { link: { label: 'UJ accommodation on campus', url: 'https://www.uj.ac.za/study-uj-and-aid/undergraduate/accommodation-on-campus/' }, portal: 'ndtprod' },
  up: { link: { label: 'UP residence placement', url: 'https://www.up.ac.za/student-accommodation/how-apply-residence-placement' }, portal: 'profprod' },
  tut: { link: { label: 'TUT student accommodation', url: 'https://www.tut.ac.za/accommodation/student-accommodation/' }, portal: 'xgprod' },
  uct: { link: { label: 'UCT student housing', url: 'https://uct.ac.za/campus-life/housing' }, portal: 'profprod' },
  sun: {
    link: { label: 'SU accommodation guide, 2027 intake (PDF)', url: 'https://files.su.ac.za/public/undergraduate-maties/documents/2026-03/what-prospective-students-need-know-about-student-accommodation-su.pdf' },
    portal: 'profprod',
  },
  cput: { link: { label: 'CPUT residence applications', url: 'https://cput.ac.za/student/support-services/dsa/residence/application-and-registration' }, portal: 'profprod' },
  dut: { link: { label: 'DUT student housing', url: 'https://www.dut.ac.za/student_services/student-housing-and-residence-life/' }, portal: 'xgprod' },
  ukzn: { link: { label: 'UKZN Student Residence Affairs', url: 'https://dsra.ukzn.ac.za/' }, portal: 'xgprod' },
  ufs: { link: { label: 'UFS Housing and Residence Affairs', url: 'https://www.ufs.ac.za/residences' }, portal: 'profprod' },
  nmu: { link: { label: 'Mandela Uni residence admission', url: 'https://studenthousing.mandela.ac.za/Apply-for-Admission' }, portal: 'profprod' },
  ul: { link: { label: 'UL 2027 residence applications', url: 'https://www.ul.ac.za/university-of-limpopo-2027-residence-application-now-open/' }, portal: 'tymprod' },
};

/** Public universities on the NSFAS portal map that the rest of the app doesn't list yet. */
export const OTHER_UNIVERSITY_PORTALS: { name: string; province: Province; portal: NsfasPortalId }[] = [
  { name: 'Rhodes University', province: 'Eastern Cape', portal: 'profprod' },
  { name: 'Walter Sisulu University', province: 'Eastern Cape', portal: 'profprod' },
  { name: 'University of Fort Hare', province: 'Eastern Cape', portal: 'profprod' },
  { name: 'Central University of Technology', province: 'Free State', portal: 'profprod' },
  { name: 'Vaal University of Technology', province: 'Gauteng', portal: 'ndtprod' },
  { name: 'North-West University (Vaal)', province: 'Gauteng', portal: 'ndtprod' },
  { name: 'Sefako Makgatho Health Sciences University', province: 'Gauteng', portal: 'ndtprod' },
  { name: 'University of Zululand', province: 'KwaZulu-Natal', portal: 'xgprod' },
  { name: 'Mangosuthu University of Technology', province: 'KwaZulu-Natal', portal: 'xgprod' },
  { name: 'University of Venda', province: 'Limpopo', portal: 'tymprod' },
  { name: 'Tshwane University of Technology (Polokwane)', province: 'Limpopo', portal: 'xgprod' },
  { name: 'University of Mpumalanga', province: 'Mpumalanga', portal: 'xgprod' },
  { name: 'Tshwane University of Technology (Mpumalanga)', province: 'Mpumalanga', portal: 'xgprod' },
  { name: 'Sol Plaatje University', province: 'Northern Cape', portal: 'profprod' },
  { name: 'North-West University', province: 'North West', portal: 'ndtprod' },
  { name: 'University of the Western Cape', province: 'Western Cape', portal: 'profprod' },
  { name: 'Nelson Mandela University (George)', province: 'Western Cape', portal: 'profprod' },
];

export interface NsfasRule {
  id: string;
  title: string;
  body: string;
  /** Where the rule is written down. */
  source: string;
}

export const NSFAS_ACCOMMODATION_RULES: NsfasRule[] = [
  {
    id: 'accredited',
    title: 'Only accredited places are paid for',
    body: 'Private accommodation counts if your institution accredited it against its own criteria, or NSFAS accredited it with its grading tool. NSFAS says it will not pay an allowance for unaccredited accommodation unless NSFAS and your institution gave permission.',
    source: 'Eligibility criteria 2026, glossary; NSFAS Student Accommodation page',
  },
  {
    id: 'residence-first',
    title: 'Residence comes first',
    body: 'Universities and TVET colleges may only let NSFAS students consider private accommodation when their residences are full, or when they have no residences.',
    source: 'Eligibility criteria 2026, 6.1.12 and 6.2.11',
  },
  {
    id: 'one-allowance',
    title: 'Accommodation or transport, not both',
    body: 'You qualify for either an accommodation allowance or a transport allowance. If you can travel from home, plan for transport instead.',
    source: 'Eligibility criteria 2026, 5.2.5 and 5.3.7.1',
  },
  {
    id: 'family',
    title: 'Living with family does not qualify',
    body: 'Students living with immediate family or relatives don’t qualify for an accommodation allowance. NSFAS treats claiming it anyway as fraud.',
    source: 'Eligibility criteria 2026, 7.1.12',
  },
  {
    id: 'moving',
    title: 'Moving mid-year uses up the same cap',
    body: 'If you move from residence to private accommodation during the year, you only get what is left of your capped amount.',
    source: 'Eligibility criteria 2026, 6.1.16 and 6.1.17',
  },
  {
    id: 'caps',
    title: 'Amounts are capped and published yearly',
    body: 'NSFAS publishes allowance amounts each year, and caps differ for metro and non-metro institutions. Check the current amount with NSFAS or your financial aid office before you sign a lease.',
    source: 'Eligibility criteria 2026, 5.2.2 and 9.6',
  },
];
