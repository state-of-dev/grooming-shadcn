'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  User,
  Phone,
  MapPin,
  PawPrint,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  X
} from 'lucide-react'

const STEPS = [
  { id: 1, title: 'Tus Datos', icon: User },
  { id: 2, title: 'Tu Mascota', icon: PawPrint }
]

export default function CustomerOnboarding() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/marketplace'

  const { user, profile, loading: authLoading } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Customer data
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  })

  // Pet data (optional)
  const [petData, setPetData] = useState({
    name: '',
    species: 'dog' as 'dog' | 'cat',
    breed: '',
    weight: '',
    notes: ''
  })

  const [skipPet, setSkipPet] = useState(false)

  // Redirect if not logged in or not a customer
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login')
    }
    if (profile && profile.role !== 'customer') {
      router.replace('/dashboard/groomer')
    }
  }, [user, profile, authLoading, router])

  // Check if customer already has a profile
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) return

      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingCustomer) {
        // Already has a profile, redirect
        router.replace(returnTo)
      }
    }

    if (user && profile?.role === 'customer') {
      checkExistingProfile()
    }
  }, [user, profile, router, returnTo])

  const currentStepData = STEPS.find(step => step.id === currentStep)!
  const progress = (currentStep / STEPS.length) * 100

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!customerData.name.trim()) newErrors.name = 'Nombre es requerido'
      if (!customerData.phone.trim()) newErrors.phone = 'Teléfono es requerido'
    }

    if (step === 2 && !skipPet) {
      if (!petData.name.trim()) newErrors.petName = 'Nombre de la mascota es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSkip = () => {
    router.push(returnTo)
  }

  const handleFinish = async () => {
    if (!user) return

    // Validate current step
    if (!validateStep(currentStep)) return

    setIsLoading(true)
    setErrors({})

    try {
      // Check if customer already exists
      const { data: existingCheck } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingCheck) {
        console.log('Customer already exists, redirecting...')
        router.push(returnTo)
        return
      }

      // Create customer record
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          name: customerData.name,
          email: user.email!,
          phone: customerData.phone,
          notes: customerData.notes || null
        })
        .select()
        .single()

      if (customerError) {
        console.error('Error creating customer:', customerError)
        setErrors({ submit: 'Error al crear perfil: ' + customerError.message })
        return
      }

      // Create pet if not skipped
      if (!skipPet && petData.name.trim()) {
        const { error: petError } = await supabase
          .from('pets')
          .insert({
            customer_id: newCustomer.id,
            name: petData.name,
            species: petData.species,
            breed: petData.breed || null,
            weight: petData.weight ? parseFloat(petData.weight) : null,
            notes: petData.notes || null
          })

        if (petError) {
          console.error('Error creating pet:', petError)
          // Don't block the flow, just log the error
        }
      }

      // Success! Redirect to return URL
      router.push(returnTo)

    } catch (error: any) {
      console.error('Error in handleFinish:', error)
      setErrors({ submit: error?.message || 'Error al guardar datos' })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nombre Completo *
              </Label>
              <Input
                id="name"
                type="text"
                value={customerData.name}
                onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
                placeholder="Juan Pérez"
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Teléfono *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={customerData.phone}
                onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                className="mt-1"
                placeholder="+52 55 1234-5678"
              />
              {errors.phone && (
                <p className="text-sm text-destructive mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Dirección (Opcional)
              </Label>
              <Input
                id="address"
                type="text"
                value={customerData.address}
                onChange={(e) => setCustomerData(prev => ({ ...prev, address: e.target.value }))}
                className="mt-1"
                placeholder="Calle, Número, Colonia"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notas Adicionales (Opcional)</Label>
              <Textarea
                id="notes"
                value={customerData.notes}
                onChange={(e) => setCustomerData(prev => ({ ...prev, notes: e.target.value }))}
                className="mt-1"
                placeholder="Preferencias, alergias, etc."
                rows={3}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            {!skipPet ? (
              <>
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    Registra tu primera mascota para agilizar futuras citas
                  </p>
                </div>

                <div>
                  <Label htmlFor="petName" className="flex items-center gap-2">
                    <PawPrint className="w-4 h-4" />
                    Nombre de la Mascota *
                  </Label>
                  <Input
                    id="petName"
                    type="text"
                    value={petData.name}
                    onChange={(e) => setPetData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                    placeholder="Firulais"
                  />
                  {errors.petName && (
                    <p className="text-sm text-destructive mt-1">{errors.petName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="species">Especie *</Label>
                  <Select
                    value={petData.species}
                    onValueChange={(value: 'dog' | 'cat') => setPetData(prev => ({ ...prev, species: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">Perro</SelectItem>
                      <SelectItem value="cat">Gato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="breed">Raza (Opcional)</Label>
                    <Input
                      id="breed"
                      type="text"
                      value={petData.breed}
                      onChange={(e) => setPetData(prev => ({ ...prev, breed: e.target.value }))}
                      className="mt-1"
                      placeholder="Labrador"
                    />
                  </div>

                  <div>
                    <Label htmlFor="weight">Peso (kg) (Opcional)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={petData.weight}
                      onChange={(e) => setPetData(prev => ({ ...prev, weight: e.target.value }))}
                      className="mt-1"
                      placeholder="15"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="petNotes">Notas sobre la Mascota (Opcional)</Label>
                  <Textarea
                    id="petNotes"
                    value={petData.notes}
                    onChange={(e) => setPetData(prev => ({ ...prev, notes: e.target.value }))}
                    className="mt-1"
                    placeholder="Comportamiento, condiciones especiales, etc."
                    rows={3}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSkipPet(true)}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Omitir este paso
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <PawPrint className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Registro de mascota omitido</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Podrás agregar tus mascotas más tarde desde tu perfil o al agendar una cita
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSkipPet(false)}
                  className="mt-2"
                >
                  Registrar mascota ahora
                </Button>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Completa tu Perfil
          </h1>
          <p className="text-muted-foreground">
            Ayúdanos a conocerte mejor para brindarte el mejor servicio
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <currentStepData.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {currentStepData.title}
                  </CardTitle>
                  <CardDescription>
                    Paso {currentStep} de {STEPS.length}
                  </CardDescription>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {Math.round(progress)}%
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>

          <CardContent>
            <div className="mb-8">
              {renderStepContent()}
            </div>

            {errors.submit && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 mb-4">
                <p className="text-sm text-destructive">{errors.submit}</p>
              </div>
            )}

            <div className="flex justify-between gap-4">
              {currentStep === 1 ? (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={isLoading}
                >
                  Omitir por ahora
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isLoading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Atrás
                </Button>
              )}

              {currentStep < STEPS.length ? (
                <Button
                  onClick={handleNext}
                  disabled={isLoading}
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Completar
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
