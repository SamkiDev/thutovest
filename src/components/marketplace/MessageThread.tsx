import { useEffect, useRef, useState, type FormEvent } from 'react';
import { SendHorizontal, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { Message } from '../../types';
import { Button } from '../ui/Button';
import { screenMessage } from '../../intelligence/moderation';
import { timeAgo } from '../../utils/dates';
import { cn } from '../../utils/cn';
import { LIMITS } from '../../platform/authorize';

export function MessageThread({
  messages,
  viewer,
  counterpart,
  onSend,
  disabledReason,
  guardianNote,
}: {
  messages: Message[];
  viewer: 'student' | 'sponsor';
  counterpart: string;
  onSend: (text: string) => void;
  disabledReason?: string;
  guardianNote?: string;
}) {
  const [text, setText] = useState('');
  const listRef = useRef<HTMLOListElement>(null);
  const preview = text.trim() ? screenMessage(text, viewer) : null;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabledReason) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div className="flex h-full min-h-[22rem] flex-col">
      {guardianNote && (
        <p className="flex items-center gap-2 border-b border-line bg-paper px-4 py-2 text-xs text-muted">
          <ShieldCheck aria-hidden className="size-3.5 shrink-0 text-veld-600" />
          {guardianNote}
        </p>
      )}
      <ol ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-label={`Conversation with ${counterpart}`}>
        {messages.map((m) => {
          if (m.from === 'system') {
            return (
              <li key={m.id} className="mx-auto max-w-md text-center text-xs text-muted">
                {m.text}
              </li>
            );
          }
          const mine = m.from === viewer;
          if (m.blocked) {
            return (
              <li key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div className="max-w-[85%] rounded-2xl border border-clay-100 bg-clay-50 px-4 py-3 text-sm text-clay-700">
                  <p className="flex items-center gap-1.5 font-semibold">
                    <ShieldAlert aria-hidden className="size-4" />
                    {mine ? 'Your message was blocked' : 'Message blocked for your safety'}
                  </p>
                  <p className="mt-1 text-xs">Reason: {m.flags?.map((f) => f.label.toLowerCase()).join(', ')}.</p>
                  {viewer === 'sponsor' && mine && <p className="mt-1 text-xs">Requests for payment are not allowed. Your account is under review.</p>}
                </div>
              </li>
            );
          }
          return (
            <li key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[85%] rounded-2xl px-4 py-3 text-sm', mine ? 'rounded-br-md bg-ink text-white' : 'rounded-bl-md border border-line bg-surface text-body')}>
                <p>{m.text}</p>
                <p className={cn('mt-1 text-[0.6875rem]', mine ? 'text-white/60' : 'text-subtle')}>
                  {timeAgo(m.at)}
                  {m.flags?.length ? `, ${m.flags.map((f) => f.label.toLowerCase()).join(', ')} removed` : ''}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <form onSubmit={submit} className="border-t border-line p-3">
        {disabledReason ? (
          <p className="rounded-xl bg-paper px-3 py-3 text-sm text-muted">{disabledReason}</p>
        ) : (
          <>
            <div className="flex items-end gap-2">
              <label htmlFor={`compose-${viewer}`} className="sr-only">
                Message {counterpart}
              </label>
              <textarea maxLength={LIMITS.message}
                id={`compose-${viewer}`}
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) submit(e);
                }}
                placeholder={`Message ${counterpart}`}
                className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-line-strong bg-surface px-4 py-3 text-sm focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none"
              />
              <Button type="submit" className="size-11 shrink-0 !px-0" disabled={!text.trim()} aria-label="Send message">
                <SendHorizontal aria-hidden className="size-5" />
              </Button>
            </div>
            {preview && preview.flags.length > 0 && (
              <p className={cn('mt-2 text-xs font-medium', preview.blocked ? 'text-clay-600' : 'text-amber-700')} role="status">
                {preview.blocked
                  ? 'This message asks for payment or bank details and will be blocked.'
                  : `${preview.flags.map((f) => f.label).join(', ')} will be removed to keep the conversation on the platform.`}
              </p>
            )}
          </>
        )}
      </form>
    </div>
  );
}
