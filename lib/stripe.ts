import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  }
  return _stripe
}

export const PLANS = {
  starter: {
    name: 'Starter',
    price: 49,
    listings: 10,
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
  },
  pro: {
    name: 'Pro',
    price: 99,
    listings: 50,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
  },
  agency: {
    name: 'Agency',
    price: 199,
    listings: -1,
    priceId: process.env.STRIPE_AGENCY_PRICE_ID,
  },
} as const
