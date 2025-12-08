import { NextRequest, NextResponse } from 'next/server'
import { paypalClient } from '@/lib/paypal'
import { createClient } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { orderId, businessId } = await request.json()

    if (!orderId || !businessId) {
      return NextResponse.json(
        { error: 'Missing orderId or businessId' },
        { status: 400 }
      )
    }

    // Capture the order
    const { result: captureResult } = await paypalClient.ordersController.ordersCapture({
      id: orderId,
      prefer: 'return=representation'
    })

    if (captureResult.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Get payment details
    const amount = parseFloat(
      captureResult.purchaseUnits?.[0]?.payments?.captures?.[0]?.amount?.value || '0'
    )

    // Update business to Pro plan
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        plan: 'pro',
        subscription_status: 'active',
        subscription_started_at: new Date().toISOString(),
      })
      .eq('id', businessId)

    if (updateError) {
      console.error('Error updating business plan:', updateError)
      return NextResponse.json(
        { error: 'Failed to update business plan' },
        { status: 500 }
      )
    }

    // Log the subscription payment
    const { error: logError } = await supabase
      .from('subscription_payments')
      .insert({
        business_id: businessId,
        amount,
        currency: 'MXN',
        plan: 'pro',
        paypal_order_id: orderId,
        paypal_capture_id: captureResult.id,
        status: 'completed',
      })

    if (logError) {
      console.error('Error logging subscription payment:', logError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      orderId,
      captureId: captureResult.id,
      amount,
      plan: 'pro',
    })
  } catch (error) {
    console.error('Error capturing PayPal subscription:', error)
    return NextResponse.json(
      { error: 'Failed to capture PayPal subscription' },
      { status: 500 }
    )
  }
}
