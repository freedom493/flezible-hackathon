import { useState, useEffect } from 'preact/hooks'
import { Link } from 'wouter-preact'
import { Check, ShieldCheck, Sparkles, Loader2 } from 'lucide-preact'
import { PLANS as FALLBACK_PLANS } from '../lib/plans.js'
import { formatNaira } from '../lib/format.js'
import { supabase } from '../lib/supabase.js'

export function Pricing() {
  const [plans, setPlans] = useState(FALLBACK_PLANS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPlans() {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*, plan_prices(*)')
          .order('sort')

        if (error) {
          console.warn('Could not load plans from DB, using local constant:', error.message)
          setPlans(FALLBACK_PLANS)
        } else if (data && data.length > 0) {
          const formatted = data.map((p) => {
            const bps = p.commission_bps || 0
            const commissionPercent =
              bps % 100 === 0 ? `${bps / 100}%` : `${(bps / 100).toFixed(1)}%`

            // Normalize prices
            const prices = (p.plan_prices || []).map((pp) => ({
              period: pp.period,
              periodLabel: pp.period === 'daily' ? 'day' : pp.period === 'weekly' ? 'week' : 'month',
              amount_kobo: pp.amount_kobo,
            }))

            // Sort prices: daily, weekly, monthly
            const periodOrder = { daily: 1, weekly: 2, monthly: 3 }
            prices.sort((a, b) => (periodOrder[a.period] || 9) - (periodOrder[b.period] || 9))

            return {
              id: p.id,
              name: p.name,
              commission_bps: p.commission_bps,
              commissionPercent,
              trial_days: p.trial_days || 14,
              features: Array.isArray(p.features) ? p.features : JSON.parse(p.features || '[]'),
              prices: prices.length > 0 ? prices : (FALLBACK_PLANS.find((fb) => fb.id === p.id)?.prices || []),
            }
          })
          setPlans(formatted)
        }
      } catch (err) {
        console.warn('Error reading plans:', err)
        setPlans(FALLBACK_PLANS)
      } finally {
        setLoading(false)
      }
    }

    loadPlans()
  }, [])

  return (
    <div className="min-h-screen bg-surface py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-tonal text-brand-deep mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Transparent Seller Plans
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-ink tracking-tight">
            Predictable plans for farms and suppliers
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted max-w-2xl mx-auto">
            Choose the plan that fits your farm or supply business. All plans include a 14-day free trial and a verified seller badge upon approval.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-8 text-muted text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-brand" />
            <span>Loading latest plans...</span>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const isFeatured = plan.id === 'B'
            const monthlyPrice = plan.prices?.find((p) => p.period === 'monthly')

            return (
              <div
                key={plan.id}
                className={`flex flex-col justify-between bg-card rounded-3xl p-6 sm:p-8 transition-all border ${
                  isFeatured
                    ? 'border-brand ring-2 ring-brand/20 shadow-md relative'
                    : 'border-outline shadow-xs'
                }`}
              >
                <div>
                  {/* Badge Row */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">
                      {plan.name}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-tonal text-brand-deep">
                      {plan.trial_days}-day free trial
                    </span>
                  </div>

                  {/* Commission */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold font-heading text-ink">
                        {plan.commissionPercent}
                      </span>
                      <span className="text-sm font-medium text-muted">commission</span>
                    </div>
                    <p className="text-xs text-muted mt-1">
                      Platform fee applied per matched order
                    </p>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="bg-surface rounded-2xl p-4 border border-outline mb-6">
                    <span className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                      Subscription Fee
                    </span>
                    {plan.id === 'A' ? (
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted">Daily:</span>
                          <span className="font-bold text-ink">{formatNaira(25000)} / day</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted">Weekly:</span>
                          <span className="font-bold text-ink">{formatNaira(150000)} / week</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-outline/70">
                          <span className="text-muted">Monthly:</span>
                          <span className="font-bold text-brand">{formatNaira(500000)} / month</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm text-muted">Monthly billing</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold font-heading text-ink">
                            {formatNaira(monthlyPrice?.amount_kobo || 0)}
                          </span>
                          <span className="text-xs text-muted"> / month</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Verified Badge Highlight */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-tonal/60 border border-brand/20 text-brand-deep text-xs font-semibold mb-6">
                    <ShieldCheck className="w-4 h-4 text-brand shrink-0" />
                    <span>Includes Verified Seller Badge</span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted">
                      What&apos;s Included
                    </span>
                    <ul className="space-y-2.5 text-sm">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-ink">
                          <div className="w-4 h-4 rounded-full bg-tonal text-brand flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-brand" />
                          </div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action CTA */}
                <div>
                  <Link
                    href="/#auth"
                    className={`w-full min-h-[44px] px-5 py-3 rounded-full text-center text-sm font-semibold flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 shadow-xs ${
                      isFeatured
                        ? 'bg-brand hover:bg-brand-deep text-white'
                        : 'bg-tonal hover:bg-brand hover:text-white text-brand-deep'
                    }`}
                  >
                    Start 14-day free trial
                  </Link>
                  <p className="text-center text-xs text-muted mt-2">
                    No payment required during trial
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-16 text-center text-xs text-muted max-w-xl mx-auto">
          Need custom volume or multi-farm logistics partnership?{' '}
          <a href="/#auth" className="text-brand font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded">
            Create an account
          </a>{' '}
          to talk with our team in Enugu.
        </div>
      </div>
    </div>
  )
}
