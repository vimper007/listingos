import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[Stripe webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const priceId = subscription.items.data[0]?.price.id

        let plan: string = 'trial'
        if (priceId === process.env.STRIPE_STARTER_PRICE_ID) plan = 'starter'
        else if (priceId === process.env.STRIPE_PRO_PRICE_ID) plan = 'pro'
        else if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) plan = 'agency'

        await supabase
          .from('agents')
          .update({ plan, stripe_customer_id: customerId })
          .eq('stripe_customer_id', customerId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await supabase
          .from('agents')
          .update({ plan: 'trial' })
          .eq('stripe_customer_id', customerId)
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.customer && session.client_reference_id) {
          await supabase
            .from('agents')
            .update({ stripe_customer_id: session.customer as string })
            .eq('id', session.client_reference_id)
        }
        break
      }
    }
  } catch (err) {
    console.error('[Stripe webhook] handler error', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
