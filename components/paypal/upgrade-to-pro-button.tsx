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
  const { businessProfile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleApprove = async (data: any, actions: any) => {
    try {
      setLoading(true)

      // Capture the payment
      const response = await fetch('/api/paypal/capture-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: data.orderID,
          businessId: businessProfile?.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar el pago')
      }

      toast({
        title: '¡Bienvenido a Pro!',
        description: 'Tu plan ha sido actualizado exitosamente.',
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

  const createOrder = async () => {
    try {
      const response = await fetch('/api/paypal/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: businessProfile?.id,
          amount: 79.00,
          currency: 'MXN',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la orden')
      }

      return data.orderId
    } catch (error) {
      console.error('Error creating order:', error)
      toast({
        title: 'Error',
        description: 'No se pudo crear la orden de pago',
        variant: 'destructive',
      })
      throw error
    }
  }

  // If already Pro, don't show button
  if (businessProfile?.plan === 'pro') {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`${fullWidth ? 'w-full' : ''} ${compact ? 'justify-start h-auto p-0 hover:bg-transparent' : 'justify-center'}`}
        >
          {children || (
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
                }}
              >
                <PayPalButtons
                  style={{ layout: 'vertical', label: 'pay' }}
                  createOrder={createOrder}
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
