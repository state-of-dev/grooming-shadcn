'use client'

import { useState } from 'react'
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

const PAYPAL_PLAN_ID = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO || 'P-7WJ60817PJ532925NNE52BUQ'

interface UpgradeToProButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  fullWidth?: boolean
  children?: React.ReactNode
  compact?: boolean // For navbar dropdown
}

export function UpgradeToProButton({
  variant = 'default',
  size = 'default',
  fullWidth = false,
  children,
  compact = false
}: UpgradeToProButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { businessProfile, refreshProfile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Debug logging
  console.log('UpgradeToProButton - Auth state:', {
    authLoading,
    hasBusinessProfile: !!businessProfile,
    businessProfileId: businessProfile?.id,
    plan: businessProfile?.plan
  })

  const handleApprove = async (data: any) => {
    try {
      setLoading(true)

      if (!businessProfile?.id) {
        throw new Error('No se pudo cargar tu perfil de negocio')
      }

      console.log('Subscription approved:', data.subscriptionID)

      // Register subscription with backend
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
      const response = await fetch(`${backendUrl}/api/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: PAYPAL_PLAN_ID,
          subscriptionId: data.subscriptionID,
          userId: businessProfile.id,
          userEmail: businessProfile.owner_id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error registrando la suscripción')
      }

      console.log('Subscription registered:', result)

      // Update business profile to Pro
      const updateResponse = await fetch('/api/business/upgrade-to-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: businessProfile.id,
          subscriptionId: data.subscriptionID,
        }),
      })

      if (!updateResponse.ok) {
        throw new Error('Error actualizando el plan')
      }

      toast({
        title: '¡Bienvenido a Pro!',
        description: 'Tu suscripción ha sido activada exitosamente.',
      })

      // Refresh profile to get updated plan
      await refreshProfile()

      // Close dialog
      setOpen(false)

      // Redirect to dashboard
      router.push('/dashboard/groomer')
    } catch (error) {
      console.error('Error upgrading to Pro:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo completar la actualización',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const createSubscription = async () => {
    try {
      // Validate businessProfile exists
      if (!businessProfile?.id) {
        console.error('Missing businessProfile:', {
          businessProfile,
          hasProfile: !!businessProfile,
          id: businessProfile?.id
        })
        throw new Error('No se pudo cargar tu perfil de negocio. Por favor recarga la página.')
      }

      console.log('Creating PayPal subscription for business:', businessProfile.id)
      console.log('Plan ID:', PAYPAL_PLAN_ID)

      // PayPal SDK maneja la creación de la suscripción en el cliente
      return PAYPAL_PLAN_ID
    } catch (error) {
      console.error('Error creating subscription:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo crear la suscripción',
        variant: 'destructive',
      })
      throw error
    }
  }

  // If already Pro, don't show button
  if (businessProfile?.plan === 'pro') {
    return null
  }

  // Don't render if still loading or no profile
  const isDisabled = authLoading || !businessProfile?.id

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isDisabled}
          className={`${fullWidth ? 'w-full' : ''} ${compact ? 'justify-start h-auto p-0 hover:bg-transparent' : 'justify-center'}`}
        >
          {authLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando...
            </>
          ) : !businessProfile?.id ? (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              No disponible
            </>
          ) : children || (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Actualiza a PRO+
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Actualizar a Plan Pro
          </DialogTitle>
          <DialogDescription>
            Desbloquea todas las funciones premium por solo $79 MXN/mes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
              <span>Comisión reducida por transacción (3%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
              <span>Citas ilimitadas al mes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
              <span>Publicado en marketplace</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
              <span>Soporte telefónico prioritario</span>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">Total:</span>
              <span className="text-2xl font-bold">$79 MXN/mes</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <PayPalScriptProvider
                options={{
                  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
                  currency: 'MXN',
                  intent: 'subscription',
                  vault: true,
                }}
              >
                <PayPalButtons
                  style={{ layout: 'vertical', label: 'subscribe' }}
                  createSubscription={createSubscription}
                  onApprove={handleApprove}
                  onError={(err) => {
                    console.error('PayPal error:', err)
                    toast({
                      title: 'Error',
                      description: 'Ocurrió un error con PayPal',
                      variant: 'destructive',
                    })
                  }}
                />
              </PayPalScriptProvider>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
