import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { Agent } from '@/lib/types'

const planDetails = {
  trial: { label: 'Free Trial', color: 'bg-gray-100 text-gray-700', listings: '5 listings' },
  starter: { label: 'Starter', color: 'bg-blue-100 text-blue-700', listings: '10 listings/mo' },
  pro: { label: 'Pro', color: 'bg-purple-100 text-purple-700', listings: '50 listings/mo' },
  agency: { label: 'Agency', color: 'bg-gold/20 text-amber-800', listings: 'Unlimited listings' },
}

const pricingPlans = [
  {
    key: 'starter',
    name: 'Starter',
    price: '$49',
    period: '/month',
    features: ['10 listings per month', 'All content types', 'Public property pages', 'Email support'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$99',
    period: '/month',
    features: ['50 listings per month', 'All content types', 'Custom branding', 'Priority support'],
    highlight: true,
  },
  {
    key: 'agency',
    name: 'Agency',
    price: '$199',
    period: '/month',
    features: ['Unlimited listings', 'All content types', 'White-label pages', 'Dedicated support'],
  },
]

export default async function BillingPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!agent) redirect('/auth/login')

  const typedAgent = agent as Agent
  const currentPlan = planDetails[typedAgent.plan]
  const trialEndsAt = typedAgent.trial_ends_at
    ? new Date(typedAgent.trial_ends_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Billing</h2>
        <p className="text-gray-500 text-sm mt-1">Manage your subscription.</p>
      </div>

      {/* Current plan */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Current Plan</h3>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${currentPlan.color}`}>
            {currentPlan.label}
          </span>
          <span className="text-gray-500 text-sm">{currentPlan.listings}</span>
        </div>
        {typedAgent.plan === 'trial' && trialEndsAt && (
          <p className="text-amber-600 text-sm mt-3">
            Trial ends on {trialEndsAt}. Upgrade to keep access.
          </p>
        )}
      </div>

      {/* Pricing plans */}
      <h3 className="font-semibold text-gray-900 mb-4">Upgrade Plan</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {pricingPlans.map((plan) => (
          <div
            key={plan.key}
            className={`bg-white rounded-2xl border p-6 relative ${
              plan.highlight ? 'border-navy shadow-md' : 'border-gray-200'
            }`}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-navy text-white text-xs font-semibold px-3 py-1 rounded-full">
                Most Popular
              </span>
            )}
            <h4 className="font-bold text-gray-900 text-lg">{plan.name}</h4>
            <div className="mt-2 mb-4">
              <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
              <span className="text-gray-500 text-sm">{plan.period}</span>
            </div>
            <ul className="space-y-2 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              disabled={typedAgent.plan === plan.key}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                typedAgent.plan === plan.key
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : plan.highlight
                  ? 'bg-navy text-white hover:bg-navy-light'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {typedAgent.plan === plan.key ? 'Current plan' : `Upgrade to ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      <p className="text-gray-400 text-xs mt-6 text-center">
        Stripe checkout integration — connect your Stripe account to enable payments.
      </p>
    </div>
  )
}
