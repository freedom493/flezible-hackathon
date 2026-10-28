import { Link, useLocation } from 'wouter-preact'
import { Store, ShoppingBag, ClipboardList, User } from 'lucide-preact'

export function BottomNav() {
  const [location] = useLocation()

  const navItems = [
    { label: 'Market', href: '/marketplace', icon: ShoppingBag },
    { label: 'Orders', href: '/orders', icon: ClipboardList },
    { label: 'Store', href: '/store', icon: Store },
    { label: 'Profile', href: '/settings', icon: User },
  ]

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-outline pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                isActive ? 'text-brand font-semibold' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
