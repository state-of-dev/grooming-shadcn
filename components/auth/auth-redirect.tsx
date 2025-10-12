'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Loader2 } from 'lucide-react'

export function AuthRedirect() {
  const { user, profile, businessProfile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return

    if (!user) {
      // If user is not logged in, no redirection is needed from here.
      // Public pages will be accessible, and protected pages should handle their own redirection.
      return
    }

    // If we have a user but are still fetching profile, wait.
    if (!profile) return

    // Redirect based on role
    if (profile.role === 'customer') {
      router.replace('/customer/dashboard')
    } else if (profile.role === 'groomer') {
      // For groomers, wait for business profile
      if (businessProfile) {
        if (businessProfile.setup_completed) {
          router.replace(`/groomer/${businessProfile.slug}/dashboard`)
        } else {
          router.replace('/setup/business')
        }
      } else if (!loading) {
        // If business profile is null and not loading, maybe they need to create one.
        router.replace('/setup/business')
      }
    }
  }, [user, profile, businessProfile, loading, router, pathname])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-2 text-center">
        <Loader2 className="animate-spin rounded-full h-8 w-8 mx-auto border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">Redirigiendo...</p>
      </div>
    </div>
  )
}
