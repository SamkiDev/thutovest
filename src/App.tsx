import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { StudentProvider } from './state/StudentProvider';
import { PlatformProvider, usePlatform } from './platform/PlatformProvider';
import { SponsorShell } from './components/layout/SponsorShell';
import { ToastProvider } from './hooks/useToast';
import { AppShell } from './components/layout/AppShell';
import { WhatsAppProvider } from './whatsapp/WhatsAppProvider';
import { Spinner } from './components/ui/Misc';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';

// App screens load on demand to keep the first download small on mobile data.
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const RiskRadarPage = lazy(() => import('./pages/RiskRadarPage'));
const FundingPage = lazy(() => import('./pages/FundingPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const JourneyPage = lazy(() => import('./pages/JourneyPage'));
const NavigatorPage = lazy(() => import('./pages/NavigatorPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SponsorsPage = lazy(() => import('./pages/SponsorsPage'));
const VerifyPage = lazy(() => import('./pages/VerifyPage'));
const ForecastPage = lazy(() => import('./pages/ForecastPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const InstitutionsPage = lazy(() => import('./pages/InstitutionsPage'));
const ResidencesPage = lazy(() => import('./pages/ResidencesPage'));
const WhatsAppPage = lazy(() => import('./pages/WhatsAppPage'));
const SignInPage = lazy(() => import('./pages/SignInPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const SponsorOverviewPage = lazy(() => import('./pages/sponsor/SponsorOverviewPage'));
const SponsorCandidatesPage = lazy(() => import('./pages/sponsor/SponsorCandidatesPage'));
const SponsorFundsPage = lazy(() => import('./pages/sponsor/SponsorFundsPage'));
const SponsorPipelinePage = lazy(() => import('./pages/sponsor/SponsorPipelinePage'));
const SponsorMessagesPage = lazy(() => import('./pages/sponsor/SponsorMessagesPage'));
const SponsorOrganisationPage = lazy(() => import('./pages/sponsor/SponsorOrganisationPage'));
const SponsorJoinPage = lazy(() => import('./pages/sponsor/SponsorJoinPage'));

/** When a login ends on its own (expired or revoked), say so and go to sign-in instead of failing quietly. */
function SessionNotice() {
  const { sessionLost, clearSessionLost } = usePlatform();
  const navigate = useNavigate();
  useEffect(() => {
    if (!sessionLost) return;
    const to = sessionLost === 'sponsor' ? '/signin?role=sponsor' : '/signin';
    // After any page's own redirect to sign-in, so the message isn't lost.
    const t = window.setTimeout(() => {
      navigate(to, { replace: true, state: { expired: true } });
      clearSessionLost();
    }, 0);
    return () => window.clearTimeout(t);
  }, [sessionLost, clearSessionLost, navigate]);
  return null;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageLoader() {
  return (
    <div className="grid min-h-[50vh] place-items-center text-veld-600">
      <Spinner className="size-7" label="Loading page" />
    </div>
  );
}

export default function App() {
  return (
    <PlatformProvider>
      <StudentProvider>
        <ToastProvider>
        {/* HashRouter: works on any static host without server rewrites. */}
        <HashRouter>
          <ScrollToTop />
          <SessionNotice />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/start" element={<OnboardingPage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/sponsor/join" element={<SponsorJoinPage />} />
              <Route path="/sponsor" element={<SponsorShell />}>
                <Route index element={<SponsorOverviewPage />} />
                <Route path="candidates" element={<SponsorCandidatesPage />} />
                <Route path="funds" element={<SponsorFundsPage />} />
                <Route path="pipeline" element={<SponsorPipelinePage />} />
                <Route path="messages" element={<SponsorMessagesPage />} />
                <Route path="organisation" element={<SponsorOrganisationPage />} />
              </Route>
              <Route
                path="/app"
                element={
                  <WhatsAppProvider>
                    <AppShell />
                  </WhatsAppProvider>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="radar" element={<RiskRadarPage />} />
                <Route path="funding" element={<FundingPage />} />
                <Route path="explore" element={<ExplorePage />} />
                <Route path="journey" element={<JourneyPage />} />
                <Route path="navigator" element={<NavigatorPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="sponsors" element={<SponsorsPage />} />
                <Route path="verify" element={<VerifyPage />} />
                <Route path="forecast" element={<ForecastPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="institutions" element={<InstitutionsPage />} />
                <Route path="residences" element={<ResidencesPage />} />
                <Route path="whatsapp" element={<WhatsAppPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </HashRouter>
        </ToastProvider>
      </StudentProvider>
    </PlatformProvider>
  );
}
