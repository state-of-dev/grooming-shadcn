import { Client, Environment, OrdersController } from '@paypal/paypal-server-sdk'

// Initialize PayPal client
const environment =
  process.env.PAYPAL_MODE === 'production'
    ? Environment.Production
    : Environment.Sandbox

const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.PAYPAL_CLIENT_ID!,
    oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET!
  },
  environment,
  timeout: 0
})

export const paypalClient = client
export const ordersController = new OrdersController(client)

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
