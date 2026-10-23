import type { ReactNode } from 'react';
import { ExternalLink, Globe, HandCoins, Send } from 'lucide-react';
import type { Institution, OfficialLink } from '../../types';
import { CAO_LINK } from '../../data/institutions';
import { cn } from '../../utils/cn';

/** One official link, opened in a new tab. */
export function Ext({ link, icon, primary }: { link: OfficialLink; icon?: ReactNode; primary?: boolean }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
        primary ? 'bg-veld-600 text-white hover:bg-veld-700' : 'border border-line-strong bg-surface text-ink hover:border-ink-300',
      )}
    >
      {icon}
      {link.label}
      <ExternalLink aria-hidden className="size-3.5 opacity-70" />
      <span className="sr-only">(official site, opens in a new tab)</span>
    </a>
  );
}

/** Official links for one institution: apply, financial aid, website (and CAO for KZN institutions). */
export function InstitutionLinks({ inst, compact = false, className }: { inst: Institution; compact?: boolean; className?: string }) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <Ext link={inst.apply} primary icon={<Send aria-hidden className="size-3.5" />} />
      {inst.viaCAO && <Ext link={{ label: 'Apply via CAO', url: CAO_LINK.url }} />}
      <Ext link={inst.funding} icon={<HandCoins aria-hidden className="size-3.5" />} />
      {!compact && <Ext link={{ label: 'Website', url: inst.website }} icon={<Globe aria-hidden className="size-3.5" />} />}
      {!compact && inst.extra?.map((l) => <Ext key={l.url} link={l} />)}
    </div>
  );
}
