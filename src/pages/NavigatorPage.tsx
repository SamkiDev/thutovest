import { BRAND } from '../config/brand';
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FlaskConical, SendHorizontal, Trash } from 'lucide-react';
import type { ChatMessage } from '../types';
import { useStudent } from '../hooks/useStudent';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { MessageBubble, TypingIndicator } from '../components/navigator/MessageBubble';
import { Button } from '../components/ui/Button';
import { answer, ASK_SHORTCUTS, SUGGESTED_QUESTIONS } from '../utils/navigator';
import { makeId } from '../utils/createState';
import { OFFICIAL } from '../data/officialResources';
import { FIELDS, INCOME_BANDS, MODE_LABEL } from '../data/labels';
import { formatZAR } from '../utils/format';
import { LIMITS } from '../platform/authorize';

const KEY = `${BRAND.storagePrefix}:chat`;

function loadChat(): ChatMessage[] {
  try {
    return JSON.parse(window.sessionStorage.getItem(KEY) ?? '[]') as ChatMessage[];
  } catch {
    return [];
  }
}

export default function NavigatorPage() {
  const { state, engine } = useStudent();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>(loadChat);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const handledQuery = useRef<string | null>(null);
  useDocumentTitle('Student Navigator');

  useEffect(() => {
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      /* ignore */
    }
  }, [messages]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [messages, thinking]);

  const send = useCallback(
    (text: string) => {
      const q = text.trim();
      if (!q || thinking) return;
      setMessages((m) => [...m, { id: makeId('m'), role: 'student', text: q }]);
      setInput('');
      setThinking(true);
      window.setTimeout(() => {
        setMessages((m) => [...m, { id: makeId('m'), role: 'navigator', reply: answer(q, state, engine) }]);
        setThinking(false);
      }, 650);
    },
    [thinking, state, engine],
  );

  // Questions passed from other screens (?q= or ?ask=)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') ?? (params.get('ask') ? ASK_SHORTCUTS[params.get('ask')!] : null);
    if (q && handledQuery.current !== location.search) {
      handledQuery.current = location.search;
      send(q);
      navigate('/app/navigator', { replace: true });
    }
  }, [location.search, send, navigate]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const p = state.profile;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_17rem] lg:gap-6">
      <section className="card flex h-[calc(100dvh-12.5rem)] min-h-[30rem] flex-col overflow-hidden lg:h-[calc(100dvh-5rem)]" aria-labelledby="nav-title">
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div>
            <h1 id="nav-title" className="text-lg font-bold">
              Student Navigator
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <FlaskConical aria-hidden className="size-3.5" />
              Scripted demo answers, not live AI advice
            </p>
          </div>
          {messages.length > 0 && (
            <Button size="sm" variant="ghost" icon={<Trash aria-hidden className="size-4" />} onClick={() => setMessages([])}>
              Clear
            </Button>
          )}
        </header>

        <ol ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5" aria-live="polite" aria-label="Conversation">
          <li className="flex gap-3">
            <div className="max-w-[92%] rounded-2xl border border-line bg-paper px-4 py-3 text-[0.9375rem] text-body">
              <p>
                Hi {p.firstName}. Ask about your next steps, funding, documents or deadlines.
              </p>
            </div>
          </li>
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {thinking && <TypingIndicator />}
        </ol>

        <div className="border-t border-line bg-paper/50 px-4 pt-3 pb-4 sm:px-5">
          <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Suggested questions" role="group">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                disabled={thinking}
                className="shrink-0 rounded-full border border-line-strong bg-surface px-4 py-1.5 text-sm font-medium text-ink hover:border-veld-400 hover:bg-veld-50 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
          <form onSubmit={onSubmit} className="flex items-end gap-2">
            <label htmlFor="nav-input" className="sr-only">
              Ask the Student Navigator
            </label>
            <textarea maxLength={LIMITS.note}
              id="nav-input"
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about funding, documents, deadlines…"
              className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border border-line-strong bg-surface px-4 py-3 text-[0.9375rem] focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none"
            />
            <Button type="submit" className="size-12 shrink-0 !px-0" disabled={!input.trim() || thinking} aria-label="Send question">
              <SendHorizontal aria-hidden className="size-5" />
            </Button>
          </form>
        </div>
      </section>

      <aside className="space-y-4" aria-label="About the Navigator">
        <section className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="text-sm font-semibold">What the Navigator uses</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row k="Field" v={FIELDS.find((f) => f.value === p.field)?.label ?? ''} />
            <Row k="Study mode" v={MODE_LABEL[p.studyMode]} />
            <Row k="Own budget" v={formatZAR(p.annualBudget)} />
            <Row k="Income band" v={INCOME_BANDS.find((b) => b.value === p.householdIncome)?.label ?? ''} />
            <Row k="Funding gap" v={formatZAR(engine.funding.gap)} />
            <Row k="Open alerts" v={String(engine.alerts.length)} />
          </dl>
        </section>
        <section className="rounded-2xl border border-line bg-surface p-4 text-sm">
          <h2 className="text-sm font-semibold">Good to know</h2>
          <p className="mt-2 text-muted">
            Scripted answers using your plan. Not financial, legal or admissions advice. Confirm with the official source.
          </p>
          <ul className="mt-3 space-y-1.5">
            {[OFFICIAL.nsfas, OFFICIAL.dhet, OFFICIAL.cao].map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer" className="font-medium text-veld-700 hover:underline">
                  {s.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className="num text-right font-medium text-ink">{v}</dd>
    </div>
  );
}
