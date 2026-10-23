import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { LogoMark } from '../layout/Logo';
import { cn } from '../../utils/cn';

export function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'student') {
    return (
      <li className="rise flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-3 text-[0.9375rem] text-white">
          <span className="sr-only">You said: </span>
          {message.text}
        </p>
      </li>
    );
  }
  const r = message.reply!;
  return (
    <li className="rise flex gap-3">
      <LogoMark className="mt-0.5 size-8 shrink-0" />
      <div className="min-w-0 max-w-[92%] rounded-2xl rounded-tl-md border border-line bg-surface px-4 py-3 text-[0.9375rem] text-body">
        <span className="sr-only">Navigator said: </span>
        <div className="space-y-2">
          {r.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {r.bullets && r.bullets.length > 0 && (
          <ul className="mt-3 space-y-1 border-l-2 border-veld-200 pl-3 text-sm">
            {r.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
        {r.actions && r.actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {r.actions.map((a) => (
              <Link
                key={a.to + a.label}
                to={a.to}
                className="inline-flex h-9 items-center rounded-full bg-veld-50 px-4 text-sm font-semibold text-veld-700 hover:bg-veld-100"
              >
                {a.label}
              </Link>
            ))}
          </div>
        )}
        {r.sources && r.sources.length > 0 && (
          <div className="mt-3 border-t border-line pt-3">
            <p className="text-xs font-semibold text-muted">Official sources</p>
            <ul className="mt-1 space-y-0.5">
              {r.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer" className={cn('inline-flex items-center gap-1 text-sm font-medium text-veld-700 hover:underline')}>
                    {s.label}
                    <ExternalLink aria-hidden className="size-3.5" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </li>
  );
}

export function TypingIndicator() {
  return (
    <li className="flex gap-3" aria-live="polite">
      <LogoMark className="mt-0.5 size-8 shrink-0" />
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-line bg-surface px-4 py-4" role="status" aria-label="Navigator is preparing an answer">
        <span className="typing-dot size-2 rounded-full bg-ink-300" />
        <span className="typing-dot size-2 rounded-full bg-ink-300" />
        <span className="typing-dot size-2 rounded-full bg-ink-300" />
      </div>
    </li>
  );
}
