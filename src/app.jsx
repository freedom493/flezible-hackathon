import { Route, Switch, useLocation } from 'wouter-preact'
import { AuthProvider, useAuth } from './lib/auth.jsx'
import { AppBar } from './components/AppBar.jsx'
import { BottomNav } from './components/BottomNav.jsx'
import { Landing } from './pages/Landing.jsx'
import { Pricing } from './pages/Pricing.jsx'
import { Onboarding } from './pages/Onboarding.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { RlsTest } from './pages/RlsTest.jsx'

function AppContent() {
  const [location] = useLocation()
  const { user } = useAuth()

  // BottomNav shown when user is authenticated on app pages, but hidden on marketing/onboarding
  const isPublicOrAuthPage = location === '/' || location === '' || location === '/pricing' || location === '/onboarding'
  const showBottomNav = user && !isPublicOrAuthPage

  return (
    <div className="min-h-screen flex flex-col bg-surface text-ink font-sans antialiased">
      <AppBar />
      <main className="flex-1 pb-16 md:pb-0">
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/rls-test" component={RlsTest} />
          <Route>
            <div className="py-24 text-center px-4">
              <h1 className="text-3xl font-extrabold font-heading text-ink mb-2">Page Not Found</h1>
              <p className="text-muted text-sm mb-6">The page you are looking for does not exist.</p>
              <a
                href="/"
                className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-full bg-brand hover:bg-brand-deep text-white text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                Back to Home
              </a>
            </div>
          </Route>
        </Switch>
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
