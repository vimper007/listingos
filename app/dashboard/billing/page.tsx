import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { Agent } from '@/lib/types'

const planDetails = {
  trial: { label: 'Free Trial', listings: '5 listings' },
  starter: { label: 'Starter', listings: '10 listings/mo' },
  pro: { label: 'Pro', listings: '50 listings/mo' },
  agency: { label: 'Agency', listings: 'Unlimited listings' },
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
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            color: 'var(--text-primary)',
            fontWeight: 700,
          }}
        >
          Billing
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
          Manage your subscription.
        </p>
      </div>

      {/* Current plan */}
      <div
        className="mb-8"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            color: 'var(--text-primary)',
            fontWeight: 600,
            marginBottom: 14,
          }}
        >
          Current Plan
        </h3>
        <div className="flex items-center gap-3">
          <span
            style={{
              padding: '4px 14px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              background: 'var(--primary-muted)',
              color: 'var(--primary)',
              border: '1px solid rgba(201,168,76,0.2)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {currentPlan.label}
          </span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{currentPlan.listings}</span>
        </div>
        {typedAgent.plan === 'trial' && trialEndsAt && (
          <p style={{ color: 'var(--primary)', fontSize: 14, marginTop: 12 }}>
            Trial ends on {trialEndsAt}. Upgrade to keep access.
          </p>
        )}
      </div>

      {/* Pricing plans */}
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          color: 'var(--text-primary)',
          fontWeight: 600,
          marginBottom: 16,
        }}
      >
        Upgrade Plan
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {pricingPlans.map((plan) => (
          <div
            key={plan.key}
            style={{
              background: 'var(--surface)',
              border: plan.highlight ? '1px solid var(--border-highlight)' : '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              position: 'relative',
              boxShadow: plan.highlight ? 'var(--shadow-card)' : 'none',
            }}
          >
            {plan.highlight && (
              <span
                style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #c9a84c, #e0bf6e)',
                  color: '#0a0a0f',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 12px',
                  borderRadius: 999,
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                MOST POPULAR
              </span>
            )}

            <h4
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                color: 'var(--text-primary)',
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              {plan.name}
            </h4>
            <div style={{ marginBottom: 20 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 30,
                  fontWeight: 700,
                  color: plan.highlight ? 'var(--primary)' : 'var(--text-primary)',
                }}
              >
                {plan.price}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{plan.period}</span>
            </div>
            <ul className="space-y-2.5 mb-6">
              {plan.features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2"
                  style={{ fontSize: 13, color: 'var(--text-secondary)' }}
                >
                  <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              disabled={typedAgent.plan === plan.key}
              style={{
                width: '100%',
                height: 40,
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                cursor: typedAgent.plan === plan.key ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                ...(typedAgent.plan === plan.key
                  ? {
                      background: 'var(--surface-raised)',
                      color: 'var(--text-tertiary)',
                      border: '1px solid var(--border)',
                    }
                  : plan.highlight
                  ? {
                      background: 'linear-gradient(135deg, #c9a84c, #e0bf6e)',
                      color: '#0a0a0f',
                      border: 'none',
                    }
                  : {
                      background: 'transparent',
                      color: 'var(--primary)',
                      border: '1px solid var(--primary)',
                    }),
              }}
            >
              {typedAgent.plan === plan.key ? 'Current plan' : `Upgrade to ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      <p style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 24, textAlign: 'center' }}>
        Stripe checkout integration — connect your Stripe account to enable payments.
      </p>
    </div>
  )
}
