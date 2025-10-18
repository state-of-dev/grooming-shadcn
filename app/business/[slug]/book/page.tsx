'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  DollarSign,
  CheckCircle,
  Scissors,
  Loader2,
  Tag
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Service {
  id: string
  name: string
  description: string
  duration: number
  price: number
  category: string
  business_id: string
}

interface BusinessProfile {
  id: string
  business_name: string
  slug: string
  description: string
  is_active: boolean
}

interface BookingState {
  businessSlug: string
  businessId: string
  businessName: string
  service: Service
  step: string
}

export default function BookServicePage() {
  const params = useParams()
  const router = useRouter()
  const businessSlug = params.slug as string

  const [business, setBusiness] = useState<BusinessProfile | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedServiceIndex, setSelectedServiceIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!businessSlug) {
      setError('Negocio no encontrado')
      setIsLoading(false)
      return
    }
    loadBusiness()
  }, [businessSlug])

  const loadBusiness = async () => {
    try {
      // Load business from database
      const { data: businessData, error: businessError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('slug', businessSlug)
        .eq('is_active', true)
        .single()

      if (businessError || !businessData) {
        setError('Negocio no encontrado o inactivo')
        return
      }

      // Load services for this business
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessData.id)
        .eq('is_active', true)

      if (servicesError) {
        console.error('Error loading services:', servicesError)
      }

      const realServices = servicesData || []

      setBusiness(businessData)
      setServices(realServices)

    } catch (error: any) {
      console.error('Error loading business:', error)
      setError('Error al cargar el negocio')
    } finally {
      setIsLoading(false)
    }
  }

  const handleServiceSelect = (index: number) => {
    setSelectedServiceIndex(index)
  }

  const handleContinue = () => {
    if (selectedServiceIndex === null || !services[selectedServiceIndex] || !business) {
      return
    }

    const selectedService = services[selectedServiceIndex]

    // Store selection in localStorage for the booking flow
    const bookingState: BookingState = {
      businessSlug,
      businessId: business.id,
      businessName: business.business_name,
      service: selectedService,
      step: 'datetime'
    }

    localStorage.setItem('booking-state', JSON.stringify(bookingState))

    router.push(`/business/${businessSlug}/book/datetime`)
  }

  // Helper function to group services by category
  const groupedServices = services.reduce((groups, service, index) => {
    const category = service.category || 'otros'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push({ ...service, index })
    return groups
  }, {} as Record<string, (Service & { index: number })[]>)

  // Category display names
  const categoryNames: Record<string, string> = {
    'baño': 'Baño y Secado',
    'corte': 'Corte y Peinado',
    'spa': 'Spa Completo',
    'cuidado': 'Uñas y Cuidado',
    'premium': 'Tratamientos Premium',
    'otros': 'Otros Servicios'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando servicios...</p>
        </div>
      </div>
    )
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/marketplace')}>
              Volver al Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>No hay servicios disponibles</CardTitle>
            <CardDescription>
              Este negocio aún no ha configurado sus servicios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/marketplace')}>
              Volver al Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedService = selectedServiceIndex !== null ? services[selectedServiceIndex] : null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => router.push('/marketplace')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Marketplace
            </Button>
            <Badge variant="secondary">Paso 1 de 4</Badge>
          </div>
          <Progress value={25} className="h-2" />
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Business header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">{business.business_name}</h1>
          <p className="text-xl text-muted-foreground">
            Selecciona el servicio que deseas reservar
          </p>
        </div>

        {/* Services by category */}
        <div className="space-y-12">
          {Object.entries(groupedServices).map(([category, categoryServices]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-6">
                <Tag className="w-5 h-5" />
                <h2 className="text-2xl font-semibold">
                  {categoryNames[category] || category}
                </h2>
              </div>

              <div className="grid gap-4">
                {categoryServices.map((service) => {
                  const isSelected = selectedServiceIndex === service.index
                  return (
                    <Card
                      key={service.index}
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'ring-2 ring-primary shadow-lg'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => handleServiceSelect(service.index)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">
                                {service.name}
                              </h3>
                              {isSelected && (
                                <CheckCircle className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {service.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                {service.duration} min
                              </div>
                              <div className="flex items-center gap-1 font-semibold text-lg">
                                <DollarSign className="w-4 h-4" />
                                {service.price}
                              </div>
                            </div>
                          </div>

                          <div className="ml-4">
                            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-primary bg-primary/10' : 'border-border'
                            }`}>
                              <Scissors className="w-6 h-6" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Continue button */}
        <div className="mt-12 flex justify-center">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!selectedService}
            className="min-w-[200px]"
          >
            Continuar
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Selected service summary */}
        {selectedService && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Servicio Seleccionado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    {selectedService.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedService.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    ${selectedService.price}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedService.duration} minutos
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
