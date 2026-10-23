import type { FitLevel, StudentProfile, StudyMatch, StudyOption } from '../types';
import { INSTITUTIONS } from '../data/institutions';
import { STUDY_OPTIONS } from '../data/studyOptions';
import { FIELDS, MODE_LABEL } from '../data/labels';
import { formatZAR } from './format';

export const fieldLabel = (f: string) => FIELDS.find((x) => x.value === f)?.label ?? f;

/**
 * Transparent rule-based fit. Every point awarded produces a reason the
 * student can read; nothing is a hidden score.
 */
export function matchOption(option: StudyOption, profile: StudentProfile): StudyMatch | null {
  const institution = INSTITUTIONS.find((i) => i.id === option.institutionId);
  if (!institution) return null;

  const reasons: string[] = [];
  const cautions: string[] = [];
  let score = 0;

  if (option.field === profile.field) {
    score += 40;
    reasons.push(`Matches your interest in ${fieldLabel(profile.field)}`);
  } else {
    cautions.push(`Outside your chosen field (${fieldLabel(profile.field)})`);
  }

  if (profile.studyMode === 'any' || option.modes.includes(profile.studyMode)) {
    score += 15;
    reasons.push(`Offered ${option.modes.map((m) => MODE_LABEL[m].toLowerCase()).join(' or ')}`);
  } else {
    cautions.push(`Not offered as ${MODE_LABEL[profile.studyMode].toLowerCase()} study`);
  }

  if (profile.preferredInstitutionIds.includes(institution.id)) {
    score += 20;
    reasons.push(`At ${institution.shortName}, one of your preferred institutions`);
  }

  if (profile.apsEstimate != null) {
    if (profile.apsEstimate >= option.apsGuide) {
      score += 15;
      reasons.push(`Your estimated APS (${profile.apsEstimate}) meets the sample guide (${option.apsGuide})`);
    } else if (profile.apsEstimate >= option.apsGuide - 2) {
      score += 5;
      cautions.push(`Your estimated APS is just below the sample guide (${option.apsGuide})`);
    } else {
      cautions.push(`Sample APS guide (${option.apsGuide}) is above your estimate (${profile.apsEstimate})`);
    }
  }

  if (option.indicativeTuition <= profile.annualBudget) {
    score += 10;
    reasons.push(`Indicative tuition fits your own budget of ${formatZAR(profile.annualBudget)}`);
  } else {
    cautions.push(`Tuition is ${formatZAR(option.indicativeTuition - profile.annualBudget)} above your own budget, so you’ll need funding`);
  }

  if (institution.province === profile.province || option.modes.includes('distance')) {
    score += 5;
    reasons.push(option.modes.includes('distance') ? 'Study from home, anywhere in SA' : `In ${institution.province}, close to home`);
  }

  const fit: FitLevel = score >= 75 ? 'strong' : score >= 50 ? 'good' : 'partial';
  return { option, institution, fit, score, reasons, cautions };
}

export function matchAll(profile: StudentProfile): StudyMatch[] {
  return STUDY_OPTIONS.map((o) => matchOption(o, profile))
    .filter((m): m is StudyMatch => Boolean(m))
    .sort((a, b) => b.score - a.score || a.option.indicativeTuition - b.option.indicativeTuition);
}

export const FIT_LABEL: Record<FitLevel, string> = {
  strong: 'Strong fit',
  good: 'Good fit',
  partial: 'Partial fit',
};
