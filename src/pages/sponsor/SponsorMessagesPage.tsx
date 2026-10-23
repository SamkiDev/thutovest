import { useState } from 'react';
import { Inbox } from 'lucide-react';
import { useSponsor } from '../../hooks/useSponsor';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { PageHeader, EmptyState } from '../../components/ui/Misc';
import { MessageThread } from '../../components/marketplace/MessageThread';
import { SPONSOR_STATUS_LABEL } from '../../data/labels';
import { cn } from '../../utils/cn';

export default function SponsorMessagesPage() {
  const { applications, funds, candidateById, platform, dispatchPlatform, sponsor } = useSponsor();
  const threads = applications.filter((a) => a.status !== 'declined-by-sponsor');
  const [selected, setSelected] = useState<string | null>(null);
  useDocumentTitle('Messages');

  const activeId = selected ?? threads[0]?.id ?? null;
  const active = threads.find((a) => a.id === activeId);
  const student = active ? candidateById(active.studentId) : undefined;

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Contact details removed. Payment requests blocked."
      />
      {threads.length === 0 ? (
        <EmptyState icon={<Inbox aria-hidden className="size-5" />} title="No conversations yet">
          Conversations open when a student shares a profile with you or you send an offer.
        </EmptyState>
      ) : (
        <div className="card grid overflow-hidden md:grid-cols-[17rem_1fr]">
          <ul className="divide-y divide-line border-b border-line md:border-r md:border-b-0" aria-label="Conversations">
            {threads.map((a) => {
              const c = candidateById(a.studentId);
              const last = platform.messages.filter((m) => m.applicationId === a.id).at(-1);
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(a.id)}
                    aria-current={activeId === a.id}
                    className={cn('w-full px-4 py-3 text-left', activeId === a.id ? 'bg-veld-50/70' : 'hover:bg-paper')}
                  >
                    <span className="block text-sm font-semibold text-ink">{c?.firstName ?? 'Student'}</span>
                    <span className="block truncate text-xs text-muted">{funds.find((f) => f.id === a.fundId)?.name}</span>
                    <span className="mt-0.5 block text-xs font-medium text-veld-700">{SPONSOR_STATUS_LABEL[a.status]}</span>
                    {last && <span className="mt-0.5 block truncate text-xs text-subtle">{last.text}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          {active && (
            <MessageThread
              messages={platform.messages.filter((m) => m.applicationId === active.id)}
              viewer="sponsor"
              counterpart={student?.firstName ?? 'student'}
              guardianNote={student && !student.isAdult ? `${student.firstName} is under 18. Their parent or guardian can read this conversation.` : undefined}
              disabledReason={sponsor?.status !== 'active' ? 'Your account is suspended. Messaging is disabled during review.' : undefined}
              onSend={(text) => dispatchPlatform({ type: 'sendMessage', applicationId: active.id, from: 'sponsor', text })}
            />
          )}
        </div>
      )}
    </div>
  );
}
