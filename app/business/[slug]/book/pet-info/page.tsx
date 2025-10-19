'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  ArrowRight,
  User,
  PawPrint,
  Loader2
} from 'lucide-react'

interface Pet {
  id: string
  name: string
  species: string
  breed: string | null
}

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
  selectedPet?: Pet
  step: string
  customerInfo?: {
    name: string
    email: string
    phone: string
  }
  petInfo?: {
    name: string
    species: string
    breed: string
    weight: string
    notes: string
  }
}

export default function PetInfoPage() {
  const params = useParams()
  const router = useRouter()
  const businessSlug = params.slug as string

  const [bookingState, setBookingState] = useState<BookingState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Customer info
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  // Pet info
  const [petName, setPetName] = useState('')
  const [petSpecies, setPetSpecies] = useState('dog')
  const [petBreed, setPetBreed] = useState('')
  const [petWeight, setPetWeight] = useState('')
  const [petNotes, setPetNotes] = useState('')

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
        state.step !== 'pet-info' ||
        !state.selectedDate ||
        !state.selectedTime
      ) {
        router.push(`/business/${businessSlug}/book`)
        return
      }

      setBookingState(state)

      // Load saved form data if exists
      if (state.customerInfo) {
        setCustomerName(state.customerInfo.name)
        setCustomerEmail(state.customerInfo.email)
        setCustomerPhone(state.customerInfo.phone)
      }
      if (state.petInfo) {
        setPetName(state.petInfo.name)
        setPetSpecies(state.petInfo.species)
        setPetBreed(state.petInfo.breed || '')
        setPetWeight(state.petInfo.weight || '')
        setPetNotes(state.petInfo.notes || '')
      }

      setIsLoading(false)
    } catch (error) {
      router.push(`/business/${businessSlug}/book`)
    }
  }, [businessSlug, router])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    // Customer validation
    if (!customerName.trim()) newErrors.customerName = 'Nombre es requerido'
    if (!customerEmail.trim()) {
      newErrors.customerEmail = 'Email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      newErrors.customerEmail = 'Email inválido'
    }
    if (!customerPhone.trim()) newErrors.customerPhone = 'Teléfono es requerido'

    // Pet validation
    if (!petName.trim()) newErrors.petName = 'Nombre de la mascota es requerido'
    if (!petSpecies) newErrors.petSpecies = 'Especie es requerida'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (!validate() || !bookingState) return

    // Update booking state with form data
    const updatedState: BookingState = {
      ...bookingState,
      customerInfo: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone
      },
      petInfo: {
        name: petName,
        species: petSpecies,
        breed: petBreed,
        weight: petWeight,
        notes: petNotes
      },
      step: 'confirmation'
    }

    localStorage.setItem('booking-state', JSON.stringify(updatedState))
    router.push(`/business/${businessSlug}/book/confirmation`)
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/business/${businessSlug}/book/datetime`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cambiar Fecha
            </Button>
            <Badge variant="secondary">Paso 3 de 4</Badge>
          </div>
          <Progress value={75} className="h-2" />
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">{bookingState.businessName}</h1>
          <p className="text-xl text-muted-foreground">
            Información de contacto y mascota
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Tus Datos
                </CardTitle>
                <CardDescription>
                  Necesitamos tu información para confirmar la cita
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Nombre Completo *</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                  />
                  {errors.customerName && (
                    <p className="text-sm text-destructive mt-1">{errors.customerName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerEmail">Email *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="tu@email.com"
                  />
                  {errors.customerEmail && (
                    <p className="text-sm text-destructive mt-1">{errors.customerEmail}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerPhone">Teléfono *</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.customerPhone && (
                    <p className="text-sm text-destructive mt-1">{errors.customerPhone}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pet Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PawPrint className="w-5 h-5" />
                  Información de tu Mascota
                </CardTitle>
                <CardDescription>
                  Ayúdanos a conocer mejor a tu mascota
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="petName">Nombre de la Mascota *</Label>
                  <Input
                    id="petName"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder="Ej: Max"
                  />
                  {errors.petName && (
                    <p className="text-sm text-destructive mt-1">{errors.petName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="petSpecies">Especie *</Label>
                  <Select value={petSpecies} onValueChange={setPetSpecies}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona especie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">Perro</SelectItem>
                      <SelectItem value="cat">Gato</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.petSpecies && (
                    <p className="text-sm text-destructive mt-1">{errors.petSpecies}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="petBreed">Raza (Opcional)</Label>
                    <Input
                      id="petBreed"
                      value={petBreed}
                      onChange={(e) => setPetBreed(e.target.value)}
                      placeholder="Ej: Labrador"
                    />
                  </div>

                  <div>
                    <Label htmlFor="petWeight">Peso (kg, Opcional)</Label>
                    <Input
                      id="petWeight"
                      type="number"
                      value={petWeight}
                      onChange={(e) => setPetWeight(e.target.value)}
                      placeholder="Ej: 25"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="petNotes">Notas Especiales (Opcional)</Label>
                  <Textarea
                    id="petNotes"
                    value={petNotes}
                    onChange={(e) => setPetNotes(e.target.value)}
                    placeholder="Alergias, comportamiento, preferencias..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Continue Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleContinue}
            >
              Continuar a Confirmación
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Sidebar - Booking Summary */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">SERVICIO</div>
                  <div className="font-semibold">{bookingState.service.name}</div>
                  <div className="text-muted-foreground">${bookingState.service.price}</div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1">FECHA Y HORA</div>
                  <div className="font-semibold">
                    {new Date(bookingState.selectedDate).toLocaleDateString('es-ES', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-muted-foreground">{bookingState.selectedTime}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
