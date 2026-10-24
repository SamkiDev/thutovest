import type { StudyOption } from '../types';

/**
 * DEMONSTRATION RECORDS.
 * Qualification names are typical of South African institutions, but the fees,
 * APS guides and subject requirements below are illustrative figures for the
 * prototype. Students must confirm details in each institution's official
 * prospectus before applying.
 */
export const STUDY_OPTIONS: StudyOption[] = [
  {
    id: 'uj-bsc-it', qualification: 'BSc Information Technology', institutionId: 'uj', field: 'computing', type: 'Degree',
    nqfLevel: 7, durationYears: 3, modes: ['contact'], indicativeTuition: 58200, apsGuide: 30,
    subjects: 'Mathematics 5, English 4', careers: ['Software developer', 'Systems analyst', 'IT support lead'],
    summary: 'Programming, databases and networks with a strong practical component.',
  },
  {
    id: 'uj-dip-it', qualification: 'Diploma in Information Technology', institutionId: 'uj', field: 'computing', type: 'Diploma',
    nqfLevel: 6, durationYears: 3, modes: ['contact'], indicativeTuition: 46800, apsGuide: 26,
    subjects: 'Mathematics 4 or Technical Maths 5, English 4', careers: ['Junior developer', 'Network technician'],
    summary: 'Career-focused IT diploma with workplace-ready skills.',
  },
  {
    id: 'wits-bsc-cs', qualification: 'BSc Computer Science', institutionId: 'wits', field: 'computing', type: 'Degree',
    nqfLevel: 7, durationYears: 3, modes: ['contact'], indicativeTuition: 68500, apsGuide: 36,
    subjects: 'Mathematics 6, Physical Sciences 5, English 5', careers: ['Software engineer', 'Data scientist', 'Researcher'],
    summary: 'Theory-heavy computer science with algorithms, AI and systems.',
  },
  {
    id: 'up-bsc-cs', qualification: 'BSc Computer Science', institutionId: 'up', field: 'computing', type: 'Degree',
    nqfLevel: 7, durationYears: 3, modes: ['contact'], indicativeTuition: 64900, apsGuide: 32,
    subjects: 'Mathematics 6, English 5', careers: ['Software engineer', 'Machine-learning engineer'],
    summary: 'Broad computer science grounding with software engineering projects.',
  },
  {
    id: 'up-bit', qualification: 'Bachelor of Information Technology (Information Systems)', institutionId: 'up', field: 'computing', type: 'Degree',
    nqfLevel: 7, durationYears: 3, modes: ['contact'], indicativeTuition: 66100, apsGuide: 30,
    subjects: 'Mathematics 5, English 5', careers: ['Business analyst', 'Systems analyst'],
    summary: 'Where technology meets business: systems design and analysis.',
  },
  {
    id: 'tut-dip-cs', qualification: 'Diploma in Computer Science', institutionId: 'tut', field: 'computing', type: 'Diploma',
    nqfLevel: 6, durationYears: 3, modes: ['contact'], indicativeTuition: 41300, apsGuide: 24,
    subjects: 'Mathematics 4, English 4', careers: ['Programmer', 'Web developer'],
    summary: 'Hands-on programming diploma with work-integrated learning.',
  },
  {
    id: 'unisa-hc-it', qualification: 'Higher Certificate in Information Technology', institutionId: 'unisa', field: 'computing', type: 'Higher Certificate',
    nqfLevel: 5, durationYears: 1, modes: ['distance'], indicativeTuition: 16900, apsGuide: 18,
    subjects: 'Mathematics 3 or Maths Literacy 4, English 3', careers: ['IT support', 'Pathway into a degree'],
    summary: 'A one-year starting point you can study from home, then build on.',
  },
  {
    id: 'unisa-bsc-computing', qualification: 'BSc Computing', institutionId: 'unisa', field: 'computing', type: 'Degree',
    nqfLevel: 7, durationYears: 3, modes: ['distance'], indicativeTuition: 24600, apsGuide: 23,
    subjects: 'Mathematics 4, English 4', careers: ['Software developer', 'Database administrator'],
    summary: 'Distance degree you can study at your own pace while working.',
  },
  {
    id: 'cput-dip-app-dev', qualification: 'Diploma in ICT: Applications Development', institutionId: 'cput', field: 'computing', type: 'Diploma',
    nqfLevel: 6, durationYears: 3, modes: ['contact', 'blended'], indicativeTuition: 42500, apsGuide: 26,
    subjects: 'Mathematics 4, English 4', careers: ['App developer', 'Software tester'],
    summary: 'Build mobile and web applications with industry projects.',
  },
  {
    id: 'dut-dip-ict-ba', qualification: 'Diploma in ICT: Business Analysis', institutionId: 'dut', field: 'computing', type: 'Diploma',
    nqfLevel: 6, durationYears: 3, modes: ['contact'], indicativeTuition: 40900, apsGuide: 26,
    subjects: 'Mathematics 4, English 4', careers: ['Business analyst', 'Project coordinator'],
    summary: 'Translate business needs into working IT solutions.',
  },
  {
    id: 'uct-bcom-is', qualification: 'BCom Information Systems', institutionId: 'uct', field: 'computing', type: 'Degree',
    nqfLevel: 7, durationYears: 3, modes: ['contact'], indicativeTuition: 74800, apsGuide: 34,
    subjects: 'Mathematics 6, English 5', careers: ['IT consultant', 'Data analyst'],
    summary: 'Commerce degree specialising in information systems.',
  },
  {
    id: 'uct-beng-ece', qualification: 'BSc (Eng) Electrical & Computer Engineering', institutionId: 'uct', field: 'engineering', type: 'Degree',
    nqfLevel: 8, durationYears: 4, modes: ['contact'], indicativeTuition: 78900, apsGuide: 38,
    subjects: 'Mathematics 7, Physical Sciences 6, English 5', careers: ['Electrical engineer', 'Embedded systems engineer'],
    summary: 'Four-year professional engineering degree.',
  },
  {
    id: 'up-beng-civil', qualification: 'BEng Civil Engineering', institutionId: 'up', field: 'engineering', type: 'Degree',
    nqfLevel: 8, durationYears: 4, modes: ['contact'], indicativeTuition: 71000, apsGuide: 35,
    subjects: 'Mathematics 6, Physical Sciences 6, English 5', careers: ['Civil engineer', 'Structural engineer'],
    summary: 'Design roads, water systems and buildings.',
  },
  {
    id: 'tut-dip-elec', qualification: 'Diploma in Electrical Engineering', institutionId: 'tut', field: 'engineering', type: 'Diploma',
    nqfLevel: 6, durationYears: 3, modes: ['contact'], indicativeTuition: 43000, apsGuide: 26,
    subjects: 'Mathematics 4, Physical Sciences 4, English 4', careers: ['Engineering technician'],
    summary: 'Practical engineering diploma with workplace training.',
  },
  {
    id: 'uj-bcom-acc', qualification: 'BCom Accounting', institutionId: 'uj', field: 'commerce', type: 'Degree',
    nqfLevel: 7, durationYears: 3, modes: ['contact'], indicativeTuition: 55400, apsGuide: 28,
    subjects: 'Mathematics 4, English 4', careers: ['Accountant', 'Auditor'],
    summary: 'Foundation for professional accounting careers.',
  },
  {
    id: 'unisa-hc-acc', qualification: 'Higher Certificate in Accounting Sciences', institutionId: 'unisa', field: 'commerce', type: 'Higher Certificate',
    nqfLevel: 5, durationYears: 1, modes: ['distance'], indicativeTuition: 15800, apsGuide: 18,
    subjects: 'Mathematics 3 or Maths Literacy 4', careers: ['Bookkeeper', 'Pathway into BCom'],
    summary: 'Affordable one-year start in accounting, studied from home.',
  },
  {
    id: 'uj-bed-fp', qualification: 'BEd Foundation Phase Teaching', institutionId: 'uj', field: 'education', type: 'Degree',
    nqfLevel: 7, durationYears: 4, modes: ['contact'], indicativeTuition: 49800, apsGuide: 26,
    subjects: 'English 4, Mathematics 3 or Maths Literacy 4', careers: ['Foundation Phase teacher'],
    summary: 'Become a qualified teacher for Grades R to 3.',
  },
  {
    id: 'unisa-bed-sp', qualification: 'BEd Senior Phase & FET Teaching', institutionId: 'unisa', field: 'education', type: 'Degree',
    nqfLevel: 7, durationYears: 4, modes: ['distance'], indicativeTuition: 21400, apsGuide: 21,
    subjects: 'English 4, subject-specific requirements', careers: ['High school teacher'],
    summary: 'Teaching degree by distance, with school-based practice.',
  },
  {
    id: 'ukzn-bnurs', qualification: 'Bachelor of Nursing', institutionId: 'ukzn', field: 'health', type: 'Degree',
    nqfLevel: 8, durationYears: 4, modes: ['contact'], indicativeTuition: 58000, apsGuide: 32,
    subjects: 'Life Sciences 5, English 5, Mathematics 4', careers: ['Professional nurse', 'Midwife'],
    summary: 'Clinical and community nursing with hospital placements.',
  },
  {
    id: 'uj-bnurs', qualification: 'Bachelor of Nursing', institutionId: 'uj', field: 'health', type: 'Degree',
    nqfLevel: 8, durationYears: 4, modes: ['contact'], indicativeTuition: 56000, apsGuide: 30,
    subjects: 'Life Sciences 4, English 4, Mathematics 3', careers: ['Professional nurse', 'Community health nurse'],
    summary: 'General, community and psychiatric nursing with midwifery.',
  },
  {
    id: 'uwc-bnurs', qualification: 'Bachelor of Nursing', institutionId: 'uwc', field: 'health', type: 'Degree',
    nqfLevel: 8, durationYears: 4, modes: ['contact'], indicativeTuition: 52000, apsGuide: 30,
    subjects: 'Life Sciences 4, English 4, Mathematics 3', careers: ['Professional nurse', 'Midwife'],
    summary: 'Nursing and midwifery with clinical practice from first year.',
  },
  {
    id: 'dut-hc-emc', qualification: 'Higher Certificate in Emergency Medical Care', institutionId: 'dut', field: 'health', type: 'Higher Certificate',
    nqfLevel: 5, durationYears: 1, modes: ['contact'], indicativeTuition: 32000, apsGuide: 22,
    subjects: 'English 4, Life Sciences 3', careers: ['Emergency care assistant'],
    summary: 'One-year start in ambulance and emergency care.',
  },
  {
    id: 'dut-dip-emc', qualification: 'Diploma in Emergency Medical Care', institutionId: 'dut', field: 'health', type: 'Diploma',
    nqfLevel: 6, durationYears: 2, modes: ['contact'], indicativeTuition: 41000, apsGuide: 26,
    subjects: 'English 4, Life Sciences 4, Mathematics 3', careers: ['Emergency care technician'],
    summary: 'Pre-hospital emergency care with ambulance placements.',
  },
  {
    id: 'uj-bemc', qualification: 'Bachelor of Emergency Medical Care', institutionId: 'uj', field: 'health', type: 'Degree',
    nqfLevel: 8, durationYears: 4, modes: ['contact'], indicativeTuition: 58000, apsGuide: 31,
    subjects: 'Mathematics 4, Physical Sciences 4, Life Sciences 4, English 4', careers: ['Emergency care practitioner', 'Paramedic'],
    summary: 'Advanced life support, rescue and emergency medicine.',
  },
  {
    id: 'uj-boptom', qualification: 'Bachelor of Optometry', institutionId: 'uj', field: 'health', type: 'Degree',
    nqfLevel: 8, durationYears: 4, modes: ['contact'], indicativeTuition: 60000, apsGuide: 31,
    subjects: 'Mathematics 4, Physical Sciences 4, Life Sciences 4, English 4', careers: ['Optometrist'],
    summary: 'Eye examinations, lenses and eye health, with clinic practice.',
  },
  {
    id: 'ukzn-bsc-diet', qualification: 'BSc Dietetics', institutionId: 'ukzn', field: 'health', type: 'Degree',
    nqfLevel: 8, durationYears: 4, modes: ['contact'], indicativeTuition: 57000, apsGuide: 32,
    subjects: 'Mathematics 4, Physical Sciences 4, Life Sciences 4, English 4', careers: ['Dietitian', 'Nutrition advisor'],
    summary: 'Nutrition science, therapeutic diets and community nutrition.',
  },
  {
    id: 'uwc-bsc-physio', qualification: 'BSc Physiotherapy', institutionId: 'uwc', field: 'health', type: 'Degree',
    nqfLevel: 8, durationYears: 4, modes: ['contact'], indicativeTuition: 58000, apsGuide: 34,
    subjects: 'Mathematics 4, Physical Sciences 4, Life Sciences 5, English 4', careers: ['Physiotherapist'],
    summary: 'Movement, rehabilitation and sports injuries, with clinical blocks.',
  },
  {
    id: 'uwc-bpharm', qualification: 'Bachelor of Pharmacy', institutionId: 'uwc', field: 'health', type: 'Degree',
    nqfLevel: 8, durationYears: 4, modes: ['contact'], indicativeTuition: 60000, apsGuide: 34,
    subjects: 'Mathematics 5, Physical Sciences 5, English 4', careers: ['Pharmacist', 'Hospital pharmacist'],
    summary: 'Medicines, chemistry and patient care, ending in a pharmacy internship.',
  },
  {
    id: 'nwu-bpharm', qualification: 'Bachelor of Pharmacy', institutionId: 'nwu', field: 'health', type: 'Degree',
    nqfLevel: 8, durationYears: 4, modes: ['contact'], indicativeTuition: 58000, apsGuide: 34,
    subjects: 'Mathematics 5, Physical Sciences 5, English 4', careers: ['Pharmacist', 'Industrial pharmacist'],
    summary: 'Pharmaceutical sciences and practice on the Potchefstroom campus.',
  },
  {
    id: 'wits-bcmp', qualification: 'Bachelor of Clinical Medical Practice', institutionId: 'wits', field: 'health', type: 'Degree',
    nqfLevel: 7, durationYears: 3, modes: ['contact'], indicativeTuition: 62000, apsGuide: 34,
    subjects: 'Mathematics 4, Physical Sciences 4, Life Sciences 5, English 5', careers: ['Clinical associate'],
    summary: 'Trains clinical associates who work alongside doctors in district hospitals.',
  },
  {
    id: 'wits-bsc-ot', qualification: 'BSc Occupational Therapy', institutionId: 'wits', field: 'health', type: 'Degree',
    nqfLevel: 8, durationYears: 4, modes: ['contact'], indicativeTuition: 66000, apsGuide: 36,
    subjects: 'Mathematics 4, Physical Sciences 4, Life Sciences 5, English 5', careers: ['Occupational therapist'],
    summary: 'Helps people regain daily skills after injury, illness or disability.',
  },
  {
    id: 'up-bchd', qualification: 'Bachelor of Dental Surgery (BChD)', institutionId: 'up', field: 'health', type: 'Degree',
    nqfLevel: 8, durationYears: 5, modes: ['contact'], indicativeTuition: 72000, apsGuide: 38,
    subjects: 'Mathematics 5, Physical Sciences 5, Life Sciences 5, English 5', careers: ['Dentist'],
    summary: 'Five-year dentistry degree with treatment of patients from the third year.',
  },
  {
    id: 'smu-mbchb', qualification: 'Bachelor of Medicine and Surgery (MBChB)', institutionId: 'smu', field: 'health', type: 'Degree',
    nqfLevel: 8, durationYears: 6, modes: ['contact'], indicativeTuition: 64000, apsGuide: 38,
    subjects: 'Mathematics 5, Physical Sciences 5, Life Sciences 5, English 5', careers: ['Medical doctor'],
    summary: 'Six-year medical degree at a dedicated health sciences university.',
  },
  {
    id: 'ul-mbchb', qualification: 'Bachelor of Medicine and Surgery (MBChB)', institutionId: 'ul', field: 'health', type: 'Degree',
    nqfLevel: 8, durationYears: 6, modes: ['contact'], indicativeTuition: 62000, apsGuide: 38,
    subjects: 'Mathematics 5, Physical Sciences 5, Life Sciences 5, English 5', careers: ['Medical doctor', 'Rural health practitioner'],
    summary: 'Medical training with a focus on rural and district health care.',
  },
  {
    id: 'wits-mbbch', qualification: 'Bachelor of Medicine and Surgery (MBBCh)', institutionId: 'wits', field: 'health', type: 'Degree',
    nqfLevel: 8, durationYears: 6, modes: ['contact'], indicativeTuition: 78000, apsGuide: 42,
    subjects: 'Mathematics 6, Physical Sciences 6, Life Sciences 6, English 6', careers: ['Medical doctor', 'Specialist after further study'],
    summary: 'Six-year medical degree with training in Johannesburg teaching hospitals.',
  },
  {
    id: 'ufs-llb', qualification: 'Bachelor of Laws (LLB)', institutionId: 'ufs', field: 'law', type: 'Degree',
    nqfLevel: 8, durationYears: 4, modes: ['contact'], indicativeTuition: 54000, apsGuide: 30,
    subjects: 'English 5', careers: ['Attorney', 'Advocate', 'Legal advisor'],
    summary: 'Four-year professional law degree.',
  },
  {
    id: 'nmu-ba', qualification: 'BA General', institutionId: 'nmu', field: 'humanities', type: 'Degree',
    nqfLevel: 7, durationYears: 3, modes: ['contact'], indicativeTuition: 47500, apsGuide: 26,
    subjects: 'English 4', careers: ['Communications', 'Policy', 'Social development'],
    summary: 'Flexible humanities degree with many majors.',
  },
  {
    id: 'ul-bsc-life', qualification: 'BSc Life Sciences', institutionId: 'ul', field: 'science', type: 'Degree',
    nqfLevel: 7, durationYears: 3, modes: ['contact'], indicativeTuition: 45000, apsGuide: 26,
    subjects: 'Mathematics 4, Life Sciences 4, Physical Sciences 4', careers: ['Lab scientist', 'Environmental officer'],
    summary: 'Biology, chemistry and environmental science foundations.',
  },
  {
    id: 'sun-bsc-maths', qualification: 'BSc Mathematical Sciences', institutionId: 'sun', field: 'science', type: 'Degree',
    nqfLevel: 7, durationYears: 3, modes: ['contact'], indicativeTuition: 69800, apsGuide: 34,
    subjects: 'Mathematics 6, English 4', careers: ['Actuarial analyst', 'Data scientist'],
    summary: 'Pure and applied mathematics, statistics and computing.',
  },
];

export const optionById = (id: string): StudyOption | undefined => STUDY_OPTIONS.find((o) => o.id === id);
