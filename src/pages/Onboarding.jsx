import { useState, useEffect } from 'preact/hooks'
import { useLocation } from 'wouter-preact'
import { Egg, Store, ShoppingBag, Truck, Check, ArrowRight, Loader2, AlertCircle } from 'lucide-preact'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'

export function Onboarding() {
  const [, setLocation] = useLocation()
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()

  const [step, setStep] = useState(1) // 1: role selection, 2: role details form
  const [role, setRole] = useState('buyer') // 'farm' | 'supplier' | 'buyer' | 'logistics'
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Form states
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('Enugu')
  const [state, setState] = useState('Enugu')
  const [sellsToBulk, setSellsToBulk] = useState(true)
  const [sellsToSmall, setSellsToSmall] = useState(true)
  const [availablePeriods, setAvailablePeriods] = useState('All year round')
  const [delivers, setDelivers] = useState(true)
  const [setsUpLogistics, setSetsUpLogistics] = useState(true)
  const [leadTimeDays, setLeadTimeDays] = useState(1)
  const [deliveryFeeNaira, setDeliveryFeeNaira] = useState(1000)
  const [logisticsTypes, setLogisticsTypes] = useState(['crates', 'trays', 'intrastate'])

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        setLocation('/#auth')
      } else if (profile) {
        setLocation('/dashboard')
      }
    }
  }, [user, profile, authLoading, setLocation])

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole)
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSubmitting(true)

    try {
      if (!user) throw new Error('Not authenticated')

      // 1. Create Profile
      const profileData = {
        id: user.id,
        role,
        full_name: fullName.trim() || businessName.trim() || 'Flezible Member',
        phone: phone.trim(),
        city: city.trim(),
        state: state.trim(),
        notify: { whatsapp: true, email: true, push: false },
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)

      if (profileError) throw profileError

      // 2. Role-specific records
      if (role === 'farm' || role === 'supplier') {
        const sellsTo = []
        if (sellsToBulk) sellsTo.push('bulk')
        if (sellsToSmall) sellsTo.push('small_quantities')

        // Insert seller
        const { data: sellerData, error: sellerError } = await supabase
          .from('sellers')
          .insert({
            owner_id: user.id,
            kind: role,
            name: (businessName.trim() || fullName.trim()).slice(0, 80),
            city: city.trim(),
            state: state.trim(),
            sells_to: sellsTo,
            delivers,
            sets_up_logistics: setsUpLogistics,
            active: true,
          })
          .select('id')
          .single()

        if (sellerError) throw sellerError

        // Insert initial seller area
        if (sellerData?.id) {
          const feeKobo = Math.max(0, Math.round(Number(deliveryFeeNaira || 0) * 100))
          const { error: areaError } = await supabase
            .from('seller_areas')
            .insert({
              seller_id: sellerData.id,
              state: state.trim(),
              city: city.trim() || null,
              lead_time_days: Math.max(0, Number(leadTimeDays || 1)),
              delivery_fee_kobo: feeKobo,
            })

          if (areaError) console.warn('Could not insert seller area:', areaError.message)
        }
      } else if (role === 'logistics') {
        const { error: logisticsError } = await supabase
          .from('logistics_partners')
          .insert({
            owner_id: user.id,
            brand_name: (businessName.trim() || fullName.trim()).slice(0, 80),
            types: logisticsTypes,
          })

        if (logisticsError) throw logisticsError
      }

      // 3. Refresh and navigate to Dashboard
      await refreshProfile()
      setLocation('/dashboard')
    } catch (err) {
      console.error('Onboarding error:', err)
      setErrorMessage(err.message || 'Failed to complete profile. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8 text-xs font-semibold uppercase tracking-wider text-muted">
          <span className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-brand text-white' : 'bg-tonal text-brand-deep'}`}>
            1. Select Role
          </span>
          <ArrowRight className="w-4 h-4 text-outline" />
          <span className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-brand text-white' : 'bg-tonal text-brand-deep'}`}>
            2. Details
          </span>
        </div>

        {/* Step 1: Role Picker */}
        {step === 1 && (
          <div className="bg-card border border-outline rounded-3xl p-6 sm:p-10 shadow-sm">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-ink">
                How will you use Flezible?
              </h1>
              <p className="text-sm text-muted mt-2">
                Select your primary account type. You can trade or list immediately.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Farm */}
              <button
                type="button"
                onClick={() => handleRoleSelect('farm')}
                className="group p-5 rounded-2xl border-2 border-outline hover:border-brand hover:bg-tonal/40 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand min-h-[44px]"
              >
                <div className="w-10 h-10 rounded-xl bg-tonal text-brand flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Egg className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold font-heading text-ink">Poultry Farm</h2>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Sell crates &amp; trays directly from your farm to verified buyers.
                </p>
              </button>

              {/* Supplier */}
              <button
                type="button"
                onClick={() => handleRoleSelect('supplier')}
                className="group p-5 rounded-2xl border-2 border-outline hover:border-brand hover:bg-tonal/40 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand min-h-[44px]"
              >
                <div className="w-10 h-10 rounded-xl bg-tonal text-brand flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Store className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold font-heading text-ink">Egg Supplier / Wholesaler</h2>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Distribute bulk eggs to restaurants, bakeries, and retail stores.
                </p>
              </button>

              {/* Buyer */}
              <button
                type="button"
                onClick={() => handleRoleSelect('buyer')}
                className="group p-5 rounded-2xl border-2 border-outline hover:border-brand hover:bg-tonal/40 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand min-h-[44px]"
              >
                <div className="w-10 h-10 rounded-xl bg-tonal text-brand flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold font-heading text-ink">Commercial Buyer</h2>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Bakeries, restaurants, marts, caterers &amp; individuals buying eggs.
                </p>
              </button>

              {/* Logistics Partner */}
              <button
                type="button"
                onClick={() => handleRoleSelect('logistics')}
                className="group p-5 rounded-2xl border-2 border-outline hover:border-brand hover:bg-tonal/40 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand min-h-[44px]"
              >
                <div className="w-10 h-10 rounded-xl bg-tonal text-brand flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Truck className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold font-heading text-ink">Logistics Partner</h2>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Egg dispatch riders and transport fleets delivering safely.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Role Form */}
        {step === 2 && (
          <div className="bg-card border border-outline rounded-3xl p-6 sm:p-10 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold text-brand uppercase tracking-wider">
                  {role === 'farm' ? 'Farm Profile' : role === 'supplier' ? 'Supplier Profile' : role === 'buyer' ? 'Buyer Profile' : 'Logistics Profile'}
                </span>
                <h1 className="text-2xl font-extrabold font-heading text-ink mt-1">
                  Complete your details
                </h1>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-muted hover:text-brand px-3 py-1.5 rounded-lg border border-outline min-h-[44px]"
              >
                Change Role
              </button>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-3 text-danger text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Common Name Field */}
              {(role === 'farm' || role === 'supplier') ? (
                <div>
                  <label htmlFor="busName" className="block text-xs font-semibold text-ink mb-1.5">
                    {role === 'farm' ? 'Farm Name *' : 'Brand / Trading Name *'}
                  </label>
                  <input
                    id="busName"
                    type="text"
                    required
                    value={businessName}
                    onInput={(e) => setBusinessName(e.currentTarget.value)}
                    placeholder={role === 'farm' ? 'e.g. Sunrise Farms Enugu' : 'e.g. Premier Egg Distributors'}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-surface border border-outline text-ink text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  />
                </div>
              ) : role === 'logistics' ? (
                <div>
                  <label htmlFor="logName" className="block text-xs font-semibold text-ink mb-1.5">
                    Logistics Brand / Driver Name *
                  </label>
                  <input
                    id="logName"
                    type="text"
                    required
                    value={businessName}
                    onInput={(e) => setBusinessName(e.currentTarget.value)}
                    placeholder="e.g. Swift Egg Logistics"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-surface border border-outline text-ink text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  />
                </div>
              ) : null}

              <div>
                <label htmlFor="contactName" className="block text-xs font-semibold text-ink mb-1.5">
                  {role === 'buyer' ? 'Full Name *' : 'Contact Person Full Name *'}
                </label>
                <input
                  id="contactName"
                  type="text"
                  required
                  value={fullName}
                  onInput={(e) => setFullName(e.currentTarget.value)}
                  placeholder="e.g. Chukwuemeka Obi"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-surface border border-outline text-ink text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                />
              </div>

              <div>
                <label htmlFor="contactPhone" className="block text-xs font-semibold text-ink mb-1.5">
                  Contact Phone (WhatsApp enabled) *
                </label>
                <input
                  id="contactPhone"
                  type="tel"
                  required
                  value={phone}
                  onInput={(e) => setPhone(e.currentTarget.value)}
                  placeholder="e.g. 08012345678"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-surface border border-outline text-ink text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                />
              </div>

              {/* Location Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-xs font-semibold text-ink mb-1.5">
                    City / Town *
                  </label>
                  <input
                    id="city"
                    type="text"
                    required
                    value={city}
                    onInput={(e) => setCity(e.currentTarget.value)}
                    placeholder="e.g. Enugu"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-surface border border-outline text-ink text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-xs font-semibold text-ink mb-1.5">
                    State *
                  </label>
                  <input
                    id="state"
                    type="text"
                    required
                    value={state}
                    onInput={(e) => setState(e.currentTarget.value)}
                    placeholder="e.g. Enugu"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-surface border border-outline text-ink text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  />
                </div>
              </div>

              {/* Farm / Supplier specific fields */}
              {(role === 'farm' || role === 'supplier') && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-2">
                      Sells To (Check all that apply)
                    </label>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer min-h-[44px] px-3 rounded-xl border border-outline bg-surface">
                        <input
                          type="checkbox"
                          checked={sellsToBulk}
                          onChange={(e) => setSellsToBulk(e.currentTarget.checked)}
                          className="w-4 h-4 text-brand rounded border-outline focus:ring-brand"
                        />
                        <span>Bulk buyers (Caterers, Bakeries)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer min-h-[44px] px-3 rounded-xl border border-outline bg-surface">
                        <input
                          type="checkbox"
                          checked={sellsToSmall}
                          onChange={(e) => setSellsToSmall(e.currentTarget.checked)}
                          className="w-4 h-4 text-brand rounded border-outline focus:ring-brand"
                        />
                        <span>Small quantities (Shops, Homes)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="availPeriods" className="block text-xs font-semibold text-ink mb-1.5">
                      Available Periods
                    </label>
                    <input
                      id="availPeriods"
                      type="text"
                      value={availablePeriods}
                      onInput={(e) => setAvailablePeriods(e.currentTarget.value)}
                      placeholder="e.g. All year, Weekdays, Weekly"
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-surface border border-outline text-ink text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <label className="flex items-center justify-between p-3.5 rounded-2xl border border-outline bg-surface cursor-pointer min-h-[44px]">
                      <div>
                        <span className="text-xs font-bold text-ink block">Direct Delivery</span>
                        <span className="text-xs text-muted">Can deliver to buyer locations</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={delivers}
                        onChange={(e) => setDelivers(e.currentTarget.checked)}
                        className="w-5 h-5 text-brand rounded border-outline focus:ring-brand"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 rounded-2xl border border-outline bg-surface cursor-pointer min-h-[44px]">
                      <div>
                        <span className="text-xs font-bold text-ink block">Logistics Setup</span>
                        <span className="text-xs text-muted">Can arrange third-party dispatch</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={setsUpLogistics}
                        onChange={(e) => setSetsUpLogistics(e.currentTarget.checked)}
                        className="w-5 h-5 text-brand rounded border-outline focus:ring-brand"
                      />
                    </label>
                  </div>

                  {/* Initial Delivery Area Coverage */}
                  <div className="p-4 rounded-2xl bg-tonal/50 border border-brand/20 space-y-3">
                    <span className="block text-xs font-bold uppercase tracking-wider text-brand-deep">
                      Primary Delivery Coverage
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label htmlFor="leadTime" className="block font-semibold text-ink mb-1">
                          Lead Time (Days)
                        </label>
                        <input
                          id="leadTime"
                          type="number"
                          min="0"
                          value={leadTimeDays}
                          onInput={(e) => setLeadTimeDays(Number(e.currentTarget.value))}
                          className="w-full min-h-[44px] px-3 py-1.5 rounded-xl bg-card border border-outline text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        />
                      </div>
                      <div>
                        <label htmlFor="delFee" className="block font-semibold text-ink mb-1">
                          Standard Delivery Fee (₦)
                        </label>
                        <input
                          id="delFee"
                          type="number"
                          min="0"
                          value={deliveryFeeNaira}
                          onInput={(e) => setDeliveryFeeNaira(Number(e.currentTarget.value))}
                          className="w-full min-h-[44px] px-3 py-1.5 rounded-xl bg-card border border-outline text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Logistics specific fields */}
              {role === 'logistics' && (
                <div>
                  <label className="block text-xs font-semibold text-ink mb-2">
                    Delivery Capabilities
                  </label>
                  <div className="space-y-2">
                    {['crates', 'trays', 'intrastate', 'interstate'].map((t) => (
                      <label key={t} className="flex items-center gap-2 cursor-pointer min-h-[44px] px-3 rounded-xl border border-outline bg-surface">
                        <input
                          type="checkbox"
                          checked={logisticsTypes.includes(t)}
                          onChange={(e) => {
                            if (e.currentTarget.checked) {
                              setLogisticsTypes([...logisticsTypes, t])
                            } else {
                              setLogisticsTypes(logisticsTypes.filter((x) => x !== t))
                            }
                          }}
                          className="w-4 h-4 text-brand rounded border-outline focus:ring-brand"
                        />
                        <span className="text-xs font-medium capitalize">{t} transport</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[44px] mt-6 px-5 py-3 rounded-full bg-brand hover:bg-brand-deep text-white font-semibold text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 shadow-xs flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                <span>Complete Profile &amp; Go to Dashboard</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
