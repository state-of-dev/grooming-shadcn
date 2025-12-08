'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Mail, Lock, User, Loader2, Briefcase, Heart, Eye, EyeOff, CheckCircle2, Building2, Phone, MapPin, FileText, DollarSign, Clock, PawPrint } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

export default function RegisterPage() {
  const router = useRouter()
  const { signUp, user, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer' as 'customer' | 'groomer',
    // Groomer fields
    businessName: '',
    address: '',
    phone: '',
    description: '',
    serviceName: '',
    servicePrice: '',
    serviceDuration: '',
    // Customer fields
    petName: '',
    petSpecies: 'dog' as 'dog' | 'cat',
    petBreed: '',
    petWeight: '',
    customerPhone: ''
  })
  const [businessHours, setBusinessHours] = useState({
    lunes: { open: true, start: '09:00', end: '18:00', lunchStart: '', lunchEnd: '' },
    martes: { open: true, start: '09:00', end: '18:00', lunchStart: '', lunchEnd: '' },
    miércoles: { open: true, start: '09:00', end: '18:00', lunchStart: '', lunchEnd: '' },
    jueves: { open: true, start: '09:00', end: '18:00', lunchStart: '', lunchEnd: '' },
    viernes: { open: true, start: '09:00', end: '18:00', lunchStart: '', lunchEnd: '' },
    sábado: { open: false, start: '09:00', end: '18:00', lunchStart: '', lunchEnd: '' },
    domingo: { open: false, start: '09:00', end: '18:00', lunchStart: '', lunchEnd: '' }
  })
  const [globalLunchBreak, setGlobalLunchBreak] = useState({ start: '14:00', end: '15:00' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    console.log('🔍 Register useEffect - User state:', user ? `User ID: ${user.id}` : 'No user')
    if (user) {
      console.log('⚠️ User already logged in, redirecting to /dashboard')
      router.replace('/dashboard')
    }
  }, [user, router])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName) newErrors.fullName = 'Nombre es requerido'
    if (!formData.email) {
      newErrors.email = 'Email es requerido'
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Email inválido'
    }
    if (!formData.password) {
      newErrors.password = 'Contraseña es requerida'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    if (formData.role === 'groomer') {
      if (!formData.businessName) newErrors.businessName = 'Nombre del negocio es requerido'
      if (!formData.phone) newErrors.phone = 'Teléfono es requerido'
      if (!formData.address) newErrors.address = 'Dirección es requerida'
      if (!formData.description) newErrors.description = 'Descripción es requerida'
      if (!formData.serviceName) newErrors.serviceName = 'Nombre del servicio es requerido'
      if (!formData.servicePrice || parseFloat(formData.servicePrice) <= 0) {
        newErrors.servicePrice = 'Precio válido es requerido'
      }
      if (!formData.serviceDuration || parseInt(formData.serviceDuration) <= 0) {
        newErrors.serviceDuration = 'Duración válida es requerida'
      }

      const hasOpenDay = Object.values(businessHours).some(h => h.open)
      if (!hasOpenDay) {
        newErrors.businessHours = 'Selecciona al menos un día abierto'
      }
    }

    if (formData.role === 'customer') {
      if (!formData.petName) newErrors.petName = 'Nombre de la mascota es requerido'
      if (!formData.customerPhone) newErrors.customerPhone = 'Teléfono es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const { data: signUpData, error: signUpError } = await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.role
      )

      if (signUpError) throw signUpError
      if (!signUpData?.user) throw new Error('Usuario no encontrado después del registro')

      const userId = signUpData.user.id

      if (formData.role === 'groomer') {
        const baseSlug = formData.businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        const slug = `${baseSlug}-${Date.now()}`

        const { data: business, error: businessError } = await supabase
          .from('business_profiles')
          .insert({
            owner_id: userId,
            business_name: formData.businessName,
            slug,
            address: formData.address,
            phone: formData.phone,
            description: formData.description,
            business_hours: businessHours,
            setup_completed: true
          })
          .select()
          .single()

        if (businessError) throw businessError

        const { error: serviceError } = await supabase
          .from('services')
          .insert({
            business_id: business.id,
            name: formData.serviceName,
            price: parseFloat(formData.servicePrice),
            duration: parseInt(formData.serviceDuration),
            is_active: true
          })

        if (serviceError) throw serviceError

        const { error: settingsError } = await supabase
          .from('appointment_settings')
          .insert({
            business_id: business.id,
            slot_duration_minutes: 30,
            buffer_time_minutes: 0,
            max_appointments_per_slot: 1,
            min_booking_notice_hours: 2,
            max_booking_advance_days: 30
          })

        if (settingsError && settingsError.code !== '23505') throw settingsError

        const { error: customerError } = await supabase
          .from('customers')
          .insert({
            user_id: userId,
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone
          })

        if (customerError) throw customerError

      } else {
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .insert({
            user_id: userId,
            name: formData.fullName,
            email: formData.email,
            phone: formData.customerPhone
          })
          .select()
          .single()

        if (customerError) throw customerError

        const { error: petError } = await supabase
          .from('pets')
          .insert({
            customer_id: customer.id,
            name: formData.petName,
            species: formData.petSpecies,
            breed: formData.petBreed || null,
            weight: formData.petWeight ? parseFloat(formData.petWeight) : null
          })

        if (petError) throw petError
      }

      setShowSuccessModal(true)

    } catch (error: any) {
      console.error('Error en registro:', error)
      setErrors({ submit: error.message || 'Error al crear cuenta' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    router.push('/login')
  }

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Crear cuenta</CardTitle>
          <CardDescription>Únete a nuestra plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
            <div className="space-y-3">
              {/* <Label>Tipo de cuenta</Label> */}
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'customer' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.role === 'customer'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  disabled={isLoading}
                >
                  <Heart className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-semibold">Cliente</div>
                  <div className="text-xs text-muted-foreground">Busco servicios</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'groomer' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.role === 'groomer'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  disabled={isLoading}
                >
                  <Briefcase className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-semibold">Negocio</div>
                  <div className="text-xs text-muted-foreground">Ofrezco servicios</div>
                </button>
              </div>
            </div>

            {/* Basic fields in 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="pl-10"
                    placeholder="Tu nombre"
                    disabled={isLoading}
                  />
                </div>
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                    placeholder="tu@email.com"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10"
                    placeholder="Mínimo 6 caracteres"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="pl-10"
                    placeholder="Repite tu contraseña"
                    disabled={isLoading}
                  />
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* GROOMER FIELDS */}
            {formData.role === 'groomer' && (
              <>
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-4">Datos del Negocio</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="businessName">Nombre del negocio *</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="businessName"
                          value={formData.businessName}
                          onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                          className="pl-10"
                          placeholder="Ej: Peluquería Canina Bella"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.businessName && <p className="text-sm text-destructive">{errors.businessName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="pl-10"
                          placeholder="+52 55 1234 5678"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                    </div>

                    <div className="space-y-2 md:col-span-3">
                      <Label htmlFor="address">Dirección *</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                          className="pl-10"
                          placeholder="Calle, colonia, ciudad"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                    </div>

                    <div className="space-y-2 md:col-span-3">
                      <Label htmlFor="description">Descripción del negocio *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe tu negocio en pocas palabras"
                        disabled={isLoading}
                        rows={3}
                      />
                      {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-4">Primer Servicio</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-3">
                      <Label htmlFor="serviceName">Nombre del servicio *</Label>
                      <Input
                        id="serviceName"
                        value={formData.serviceName}
                        onChange={(e) => setFormData(prev => ({ ...prev, serviceName: e.target.value }))}
                        placeholder="Ej: Baño completo"
                        disabled={isLoading}
                      />
                      {errors.serviceName && <p className="text-sm text-destructive">{errors.serviceName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="servicePrice">Precio *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="servicePrice"
                          type="number"
                          value={formData.servicePrice}
                          onChange={(e) => setFormData(prev => ({ ...prev, servicePrice: e.target.value }))}
                          className="pl-10"
                          placeholder="350"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.servicePrice && <p className="text-sm text-destructive">{errors.servicePrice}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serviceDuration">Duración (min) *</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="serviceDuration"
                          type="number"
                          value={formData.serviceDuration}
                          onChange={(e) => setFormData(prev => ({ ...prev, serviceDuration: e.target.value }))}
                          className="pl-10"
                          placeholder="60"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.serviceDuration && <p className="text-sm text-destructive">{errors.serviceDuration}</p>}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-4">Horarios</h3>
                  {errors.businessHours && <p className="text-sm text-destructive mb-2">{errors.businessHours}</p>}

                  {/* Global Lunch Break */}
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg space-y-3">
                    <Label className="font-medium">Horario de comida general</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={globalLunchBreak.start}
                        onChange={(e) =>
                          setGlobalLunchBreak(prev => ({ ...prev, start: e.target.value }))
                        }
                        className="h-8 text-sm w-24"
                      />
                      <span className="text-muted-foreground text-sm">a</span>
                      <Input
                        type="time"
                        value={globalLunchBreak.end}
                        onChange={(e) =>
                          setGlobalLunchBreak(prev => ({ ...prev, end: e.target.value }))
                        }
                        className="h-8 text-sm w-24"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setBusinessHours(prev => {
                            const updated = { ...prev }
                            Object.keys(updated).forEach(day => {
                              if (updated[day as keyof typeof updated].open) {
                                updated[day as keyof typeof updated] = {
                                  ...updated[day as keyof typeof updated],
                                  lunchStart: globalLunchBreak.start,
                                  lunchEnd: globalLunchBreak.end
                                }
                              }
                            })
                            return updated
                          })
                        }}
                        className="ml-2"
                      >
                        Aplicar a todos
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    {Object.entries(businessHours).map(([day, hours]) => (
                      <div key={day} className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 w-28">
                            <Checkbox
                              checked={hours.open}
                              onCheckedChange={(checked) =>
                                setBusinessHours(prev => ({
                                  ...prev,
                                  [day]: { ...prev[day as keyof typeof prev], open: checked as boolean }
                                }))
                              }
                            />
                            <Label className="capitalize text-sm">{day}</Label>
                          </div>
                          {hours.open && (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                type="time"
                                value={hours.start}
                                onChange={(e) =>
                                  setBusinessHours(prev => ({
                                    ...prev,
                                    [day]: { ...prev[day as keyof typeof prev], start: e.target.value }
                                  }))
                                }
                                className="h-8 text-sm"
                              />
                              <span className="text-muted-foreground">a</span>
                              <Input
                                type="time"
                                value={hours.end}
                                onChange={(e) =>
                                  setBusinessHours(prev => ({
                                    ...prev,
                                    [day]: { ...prev[day as keyof typeof prev], end: e.target.value }
                                  }))
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                          )}
                        </div>
                        {hours.open && (
                          <div className="flex items-center gap-2 ml-28 pl-2">
                            <Label className="text-xs text-muted-foreground w-20">Comida:</Label>
                            <Input
                              type="time"
                              value={hours.lunchStart || ''}
                              onChange={(e) =>
                                setBusinessHours(prev => ({
                                  ...prev,
                                  [day]: { ...prev[day as keyof typeof prev], lunchStart: e.target.value }
                                }))
                              }
                              className="h-7 text-xs w-20"
                              placeholder="--:--"
                            />
                            <span className="text-muted-foreground text-xs">a</span>
                            <Input
                              type="time"
                              value={hours.lunchEnd || ''}
                              onChange={(e) =>
                                setBusinessHours(prev => ({
                                  ...prev,
                                  [day]: { ...prev[day as keyof typeof prev], lunchEnd: e.target.value }
                                }))
                              }
                              className="h-7 text-xs w-20"
                              placeholder="--:--"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* CUSTOMER FIELDS */}
            {formData.role === 'customer' && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-4">Información de Contacto y Mascota</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="customerPhone">Teléfono *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="customerPhone"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                        className="pl-10"
                        placeholder="+52 55 1234 5678"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.customerPhone && <p className="text-sm text-destructive">{errors.customerPhone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="petName">Nombre de la mascota *</Label>
                    <div className="relative">
                      <PawPrint className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="petName"
                        value={formData.petName}
                        onChange={(e) => setFormData(prev => ({ ...prev, petName: e.target.value }))}
                        className="pl-10"
                        placeholder="Ej: Max"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.petName && <p className="text-sm text-destructive">{errors.petName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="petSpecies">Especie *</Label>
                    <Select
                      value={formData.petSpecies}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, petSpecies: value as 'dog' | 'cat' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dog">Perro</SelectItem>
                        <SelectItem value="cat">Gato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="petWeight">Peso kg (opcional)</Label>
                    <Input
                      id="petWeight"
                      type="number"
                      value={formData.petWeight}
                      onChange={(e) => setFormData(prev => ({ ...prev, petWeight: e.target.value }))}
                      placeholder="15"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="petBreed">Raza (opcional)</Label>
                    <Input
                      id="petBreed"
                      value={formData.petBreed}
                      onChange={(e) => setFormData(prev => ({ ...prev, petBreed: e.target.value }))}
                      placeholder="Ej: Labrador"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            )}

            {errors.submit && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive">
                <p className="text-sm text-destructive text-center">{errors.submit}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando cuenta...</>
              ) : (
                'Crear cuenta'
              )}
            </Button>

            <div className="text-center text-sm">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Inicia sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Success Modal */}
      <AlertDialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-500" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl">
              ¡Registro Exitoso!
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center space-y-3">
                <p className="text-base">
                  Gracias por registrarte. Te hemos enviado un correo de confirmación a:
                </p>
                <p className="font-semibold text-foreground">
                  {formData.email}
                </p>
                <p className="text-sm">
                  Por favor, revisa tu bandeja de entrada y confirma tu cuenta para poder iniciar sesión.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleCloseSuccessModal} className="w-full">
              Ir a Iniciar Sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
