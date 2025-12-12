import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { businessId, subscriptionId } = await request.json()

    if (!businessId) {
      return NextResponse.json(
        { error: 'Missing businessId' },
        { status: 400 }
      )
    }

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Missing subscriptionId' },
        { status: 400 }
      )
    }

    console.log('Upgrading business to Pro:', businessId)
    console.log('Subscription ID:', subscriptionId)

    // Update business profile to Pro plan
    const { data, error } = await supabase
      .from('business_profiles')
      .update({
        plan: 'pro',
        subscription_status: 'active',
        paypal_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)
      .select()
      .single()

    if (error) {
      console.error('Error updating business profile:', error)
      return NextResponse.json(
        { error: 'Failed to upgrade business profile' },
        { status: 500 }
      )
    }

    console.log('Business upgraded successfully:', data)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error upgrading to Pro:', error)
    return NextResponse.json(
      { error: 'Failed to upgrade to Pro' },
      { status: 500 }
    )
  }
}
