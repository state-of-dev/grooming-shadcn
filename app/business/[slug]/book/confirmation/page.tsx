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
import { useAuth } from '@/lib/auth-context'

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
  const { user } = useAuth()

  const [bookingState, setBookingState] = useState<BookingState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const loadBookingData = async () => {
      // Load booking state from localStorage
      const savedState = localStorage.getItem('booking-state')
      if (!savedState) {
        router.push(`/business/${businessSlug}/book`)
        return
      }

      try {
        const state = JSON.parse(savedState) as BookingState

        // Basic validation
        if (
          state.businessSlug !== businessSlug ||
          state.step !== 'confirmation' ||
          !state.selectedDate ||
          !state.selectedTime
        ) {
          router.push(`/business/${businessSlug}/book`)
          return
        }

        // If user is logged in and customerInfo/petInfo are missing, load them
        if (user && (!state.customerInfo || !state.petInfo)) {
          console.log('Loading customer data for logged in user...')

          const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('id, name, email, phone')
            .eq('user_id', user.id)
            .maybeSingle()

          if (customerError || !customer) {
            console.error('Error loading customer:', customerError)
            setError('No se encontró tu perfil. Por favor completa tus datos primero.')
            setIsLoading(false)
            return
          }

          // Load first pet (if exists)
          const { data: pets } = await supabase
            .from('pets')
            .select('*')
            .eq('customer_id', customer.id)
            .limit(1)

          const pet = pets?.[0]

          // Update state with loaded data
          state.customerInfo = {
            name: customer.name,
            email: customer.email,
            phone: customer.phone
          }

          if (pet) {
            state.petInfo = {
              name: pet.name,
              species: pet.species,
              breed: pet.breed || '',
              weight: pet.weight?.toString() || '',
              notes: pet.notes || ''
            }
            state.petId = pet.id // Store pet ID to avoid creating duplicate
            state.customerId = customer.id // Store customer ID
          } else {
            // No pet found, will create one with minimal data
            state.petInfo = {
              name: 'Mascota',
              species: 'dog',
              breed: '',
              weight: '',
              notes: ''
            }
          }

          // Save updated state
          localStorage.setItem('booking-state', JSON.stringify(state))
        } else if (!state.customerInfo || !state.petInfo) {
          // Guest user without data - redirect back
          router.push(`/business/${businessSlug}/book`)
          return
        }

        setBookingState(state)
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading booking data:', error)
        router.push(`/business/${businessSlug}/book`)
      }
    }

    loadBookingData()
  }, [businessSlug, router, user])

  const handleConfirm = async () => {
    if (!bookingState) return

    setIsCreating(true)
    setError(null)

    try {
      console.log('Starting appointment creation...')
      console.log('Booking state:', bookingState)

      // Step 1: Get customer (should exist if user came from onboarding)
      console.log('Step 1: Getting customer...')
      let customerId: string

      if (user) {
        // User is logged in, get their customer profile
        const { data: existingCustomer, error: customerCheckError } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (customerCheckError) {
          console.error('Error checking customer:', customerCheckError)
          throw new Error('Error al verificar cliente: ' + customerCheckError.message)
        }

        if (existingCustomer) {
          console.log('Customer exists:', existingCustomer.id)
          customerId = existingCustomer.id
        } else {
          // Shouldn't happen if validation worked, but create one just in case
          console.log('Creating customer for logged in user...')
          const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert({
              user_id: user.id,
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
      } else {
        // User not logged in - check by email (existing flow for non-logged users)
        const { data: existingCustomer, error: customerCheckError } = await supabase
          .from('customers')
          .select('id')
          .eq('email', bookingState.customerInfo.email)
          .maybeSingle()

        if (customerCheckError) {
          console.error('Error checking customer:', customerCheckError)
          throw new Error('Error al verificar cliente: ' + customerCheckError.message)
        }

        if (existingCustomer) {
          console.log('Customer exists:', existingCustomer.id)
          customerId = existingCustomer.id
        } else {
          // Guest user - create customer without user_id
          console.log('Creating guest customer...')
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

          console.log('New guest customer created:', newCustomer)
          customerId = newCustomer.id
        }
      }

      // Step 2: Get pet ID (should already exist from onboarding)
      console.log('Step 2: Getting pet ID...')

      let petId: string

      // Check if we already have pet ID from loaded data
      if (bookingState.petId) {
        console.log('Using existing pet ID from booking state:', bookingState.petId)
        petId = bookingState.petId
      } else {
        // Fallback: search for pet by name (shouldn't happen for logged-in users)
        console.log('No pet ID in booking state, searching by name...')
        const { data: existingPet, error: findPetError } = await supabase
          .from('pets')
          .select('*')
          .eq('customer_id', customerId)
          .eq('name', bookingState.petInfo.name)
          .maybeSingle()

        if (findPetError) {
          console.error('Error finding pet:', findPetError)
          throw new Error('Error al buscar mascota: ' + findPetError.message)
        }

        if (existingPet) {
          console.log('Found existing pet:', existingPet.id)
          petId = existingPet.id
        } else {
          // Only create new pet if absolutely necessary (guest users or edge cases)
          console.log('⚠️ Creating new pet (should not happen for logged-in users)...')
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
          petId = newPet.id
        }
      }

      // Step 3: Create appointment
      console.log('Step 3: Creating appointment...')

      // Calculate end_time based on service duration
      const [hours, minutes] = bookingState.selectedTime.split(':')
      const startDate = new Date()
      startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      // Add service duration (in minutes) to start time
      const serviceDuration = bookingState.service.duration || 60 // Default 60 minutes if not specified
      const endDate = new Date(startDate.getTime() + serviceDuration * 60000)
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`

      console.log('Calculated times:', { start: bookingState.selectedTime, end: endTime, duration: serviceDuration })

      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          business_id: bookingState.businessId,
          customer_id: customerId,
          pet_id: petId,
          service_id: bookingState.service.id,
          appointment_date: bookingState.selectedDate,
          start_time: bookingState.selectedTime,
          end_time: endTime,
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
