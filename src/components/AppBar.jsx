import { useState } from 'preact/hooks'
import { Link, useLocation } from 'wouter-preact'
import { Menu, X, Egg, LogOut, LayoutDashboard } from 'lucide-preact'
import { useAuth } from '../lib/auth.jsx'

export function AppBar() {
  const [isOpen, setIsOpen] = useState(false)
  const [location, setLocation] = useLocation()
  const { user, profile, signOut } = useAuth()

  const toggleMenu = () => setIsOpen((prev) => !prev)
  const closeMenu = () => setIsOpen(false)

  const handleSignOut = async () => {
    closeMenu()
    await signOut()
    setLocation('/')
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-card/95 backdrop-blur-sm border-b border-outline">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Wordmark */}
          <Link
            href="/"
            onClick={closeMenu}
            className="flex items-center gap-2.5 rounded-lg py-1 px-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-card shadow-xs">
              <Egg className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-extrabold text-2xl tracking-tight text-ink">
              Flezible<span className="text-brand">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2" aria-label="Main Navigation">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 min-h-[44px] flex items-center gap-1.5 ${
                    location === '/dashboard'
                      ? 'bg-tonal text-brand-deep font-semibold'
                      : 'text-ink hover:text-brand'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/pricing"
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 min-h-[44px] flex items-center ${
                    location === '/pricing'
                      ? 'bg-tonal text-brand-deep font-semibold'
                      : 'text-ink hover:text-brand'
                  }`}
                >
                  Pricing
                </Link>

                {profile?.role && (
                  <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-tonal text-brand-deep">
                    {profile.role}
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="ml-2 px-4 py-2 text-sm font-medium text-muted hover:text-danger rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-danger min-h-[44px] flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <>
                <a
                  href="/#how-it-works"
                  className="px-4 py-2 text-sm font-medium text-ink hover:text-brand rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 min-h-[44px] flex items-center"
                >
                  How it works
                </a>
                <Link
                  href="/pricing"
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 min-h-[44px] flex items-center ${
                    location === '/pricing'
                      ? 'bg-tonal text-brand-deep font-semibold'
                      : 'text-ink hover:text-brand'
                  }`}
                >
                  Pricing
                </Link>
                <a
                  href="/#auth"
                  className="ml-2 px-5 py-2 text-sm font-semibold text-white bg-brand hover:bg-brand-deep rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 min-h-[44px] flex items-center shadow-xs"
                >
                  Sign in
                </a>
              </>
            )}
          </nav>

          {/* Mobile Menu Button (min 44x44 touch target) */}
          <button
            type="button"
            onClick={toggleMenu}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl text-ink hover:bg-tonal transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div id="mobile-menu" className="md:hidden border-b border-outline bg-card px-4 pt-2 pb-6 space-y-2 shadow-lg">
          {user ? (
            <>
              <Link
                href="/dashboard"
                onClick={closeMenu}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-base font-medium text-ink hover:bg-tonal transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <LayoutDashboard className="w-5 h-5 text-brand" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/pricing"
                onClick={closeMenu}
                className="flex items-center px-4 py-3 rounded-xl text-base font-medium text-ink hover:bg-tonal transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                Pricing
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-base font-medium text-danger hover:bg-danger/10 transition-colors min-h-[44px] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign out</span>
              </button>
            </>
          ) : (
            <>
              <a
                href="/#how-it-works"
                onClick={closeMenu}
                className="flex items-center px-4 py-3 rounded-xl text-base font-medium text-ink hover:bg-tonal transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                How it works
              </a>
              <Link
                href="/pricing"
                onClick={closeMenu}
                className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  location === '/pricing'
                    ? 'bg-tonal text-brand-deep font-semibold'
                    : 'text-ink hover:bg-tonal'
                }`}
              >
                Pricing
              </Link>
              <a
                href="/#auth"
                onClick={closeMenu}
                className="flex items-center justify-center px-4 py-3 rounded-full text-base font-semibold text-white bg-brand hover:bg-brand-deep transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand shadow-xs"
              >
                Sign in
              </a>
            </>
          )}
        </div>
      )}
    </header>
  )
}
