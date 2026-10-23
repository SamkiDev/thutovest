import { Compass } from 'lucide-react';
import { useStudent } from '../hooks/useStudent';
import { useTaskActions } from '../hooks/useTaskActions';
import { useOptionActions } from '../hooks/useOptionActions';
import { JourneyHero } from '../components/dashboard/JourneyHero';
import { NextBestAction } from '../components/dashboard/NextBestAction';
import { ActivityFeed, DeadlinesCard, FundingSnapshot, NavigatorPrompt, RiskSummary, TaskOverview } from '../components/dashboard/Panels';
import { OptionCard } from '../components/study-options/OptionCard';
import { SectionTitle, EmptyState } from '../components/ui/Misc';
import { ButtonLink } from '../components/ui/Button';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAgent } from '../hooks/useAgent';
import { useAllAlerts } from '../hooks/useDocuments';
import { AgentPanel } from '../components/agent/AgentCard';
import { SponsorSnapshot } from '../components/dashboard/SponsorSnapshot';

export default function DashboardPage() {
  const { state, engine } = useStudent();
  const { setStatus } = useTaskActions();
  const options = useOptionActions();
  const agent = useAgent();
  const alerts = useAllAlerts();
  useDocumentTitle('Dashboard');

  const recommended = engine.matches.filter((m) => m.option.field === state.profile.field).slice(0, 3);
  const nextStatus = engine.nextAction?.taskId ? engine.tasks.find((t) => t.id === engine.nextAction!.taskId)?.status : undefined;

  return (
    <div className="space-y-5 lg:space-y-6">
      <JourneyHero state={state} engine={engine} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-7">
          <NextBestAction action={engine.nextAction} status={nextStatus} onSetStatus={setStatus} />
        </div>
        <div className="lg:col-span-5">
          <FundingSnapshot engine={engine} needsFunding={state.profile.fundingNeed !== 'no'} />
        </div>
        <div className="space-y-5 lg:col-span-7 lg:space-y-6">
          <AgentPanel pending={agent.brief.pending} done={agent.brief.done} onApprove={agent.approve} onDismiss={agent.dismiss} />
          <RiskSummary alerts={alerts} />
        </div>
        <div className="space-y-5 lg:col-span-5 lg:space-y-6">
          <SponsorSnapshot state={state} />
          <DeadlinesCard deadlines={engine.deadlines} />
        </div>
      </div>

      <section aria-labelledby="rec-heading" className="pt-2">
        <SectionTitle
          id="rec-heading"
          title="Recommended study options"
          description="Ranked by your field, institutions, APS and budget."
          action={
            <span className="hidden sm:block">
              <ButtonLink to="/app/explore" variant="secondary" size="sm">
                Explore all
              </ButtonLink>
            </span>
          }
        />
        {recommended.length === 0 ? (
          <EmptyState icon={<Compass aria-hidden className="size-5" />} title="No options for this field yet" action={<ButtonLink to="/app/explore">Browse all</ButtonLink>}>
            Not in the demo catalogue yet.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {recommended.map((m) => (
              <OptionCard
                key={m.option.id}
                match={m}
                compact
                saved={options.isSaved(m.option.id)}
                onToggleSave={() => options.toggleSave(m)}
                onView={() => options.openDetail(m.option.id)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        <TaskOverview engine={engine} />
        <ActivityFeed items={state.activity} />
        <div className="md:col-span-2 lg:col-span-1">
          <NavigatorPrompt />
        </div>
      </div>
      {options.modal}
    </div>
  );
}
