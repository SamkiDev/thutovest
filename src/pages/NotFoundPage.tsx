import { Compass } from 'lucide-react';
import { Logo } from '../components/layout/Logo';
import { ButtonLink } from '../components/ui/Button';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-4 text-center">
      <div className="max-w-md">
        <Logo className="mb-10" />
        <Compass aria-hidden className="mx-auto size-10 text-veld-600" />
        <h1 className="mt-4 text-3xl font-bold">This page isn’t on the map</h1>
        <p className="mt-2 text-muted">The link may be old or mistyped. Head back to your dashboard or the homepage.</p>
        <div className="mt-6 flex justify-center gap-2">
          <ButtonLink to="/app">Go to dashboard</ButtonLink>
          <ButtonLink to="/" variant="secondary">
            Homepage
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
