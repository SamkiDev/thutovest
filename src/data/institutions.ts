import type { Institution } from '../types';

/**
 * Real South African public institutions with links to their OFFICIAL pages.
 * Links were checked on 19 October 2026. Institutions move pages from time to
 * time; the app always shows the homepage as a fallback.
 *
 * Qualifications, fees and requirements attached to these institutions in
 * studyOptions.ts are demonstration data.
 */
export const LINKS_CHECKED_ON = '19 October 2026';

export const CAO_LINK = { label: 'Central Applications Office (CAO)', url: 'https://www.cao.ac.za' };

export const INSTITUTIONS: Institution[] = [
  {
    id: 'wits', name: 'University of the Witwatersrand', shortName: 'Wits', city: 'Johannesburg', province: 'Gauteng', type: 'university', website: 'https://www.wits.ac.za',
    apply: { label: 'Apply to Wits', url: 'https://www.wits.ac.za/undergraduate/apply-to-wits/' },
    funding: { label: 'Financial aid', url: 'https://www.wits.ac.za/study-at-wits/fees-and-funding/financial-aid-and-scholarships-office/' },
    extra: [{ label: 'Application timelines', url: 'https://www.wits.ac.za/undergraduate/apply-to-wits/timelines/' }],
  },
  {
    id: 'uj', name: 'University of Johannesburg', shortName: 'UJ', city: 'Johannesburg', province: 'Gauteng', type: 'university', website: 'https://www.uj.ac.za',
    apply: { label: 'Apply online', url: 'https://www.uj.ac.za/admission-aid/new/' },
    funding: { label: 'Bursaries', url: 'https://www.uj.ac.za/admission-aid/external-bursaries/' },
    extra: [{ label: 'Merit bursaries', url: 'https://www.uj.ac.za/admission-aid/student-finance/bursaries/merit-bursaries/' }],
  },
  {
    id: 'up', name: 'University of Pretoria', shortName: 'UP', city: 'Pretoria', province: 'Gauteng', type: 'university', website: 'https://www.up.ac.za',
    apply: { label: 'Online application', url: 'https://www.up.ac.za/online-application' },
    funding: { label: 'Student funding', url: 'https://www.up.ac.za/funding' },
    extra: [{ label: 'Programmes', url: 'https://www.up.ac.za/undergraduate' }],
  },
  {
    id: 'tut', name: 'Tshwane University of Technology', shortName: 'TUT', city: 'Pretoria', province: 'Gauteng', type: 'university-of-technology', website: 'https://www.tut.ac.za',
    apply: { label: 'How to apply', url: 'https://www.tut.ac.za/programme-closing-dates/undergraduate-first-time-applicant/' },
    funding: { label: 'Financial aid', url: 'https://www.tut.ac.za/financial-aid/' },
  },
  {
    id: 'unisa', name: 'University of South Africa', shortName: 'UNISA', city: 'Distance learning', province: 'Gauteng', type: 'university', website: 'https://www.unisa.ac.za',
    apply: { label: 'Apply for admission', url: 'https://www.unisa.ac.za/sites/corporate/default/Apply-for-admission' },
    funding: { label: 'Bursaries and loans', url: 'https://www.unisa.ac.za/sites/myunisa/default/Student-Affairs-&-SRC/Student-funding:-bursaries-&-loans' },
  },
  {
    id: 'uct', name: 'University of Cape Town', shortName: 'UCT', city: 'Cape Town', province: 'Western Cape', type: 'university', website: 'https://www.uct.ac.za',
    apply: { label: 'How to apply', url: 'https://uct.ac.za/students/applications-apply-undergraduate-qualifications/application-procedure' },
    funding: { label: 'Student financial aid', url: 'https://uct.ac.za/dsa/student-financial-aid' },
  },
  {
    id: 'sun', name: 'Stellenbosch University', shortName: 'SU', city: 'Stellenbosch', province: 'Western Cape', type: 'university', website: 'https://www.sun.ac.za',
    apply: { label: 'Apply guide (PDF)', url: 'https://blogs.sun.ac.za/open-day/files/2026/03/How-to-Apply-Undergraduate-programmes-2027-intake.pdf' },
    funding: { label: 'Bursaries and loans', url: 'https://finaid.sun.ac.za/bursaries' },
  },
  {
    id: 'cput', name: 'Cape Peninsula University of Technology', shortName: 'CPUT', city: 'Cape Town', province: 'Western Cape', type: 'university-of-technology', website: 'https://www.cput.ac.za',
    apply: { label: 'Apply to study', url: 'https://www.cput.ac.za/study-at-cput/undergraduate/apply' },
    funding: { label: 'Financial aid', url: 'https://www.cput.ac.za/study-at-cput/undergraduate/financial-aid-funding' },
  },
  {
    id: 'dut', name: 'Durban University of Technology', shortName: 'DUT', city: 'Durban', province: 'KwaZulu-Natal', type: 'university-of-technology', website: 'https://www.dut.ac.za',
    apply: { label: 'How to apply', url: 'https://www.dut.ac.za/student_services/student_registration/how_to/' },
    funding: { label: 'Financial aid', url: 'https://www.dut.ac.za/support_services/financial_aid/' },
    viaCAO: true,
  },
  {
    id: 'ukzn', name: 'University of KwaZulu-Natal', shortName: 'UKZN', city: 'Durban', province: 'KwaZulu-Natal', type: 'university', website: 'https://www.ukzn.ac.za',
    apply: { label: 'How to apply', url: 'https://studyatukzn.ukzn.ac.za/apply-at-ukzn/how-to-apply/' },
    funding: { label: 'Student funding', url: 'https://studentfunding.ukzn.ac.za/' },
    viaCAO: true,
  },
  {
    id: 'ufs', name: 'University of the Free State', shortName: 'UFS', city: 'Bloemfontein', province: 'Free State', type: 'university', website: 'https://www.ufs.ac.za',
    apply: { label: 'Prospective students', url: 'https://www.ufs.ac.za/prospective' },
    funding: { label: 'UFS bursaries', url: 'https://www.ufs.ac.za/kovsielife/student-fin/bursaries/ufs-internal-bursaries' },
  },
  {
    id: 'nmu', name: 'Nelson Mandela University', shortName: 'NMU', city: 'Gqeberha', province: 'Eastern Cape', type: 'university', website: 'https://www.mandela.ac.za',
    apply: { label: 'Apply: undergraduate', url: 'https://www.mandela.ac.za/study-at-mandela/application/apply-undergraduate' },
    funding: { label: 'Funding your studies', url: 'https://myfuture.mandela.ac.za/Funding-your-studies' },
  },
  {
    id: 'ul', name: 'University of Limpopo', shortName: 'UL', city: 'Polokwane', province: 'Limpopo', type: 'university', website: 'https://www.ul.ac.za',
    apply: { label: 'Apply online', url: 'https://www.ul.ac.za/admissions/undergraduate-studies/' },
    funding: { label: 'Financial support', url: 'https://www.ul.ac.za/admissions/undergraduate-studies/financial-support/' },
  },
];

export const institutionById = (id: string): Institution | undefined => INSTITUTIONS.find((i) => i.id === id);
