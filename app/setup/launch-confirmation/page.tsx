'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useAuthGuard } from '@/lib/hooks/useAuthGuard'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Sparkles, Loader2, AlertCircle, ExternalLink } from 'lucide-react'

// Define types for the fetched data
interface Service {
  name: string;
}
interface PortfolioImage {
  id: string;
}

export default function LaunchConfirmationPage() {
  const { businessProfile, loading: authLoading, refreshBusinessProfile } = useAuthGuard()
  const router = useRouter()
  const [isLaunching, setIsLaunching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<{ services: Service[], portfolio: PortfolioImage[] }>({ services: [], portfolio: [] })

  const businessUrl = businessProfile ? `/business/${businessProfile.slug}` : '#'

  useEffect(() => {
    if (businessProfile) {
      const fetchSummaryData = async () => {
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('name')
          .eq('business_id', businessProfile.id)

        const { data: portfolio, error: portfolioError } = await supabase
          .from('portfolio_images')
          .select('id')
          .eq('business_id', businessProfile.id)

        if (servicesError || portfolioError) {
          setError('No se pudo cargar el resumen del negocio.')
        } else {
          setSummary({ services: services || [], portfolio: portfolio || [] })
        }
      }
      fetchSummaryData()
    }
  }, [businessProfile])

  const handleLaunch = async () => {
    if (!businessProfile) return
    setIsLaunching(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('business_profiles')
        .update({ setup_completed: true, is_active: true, updated_at: new Date().toISOString() })
        .eq('id', businessProfile.id)

      if (updateError) throw updateError

      await refreshBusinessProfile() // Refresh context to reflect the change
      router.push(`/dashboard`) // Redirect to the main dashboard
    } catch (error: any) {
      setError(error.message || 'Error al activar el negocio.')
    } finally {
      setIsLaunching(false)
    }
  }

  if (authLoading || !businessProfile) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  const completedSteps = [
    { name: 'Información del Negocio', completed: !!businessProfile.business_name },
    { name: 'Horarios de Atención', completed: businessProfile.business_hours && Object.keys(businessProfile.business_hours).length > 0 },
    { name: 'Servicios Definidos', completed: summary.services.length > 0 },
    { name: 'Portafolio Inicial', completed: summary.portfolio.length > 0 },
  ]

  return (
    <div className="min-h-screen bg-muted/50 p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-6 py-8">
        <div className="text-center space-y-2">
          <Sparkles className="mx-auto h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bold">¡Todo listo para lanzar!</h1>
          <p className="text-muted-foreground">Revisa la configuración de tu negocio y activa tu página.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resumen de Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {completedSteps.map((step, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle className={`h-5 w-5 ${step.completed ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <span className={!step.completed ? 'text-muted-foreground' : ''}>{step.name}</span>
                  {step.completed && <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">COMPLETADO</span>}
                </li>
              ))}
            </ul>
            <div className="border-t pt-4">
              <p className="text-sm font-medium">Tu página pública estará en:</p>
              <Link href={businessUrl} target="_blank" className="text-sm text-primary hover:underline break-all">
                {`${window.location.origin}${businessUrl}`}
                <ExternalLink className="inline-block ml-1 h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-3 my-2 rounded-md bg-destructive/10 border border-destructive/50 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} className="w-full">Atrás</Button>
          <Button onClick={handleLaunch} disabled={isLaunching} className="w-full">
            {isLaunching ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Activando...</>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> ¡Lanzar mi Página!
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
