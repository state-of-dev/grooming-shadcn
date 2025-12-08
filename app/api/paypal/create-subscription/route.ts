import { NextRequest, NextResponse } from 'next/server'
import { ordersController } from '@/lib/paypal'
import { OrderRequest, CheckoutPaymentIntent } from '@paypal/paypal-server-sdk'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { businessId, amount = 79.00, currency = 'MXN' } = await request.json()

    if (!businessId) {
      return NextResponse.json(
        { error: 'Missing businessId' },
        { status: 400 }
      )
    }

    // Create order request for Pro subscription
    const orderRequest: OrderRequest = {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          amount: {
            currencyCode: currency,
            value: amount.toFixed(2),
          },
          description: 'Plan Pro - Suscripción mensual',
          customId: JSON.stringify({
            businessId,
            plan: 'pro',
            type: 'subscription',
          }),
        },
      ],
    }

    // Execute request
    const { result } = await ordersController.createOrder({
      body: orderRequest,
      prefer: 'return=representation'
    })

    return NextResponse.json({
      orderId: result.id,
      status: result.status,
    })
  } catch (error) {
    console.error('Error creating PayPal subscription order:', error)
    return NextResponse.json(
      { error: 'Failed to create PayPal subscription order' },
      { status: 500 }
    )
  }
}
