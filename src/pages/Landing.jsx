import { useState, useEffect } from 'preact/hooks'
import { useLocation } from 'wouter-preact'
import { MessageSquare, MapPin, Truck, CheckCircle2, Loader2, AlertCircle } from 'lucide-preact'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'

export function Landing() {
  const [, setLocation] = useLocation()
  const { user, profile, loading: authLoading } = useAuth()

  const [authMode, setAuthMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // If already authenticated and profile exists, redirect to dashboard or onboarding
  useEffect(() => {
    if (!authLoading && user) {
      if (profile) {
        setLocation('/dashboard')
      } else {
        setLocation('/onboarding')
      }
    }
  }, [user, profile, authLoading, setLocation])

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)

    try {
      if (authMode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) {
          setErrorMessage(error.message)
          setSubmitting(false)
          return
        }

        if (data?.user) {
          // Check profile
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle()

          if (prof) {
            setLocation('/dashboard')
          } else {
            setLocation('/onboarding')
          }
        }
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })

        if (error) {
          setErrorMessage(error.message)
          setSubmitting(false)
          return
        }

        if (data?.session) {
          // Direct login without email confirm
          setLocation('/onboarding')
        } else if (data?.user) {
          setSuccessMessage(
            'Account created! If email confirmation is enabled, please check your inbox.'
          )
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setErrorMessage('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
        },
      })
      if (error) {
        setErrorMessage(error.message)
      }
    } catch (err) {
      setErrorMessage(err.message || 'Google sign in failed.')
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-surface py-6 sm:py-10 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Tagline Box (Top for mobile) */}
          <div className="lg:hidden mb-6 bg-night text-white p-6 rounded-2xl shadow-sm">
            <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-brand text-white rounded-full mb-3">
              Egg Distribution Marketplace
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight mb-2">
              From the farm to your store.
            </h1>
            <p className="text-sm text-tonal mb-4">
              Direct egg supply connecting Nigerian farms, suppliers, and buyers.
            </p>
            <div className="space-y-2.5 pt-2 border-t border-white/10 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                <span>Order by chatting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                <span>Matched with farms near you</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                <span>Track every order</span>
              </div>
            </div>
          </div>

          {/* Desktop Split Layout & Mobile Auth Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Desktop Left: Night-Green Brand Panel */}
            <div className="hidden lg:flex lg:col-span-7 bg-night text-white rounded-3xl p-10 xl:p-14 flex-col justify-between shadow-md relative overflow-hidden">
              <div className="relative z-10">
                <span className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider bg-brand text-white rounded-full mb-6">
                  Nigeria Egg Marketplace
                </span>
                <h1 className="text-4xl xl:text-5xl font-extrabold font-heading tracking-tight leading-tight mb-6">
                  From the farm to your store.
                </h1>
                <p className="text-lg text-tonal max-w-lg mb-10 leading-relaxed">
                  Connecting poultry farms, suppliers, and commercial buyers across Nigeria. Fresh stock, transparent pricing, and fast local delivery.
                </p>

                {/* Exactly 3 Value Points */}
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Order by chatting</h2>
                      <p className="text-sm text-tonal">
                        Type what you need in plain English or Pidgin. Assistant prepares your draft order in seconds.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Matched with farms near you</h2>
                      <p className="text-sm text-tonal">
                        Direct connection to vetted local farms with verified inventory and clear lead times.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Track every order</h2>
                      <p className="text-sm text-tonal">
                        Transparent milestone updates from confirmation to dispatch and final delivery.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-8 mt-8 border-t border-white/10 text-xs text-tonal flex items-center justify-between">
                <span>Direct egg trade for farms &amp; stores</span>
                <span>Enugu &bull; South-East Nigeria</span>
              </div>
            </div>

            {/* Right: Auth Panel */}
            <div id="auth" className="lg:col-span-5 flex flex-col justify-center">
              <div className="bg-card border border-outline rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold font-heading text-ink">
                    {authMode === 'signin' ? 'Welcome back' : 'Create an account'}
                  </h2>
                  <p className="text-sm text-muted mt-1">
                    {authMode === 'signin'
                      ? 'Sign in to access your orders and listings'
                      : 'Join Flezible to start buying or selling eggs'}
                  </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="mb-5 p-3.5 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-2.5 text-danger text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="leading-snug">{errorMessage}</span>
                  </div>
                )}

                {/* Success Banner */}
                {successMessage && (
                  <div className="mb-5 p-3.5 rounded-xl bg-tonal border border-brand/30 flex items-start gap-2.5 text-brand-deep text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-brand" />
                    <span className="leading-snug">{successMessage}</span>
                  </div>
                )}

                {/* Continue with Google button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-full border border-outline bg-card hover:bg-tonal text-ink font-medium text-sm flex items-center justify-center gap-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative my-6 text-center">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-outline" />
                  </div>
                  <span className="relative bg-card px-3 text-xs text-muted uppercase tracking-wider">
                    Or continue with email
                  </span>
                </div>

                {/* Form */}
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="auth-email" className="block text-xs font-semibold text-ink mb-1.5">
                      Email address
                    </label>
                    <input
                      id="auth-email"
                      type="email"
                      required
                      value={email}
                      onInput={(e) => setEmail(e.currentTarget.value)}
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-surface border border-outline text-ink placeholder:text-muted/60 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-brand transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="auth-password" className="block text-xs font-semibold text-ink mb-1.5">
                      Password
                    </label>
                    <input
                      id="auth-password"
                      type="password"
                      required
                      value={password}
                      onInput={(e) => setPassword(e.currentTarget.value)}
                      autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                      placeholder="••••••••"
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-surface border border-outline text-ink placeholder:text-muted/60 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-brand transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full min-h-[44px] mt-2 px-4 py-2.5 rounded-full bg-brand hover:bg-brand-deep text-white font-semibold text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 shadow-xs flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                    <span>{authMode === 'signin' ? 'Sign in' : 'Create account'}</span>
                  </button>
                </form>

                {/* Mode toggle */}
                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('')
                      setSuccessMessage('')
                      setAuthMode((prev) => (prev === 'signin' ? 'signup' : 'signin'))
                    }}
                    className="min-h-[44px] text-xs text-muted hover:text-brand font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg px-2"
                  >
                    {authMode === 'signin' ? (
                      <>
                        Don&apos;t have an account?{' '}
                        <span className="font-semibold text-brand">Create account</span>
                      </>
                    ) : (
                      <>
                        Already have an account?{' '}
                        <span className="font-semibold text-brand">Sign in</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step "How it works" section under hero */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-card border-t border-outline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-brand uppercase tracking-wider">
              Simple 3-Step Flow
            </span>
            <h2 className="text-3xl font-extrabold font-heading text-ink mt-2">
              How Flezible Works
            </h2>
            <p className="text-sm text-muted mt-2">
              Whether you are buying crates for your restaurant or listing stock from your farm.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative bg-surface border border-outline rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-full bg-tonal text-brand-deep font-heading font-extrabold flex items-center justify-center text-base mb-5">
                  1
                </div>
                <h3 className="text-lg font-bold font-heading text-ink mb-2">
                  Tell us what you need
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  Type what you want in plain words (e.g. &ldquo;30 crates to Enugu on Friday&rdquo;) or pick from available listings.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-outline/60 text-xs font-medium text-brand">
                Order by chatting or simple form
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative bg-surface border border-outline rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-full bg-tonal text-brand-deep font-heading font-extrabold flex items-center justify-center text-base mb-5">
                  2
                </div>
                <h3 className="text-lg font-bold font-heading text-ink mb-2">
                  Matched with nearby farms
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  We match you with active farms in your area with verified stock, transparent delivery fees, and clear lead times.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-outline/60 text-xs font-medium text-brand">
                Direct farm pricing, no hidden markups
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative bg-surface border border-outline rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-full bg-tonal text-brand-deep font-heading font-extrabold flex items-center justify-center text-base mb-5">
                  3
                </div>
                <h3 className="text-lg font-bold font-heading text-ink mb-2">
                  Track every order
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  Review your editable order card, tap confirm, and follow real-time progress from farm dispatch to your store.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-outline/60 text-xs font-medium text-brand">
                Clear status updates at each step
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
