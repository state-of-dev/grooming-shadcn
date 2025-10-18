'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Building2,
  Globe,
  MapPin,
  Phone,
  Mail,
  Camera,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Instagram,
  Facebook,
  Sparkles,
  Scissors
} from 'lucide-react'

const STEPS = [
  { id: 1, title: 'Información Básica', icon: Building2 },
  { id: 2, title: 'Ubicación y Contacto', icon: MapPin },
  { id: 3, title: 'Branding y Redes', icon: Camera },
  { id: 4, title: 'Finalizar Setup', icon: Check }
]

export default function BusinessSetupPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    businessName: '',
    slug: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    websiteUrl: '',
    instagramHandle: '',
    facebookUrl: '',
    logoUrl: '',
    coverImageUrl: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  const currentStepData = STEPS.find(step => step.id === currentStep)!
  const progress = (currentStep / STEPS.length) * 100

  // Generate slug from business name
  useEffect(() => {
    if (formData.businessName && !formData.slug) {
      const slug = formData.businessName
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.businessName, formData.slug])

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.businessName) newErrors.businessName = 'Nombre del negocio es requerido'
        if (!formData.slug) newErrors.slug = 'Slug es requerido'
        if (formData.slug.length < 3) newErrors.slug = 'Slug debe tener al menos 3 caracteres'
        if (!/^[a-z0-9-]+$/.test(formData.slug)) newErrors.slug = 'Solo letras minúsculas, números y guiones'
        break
      case 2:
        if (!formData.phone) newErrors.phone = 'Teléfono es requerido'
        if (!formData.email) newErrors.email = 'Email es requerido'
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Email inválido'
        }
        if (!formData.address) newErrors.address = 'Dirección es requerida'
        if (!formData.city) newErrors.city = 'Ciudad es requerida'
        if (!formData.state) newErrors.state = 'Estado es requerido'
        break
      case 3:
        // Optional fields, no validation required
        break
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

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) return false

    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('slug')
        .eq('slug', slug)
        .maybeSingle()

      // If there's an error, log it but assume available
      if (error) {
        console.error('Error checking slug:', error)
        return true
      }

      return !data // true if available (no data found)
    } catch (err) {
      console.error('Exception checking slug:', err)
      return true // Available if query fails
    }
  }

  const handleSlugChange = async (newSlug: string) => {
    setFormData(prev => ({ ...prev, slug: newSlug }))

    if (newSlug.length >= 3) {
      const isAvailable = await checkSlugAvailability(newSlug)
      if (!isAvailable) {
        setErrors(prev => ({ ...prev, slug: 'Este slug ya está en uso' }))
      } else {
        setErrors(prev => ({ ...prev, slug: '' }))
      }
    }
  }

  const handleFinish = async () => {
    if (!validateStep(currentStep) || !user) return

    setIsLoading(true)

    try {
      // Check slug availability one more time
      const isSlugAvailable = await checkSlugAvailability(formData.slug)
      if (!isSlugAvailable) {
        setErrors({ slug: 'Este slug ya no está disponible' })
        setCurrentStep(1)
        setIsLoading(false)
        return
      }

      // Create business profile
      const { data: businessProfile, error } = await supabase
        .from('business_profiles')
        .insert({
          owner_id: user.id,
          slug: formData.slug,
          business_name: formData.businessName,
          description: formData.description || null,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postalCode || null,
          website_url: formData.websiteUrl || null,
          instagram_handle: formData.instagramHandle || null,
          facebook_url: formData.facebookUrl || null,
          logo_url: formData.logoUrl || null,
          cover_image_url: formData.coverImageUrl || null,
          is_active: true,
          setup_completed: false // Will be set to true after completing all setup steps
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Redirect to next setup step (business hours)
      router.push('/setup/business-hours')

    } catch (error: any) {
      console.error('Error creating business profile:', error)
      setErrors({ submit: error?.message || 'Error al crear perfil de negocio' })
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
              <Label htmlFor="businessName" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Nombre del Negocio *
              </Label>
              <Input
                id="businessName"
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                className="mt-1"
                placeholder="Ej: Grooming Paradise"
              />
              {errors.businessName && (
                <p className="text-sm text-destructive mt-1">{errors.businessName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="slug" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                URL de tu Negocio *
              </Label>
              <div className="flex items-center mt-1">
                <span className="text-sm text-muted-foreground px-3 py-2 bg-muted border border-r-0 rounded-l-md">
                  https://
                </span>
                <Input
                  id="slug"
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="rounded-none border-x-0"
                  placeholder="tu-negocio"
                />
                <span className="text-sm text-muted-foreground px-3 py-2 bg-muted border border-l-0 rounded-r-md">
                  .grooming.com
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Esta será la URL única de tu perfil de negocio
              </p>
              {errors.slug && (
                <p className="text-sm text-destructive mt-1">{errors.slug}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Descripción (Opcional)
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1"
                placeholder="Cuéntanos sobre tu negocio, especialidades, experiencia..."
                rows={3}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Teléfono *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="mt-1"
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email del Negocio *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1"
                  placeholder="contacto@tunegocio.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Dirección *
              </Label>
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="mt-1"
                placeholder="123 Main Street"
              />
              {errors.address && (
                <p className="text-sm text-destructive mt-1">{errors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">Ciudad *</Label>
                <Input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="mt-1"
                  placeholder="Miami"
                />
                {errors.city && (
                  <p className="text-sm text-destructive mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <Label htmlFor="state">Estado *</Label>
                <Input
                  id="state"
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  className="mt-1"
                  placeholder="FL"
                />
                {errors.state && (
                  <p className="text-sm text-destructive mt-1">{errors.state}</p>
                )}
              </div>

              <div>
                <Label htmlFor="postalCode">Código Postal</Label>
                <Input
                  id="postalCode"
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                  className="mt-1"
                  placeholder="33101"
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="websiteUrl" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Sitio Web (Opcional)
              </Label>
              <Input
                id="websiteUrl"
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                className="mt-1"
                placeholder="https://www.tunegocio.com"
              />
            </div>

            <div>
              <Label htmlFor="instagramHandle" className="flex items-center gap-2">
                <Instagram className="w-4 h-4" />
                Instagram (Opcional)
              </Label>
              <div className="flex items-center mt-1">
                <span className="text-sm text-muted-foreground px-3 py-2 bg-muted border border-r-0 rounded-l-md">
                  @
                </span>
                <Input
                  id="instagramHandle"
                  type="text"
                  value={formData.instagramHandle}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagramHandle: e.target.value }))}
                  className="rounded-l-none border-l-0"
                  placeholder="tunegocio"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="facebookUrl" className="flex items-center gap-2">
                <Facebook className="w-4 h-4" />
                Facebook (Opcional)
              </Label>
              <Input
                id="facebookUrl"
                type="url"
                value={formData.facebookUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, facebookUrl: e.target.value }))}
                className="mt-1"
                placeholder="https://facebook.com/tunegocio"
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="text-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Logo y foto de portada se pueden subir después desde el panel de administración
                </p>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Scissors className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                ¡Todo Listo!
              </h3>
              <p className="text-muted-foreground">
                Tu perfil de negocio está configurado. Continuaremos con la configuración de horarios y servicios.
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6 text-left">
              <h4 className="font-medium text-foreground mb-4">Resumen de tu configuración:</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Negocio:</span>
                  <span className="font-medium text-foreground">{formData.businessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">URL:</span>
                  <span className="font-medium text-foreground">
                    https://{formData.slug}.grooming.com
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ubicación:</span>
                  <span className="font-medium text-foreground">{formData.city}, {formData.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Teléfono:</span>
                  <span className="font-medium text-foreground">{formData.phone}</span>
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{errors.submit}</p>
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

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1 || isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Atrás
              </Button>

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
                      Creando...
                    </>
                  ) : (
                    <>
                      Continuar al Siguiente Paso
                      <ArrowRight className="w-4 h-4 ml-2" />
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
