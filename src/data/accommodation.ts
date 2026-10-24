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
  ru: { link: { label: 'Rhodes halls and residences', url: 'https://www.ru.ac.za/residences/' }, portal: 'profprod' },
  uwc: { link: { label: 'UWC residence applications', url: 'https://www.uwc.ac.za/admission-and-financial-aid/apply/residential-applications' }, portal: 'profprod' },
  ufh: { link: { label: 'UFH 2026 registration and residence guide', url: 'https://www.ufh.ac.za/registration-information-2026' }, portal: 'profprod' },
  wsu: { link: { label: 'WSU student accommodation', url: 'https://www.wsu.ac.za/en/study-with-us/undergraduate-programmes/new-students/student-accommodation' }, portal: 'profprod' },
  nwu: { link: { label: 'NWU residences', url: 'https://studies.nwu.ac.za/studies/residences' }, portal: 'ndtprod' },
  univen: { link: { label: 'UNIVEN housing and accommodation', url: 'https://www.univen.ac.za/student-affairs/housing-and-accommodation/' }, portal: 'tymprod' },
  unizulu: { link: { label: 'UNIZULU student housing', url: 'https://www.unizulu.ac.za/student-affairs/student-housing/' }, portal: 'xgprod' },
  mut: { link: { label: 'MUT student housing', url: 'https://www.mut.ac.za/student-housing/' }, portal: 'xgprod' },
  vut: { link: { label: 'VUT accommodation', url: 'https://vut.ac.za/accommodation/' }, portal: 'ndtprod' },
  cut: { link: { label: 'CUT campus accommodation', url: 'https://www.cut.ac.za/student-life---campus-accommodation' }, portal: 'profprod' },
  smu: { link: { label: 'SMU residences', url: 'https://www.smu.ac.za/students/student-affairs/residence-and-catering/' }, portal: 'ndtprod' },
  spu: { link: { label: 'SPU residences', url: 'https://www.spu.ac.za/index.php/residences/' }, portal: 'profprod' },
  ump: { link: { label: 'UMP student housing', url: 'https://www.ump.ac.za/Student-Life/Student-Housing.aspx' }, portal: 'xgprod' },
};

/** University campuses on the NSFAS portal map that have their own portal entry (the universities themselves are in RESIDENCE_PAGES). */
export const OTHER_UNIVERSITY_PORTALS: { name: string; province: Province; portal: NsfasPortalId }[] = [
  { name: 'North-West University (Vaal)', province: 'Gauteng', portal: 'ndtprod' },
  { name: 'Tshwane University of Technology (Polokwane)', province: 'Limpopo', portal: 'xgprod' },
  { name: 'Tshwane University of Technology (Mpumalanga)', province: 'Mpumalanga', portal: 'xgprod' },
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
    body: 'Only places accredited by your institution or NSFAS. Otherwise NSFAS won’t pay.',
    source: 'Eligibility criteria 2026, glossary; NSFAS Student Accommodation page',
  },
  {
    id: 'residence-first',
    title: 'Residence comes first',
    body: 'Private places only when residences are full, or there are none.',
    source: 'Eligibility criteria 2026, 6.1.12 and 6.2.11',
  },
  {
    id: 'one-allowance',
    title: 'Accommodation or transport, not both',
    body: 'You get one or the other. Living at home? Plan for transport.',
    source: 'Eligibility criteria 2026, 5.2.5 and 5.3.7.1',
  },
  {
    id: 'family',
    title: 'Living with family does not qualify',
    body: 'No accommodation allowance with family. Claiming it is treated as fraud.',
    source: 'Eligibility criteria 2026, 7.1.12',
  },
  {
    id: 'moving',
    title: 'Moving mid-year uses up the same cap',
    body: 'Move mid-year and you only get what’s left of the cap.',
    source: 'Eligibility criteria 2026, 6.1.16 and 6.1.17',
  },
  {
    id: 'caps',
    title: 'Amounts are capped and published yearly',
    body: 'Capped yearly, and metro and non-metro differ. Check before you sign.',
    source: 'Eligibility criteria 2026, 5.2.2 and 9.6',
  },
];
