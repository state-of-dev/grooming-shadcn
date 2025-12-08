import { NextRequest, NextResponse } from 'next/server'
import { paypalClient } from '@/lib/paypal'
import { OrderRequest } from '@paypal/paypal-server-sdk/dist/models/orderRequest'

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
      intent: 'CAPTURE',
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
    const { result } = await paypalClient.ordersController.ordersCreate({
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
