import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/layout/Logo';
import { Button } from '../../components/ui/Button';
import { ChoiceCards, TextField } from '../../components/forms/Fields';
import { usePlatform } from '../../platform/PlatformProvider';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import type { SponsorOrg, SponsorType } from '../../types';
import { REGISTRATION_HINT, validRegistration } from '../../utils/trust';
import { makeId } from '../../utils/createState';
import { LIMITS } from '../../platform/authorize';
import { rememberDeviceSponsor } from '../../platform/dataStore';

export default function SponsorJoinPage() {
  const { dispatchPlatform, signIn } = usePlatform();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [type, setType] = useState<SponsorType>('company');
  const [reg, setReg] = useState('');
  const [contact, setContact] = useState('');
  const [about, setAbout] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  useDocumentTitle('Register as a sponsor');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (name.trim().length < 3) err.name = 'Enter your organisation’s registered name.';
    if (!validRegistration(type, reg)) err.reg = `That doesn’t look right. ${REGISTRATION_HINT[type]}.`;
    if (!/^[\p{L}][\p{L}' -]{1,39}$/u.test(contact.trim())) err.contact = 'Enter the first name of the person registering.';
    setErrors(err);
    if (Object.keys(err).length) return;
    const unchecked = { status: 'not-started' as const };
    const sponsor: SponsorOrg = {
      id: makeId('sp'),
      name: name.trim(),
      type,
      registrationNumber: reg.trim().toUpperCase(),
      contactName: contact.trim(),
      about: about.trim() || 'Supporting South African students.',
      verification: { organisation: unchecked, representative: unchecked, bank: unchecked },
      status: 'active',
      isDemo: false,
      createdAt: new Date().toISOString(),
    };
    dispatchPlatform({ type: 'registerSponsor', sponsor });
    rememberDeviceSponsor(sponsor.id);
    signIn({ role: 'sponsor', userId: sponsor.id, email: '', demo: false });
    navigate('/sponsor/organisation');
  };

  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Home">
            <Logo />
          </Link>
          <Link to="/signin?role=sponsor" className="text-sm font-semibold text-veld-700 hover:underline">
            Already registered? Sign in
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-3xl font-bold sm:text-4xl">Fund students directly</h1>
        <p className="mt-2 max-w-xl text-muted">
          Register, pass three checks, then publish a fund. Awards go straight to institutions.
        </p>
        <form onSubmit={submit} noValidate className="card mt-8 space-y-6 p-5 sm:p-8">
          <TextField label="Registered organisation name" maxLength={LIMITS.name} value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="organization" />
          <ChoiceCards<SponsorType>
            legend="Organisation type"
            options={[
              { value: 'company', label: 'Company', hint: 'Registered with CIPC' },
              { value: 'trust', label: 'Trust', hint: 'Registered with the Master’s Office' },
              { value: 'npo', label: 'Non-profit', hint: 'Registered NPO' },
            ]}
            value={type}
            onChange={setType}
            columns={3}
          />
          <TextField label="Registration number" maxLength={LIMITS.registration} hint={REGISTRATION_HINT[type]} value={reg} onChange={(e) => setReg(e.target.value)} error={errors.reg} className="sm:max-w-xs" />
          <TextField label="Your first name" maxLength={40} hint="You’ll verify your identity in the next step." value={contact} onChange={(e) => setContact(e.target.value)} error={errors.contact} autoComplete="given-name" className="sm:max-w-xs" />
          <div>
            <label htmlFor="about" className="mb-1.5 block text-sm font-semibold text-ink">
              Who you support <span className="font-normal text-subtle">Optional</span>
            </label>
            <textarea maxLength={LIMITS.about} id="about" rows={3} value={about} onChange={(e) => setAbout(e.target.value)} className="w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-sm focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none" />
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted">Prototype: details stay in this browser. Checks are simulated.</p>
            <Button type="submit" size="lg">
              Start checks
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
