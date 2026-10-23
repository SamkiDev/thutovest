import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Check, CircleOff, Send, Smartphone, X } from 'lucide-react';
import { useStudent } from '../hooks/useStudent';
import { useToast } from '../hooks/useToast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useWhatsApp, type ChatMessage } from '../whatsapp/WhatsAppProvider';
import { dataPlan, maskPhone, normaliseSaMobile } from '../../supabase/functions/_shared/whatsapp/bot.ts';
import type { WhatsAppAlertPrefs } from '../types';
import { PageHeader } from '../components/ui/Misc';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TextField } from '../components/forms/Fields';
import { LogoMark } from '../components/layout/Logo';
import { BRAND } from '../config/brand';
import { cn } from '../utils/cn';

const ALERT_LABELS: [keyof WhatsAppAlertPrefs, string][] = [
  ['offers', 'New sponsor offers'],
  ['documents', 'Document requests and approvals'],
  ['deadlines', 'Deadlines 3 days away'],
  ['payments', 'Funding approved and paid'],
  ['messages', 'New sponsor messages (count only)'],
];

export default function WhatsAppPage() {
  const { state } = useStudent();
  const wa = state.whatsapp;
  const { snapshot, markRead, unread } = useWhatsApp();
  useDocumentTitle('WhatsApp updates');

  useEffect(() => {
    if (unread) markRead();
  }, [unread, markRead]);

  const plan = snapshot ? dataPlan(snapshot) : null;

  return (
    <div>
      <PageHeader
        title="WhatsApp updates"
        description="Updates on WhatsApp when data is low. Uploads stay in the app."
      />

      {/* Mobile order: link, chat, details. Desktop: chat pinned in the right column. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="lg:col-start-1 lg:row-start-1">
          <LinkCard />
        </div>
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <Simulator linked={Boolean(wa?.linkedAt)} />
        </div>
        <div className="space-y-6 lg:col-start-1 lg:row-start-2">

          {plan && (
            <section className="card p-5 sm:p-6" aria-labelledby="data-heading">
              <h2 id="data-heading" className="text-lg font-semibold">
                When you’ll need data
              </h2>
              <p className="mt-1 text-sm text-muted">Reply 6 to get this on WhatsApp.</p>
              {plan.items.length === 0 ? (
                <p className="mt-4 text-sm text-body">Nothing needs data in the next 7 days.</p>
              ) : (
                <>
                  <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
                    {plan.items.map((i) => (
                      <li key={i.label} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                        <span className="text-ink">{i.label}</span>
                        <span className="num shrink-0 text-muted">about {i.mb} MB</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm text-body">
                    Total about <span className="num font-semibold text-ink">{plan.totalMb} MB</span>.{' '}
                    {plan.buyBy != null && (plan.buyBy === 0 ? 'Get data today.' : `Get data within ${plan.buyBy} ${plan.buyBy === 1 ? 'day' : 'days'}.`)}
                  </p>
                </>
              )}
            </section>
          )}

          <section className="card p-5 sm:p-6" aria-labelledby="rules-heading">
            <h2 id="rules-heading" className="text-lg font-semibold">
              What the bot does, and never does
            </h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <ul className="space-y-2 text-sm">
                {['Lists deadlines and what’s new', 'Alerts you to offers, requests and payments', 'Says how much data each step needs'].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-veld-600" strokeWidth={3} />
                    {t}
                  </li>
                ))}
              </ul>
              <ul className="space-y-2 text-sm">
                {['Accepts documents, photos or voice notes', 'Asks for ID numbers, OTPs or bank details', 'Asks you to pay anything'].map((t) => (
                  <li key={t} className="flex gap-2">
                    <X aria-hidden className="mt-0.5 size-4 shrink-0 text-clay-600" strokeWidth={3} />
                    <span>
                      <span className="sr-only">Never: </span>
                      {t}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Linking ---------------- */

function LinkCard() {
  const { state, dispatch } = useStudent();
  const { requestCode, send } = useWhatsApp();
  const notify = useToast();
  const wa = state.whatsapp;
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const consentId = useId();
  const [, tick] = useState(0);

  useEffect(() => {
    if (!wa?.pending) return;
    const t = window.setInterval(() => tick((n) => n + 1), 15_000);
    return () => window.clearInterval(t);
  }, [wa?.pending]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const normal = normaliseSaMobile(phone);
    if (!normal) return setError('Enter a South African cellphone number, like 082 123 4567.');
    if (!consent) return setError('Tick the box to agree to receive updates.');
    setError(null);
    requestCode(normal);
  };

  if (wa?.linkedAt) {
    return (
      <section className="card p-5 sm:p-6" aria-labelledby="link-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="link-heading" className="text-lg font-semibold">
              Linked to {maskPhone(wa.phone)}
            </h2>
            <p className="mt-1 text-sm text-muted">Reply STOP to turn updates off.</p>
          </div>
          {wa.optedOut ? <Badge tone="outline">Updates off</Badge> : <Badge tone="veld">Updates on</Badge>}
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-ink">Send me</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {ALERT_LABELS.map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-3 py-3 text-sm hover:bg-paper">
                <input
                  type="checkbox"
                  checked={wa.alerts[key]}
                  disabled={wa.optedOut}
                  onChange={(e) => dispatch({ type: 'whatsappAlerts', alerts: { ...wa.alerts, [key]: e.target.checked } })}
                  className="size-4 accent-veld-600"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" onClick={() => dispatch({ type: 'whatsappOptOut', value: !wa.optedOut })}>
            {wa.optedOut ? 'Resume updates' : 'Pause updates'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<CircleOff aria-hidden className="size-4" />}
            onClick={() => {
              dispatch({ type: 'whatsappUnlink' });
              notify('WhatsApp unlinked. No more messages will be sent.', 'info');
            }}
          >
            Unlink number
          </Button>
        </div>
      </section>
    );
  }

  if (wa?.pending) {
    const minutesLeft = Math.max(0, Math.ceil((new Date(wa.pending.expiresAt).getTime() - Date.now()) / 60_000));
    const expired = minutesLeft === 0;
    const message = `LINK ${wa.pending.code}`;
    return (
      <section className="card p-5 sm:p-6" aria-labelledby="link-heading">
        <h2 id="link-heading" className="text-lg font-semibold">
          Confirm it’s your number
        </h2>
        <p className="mt-1 text-sm text-muted">Send this from {maskPhone(wa.phone)} to prove it’s yours.</p>
        <p className={cn('num mt-4 rounded-xl bg-paper px-4 py-3 font-display text-2xl font-bold tracking-wider', expired ? 'text-subtle line-through' : 'text-ink')} aria-live="polite">
          {message}
        </p>
        <p className="mt-2 text-xs text-subtle">{expired ? 'This code has expired.' : `Expires in about ${minutesLeft} ${minutesLeft === 1 ? 'minute' : 'minutes'}.`}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {expired ? (
            <Button size="sm" onClick={() => requestCode(wa.phone)}>
              Get a new code
            </Button>
          ) : (
            <>
              <Button size="sm" icon={<Send aria-hidden className="size-4" />} onClick={() => send(message)}>
                Send in simulator
              </Button>
              {BRAND.whatsappNumber && (
                <a
                  href={`https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center rounded-full border border-line-strong px-4 text-sm font-semibold text-ink hover:border-ink-300"
                >
                  Open WhatsApp
                </a>
              )}
            </>
          )}
          <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'whatsappUnlink' })}>
            Change number
          </Button>
        </div>
        {!BRAND.whatsappNumber && <p className="mt-4 text-xs text-subtle">Prototype: the simulator plays the bot.</p>}
      </section>
    );
  }

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="link-heading">
      <h2 id="link-heading" className="flex items-center gap-2 text-lg font-semibold">
        <Smartphone aria-hidden className="size-5 text-veld-600" /> Get updates on WhatsApp
      </h2>
      <p className="mt-1 text-sm text-muted">Get a code, then send it from your phone.</p>
      <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
        <TextField
          label="Your cellphone number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={16}
          placeholder="082 123 4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="sm:max-w-xs"
        />
        <label htmlFor={consentId} className="flex cursor-pointer gap-3 text-sm text-body">
          <input id={consentId} type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-veld-600" />
          I agree to WhatsApp updates. My number is used only for these updates, sponsors never see it, and I can reply STOP any time.
        </label>
        {error && (
          <p role="alert" className="text-sm font-medium text-clay-700">
            {error}
          </p>
        )}
        <Button type="submit">Get link code</Button>
      </form>
    </section>
  );
}

/* ---------------- Simulator ---------------- */

const QUICK = ['Menu', '1', '2', '3', '4', '5', '6'];

function Simulator({ linked }: { linked: boolean }) {
  const { messages, typing, send, clearChat } = useWhatsApp();
  const [text, setText] = useState('');
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, typing]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(text);
    setText('');
  };

  return (
    <section aria-labelledby="sim-heading" className="lg:sticky lg:top-6">
      <div className="overflow-hidden rounded-[2rem] border-8 border-ink bg-ink shadow-[var(--shadow-lift)]">
        <header className="flex items-center gap-3 bg-ink px-4 pt-2 pb-3 text-white">
          <LogoMark dark className="size-9" />
          <div className="min-w-0 flex-1">
            <h2 id="sim-heading" className="truncate font-sans text-[0.9375rem] font-semibold text-white">
              ThutoVest
            </h2>
            <p className="text-xs text-white/70">Official updates · simulated</p>
          </div>
          {messages.length > 0 && (
            <button type="button" onClick={clearChat} className="rounded-full px-2 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white">
              Clear
            </button>
          )}
        </header>

        <ol ref={listRef} role="log" aria-live="polite" aria-label="Chat with the ThutoVest bot" className="h-[26rem] space-y-2 overflow-y-auto bg-sunken px-3 py-4">
          {messages.length === 0 && (
            <li className="mx-auto max-w-[16rem] rounded-xl bg-surface px-3 py-2 text-center text-xs text-muted">
              {linked ? 'Say hi, or reply with a number from the menu.' : 'Link your number, or say hi to try it.'}
            </li>
          )}
          {messages.map((m) => (
            <Bubble key={m.id} m={m} />
          ))}
          {typing && (
            <li className="w-fit rounded-2xl rounded-tl-sm bg-surface px-3 py-2" aria-label="ThutoVest is typing">
              <span className="typing-dot inline-block size-1.5 rounded-full bg-subtle" /> <span className="typing-dot inline-block size-1.5 rounded-full bg-subtle" />{' '}
              <span className="typing-dot inline-block size-1.5 rounded-full bg-subtle" />
            </li>
          )}
        </ol>

        <div className="bg-paper px-3 pt-2 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Quick replies">
            {QUICK.map((q) => (
              <button key={q} type="button" onClick={() => send(q)} className="h-8 shrink-0 rounded-full border border-line-strong bg-surface px-3 text-sm font-semibold text-ink hover:border-veld-500">
                {q}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="flex items-center gap-2">
            <label htmlFor="sim-input" className="sr-only">
              Message
            </label>
            <input
              id="sim-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              autoComplete="off"
              placeholder="Type a message"
              className="h-11 min-w-0 flex-1 rounded-full border border-line-strong bg-surface px-4 text-sm focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none"
            />
            <button type="submit" aria-label="Send" disabled={!text.trim()} className="grid size-11 shrink-0 place-items-center rounded-full bg-veld-600 text-white hover:bg-veld-700 disabled:opacity-50">
              <Send aria-hidden className="size-4" />
            </button>
          </form>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-subtle">Tip: type an ID number to test the safety check.</p>
    </section>
  );
}

function Bubble({ m }: { m: ChatMessage }) {
  const mine = m.from === 'me';
  const time = new Date(m.at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  return (
    <li className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2 text-[0.875rem] leading-snug shadow-[0_1px_0_rgb(13_27_62/0.06)]',
          mine ? 'rounded-tr-sm bg-veld-100 text-ink' : 'rounded-tl-sm bg-surface text-ink',
        )}
      >
        <span className="sr-only">{mine ? 'You: ' : 'ThutoVest: '}</span>
        {m.alert && <span className="mb-1 block text-[0.6875rem] font-semibold tracking-wide text-veld-700 uppercase">Alert</span>}
        <FormattedText text={m.text} />
        <span className="mt-1 block text-right text-[0.6875rem] text-subtle">{time}</span>
      </div>
    </li>
  );
}

/** WhatsApp-style *bold* and line breaks, rendered as React nodes. No HTML is ever injected. */
function FormattedText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => {
        const parts: ReactNode[] = line.split(/(\*[^*\n]+\*)/g).map((seg, j) =>
          /^\*[^*]+\*$/.test(seg) ? (
            <strong key={j} className="font-semibold">
              {seg.slice(1, -1)}
            </strong>
          ) : (
            seg
          ),
        );
        return (
          <span key={i} className="block min-h-[1em] break-words">
            {parts}
          </span>
        );
      })}
    </>
  );
}
