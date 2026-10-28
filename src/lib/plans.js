/**
 * Local constant pricing plans seeded from section 7 of Skill.md.
 * In Phase 2, this will be loaded from Supabase public.plans & public.plan_prices.
 */
export const PLANS = [
  {
    id: 'A',
    name: 'Plan A',
    commission_bps: 300,
    commissionPercent: '3%',
    trial_days: 14,
    sort: 1,
    prices: [
      { period: 'daily', periodLabel: 'day', amount_kobo: 25000 },
      { period: 'weekly', periodLabel: 'week', amount_kobo: 150000 },
      { period: 'monthly', periodLabel: 'month', amount_kobo: 500000 },
    ],
    features: [
      'Verified badge',
      'Basic analytics (14 days)',
      'Limited WhatsApp/email notifications',
      'Monthly WhatsApp business report',
    ],
  },
  {
    id: 'B',
    name: 'Plan B',
    commission_bps: 130,
    commissionPercent: '1.3%',
    trial_days: 14,
    sort: 2,
    prices: [
      { period: 'monthly', periodLabel: 'month', amount_kobo: 1000000 },
    ],
    features: [
      'Verified badge',
      'WhatsApp and email notifications',
      'Advanced analytics (90 days)',
      'Weekly business report',
    ],
  },
  {
    id: 'C',
    name: 'Plan C',
    commission_bps: 30,
    commissionPercent: '0.3%',
    trial_days: 14,
    sort: 3,
    prices: [
      { period: 'monthly', periodLabel: 'month', amount_kobo: 1500000 },
    ],
    features: [
      'Verified badge',
      'Platform promotion',
      'SMS, email and WhatsApp notifications',
      'Advanced analytics (180 days)',
      'Daily WhatsApp/email business report',
      'Business tracker',
    ],
  },
]
