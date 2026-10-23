import { useState, type ReactNode } from 'react';
import { BRAND } from '../../config/brand';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { ButtonLink } from '../ui/Button';

/** Sections on the landing page. About is its own page (/about). */
export const PUBLIC_LINKS = [
  { id: 'how', label: 'How it works' },
  { id: 'support', label: 'Student support' },
];

export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  el.focus({ preventScroll: true });
  return true;
}

/** Scrolls to a landing section, going back to the landing page first when needed (e.g. from /about). */
function useSectionLink() {
  const navigate = useNavigate();
  return (id: string) => {
    if (scrollToSection(id)) return;
    navigate('/');
    window.setTimeout(() => scrollToSection(id), 150);
  };
}

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const goTo = useSectionLink();
  const linkCls = 'rounded-full px-3 py-2 text-[0.9375rem] font-medium text-body hover:bg-sunken hover:text-ink';

  const link = (id: string, label: string, onClick?: () => void) => (
    <a
      key={id}
      href={`#${id}`}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
        goTo(id);
      }}
      className={linkCls}
    >
      {label}
    </a>
  );
  const about = (onClick?: () => void) => (
    <Link key="about" to="/about" onClick={onClick} className={linkCls}>
      About
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper">
      <div className="mx-auto flex h-16 max-w-[76rem] items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link to="/" aria-label={`${BRAND.name} home`}>
          <Logo />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {PUBLIC_LINKS.map((l) => link(l.id, l.label))}
          {about()}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ButtonLink to="/signin" variant="ghost" size="sm" icon={<LogIn aria-hidden className="size-4" />}>
            Sign in
          </ButtonLink>
          <ButtonLink to="/start" size="sm" variant="dark">
            Get started
          </ButtonLink>
        </div>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full hover:bg-sunken md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="public-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X aria-hidden className="size-6 text-ink" /> : <Menu aria-hidden className="size-6 text-ink" />}
        </button>
      </div>
      {open && (
        <div id="public-menu" className="rise border-t border-line bg-paper px-4 pt-2 pb-5 md:hidden">
          <nav aria-label="Primary mobile" className="flex flex-col">
            {PUBLIC_LINKS.map((l) => link(l.id, l.label, () => setOpen(false)))}
            {about(() => setOpen(false))}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <ButtonLink to="/signin" variant="secondary">
              Sign in
            </ButtonLink>
            <ButtonLink to="/start" variant="dark">
              Get started
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  const goTo = useSectionLink();
  return (
    <footer className="bg-ink text-white/70">
      <div className="mx-auto grid max-w-[76rem] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-10">
        <div>
          <Logo dark />
          <p className="mt-4 max-w-xs text-sm">Built for the FNB App of the Year Hackathon 2026.</p>
        </div>
        <FooterCol title="Product">
          <FooterLink to="/start">Build my pathway</FooterLink>
          <FooterLink to="/app">Dashboard</FooterLink>
          <FooterLink to="/app/funding">Funding Gap Solver</FooterLink>
          <FooterLink to="/app/explore">Study Explorer</FooterLink>
        </FooterCol>
        <FooterCol title="Learn more">
          {PUBLIC_LINKS.map((l) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  goTo(l.id);
                }}
                className="hover:text-white"
              >
                {l.label}
              </a>
            </li>
          ))}
          <FooterLink to="/about">About and business model</FooterLink>
        </FooterCol>
        <FooterCol title="Official sources">
          <li><a className="hover:text-white" href="https://www.nsfas.org.za" target="_blank" rel="noreferrer">NSFAS</a></li>
          <li><a className="hover:text-white" href="https://www.dhet.gov.za" target="_blank" rel="noreferrer">Dept. of Higher Education</a></li>
          <li><a className="hover:text-white" href="https://www.cao.ac.za" target="_blank" rel="noreferrer">Central Applications Office</a></li>
        </FooterCol>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-[76rem] px-4 py-5 text-xs text-white/50 sm:px-6 lg:px-10">
          {BRAND.name} is not a funder and guarantees no admission or funding. Demo data is labelled.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 font-sans text-sm font-semibold text-white">{title}</h2>
      <ul className="space-y-2 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <li>
      <Link to={to} className="hover:text-white">
        {children}
      </Link>
    </li>
  );
}
