import { useEffect, useState } from 'preact/hooks'
import { useLocation, Link } from 'wouter-preact'
import {
  Wallet,
  Egg,
  Store,
  ShoppingBag,
  Truck,
  PlusCircle,
  Clock,
  ArrowUpRight,
  ClipboardList,
  Sparkles,
  MapPin,
  Loader2,
} from 'lucide-preact'
import { useAuth } from '../lib/auth.jsx'
import { supabase } from '../lib/supabase.js'

export function Dashboard() {
  const [, setLocation] = useLocation()
  const { user, profile, loading: authLoading } = useAuth()
  const [sellerInfo, setSellerInfo] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        setLocation('/#auth')
      } else if (!profile) {
        setLocation('/onboarding')
      }
    }
  }, [user, profile, authLoading, setLocation])

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return

      try {
        // If farm or supplier, fetch seller record
        if (profile?.role === 'farm' || profile?.role === 'supplier') {
          const { data: seller } = await supabase
            .from('sellers')
            .select('*')
            .eq('owner_id', user.id)
            .maybeSingle()
          setSellerInfo(seller)
        }

        // Fetch recent orders if any
        const { data: orders } = await supabase
          .from('orders')
          .select('id, status, needed_by, total_kobo, delivery_city, created_at')
          .order('created_at', { ascending: false })
          .limit(5)

        setRecentOrders(orders || [])
      } catch (err) {
        console.warn('Dashboard fetch notice:', err.message)
      } finally {
        setLoadingOrders(false)
      }
    }

    if (profile) {
      loadDashboardData()
    }
  }, [user, profile])

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    )
  }

  const roleLabels = {
    farm: 'Poultry Farm',
    supplier: 'Egg Supplier',
    buyer: 'Egg Buyer',
    logistics: 'Logistics Partner',
  }

  const isSeller = profile.role === 'farm' || profile.role === 'supplier'

  return (
    <div className="min-h-screen bg-surface py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-card border border-outline rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-tonal text-brand-deep">
                {roleLabels[profile.role] || 'Member'}
              </span>
              {profile.city && (
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  <MapPin className="w-3.5 h-3.5" />
                  {profile.city}, {profile.state}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-ink">
              Welcome back, {profile.full_name || 'Partner'}!
            </h1>
            <p className="text-sm text-muted mt-1">
              {isSeller
                ? 'Manage your egg inventory, lead times and order dispatches.'
                : 'Find nearby crates and trays or order directly via assistant.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isSeller ? (
              <Link
                href="/store/upload"
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-brand hover:bg-brand-deep text-white font-semibold text-sm transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Upload Stock</span>
              </Link>
            ) : (
              <Link
                href="/marketplace"
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-brand hover:bg-brand-deep text-white font-semibold text-sm transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand shadow-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Find Eggs</span>
              </Link>
            )}
          </div>
        </div>

        {/* Dashboard Grid: Wallet Card + Shortcuts */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Wallet Card (Section 5.4: shows ₦0.00 with "Wallet coming soon") */}
          <div className="md:col-span-5 bg-night text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-md relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-brand" />
                  </div>
                  <span className="text-sm font-semibold tracking-wide text-tonal">
                    Flezible Wallet
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber/20 text-amber border border-amber/30">
                  Wallet coming soon
                </span>
              </div>

              <div className="my-4">
                <span className="block text-xs uppercase tracking-wider text-tonal mb-1">
                  Available Balance
                </span>
                <span className="text-4xl sm:text-5xl font-extrabold font-heading text-white tracking-tight">
                  ₦0.00
                </span>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10 text-xs text-tonal flex items-center justify-between">
              <span>Display only &bull; Secured accounts</span>
              <span>Enugu Gateway</span>
            </div>
          </div>

          {/* Role-Specific Quick Shortcuts */}
          <div className="md:col-span-7 bg-card border border-outline rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-bold font-heading text-ink mb-4">
              Quick Shortcuts
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {isSeller ? (
                <>
                  <Link
                    href="/store/upload"
                    className="p-4 rounded-2xl border border-outline hover:border-brand hover:bg-tonal/30 transition-all flex items-center justify-between min-h-[44px] group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-tonal text-brand flex items-center justify-center">
                        <PlusCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-ink block">List Stock</span>
                        <span className="text-xs text-muted">Upload crates or trays</span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-brand transition-colors" />
                  </Link>

                  <Link
                    href="/orders"
                    className="p-4 rounded-2xl border border-outline hover:border-brand hover:bg-tonal/30 transition-all flex items-center justify-between min-h-[44px] group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-tonal text-brand flex items-center justify-center">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-ink block">Incoming Orders</span>
                        <span className="text-xs text-muted">Accept &amp; dispatch</span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-brand transition-colors" />
                  </Link>

                  <Link
                    href="/settings"
                    className="p-4 rounded-2xl border border-outline hover:border-brand hover:bg-tonal/30 transition-all flex items-center justify-between min-h-[44px] group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-tonal text-brand flex items-center justify-center">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-ink block">Delivery Areas</span>
                        <span className="text-xs text-muted">Lead time &amp; coverage</span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-brand transition-colors" />
                  </Link>

                  <Link
                    href="/pricing"
                    className="p-4 rounded-2xl border border-outline hover:border-brand hover:bg-tonal/30 transition-all flex items-center justify-between min-h-[44px] group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-tonal text-brand flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-ink block">Seller Plan</span>
                        <span className="text-xs text-muted">14-day trial &amp; badge</span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-brand transition-colors" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/marketplace"
                    className="p-4 rounded-2xl border border-outline hover:border-brand hover:bg-tonal/30 transition-all flex items-center justify-between min-h-[44px] group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-tonal text-brand flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-ink block">Egg Marketplace</span>
                        <span className="text-xs text-muted">Browse local farm stock</span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-brand transition-colors" />
                  </Link>

                  <Link
                    href="/orders"
                    className="p-4 rounded-2xl border border-outline hover:border-brand hover:bg-tonal/30 transition-all flex items-center justify-between min-h-[44px] group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-tonal text-brand flex items-center justify-center">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-ink block">Order History</span>
                        <span className="text-xs text-muted">Track order status</span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-brand transition-colors" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-card border border-outline rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold font-heading text-ink">
              Recent Activity
            </h2>
            <Link
              href="/orders"
              className="text-xs font-semibold text-brand hover:underline min-h-[44px] flex items-center"
            >
              View all orders
            </Link>
          </div>

          {loadingOrders ? (
            <div className="py-8 flex justify-center text-muted text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand" />
              <span>Loading recent activity...</span>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-2xl bg-surface border border-outline/60">
              <Clock className="w-8 h-8 text-muted/60 mx-auto mb-3" />
              <p className="text-sm font-semibold text-ink">No recent activity yet</p>
              <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                {isSeller
                  ? 'Your incoming buyer orders and listing updates will appear here.'
                  : 'Start by browsing the marketplace or ordering via our AI assistant.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline">
              {recentOrders.map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold text-ink block">Order #{ord.id.slice(0, 8)}</span>
                    <span className="text-xs text-muted">Needed by: {ord.needed_by} ({ord.delivery_city})</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-tonal text-brand-deep">
                    {ord.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
