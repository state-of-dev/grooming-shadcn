'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export function AuthRedirect() {
  const { user, profile, businessProfile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const checkAndRedirect = async () => {
      console.log('🔍 AuthRedirect - Checking redirect logic', { user: user?.id, profile: profile?.role, pathname, loading })

      if (loading) return

      if (!user) {
        console.log('👻 No user, skipping redirect')
        return
      }

      if (!profile) {
        console.log('⏳ Profile not loaded yet')
        return
      }

      // Skip redirect if already on onboarding page
      if (pathname === '/customer/onboarding') {
        console.log('📝 Already on onboarding page, skipping redirect')
        return
      }

      // Redirect based on role
      if (profile.role === 'customer') {
        console.log('👤 Customer detected, checking if has customer profile')

        // Check if customer has completed onboarding
        if (!checking) {
          setChecking(true)
          const { data: customerProfile } = await supabase
            .from('customers')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle()

          console.log('📋 Customer profile check result:', customerProfile ? 'HAS PROFILE' : 'NO PROFILE')

          if (!customerProfile) {
            console.log('⚠️ No customer profile, redirecting to onboarding')
            router.replace('/customer/onboarding?returnTo=/marketplace')
          } else {
            console.log('✅ Has customer profile, redirecting to dashboard')
            router.replace('/customer/dashboard')
          }
          setChecking(false)
        }
      } else if (profile.role === 'groomer') {
        console.log('💼 Groomer detected')
        // For groomers, wait for business profile
        if (businessProfile) {
          if (businessProfile.setup_completed) {
            console.log('✅ Groomer setup complete')
            router.replace(`/groomer/${businessProfile.slug}/dashboard`)
          } else {
            console.log('⚠️ Groomer setup incomplete')
            router.replace('/setup/business')
          }
        } else if (!loading) {
          console.log('⚠️ No business profile')
          router.replace('/setup/business')
        }
      }
    }

    checkAndRedirect()
  }, [user, profile, businessProfile, loading, router, pathname, checking])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-2 text-center">
        <Loader2 className="animate-spin rounded-full h-8 w-8 mx-auto border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">Redirigiendo...</p>
      </div>
    </div>
  )
}
