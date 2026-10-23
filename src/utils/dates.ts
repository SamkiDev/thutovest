const DAY = 24 * 60 * 60 * 1000;

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function daysUntil(iso: string, now = new Date()): number {
  return Math.round((fromISODate(iso).getTime() - startOfDay(now).getTime()) / DAY);
}

const dayFmt = new Intl.DateTimeFormat('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
const shortFmt = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short' });

export function formatDate(iso: string): string {
  return dayFmt.format(fromISODate(iso));
}

export function formatDayMonth(iso: string): { day: string; month: string } {
  const parts = shortFmt.formatToParts(fromISODate(iso));
  return {
    day: parts.find((p) => p.type === 'day')?.value ?? '',
    month: parts.find((p) => p.type === 'month')?.value ?? '',
  };
}

export function relativeDays(days: number): string {
  if (days < 0) return `${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `${days} days left`;
}

export function timeAgo(isoDateTime: string, now = new Date()): string {
  const diff = now.getTime() - new Date(isoDateTime).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
