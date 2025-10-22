// Supabase Edge Function: stripe-webhook
// Handles Stripe webhooks for subscription events
// Deploy with: supabase functions deploy stripe-webhook

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';

serve(async (req) => {
  try {
    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get signature from headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No signature found');
    }

    // Get raw body
    const body = await req.text();

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`Processing webhook event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, supabase, stripe);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription, supabase, stripe);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, supabase);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice, supabase);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice, supabase);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent, supabase);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: any,
  stripe: any
) {
  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id;
  const jobId = session.metadata?.job_id;
  const isOneTime = session.metadata?.is_one_time === 'true';

  if (!userId || !planId) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Handle one-time payments (like featured job postings)
  if (isOneTime || session.mode === 'payment') {
    console.log(`One-time payment completed for user ${userId}`);
    
    // Get plan details
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (!plan) {
      console.error('Plan not found:', planId);
      return;
    }

    // Record the payment transaction
    await supabase.from('payment_transactions').insert({
      user_id: userId,
      amount_cents: session.amount_total,
      currency: session.currency?.toUpperCase(),
      status: 'succeeded',
      stripe_payment_intent_id: session.payment_intent,
      description: `One-time purchase: ${plan.name}`,
      metadata: {
        plan_id: planId,
        job_id: jobId,
        feature: plan.metadata?.feature,
      },
    });

    // If it's a featured job posting, activate it
    if (plan.metadata?.feature === 'featured_job' && jobId) {
      const durationDays = plan.features?.duration_days || 30;
      const featuredUntil = new Date();
      featuredUntil.setDate(featuredUntil.getDate() + durationDays);

      await supabase.from('featured_jobs').insert({
        job_id: jobId,
        feature_type: 'premium',
        featured_until: featuredUntil.toISOString(),
        is_active: true,
      });

      console.log(`Featured job ${jobId} activated for ${durationDays} days`);
    }

    return;
  }

  // For subscriptions, the subscription.created event will handle it
  const subscriptionId = session.subscription as string;
  console.log(`Checkout completed for user ${userId}, subscription ${subscriptionId}`);
}

async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  supabase: any,
  stripe: any
) {
  const userId = subscription.metadata?.user_id;
  const planId = subscription.metadata?.plan_id;

  if (!userId || !planId) {
    console.error('Missing metadata in subscription');
    return;
  }

  // Get payment method details
  let paymentMethodBrand = null;
  let paymentMethodLast4 = null;

  if (subscription.default_payment_method) {
    try {
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
        apiVersion: '2023-10-16',
        httpClient: Stripe.createFetchHttpClient(),
      });
      const pm = await stripe.paymentMethods.retrieve(
        subscription.default_payment_method as string
      );
      if (pm.card) {
        paymentMethodBrand = pm.card.brand;
        paymentMethodLast4 = pm.card.last4;
      }
    } catch (error) {
      console.error('Error fetching payment method:', error);
    }
  }

  // Upsert subscription
  const { error } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      plan_id: planId,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      trial_start: subscription.trial_start
        ? new Date(subscription.trial_start * 1000).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0].price.id,
      payment_method_brand: paymentMethodBrand,
      payment_method_last4: paymentMethodLast4,
    }, {
      onConflict: 'stripe_subscription_id',
    });

  if (error) {
    console.error('Error upserting subscription:', error);
  } else {
    console.log(`Subscription updated for user ${userId}`);
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error marking subscription as canceled:', error);
  } else {
    console.log(`Subscription ${subscription.id} marked as canceled`);
  }
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any
) {
  const subscriptionId = invoice.subscription as string;

  // Get subscription to find user_id
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('user_id, id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!subscription) {
    console.error('Subscription not found for invoice');
    return;
  }

  // Record payment transaction
  const { error } = await supabase.from('payment_transactions').insert({
    user_id: subscription.user_id,
    subscription_id: subscription.id,
    amount_cents: invoice.amount_paid,
    currency: invoice.currency.toUpperCase(),
    status: 'succeeded',
    stripe_payment_intent_id: invoice.payment_intent as string,
    stripe_charge_id: invoice.charge as string,
    stripe_invoice_id: invoice.id,
    description: `Subscription payment for period`,
  });

  if (error) {
    console.error('Error recording payment transaction:', error);
  } else {
    console.log(`Payment recorded for user ${subscription.user_id}`);
  }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
) {
  const subscriptionId = invoice.subscription as string;

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('user_id, id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!subscription) return;

  // Record failed payment
  const { error } = await supabase.from('payment_transactions').insert({
    user_id: subscription.user_id,
    subscription_id: subscription.id,
    amount_cents: invoice.amount_due,
    currency: invoice.currency.toUpperCase(),
    status: 'failed',
    stripe_payment_intent_id: invoice.payment_intent as string,
    stripe_invoice_id: invoice.id,
    description: 'Failed subscription payment',
  });

  if (error) {
    console.error('Error recording failed payment:', error);
  }

  // Update subscription status to past_due
  await supabase
    .from('user_subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', subscriptionId);

  console.log(`Payment failed for user ${subscription.user_id}`);
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any
) {
  // This handles one-time payments that aren't associated with a subscription
  const metadata = paymentIntent.metadata;
  
  if (!metadata.user_id) {
    console.log('PaymentIntent without user_id metadata, skipping');
    return;
  }

  console.log(`One-time payment intent succeeded for user ${metadata.user_id}`);
}

