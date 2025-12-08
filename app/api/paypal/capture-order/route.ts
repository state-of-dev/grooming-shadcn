import { NextRequest, NextResponse } from 'next/server'
import { ordersController, calculateCommission, calculatePayout } from '@/lib/paypal'
import { createClient } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      )
    }

    // Capture the order
    const { result: captureResult } = await ordersController.captureOrder({
      id: orderId,
      prefer: 'return=representation'
    })

    if (captureResult.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Extract custom data (businessId and appointmentId)
    const customId = captureResult.purchaseUnits?.[0]?.customId
    const { businessId, appointmentId } = customId ? JSON.parse(customId) : {}

    if (!businessId || !appointmentId) {
      return NextResponse.json(
        { error: 'Missing business or appointment information' },
        { status: 400 }
      )
    }

    // Get payment details
    const amount = parseFloat(
      captureResult.purchaseUnits?.[0]?.payments?.captures?.[0]?.amount?.value || '0'
    )

    // Get business plan from database
    const supabase = createClient()
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('plan')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    const plan = business.plan as 'free' | 'pro'
    const commission = calculateCommission(amount, plan)
    const payout = calculatePayout(amount, plan)

    // Update appointment with payment information
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        payment_status: 'completed',
        payment_method: 'paypal',
        payment_amount: amount,
        platform_commission: commission,
        business_payout: payout,
        paypal_order_id: orderId,
        paypal_capture_id: captureResult.id,
        paid_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)

    if (updateError) {
      console.error('Error updating appointment:', updateError)
      return NextResponse.json(
        { error: 'Failed to update appointment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId,
      captureId: captureResult.id,
      amount,
      commission,
      payout,
      plan,
    })
  } catch (error) {
    console.error('Error capturing PayPal order:', error)
    return NextResponse.json(
      { error: 'Failed to capture PayPal order' },
      { status: 500 }
    )
  }
}
