import type { EducationStage, StudentProfile, StudyField } from '../types';

export type ProfileDraft = Omit<StudentProfile, 'field' | 'educationStage'> & {
  field: StudyField | null;
  educationStage: EducationStage | null;
};

export type ProfileErrors = Partial<Record<keyof StudentProfile, string>>;

export const EMPTY_DRAFT: ProfileDraft = {
  firstName: '',
  province: 'Gauteng',
  educationStage: 'grade12',
  field: null,
  studyMode: 'contact',
  preferredInstitutionIds: [],
  apsEstimate: null,
  annualBudget: 15000,
  fundingNeed: 'unsure',
  householdIncome: 'prefer-not',
  livingArrangement: 'home',
  applicationProgress: 'researching',
  documentsReady: [],
  isAdult: true,
};

export type ProfileSection = 'about' | 'goals' | 'money' | 'applications';

export function validateSection(d: ProfileDraft, section: ProfileSection): ProfileErrors {
  const e: ProfileErrors = {};
  if (section === 'about') {
    const name = d.firstName.trim();
    if (!name) e.firstName = 'Enter the name you’d like us to use.';
    else if (name.length > 40) e.firstName = 'Keep your name under 40 characters.';
    else if (!/^[\p{L}][\p{L}' -]*$/u.test(name)) e.firstName = 'Use letters only, for example “Thando”.';
    if (!d.educationStage) e.educationStage = 'Choose where you are in your studies.';
  }
  if (section === 'goals') {
    if (!d.field) e.field = 'Choose the field you’re most interested in.';
    if (d.preferredInstitutionIds.length > 3) e.preferredInstitutionIds = 'Choose up to three institutions.';
    if (d.apsEstimate != null && (d.apsEstimate < 0 || d.apsEstimate > 49)) e.apsEstimate = 'APS is usually between 0 and 49.';
  }
  if (section === 'money') {
    if (!Number.isFinite(d.annualBudget) || d.annualBudget < 0) e.annualBudget = 'Enter R0 or more.';
    else if (d.annualBudget > 1_000_000) e.annualBudget = 'Enter an amount below R1,000,000.';
  }
  return e;
}

export function validateAll(d: ProfileDraft): ProfileErrors {
  return {
    ...validateSection(d, 'about'),
    ...validateSection(d, 'goals'),
    ...validateSection(d, 'money'),
    ...validateSection(d, 'applications'),
  };
}

export function toProfile(d: ProfileDraft): StudentProfile {
  return {
    ...d,
    firstName: d.firstName.trim().replace(/^\p{L}/u, (c) => c.toUpperCase()),
    field: d.field ?? 'computing',
    educationStage: d.educationStage ?? 'grade12',
  };
}
