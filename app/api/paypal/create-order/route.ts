import { NextRequest, NextResponse } from 'next/server'
import { ordersController } from '@/lib/paypal'
import { OrderRequest, CheckoutPaymentIntent } from '@paypal/paypal-server-sdk'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'MXN', businessId, appointmentId } = await request.json()

    if (!amount || !businessId || !appointmentId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, businessId, appointmentId' },
        { status: 400 }
      )
    }

    // Create order
    const orderRequest: OrderRequest = {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          amount: {
            currencyCode: currency,
            value: amount.toFixed(2),
          },
          customId: JSON.stringify({
            businessId,
            appointmentId,
          }),
        },
      ],
      applicationContext: {
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      },
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
    console.error('Error creating PayPal order:', error)
    return NextResponse.json(
      { error: 'Failed to create PayPal order' },
      { status: 500 }
    )
  }
}
