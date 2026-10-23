/* ------------------------------------------------------------------
 * Student Success Engine
 * One pure function turns the shared student state into everything the
 * UI shows: journey tasks, progress, funding gap, risk alerts and the
 * next best action. Because every screen reads from this, a change made
 * anywhere (profile, costs, a task) updates every screen at once.
 * ------------------------------------------------------------------ */
import type {
  EngineResult,
  JourneyTask,
  NextAction,
  Priority,
  RiskAlert,
  Severity,
  StageId,
  StudentState,
  TaskDefinition,
} from '../types';
import { STAGES, TASKS } from '../data/journey';
import { TASK_STATUS_LABEL } from '../data/labels';
import { addDays, daysUntil, formatDate } from './dates';
import { formatZAR } from './format';
import { summariseFunding } from './funding';
import { matchAll } from './matching';

const SEVERITY_ORDER: Record<Severity, number> = { urgent: 0, soon: 1, watch: 2 };
const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
const STAGE_ORDER = STAGES.map((s) => s.id);

export function buildTasks(state: StudentState, now = new Date()) {
  const tasks: JourneyTask[] = [];
  const hiddenTasks: { task: TaskDefinition; reason: string }[] = [];
  for (const def of TASKS) {
    const reason = def.hiddenWhen?.(state.profile) ?? null;
    if (reason) {
      hiddenTasks.push({ task: def, reason });
      continue;
    }
    const dueDate = def.dueInDays != null ? addDays(state.demoStart, def.dueInDays) : undefined;
    tasks.push({
      ...def,
      status: state.taskStatus[def.id] ?? 'pending',
      dueDate,
      daysLeft: dueDate ? daysUntil(dueDate, now) : undefined,
    });
  }
  return { tasks, hiddenTasks };
}

function deadlineSeverity(daysLeft: number): Severity {
  if (daysLeft <= 7) return 'urgent';
  if (daysLeft <= 21) return 'soon';
  return 'watch';
}

const KIND_COPY = {
  application: {
    title: 'Application deadline approaching',
    impact: 'Late applications are usually rejected.',
  },
  funding: {
    title: 'Funding deadline approaching',
    impact: 'Miss it and you could go a year without support.',
  },
  registration: {
    title: 'Registration deadline approaching',
    impact: 'Unfinished steps can delay classes, residence and funding.',
  },
  planning: {
    title: 'Planning step due soon',
    impact: 'Leaving this late adds pressure before the year starts.',
  },
} as const;

function statusPhrase(t: JourneyTask) {
  return t.status === 'in-progress' ? 'is still in progress' : 'has not been started';
}

export function buildAlerts(state: StudentState, tasks: JourneyTask[]): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  const open = tasks.filter((t) => t.status !== 'completed');

  // 1 & 2: dated tasks — documents always surface, others within 21 days.
  for (const t of open) {
    if (t.dueDate == null || t.daysLeft == null) continue;
    if (t.kind === 'document') {
      alerts.push({
        id: `doc-${t.id}`,
        category: 'document',
        severity: deadlineSeverity(t.daysLeft),
        title: 'Required document still outstanding',
        subject: t.title,
        impact: 'Applications missing documents are often marked incomplete.',
        why: `Flagged because this document is marked “${TASK_STATUS_LABEL[t.status]}” and it is needed by ${formatDate(t.dueDate)}.`,
        recommendedAction: t.description,
        dueDate: t.dueDate,
        daysLeft: t.daysLeft,
        taskId: t.id,
        route: t.action.to,
        routeLabel: t.action.label,
      });
    } else if (t.daysLeft <= 21) {
      const copy = KIND_COPY[t.kind];
      alerts.push({
        id: `deadline-${t.id}`,
        category: t.kind === 'registration' ? 'registration' : 'deadline',
        severity: deadlineSeverity(t.daysLeft),
        title: copy.title,
        subject: t.title,
        impact: copy.impact,
        why: `Flagged because “${t.title}” ${statusPhrase(t)} and the demo deadline is ${formatDate(t.dueDate)}.`,
        recommendedAction: t.description,
        dueDate: t.dueDate,
        daysLeft: t.daysLeft,
        taskId: t.id,
        route: t.action.to,
        routeLabel: t.action.label,
      });
    }
  }

  // 3: funding gap
  const funding = summariseFunding(state);
  if (funding.totalCost > 0 && funding.gap > 0) {
    const ratio = funding.gap / funding.totalCost;
    const applied = Object.values(state.opportunityStatus).filter((s) => s === 'submitted' || s === 'awarded').length;
    const severity: Severity = ratio >= 0.5 ? (applied === 0 ? 'urgent' : 'soon') : ratio >= 0.15 ? 'soon' : 'watch';
    alerts.push({
      id: 'funding-gap',
      category: 'funding',
      severity,
      title: 'Estimated funding shortfall',
      subject: `${formatZAR(funding.gap)} of next year’s costs not yet covered`,
      impact: 'An unfunded gap can block registration.',
      why: `Flagged because your estimated costs are ${formatZAR(funding.totalCost)} and the funding you’ve identified is ${formatZAR(
        funding.identifiedFunding,
      )}. ${applied === 0 ? 'No funding applications are marked as submitted yet.' : `${applied} funding ${applied === 1 ? 'application is' : 'applications are'} submitted or awarded.`}`,
      recommendedAction: 'Review your cost estimate and start an application for your strongest possible funding match.',
      route: '/app/funding',
      routeLabel: 'Open funding',
    });
  }

  // 4: registration readiness
  const readyToRegister =
    state.profile.applicationProgress === 'accepted' ||
    state.taskStatus['t-accept'] === 'completed' ||
    state.profile.educationStage === 'first-year' ||
    state.profile.educationStage === 'continuing';
  if (readyToRegister) {
    for (const t of open.filter((x) => x.kind === 'registration')) {
      if (alerts.some((a) => a.taskId === t.id)) continue;
      alerts.push({
        id: `reg-${t.id}`,
        category: 'registration',
        severity: 'soon',
        title: 'Registration step not completed',
        subject: t.title,
        impact: 'Registration windows are short. You could lose your place.',
        why: `Flagged because you are ready to register and “${t.title}” ${statusPhrase(t)}.`,
        recommendedAction: t.description,
        dueDate: t.dueDate,
        daysLeft: t.daysLeft,
        taskId: t.id,
        route: t.action.to,
        routeLabel: t.action.label,
      });
    }
  }

  return alerts.sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      (a.daysLeft ?? 999) - (b.daysLeft ?? 999) ||
      a.title.localeCompare(b.title),
  );
}

function nextActionFrom(alerts: RiskAlert[], tasks: JourneyTask[], gap: number): NextAction | null {
  const open = tasks.filter((t) => t.status !== 'completed');
  const top = alerts[0];

  if (top?.taskId) {
    const t = tasks.find((x) => x.id === top.taskId);
    if (t) {
      return {
        title: t.title,
        reason: top.impact,
        dueDate: t.dueDate,
        daysLeft: t.daysLeft,
        severity: top.severity,
        taskId: t.id,
        route: t.action.to,
        routeLabel: t.action.label,
      };
    }
  }

  if (top?.category === 'funding') {
    const fundingTask = open.find((t) => t.id === 't-funding-main') ?? open.find((t) => t.stageId === 'funding');
    if (fundingTask) {
      return {
        title: fundingTask.title,
        reason: `${formatZAR(gap)} still unfunded. Applying for a possible match is the fastest fix.`,
        dueDate: fundingTask.dueDate,
        daysLeft: fundingTask.daysLeft,
        severity: top.severity,
        taskId: fundingTask.id,
        route: fundingTask.action.to,
        routeLabel: fundingTask.action.label,
      };
    }
    return { title: 'Close your funding gap', reason: `${formatZAR(gap)} still unfunded.`, severity: top.severity, route: top.route, routeLabel: top.routeLabel };
  }

  const next = [...open].sort(
    (a, b) =>
      STAGE_ORDER.indexOf(a.stageId) - STAGE_ORDER.indexOf(b.stageId) ||
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  )[0];
  if (!next) return null;
  const stage = STAGES.find((s) => s.id === next.stageId)!;
  return {
    title: next.title,
    reason: `Nothing urgent. Next open step in “${stage.title}”.`,
    dueDate: next.dueDate,
    daysLeft: next.daysLeft,
    taskId: next.id,
    route: next.action.to,
    routeLabel: next.action.label,
  };
}

export function computeEngine(state: StudentState, now = new Date()): EngineResult {
  const { tasks, hiddenTasks } = buildTasks(state, now);

  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;

  const stageProgress = Object.fromEntries(
    STAGES.map((s) => {
      const st = tasks.filter((t) => t.stageId === s.id);
      return [s.id, { completed: st.filter((t) => t.status === 'completed').length, total: st.length }];
    }),
  ) as Record<StageId, { completed: number; total: number }>;

  const currentStage =
    STAGES.find((s) => stageProgress[s.id].total > 0 && stageProgress[s.id].completed < stageProgress[s.id].total)?.id ??
    'year';

  const alerts = buildAlerts(state, tasks);
  const funding = summariseFunding(state);
  const deadlines = tasks
    .filter((t) => t.status !== 'completed' && t.dueDate)
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));

  return {
    tasks,
    hiddenTasks,
    progress: { completed, inProgress, total: tasks.length, ratio: tasks.length ? completed / tasks.length : 0 },
    stageProgress,
    currentStage,
    funding,
    alerts,
    nextAction: nextActionFrom(alerts, tasks, funding.gap),
    deadlines,
    matches: matchAll(state.profile),
  };
}
