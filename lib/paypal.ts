import { PayPalHttpClient, core } from '@paypal/paypal-server-sdk'

// Initialize PayPal client
const environment =
  process.env.PAYPAL_MODE === 'production'
    ? new core.LiveEnvironment(
        process.env.PAYPAL_CLIENT_ID!,
        process.env.PAYPAL_CLIENT_SECRET!
      )
    : new core.SandboxEnvironment(
        process.env.PAYPAL_CLIENT_ID!,
        process.env.PAYPAL_CLIENT_SECRET!
      )

export const paypalClient = new PayPalHttpClient(environment)

// Commission rates based on plan
export const COMMISSION_RATES = {
  free: 0.15, // 15% commission for free plan (covers Stripe fees + platform fee)
  pro: 0.03,  // 3% commission for pro plan (minimal, mostly covers Stripe fees)
}

// Calculate platform commission
export function calculateCommission(amount: number, plan: 'free' | 'pro'): number {
  const rate = COMMISSION_RATES[plan]
  return Math.round(amount * rate * 100) / 100 // Round to 2 decimals
}

// Calculate business payout (after commission)
export function calculatePayout(amount: number, plan: 'free' | 'pro'): number {
  const commission = calculateCommission(amount, plan)
  return amount - commission
}
