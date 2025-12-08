import { NextRequest, NextResponse } from 'next/server'
import { orders } from '@paypal/paypal-server-sdk'
import { paypalClient } from '@/lib/paypal'

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

    // Create order request
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
          custom_id: JSON.stringify({
            businessId,
            appointmentId,
          }),
        },
      ],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      },
    })

    // Execute request
    const order = await paypalClient.execute(orderRequest)

    return NextResponse.json({
      orderId: order.result.id,
      status: order.result.status,
    })
  } catch (error) {
    console.error('Error creating PayPal order:', error)
    return NextResponse.json(
      { error: 'Failed to create PayPal order' },
      { status: 500 }
    )
  }
}
