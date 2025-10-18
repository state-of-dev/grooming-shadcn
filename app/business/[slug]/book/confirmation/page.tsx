'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Check,
  Loader2,
  Calendar,
  Clock,
  User,
  PawPrint,
  DollarSign,
  MapPin
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface BookingState {
  businessSlug: string
  businessId: string
  businessName: string
  service: {
    id: string
    name: string
    description: string
    duration: number
    price: number
  }
  selectedDate: string
  selectedTime: string
  customerInfo: {
    name: string
    email: string
    phone: string
  }
  petInfo: {
    name: string
    species: string
    breed: string
    weight: string
    notes: string
  }
  step: string
}

export default function ConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const businessSlug = params.slug as string

  const [bookingState, setBookingState] = useState<BookingState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Load booking state from localStorage
    const savedState = localStorage.getItem('booking-state')
    if (!savedState) {
      router.push(`/business/${businessSlug}/book`)
      return
    }

    try {
      const state = JSON.parse(savedState) as BookingState
      if (
        state.businessSlug !== businessSlug ||
        state.step !== 'confirmation' ||
        !state.selectedDate ||
        !state.selectedTime ||
        !state.customerInfo ||
        !state.petInfo
      ) {
        router.push(`/business/${businessSlug}/book`)
        return
      }

      setBookingState(state)
      setIsLoading(false)
    } catch (error) {
      router.push(`/business/${businessSlug}/book`)
    }
  }, [businessSlug, router])

  const handleConfirm = async () => {
    if (!bookingState) return

    setIsCreating(true)
    setError(null)

    try {
      console.log('Starting appointment creation...')
      console.log('Booking state:', bookingState)

      // Step 1: Create or get customer
      console.log('Step 1: Creating/getting customer...')
      const { data: existingCustomer, error: customerCheckError } = await supabase
        .from('customers')
        .select('id')
        .eq('email', bookingState.customerInfo.email)
        .maybeSingle()

      if (customerCheckError) {
        console.error('Error checking customer:', customerCheckError)
        throw new Error('Error al verificar cliente: ' + customerCheckError.message)
      }

      let customerId: string

      if (existingCustomer) {
        console.log('Customer exists:', existingCustomer.id)
        customerId = existingCustomer.id
      } else {
        console.log('Creating new customer...')
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            name: bookingState.customerInfo.name,
            email: bookingState.customerInfo.email,
            phone: bookingState.customerInfo.phone
          })
          .select()
          .single()

        if (customerError) {
          console.error('Error creating customer:', customerError)
          throw new Error('Error al crear cliente: ' + customerError.message)
        }

        console.log('New customer created:', newCustomer)
        customerId = newCustomer.id
      }

      // Step 2: Create pet
      console.log('Step 2: Creating pet...')
      const { data: newPet, error: petError } = await supabase
        .from('pets')
        .insert({
          customer_id: customerId,
          name: bookingState.petInfo.name,
          species: bookingState.petInfo.species,
          breed: bookingState.petInfo.breed || null,
          weight: bookingState.petInfo.weight ? parseFloat(bookingState.petInfo.weight) : null,
          notes: bookingState.petInfo.notes || null
        })
        .select()
        .single()

      if (petError) {
        console.error('Error creating pet:', petError)
        throw new Error('Error al crear mascota: ' + petError.message)
      }

      console.log('Pet created:', newPet)

      // Step 3: Create appointment
      console.log('Step 3: Creating appointment...')
      const appointmentDate = new Date(bookingState.selectedDate)
      const [hours, minutes] = bookingState.selectedTime.split(':')

      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          business_id: bookingState.businessId,
          customer_id: customerId,
          pet_id: newPet.id,
          service_id: bookingState.service.id,
          appointment_date: bookingState.selectedDate,
          start_time: bookingState.selectedTime,
          status: 'pending',
          total_amount: bookingState.service.price,
          notes: bookingState.petInfo.notes || null
        })
        .select()
        .single()

      if (appointmentError) {
        console.error('Error creating appointment:', appointmentError)
        throw new Error('Error al crear cita: ' + appointmentError.message)
      }

      console.log('Appointment created successfully:', appointment)

      // Success!
      setSuccess(true)
      localStorage.removeItem('booking-state')

      // Redirect to success page after 2 seconds
      setTimeout(() => {
        router.push('/marketplace?success=true')
      }, 2000)

    } catch (error: any) {
      console.error('Error in handleConfirm:', error)
      setError(error.message || 'Error al crear la cita. Por favor intenta de nuevo.')
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading || !bookingState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">¡Cita Confirmada!</h2>
            <p className="text-muted-foreground mb-4">
              Recibirás un email de confirmación en {bookingState.customerInfo.email}
            </p>
            <div className="text-sm text-muted-foreground">
              Redirigiendo al marketplace...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/business/${businessSlug}/book/pet-info`)}
              disabled={isCreating}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Editar Información
            </Button>
            <Badge variant="secondary">Paso 4 de 4</Badge>
          </div>
          <Progress value={100} className="h-2" />
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Confirma tu Cita</h1>
          <p className="text-xl text-muted-foreground">
            Revisa todos los detalles antes de confirmar
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 mb-8">
          {/* Business & Service */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Negocio y Servicio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Negocio</div>
                <div className="font-semibold text-lg">{bookingState.businessName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Servicio</div>
                <div className="font-semibold">{bookingState.service.name}</div>
                <div className="text-sm text-muted-foreground">{bookingState.service.description}</div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {bookingState.service.duration} minutos
                </div>
                <div className="flex items-center gap-1 text-2xl font-bold">
                  <DollarSign className="w-5 h-5" />
                  {bookingState.service.price}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Fecha y Hora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Fecha</div>
                  <div className="font-semibold">
                    {new Date(bookingState.selectedDate).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Hora</div>
                  <div className="font-semibold">{bookingState.selectedTime}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Tu Información
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="text-sm text-muted-foreground">Nombre</div>
                <div className="font-medium">{bookingState.customerInfo.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{bookingState.customerInfo.email}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Teléfono</div>
                <div className="font-medium">{bookingState.customerInfo.phone}</div>
              </div>
            </CardContent>
          </Card>

          {/* Pet Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PawPrint className="w-5 h-5" />
                Información de Mascota
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="text-sm text-muted-foreground">Nombre</div>
                <div className="font-medium">{bookingState.petInfo.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Especie</div>
                  <div className="font-medium capitalize">{bookingState.petInfo.species}</div>
                </div>
                {bookingState.petInfo.breed && (
                  <div>
                    <div className="text-sm text-muted-foreground">Raza</div>
                    <div className="font-medium">{bookingState.petInfo.breed}</div>
                  </div>
                )}
              </div>
              {bookingState.petInfo.weight && (
                <div>
                  <div className="text-sm text-muted-foreground">Peso</div>
                  <div className="font-medium">{bookingState.petInfo.weight} kg</div>
                </div>
              )}
              {bookingState.petInfo.notes && (
                <div>
                  <div className="text-sm text-muted-foreground">Notas</div>
                  <div className="font-medium">{bookingState.petInfo.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Confirm Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleConfirm}
            disabled={isCreating}
            className="min-w-[200px]"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando Cita...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirmar Cita
              </>
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Al confirmar, aceptas recibir un email de confirmación y recordatorios de tu cita.</p>
        </div>
      </main>
    </div>
  )
}
