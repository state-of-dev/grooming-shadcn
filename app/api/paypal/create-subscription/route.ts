import { NextRequest, NextResponse } from 'next/server'
import { orders } from '@paypal/paypal-server-sdk'
import { paypalClient } from '@/lib/paypal'

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
    const orderRequest = new orders.OrdersCreateRequest()
    orderRequest.prefer('return=representation')
    orderRequest.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description: 'Plan Pro - Suscripción mensual',
          custom_id: JSON.stringify({
            businessId,
            plan: 'pro',
            type: 'subscription',
          }),
        },
      ],
    })

    // Execute request
    const order = await paypalClient.execute(orderRequest)

    return NextResponse.json({
      orderId: order.result.id,
      status: order.result.status,
    })
  } catch (error) {
    console.error('Error creating PayPal subscription order:', error)
    return NextResponse.json(
      { error: 'Failed to create PayPal subscription order' },
      { status: 500 }
    )
  }
}
