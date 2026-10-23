import { useState } from 'react';
import { Landmark, Receipt } from 'lucide-react';
import type { ApplicationStatus, FundApplication } from '../../types';
import { useSponsor } from '../../hooks/useSponsor';
import { useToast } from '../../hooks/useToast';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { PageHeader, EmptyState } from '../../components/ui/Misc';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { DocumentReviewModal } from '../../components/sponsor/DocumentReviewModal';
import { SPONSOR_STATUS_LABEL } from '../../data/labels';
import { institutionById } from '../../data/institutions';
import { formatZAR } from '../../utils/format';
import { formatDate } from '../../utils/dates';
import { cn } from '../../utils/cn';

const FILTERS: { id: 'action' | 'all' | ApplicationStatus; label: string }[] = [
  { id: 'action', label: 'Needs action' },
  { id: 'accepted', label: 'Documents in review' },
  { id: 'offered', label: 'Offers sent' },
  { id: 'paid', label: 'Paid' },
  { id: 'all', label: 'All' },
];

export default function SponsorPipelinePage() {
  const { applications, funds, candidateById, dispatchPlatform, verified, platform } = useSponsor();
  const notify = useToast();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('action');
  const [paying, setPaying] = useState<FundApplication | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const setReviewing = (a: FundApplication | null) => setReviewingId(a?.id ?? null);
  const reviewing = applications.find((a) => a.id === reviewingId) ?? null;
  const sharesFor = (a: FundApplication) => platform.documents.filter((d) => d.applicationId === a.id);
  const requiredCount = (a: FundApplication) => sharesFor(a).filter((d) => d.required).length;
  const approvedCount = (a: FundApplication) => sharesFor(a).filter((d) => d.required && d.status === 'approved').length;
  useDocumentTitle('Offers & payments');

  const rows = applications.filter((a) =>
    filter === 'all' ? true : filter === 'action' ? a.status === 'accepted' || a.status === 'approved' || a.status === 'interested' : a.status === filter,
  );
  const inst = (a: FundApplication) => institutionById(candidateById(a.studentId)?.institutionId ?? '')?.name ?? 'the institution';

  return (
    <div>
      <PageHeader
        title="Offers & payments"
        description="Students sign in the app, then share the documents you asked for. Once you approve them, payment goes straight into the student’s fee account at their institution. Nothing goes by email, and students never handle the money."
      />
      <div role="tablist" aria-label="Filter" className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn('h-10 shrink-0 rounded-full border px-4 text-sm font-semibold', filter === f.id ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-body hover:border-ink-300')}
          >
            {f.label}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<Receipt aria-hidden className="size-5" />} title="Nothing here">
          {filter === 'action' ? 'No documents to review, payments to make or new profiles to look at.' : 'Try another filter.'}
        </EmptyState>
      ) : (
        <div className="card relative overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <caption className="sr-only">Applications, offers and payments</caption>
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Student</th>
                <th scope="col" className="px-3 py-3 font-semibold">Fund</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">Amount</th>
                <th scope="col" className="px-3 py-3 font-semibold">Status</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((a) => {
                const c = candidateById(a.studentId);
                const fund = funds.find((f) => f.id === a.fundId);
                return (
                  <tr key={a.id}>
                    <th scope="row" className="px-5 py-4 font-semibold text-ink">
                      {c?.firstName ?? 'Student'}
                      <span className="block text-xs font-normal text-muted">{institutionById(c?.institutionId ?? '')?.shortName}</span>
                    </th>
                    <td className="px-3 py-4 text-body">{fund?.name}</td>
                    <td className="num px-3 py-4 text-right font-semibold text-ink">{a.amount ? formatZAR(a.amount) : 'Not set'}</td>
                    <td className="px-3 py-4">
                      <Badge tone={a.status === 'paid' ? 'veld' : a.status === 'accepted' || a.status === 'approved' ? 'amber' : 'neutral'}>{SPONSOR_STATUS_LABEL[a.status]}</Badge>
                      {a.paymentReference && <span className="mt-1 block font-mono text-xs text-muted">Ref {a.paymentReference}</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {a.status === 'accepted' && (
                        <Button size="sm" onClick={() => setReviewing(a)} disabled={!verified}>
                          Review documents ({approvedCount(a)}/{requiredCount(a)})
                        </Button>
                      )}
                      {a.status === 'approved' && (
                        <span className="inline-flex flex-wrap justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setReviewing(a)}>
                            Documents
                          </Button>
                          <Button size="sm" onClick={() => setPaying(a)} disabled={!verified}>
                            Pay institution
                          </Button>
                        </span>
                      )}
                      {a.status === 'paid' && (
                        <Button size="sm" variant="secondary" onClick={() => setReviewing(a)}>
                          Documents & results
                        </Button>
                      )}
                      {a.status === 'interested' && <span className="text-xs text-muted">Review in Candidates</span>}
                      {a.status === 'offered' && <span className="text-xs text-muted">Sent {formatDate(a.updatedAt.slice(0, 10))}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {reviewing && (
        <DocumentReviewModal
          app={reviewing}
          studentName={candidateById(reviewing.studentId)?.firstName ?? 'Student'}
          institution={inst(reviewing)}
          shares={sharesFor(reviewing)}
          onClose={() => setReviewing(null)}
          onReview={(shareId, approve, note) => {
            dispatchPlatform({ type: 'reviewDocument', shareId, approve, note });
            notify(approve ? 'Document approved.' : 'Request for a new copy sent in the app.', approve ? 'success' : 'info');
          }}
          onConfirmIssuer={(shareId) => {
            dispatchPlatform({ type: 'confirmShareIssuer', shareId, ok: true });
            notify('Confirmed by the issuer.');
          }}
          onRequest={(kind, note) => {
            dispatchPlatform({ type: 'requestDocument', applicationId: reviewing.id, kind, note, required: reviewing.status === 'accepted' });
            notify('Request sent. The student sees it in the app straight away.');
          }}
          onRemind={(share) => {
            dispatchPlatform({ type: 'remindDocument', shareId: share.id });
            notify('In-app reminder sent.', 'info');
          }}
          onApprove={() => {
            dispatchPlatform({ type: 'approveFunding', applicationId: reviewing.id, studentName: candidateById(reviewing.studentId)?.firstName ?? 'Student' });
            notify('Funding approved. You can now pay the institution.');
          }}
        />
      )}

      <Modal
        open={Boolean(paying)}
        onClose={() => setPaying(null)}
        title="Pay the institution"
        description={paying ? `${formatZAR(paying.amount ?? 0)} for ${candidateById(paying.studentId)?.firstName}` : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPaying(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!paying) return;
                dispatchPlatform({ type: 'payInstitution', applicationId: paying.id, institution: inst(paying), studentName: candidateById(paying.studentId)?.firstName ?? 'Student' });
                notify(`Payment to ${inst(paying)} confirmed. The student has been notified.`);
                setPaying(null);
              }}
            >
              Confirm payment
            </Button>
          </>
        }
      >
        {paying && (
          <div className="space-y-3 text-sm">
            <p className="flex items-start gap-2 rounded-xl bg-paper p-3">
              <Landmark aria-hidden className="mt-0.5 size-4 shrink-0 text-veld-600" />
              Paid into the student fee account at <strong className="font-semibold">{inst(paying)}</strong>, with the student number as reference.
            </p>
            <p className="text-muted">Registration payments fall due in January. Paying now means the student can register without a fee block.</p>
            <p className="text-xs text-subtle">Prototype: no money moves. In production this runs through a bank payment rail with the institution’s verified account.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
