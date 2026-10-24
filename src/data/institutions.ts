import type { Institution } from '../types';

/**
 * All 26 South African public universities, with links to their OFFICIAL pages.
 * Every link was checked on 24 October 2026 (pages behind bot protection were
 * opened in a browser). Institutions move pages from time to time; the app
 * always shows the homepage as a fallback.
 *
 * Qualifications, fees and requirements attached to these institutions in
 * studyOptions.ts are demonstration data.
 */
export const LINKS_CHECKED_ON = '24 October 2026';

export const CAO_LINK = { label: 'Central Applications Office (CAO)', url: 'https://www.cao.ac.za' };

export const INSTITUTIONS: Institution[] = [
  {
    id: 'wits', name: 'University of the Witwatersrand', shortName: 'Wits', city: 'Johannesburg', province: 'Gauteng', type: 'university', website: 'https://www.wits.ac.za',
    apply: { label: 'Apply to Wits', url: 'https://www.wits.ac.za/undergraduate/apply-to-wits/' },
    funding: { label: 'Financial aid', url: 'https://www.wits.ac.za/study-at-wits/financial-aid-and-scholarships-administration/' },
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
    id: 'sun', name: 'Stellenbosch University', shortName: 'SU', city: 'Stellenbosch', province: 'Western Cape', type: 'university', website: 'https://www.su.ac.za/en',
    apply: { label: 'Apply guide (PDF)', url: 'https://blogs.sun.ac.za/open-day/files/2026/03/How-to-Apply-Undergraduate-programmes-2027-intake.pdf' },
    funding: { label: 'Bursaries and loans', url: 'https://www.su.ac.za/en/students/undergraduate-bursaries-loans' },
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
  {
    id: 'ru', name: 'Rhodes University', shortName: 'RU', city: 'Makhanda', province: 'Eastern Cape', type: 'university', website: 'https://www.ru.ac.za',
    apply: { label: 'Apply online', url: 'https://ross.ru.ac.za/ugadmissions' },
    funding: { label: 'Fees and financial aid', url: 'https://www.ru.ac.za/studentfeesandfinancialaid/' },
    extra: [{ label: 'Admissions', url: 'https://www.ru.ac.za/admissiongateway/' }],
  },
  {
    id: 'uwc', name: 'University of the Western Cape', shortName: 'UWC', city: 'Cape Town', province: 'Western Cape', type: 'university', website: 'https://www.uwc.ac.za',
    apply: { label: 'How to apply', url: 'https://www.uwc.ac.za/admission-and-financial-aid/apply' },
    funding: { label: 'Fees and financial aid', url: 'https://www.uwc.ac.za/admission-and-financial-aid/fees-and-financial-aid' },
    extra: [{ label: 'Bursaries and opportunities', url: 'https://www.uwc.ac.za/admission-and-financial-aid/fees-and-financial-aid/bursaries-and-opportunities' }],
  },
  {
    id: 'ufh', name: 'University of Fort Hare', shortName: 'UFH', city: 'Alice', province: 'Eastern Cape', type: 'university', website: 'https://www.ufh.ac.za',
    apply: { label: 'How to apply', url: 'https://www.ufh.ac.za/apply/apply-undergraduate' },
    funding: { label: 'Bursaries and NSFAS', url: 'https://www.ufh.ac.za/apply/apply-undergraduate' },
    extra: [{ label: 'Online application', url: 'https://ienabler.ufh.ac.za/pls/prodi41/w99pkg.mi_login' }],
  },
  {
    id: 'wsu', name: 'Walter Sisulu University', shortName: 'WSU', city: 'Mthatha', province: 'Eastern Cape', type: 'university', website: 'https://www.wsu.ac.za',
    apply: { label: 'How to apply', url: 'https://www.wsu.ac.za/en/study-with-us/application-and-registration/how-to-apply-the-process' },
    funding: { label: 'Fees and financial support', url: 'https://www.wsu.ac.za/en/study-with-us/fees-financial-support' },
  },
  {
    id: 'nwu', name: 'North-West University', shortName: 'NWU', city: 'Potchefstroom', province: 'North West', type: 'university', website: 'https://www.nwu.ac.za',
    apply: { label: 'Apply to NWU', url: 'https://studies.nwu.ac.za/studies/apply' },
    funding: { label: 'Bursaries', url: 'https://studies.nwu.ac.za/studies/bursaries' },
  },
  {
    id: 'univen', name: 'University of Venda', shortName: 'UNIVEN', city: 'Thohoyandou', province: 'Limpopo', type: 'university', website: 'https://www.univen.ac.za',
    apply: { label: 'How to apply', url: 'https://www.univen.ac.za/student-affairs/student-support-services/how-to-apply/' },
    funding: { label: 'Student finance and financial aid', url: 'https://www.univen.ac.za/student-finance-and-financial-aid/' },
    extra: [{ label: 'Scholarships and bursaries', url: 'https://www.univen.ac.za/student-affairs/scholarships-and-bursaries/' }],
  },
  {
    id: 'unizulu', name: 'University of Zululand', shortName: 'UNIZULU', city: 'KwaDlangezwa', province: 'KwaZulu-Natal', type: 'university', website: 'https://www.unizulu.ac.za',
    apply: { label: 'How to apply', url: 'https://www.unizulu.ac.za/apply/' },
    funding: { label: 'Bursaries and loans', url: 'https://www.unizulu.ac.za/bursaries-and-loans/' },
    viaCAO: true,
  },
  {
    id: 'mut', name: 'Mangosuthu University of Technology', shortName: 'MUT', city: 'Durban', province: 'KwaZulu-Natal', type: 'university-of-technology', website: 'https://www.mut.ac.za',
    apply: { label: 'Where and when to apply', url: 'https://www.mut.ac.za/prospective-students/apply/' },
    funding: { label: 'Bursaries', url: 'https://www.mut.ac.za/fees-and-funding/bursaries/' },
    viaCAO: true,
  },
  {
    id: 'vut', name: 'Vaal University of Technology', shortName: 'VUT', city: 'Vanderbijlpark', province: 'Gauteng', type: 'university-of-technology', website: 'https://www.vut.ac.za',
    apply: { label: 'How to apply', url: 'https://vut.ac.za/how-to-apply/' },
    funding: { label: 'Financial aid and bursaries', url: 'https://vut.ac.za/financial-aid-bursaries/' },
  },
  {
    id: 'cut', name: 'Central University of Technology', shortName: 'CUT', city: 'Bloemfontein', province: 'Free State', type: 'university-of-technology', website: 'https://www.cut.ac.za',
    apply: { label: 'How to apply', url: 'https://www.cut.ac.za/application-process' },
    funding: { label: 'Fees, bursaries and loans', url: 'https://www.cut.ac.za/fees-bursaries-and-loans' },
  },
  {
    id: 'smu', name: 'Sefako Makgatho Health Sciences University', shortName: 'SMU', city: 'Pretoria', province: 'Gauteng', type: 'university', website: 'https://www.smu.ac.za',
    apply: { label: 'Online application', url: 'https://www.smu.ac.za/students/apply/online-application/' },
    funding: { label: 'Financial aid', url: 'https://www.smu.ac.za/students/financial-aid/' },
  },
  {
    id: 'spu', name: 'Sol Plaatje University', shortName: 'SPU', city: 'Kimberley', province: 'Northern Cape', type: 'university', website: 'https://www.spu.ac.za',
    apply: { label: 'How to apply', url: 'https://www.spu.ac.za/index.php/how-to-apply/' },
    funding: { label: 'Financial aid', url: 'https://www.spu.ac.za/index.php/financial-aid/' },
  },
  {
    id: 'ump', name: 'University of Mpumalanga', shortName: 'UMP', city: 'Mbombela', province: 'Mpumalanga', type: 'university', website: 'https://www.ump.ac.za',
    apply: { label: 'Application process', url: 'https://www.ump.ac.za/Study-with-us/Application-Process.aspx' },
    funding: { label: 'Student funding', url: 'https://www.ump.ac.za/Study-with-us/Student-Funding.aspx' },
  },
];

export const institutionById = (id: string): Institution | undefined => INSTITUTIONS.find((i) => i.id === id);
