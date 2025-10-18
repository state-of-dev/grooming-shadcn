'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from '@/lib/supabase'
import {
  Scissors,
  Plus,
  Trash2,
  Loader2,
  ArrowRight,
  DollarSign,
  Clock
} from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string
  duration: number // in minutes
  price: number
  category: string
}

const SERVICE_CATEGORIES = [
  { label: 'Corte y Peinado', value: 'corte' },
  { label: 'Baño y Secado', value: 'baño' },
  { label: 'Uñas y Cuidado', value: 'cuidado' },
  { label: 'Tratamientos Especiales', value: 'premium' },
  { label: 'Paquetes Completos', value: 'spa' }
]

const DEFAULT_SERVICES: Omit<Service, 'id'>[] = [
  {
    name: 'Baño Básico',
    description: 'Baño completo con champú y secado',
    duration: 60,
    price: 25,
    category: 'spa'
  },
  {
    name: 'Corte y Baño',
    description: 'Corte de pelo profesional más baño completo',
    duration: 90,
    price: 45,
    category: 'spa'
  },
  {
    name: 'Corte de Uñas',
    description: 'Corte y limado profesional de uñas',
    duration: 30,
    price: 15,
    category: 'cuidado'
  }
]

export default function ServicesSetup() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [services, setServices] = useState<Service[]>(() =>
    DEFAULT_SERVICES.map(service => ({
      ...service,
      id: Math.random().toString(36).substr(2, 9)
    }))
  )

  // Redirect if not logged in or not a groomer
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login')
    }
    if (profile && profile.role !== 'groomer') {
      router.replace('/customer/dashboard')
    }
  }, [user, profile, authLoading, router])

  const addService = () => {
    const newService: Service = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      description: '',
      duration: 60,
      price: 0,
      category: 'spa'
    }
    setServices(prev => [...prev, newService])
  }

  const removeService = (id: string) => {
    setServices(prev => prev.filter(service => service.id !== id))
  }

  const updateService = (id: string, field: keyof Service, value: string | number) => {
    setServices(prev => prev.map(service =>
      service.id === id ? { ...service, [field]: value } : service
    ))
  }

  const validateServices = () => {
    const newErrors: Record<string, string> = {}

    if (services.length === 0) {
      newErrors.general = 'Debes tener al menos un servicio'
      setErrors(newErrors)
      return false
    }

    services.forEach((service, index) => {
      if (!service.name.trim()) {
        newErrors[`service-${index}-name`] = 'El nombre del servicio es requerido'
      }
      if (service.price <= 0) {
        newErrors[`service-${index}-price`] = 'El precio debe ser mayor a 0'
      }
      if (service.duration <= 0) {
        newErrors[`service-${index}-duration`] = 'La duración debe ser mayor a 0'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateServices()) return
    if (!user) return

    setIsLoading(true)
    setErrors({})

    try {
      // Get the business profile first
      const { data: business, error: businessError } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (businessError || !business) {
        setErrors({ submit: 'No se encontró el perfil del negocio. Por favor completa primero los pasos anteriores.' })
        return
      }

      // Clear existing services first
      await supabase
        .from('services')
        .delete()
        .eq('business_id', business.id)

      // Insert new services
      const servicesToInsert = services.map(({id, ...service}) => ({
        ...service,
        business_id: business.id,
        is_active: true
      }))

      const { error: servicesError } = await supabase
        .from('services')
        .insert(servicesToInsert)
        .select()

      if (servicesError) {
        console.error('Error saving services:', servicesError)
        setErrors({ submit: servicesError.message })
        return
      }

      // Mark setup as completed
      await supabase
        .from('business_profiles')
        .update({ setup_completed: true })
        .eq('id', business.id)

      // Success! Navigate to dashboard
      router.push('/dashboard/groomer')

    } catch (error: any) {
      console.error('Error in handleSubmit:', error)
      setErrors({ submit: error?.message || 'Error al guardar servicios' })
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              <Scissors className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Servicios de tu Negocio
            </CardTitle>
            <CardDescription>
              Define los servicios que ofrecerás a tus clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6">
                {services.map((service, index) => (
                  <Card key={service.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold">
                          Servicio {index + 1}
                        </h3>
                        {services.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeService(service.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor={`service-${index}-name`}>
                            Nombre del Servicio *
                          </Label>
                          <Input
                            id={`service-${index}-name`}
                            type="text"
                            value={service.name}
                            onChange={(e) => updateService(service.id, 'name', e.target.value)}
                            className="mt-1"
                            placeholder="Ej: Baño Completo"
                            disabled={isLoading}
                          />
                          {errors[`service-${index}-name`] && (
                            <p className="text-sm text-destructive mt-1">
                              {errors[`service-${index}-name`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor={`service-${index}-category`}>
                            Categoría
                          </Label>
                          <Select
                            value={service.category}
                            onValueChange={(value) => updateService(service.id, 'category', value)}
                            disabled={isLoading}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Selecciona categoría" />
                            </SelectTrigger>
                            <SelectContent>
                              {SERVICE_CATEGORIES.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor={`service-${index}-price`} className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Precio (USD) *
                          </Label>
                          <Input
                            id={`service-${index}-price`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={service.price}
                            onChange={(e) => updateService(service.id, 'price', parseFloat(e.target.value) || 0)}
                            className="mt-1"
                            placeholder="25.00"
                            disabled={isLoading}
                          />
                          {errors[`service-${index}-price`] && (
                            <p className="text-sm text-destructive mt-1">
                              {errors[`service-${index}-price`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor={`service-${index}-duration`} className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Duración (minutos) *
                          </Label>
                          <Input
                            id={`service-${index}-duration`}
                            type="number"
                            min="15"
                            step="15"
                            value={service.duration}
                            onChange={(e) => updateService(service.id, 'duration', parseInt(e.target.value) || 0)}
                            className="mt-1"
                            placeholder="60"
                            disabled={isLoading}
                          />
                          {errors[`service-${index}-duration`] && (
                            <p className="text-sm text-destructive mt-1">
                              {errors[`service-${index}-duration`]}
                            </p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor={`service-${index}-description`}>
                            Descripción
                          </Label>
                          <Textarea
                            id={`service-${index}-description`}
                            value={service.description}
                            onChange={(e) => updateService(service.id, 'description', e.target.value)}
                            className="mt-1"
                            placeholder="Describe qué incluye este servicio..."
                            rows={2}
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addService}
                className="w-full"
                disabled={isLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Otro Servicio
              </Button>

              {errors.general && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{errors.general}</p>
                </div>
              )}

              {errors.submit && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{errors.submit}</p>
                </div>
              )}

              <Separator />

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Atrás
                </Button>

                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando servicios...
                    </>
                  ) : (
                    <>
                      Completar Configuración
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
