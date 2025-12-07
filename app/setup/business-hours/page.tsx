'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import {
  Clock,
  ArrowRight,
  Loader2,
  CheckCircle,
  Plus,
  Trash2,
  XCircle
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

interface DayHours {
  open: boolean
  start: string
  end: string
  lunchStart?: string
  lunchEnd?: string
}

interface BusinessHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

const DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
] as const

const DEFAULT_HOURS: BusinessHours = {
  monday: { open: true, start: '09:00', end: '18:00', lunchStart: '', lunchEnd: '' },
  tuesday: { open: true, start: '09:00', end: '18:00', lunchStart: '', lunchEnd: '' },
  wednesday: { open: true, start: '09:00', end: '18:00', lunchStart: '', lunchEnd: '' },
  thursday: { open: true, start: '09:00', end: '18:00', lunchStart: '', lunchEnd: '' },
  friday: { open: true, start: '09:00', end: '19:00', lunchStart: '', lunchEnd: '' },
  saturday: { open: true, start: '08:00', end: '16:00', lunchStart: '', lunchEnd: '' },
  sunday: { open: false, start: '09:00', end: '17:00', lunchStart: '', lunchEnd: '' }
}

export default function BusinessHoursSetup() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [businessHours, setBusinessHours] = useState<BusinessHours>(DEFAULT_HOURS)
  const [businessName, setBusinessName] = useState('')
  const [globalLunchBreak, setGlobalLunchBreak] = useState({ enabled: false, start: '14:00', end: '15:00' })
  const [blockedTimes, setBlockedTimes] = useState<Array<{ day?: string, start: string, end: string, recurring: boolean }>>([])

  // Apply global lunch break to all open days
  useEffect(() => {
    if (globalLunchBreak.enabled) {
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
    }
  }, [globalLunchBreak.enabled, globalLunchBreak.start, globalLunchBreak.end])

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

  useEffect(() => {
    if (user && profile?.role === 'groomer') {
      loadBusinessData()
    }
  }, [user, profile])

  const loadBusinessData = async () => {
    try {
      const { data: business, error } = await supabase
        .from('business_profiles')
        .select('business_name, business_hours')
        .eq('owner_id', user!.id)
        .maybeSingle()

      if (error) {
        console.error('Supabase error loading business:', error)
        setErrors({ load: 'Error al cargar el perfil del negocio: ' + error.message })
        return
      }

      if (!business) {
        setErrors({ load: 'No se encontró el perfil del negocio. Por favor completa primero la información básica.' })
        return
      }

      setBusinessName(business.business_name || '')

      // Load existing hours if available
      if (business.business_hours && typeof business.business_hours === 'object') {
        setBusinessHours(business.business_hours as BusinessHours)
      }
    } catch (error: any) {
      console.error('Error loading business data:', error)
      setErrors({ load: 'Error al cargar datos del negocio: ' + (error?.message || 'Error desconocido') })
    } finally {
      setIsLoadingData(false)
    }
  }

  const updateDayHours = (day: keyof BusinessHours, field: keyof DayHours, value: boolean | string) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

  const copyHoursToAll = () => {
    const mondayHours = businessHours.monday
    const newHours = { ...businessHours }

    Object.keys(newHours).forEach(day => {
      if (day !== 'sunday') { // Keep Sunday separate
        newHours[day as keyof BusinessHours] = { ...mondayHours }
      }
    })

    setBusinessHours(newHours)
  }

  const validateHours = () => {
    const newErrors: Record<string, string> = {}

    // Check if at least one day is open
    const hasOpenDays = Object.values(businessHours).some(day => day.open)
    if (!hasOpenDays) {
      newErrors.general = 'Debes estar abierto al menos un día'
      setErrors(newErrors)
      return false
    }

    // Validate each open day has valid times
    Object.entries(businessHours).forEach(([dayKey, day]) => {
      if (day.open) {
        if (!day.start || !day.end) {
          newErrors[dayKey] = 'Horarios requeridos para días abiertos'
        } else {
          const startTime = new Date(`2000-01-01T${day.start}:00`)
          const endTime = new Date(`2000-01-01T${day.end}:00`)

          if (startTime >= endTime) {
            newErrors[dayKey] = 'La hora de cierre debe ser después de la apertura'
          }
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateHours()) return
    if (!user) return

    setIsLoading(true)
    setErrors({})

    try {
      const { error: updateError } = await supabase
        .from('business_profiles')
        .update({
          business_hours: businessHours,
          blocked_times: blockedTimes.length > 0 ? blockedTimes : null
        })
        .eq('owner_id', user.id)

      if (updateError) {
        setErrors({ submit: updateError.message })
        return
      }

      // Success! Navigate to services setup
      router.push('/setup/services-setup')

    } catch (error: any) {
      console.error('Error saving hours:', error)
      setErrors({ submit: error?.message || 'Error al guardar horarios' })
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando datos del negocio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              <Clock className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Horarios de Atención
            </CardTitle>
            <CardDescription>
              Define los horarios en que {businessName} estará disponible para recibir citas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errors.load && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 mb-6">
                <p className="text-sm text-destructive">{errors.load}</p>
                <Button
                  variant="outline"
                  onClick={() => router.push('/setup/business')}
                  className="mt-3"
                >
                  Ir a Información Básica
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Quick Actions */}
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <div>
                  <h3 className="font-semibold">Configuración Rápida</h3>
                  <p className="text-sm text-muted-foreground">
                    Aplica los horarios de lunes a todos los días laborales
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyHoursToAll}
                  disabled={isLoading}
                >
                  Copiar a Todos
                </Button>
              </div>

              {/* Global Lunch Break */}
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Horario de Comida General</Label>
                      <Button
                        type="button"
                        variant={globalLunchBreak.enabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGlobalLunchBreak(prev => ({ ...prev, enabled: !prev.enabled }))}
                        disabled={isLoading}
                        className={globalLunchBreak.enabled ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {globalLunchBreak.enabled ? 'Habilitado' : 'Deshabilitado'}
                      </Button>
                    </div>
                    {globalLunchBreak.enabled && (
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <Label className="text-sm text-muted-foreground">Inicio de Comida</Label>
                          <Input
                            type="time"
                            value={globalLunchBreak.start}
                            onChange={(e) => setGlobalLunchBreak(prev => ({ ...prev, start: e.target.value }))}
                            className="mt-1"
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Fin de Comida</Label>
                          <Input
                            type="time"
                            value={globalLunchBreak.end}
                            onChange={(e) => setGlobalLunchBreak(prev => ({ ...prev, end: e.target.value }))}
                            className="mt-1"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    )}
                    {globalLunchBreak.enabled && (
                      <p className="text-xs text-muted-foreground">
                        Este horario se aplicará automáticamente a todos los días abiertos. Puedes editarlo individualmente por día después.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Days Configuration */}
              <div className="space-y-4">
                {DAYS.map(({ key, label }) => {
                  const dayHours = businessHours[key]
                  return (
                    <Card key={key}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <Label className="text-base font-semibold">
                            {label}
                          </Label>
                          <Button
                            type="button"
                            variant={dayHours.open ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateDayHours(key, 'open', !dayHours.open)}
                            disabled={isLoading}
                            className={dayHours.open ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            {dayHours.open ? 'Abierto' : 'Cerrado'}
                          </Button>
                        </div>

                        {dayHours.open && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`${key}-start`} className="text-sm text-muted-foreground">
                                  Hora de Apertura
                                </Label>
                                <Input
                                  id={`${key}-start`}
                                  type="time"
                                  value={dayHours.start}
                                  onChange={(e) => updateDayHours(key, 'start', e.target.value)}
                                  className="mt-1"
                                  disabled={isLoading}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`${key}-end`} className="text-sm text-muted-foreground">
                                  Hora de Cierre
                                </Label>
                                <Input
                                  id={`${key}-end`}
                                  type="time"
                                  value={dayHours.end}
                                  onChange={(e) => updateDayHours(key, 'end', e.target.value)}
                                  className="mt-1"
                                  disabled={isLoading}
                                />
                              </div>
                            </div>
                            {!globalLunchBreak.enabled && (
                              <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-muted">
                                <div>
                                  <Label htmlFor={`${key}-lunch-start`} className="text-xs text-muted-foreground">
                                    Comida - Inicio (opcional)
                                  </Label>
                                  <Input
                                    id={`${key}-lunch-start`}
                                    type="time"
                                    value={dayHours.lunchStart || ''}
                                    onChange={(e) => updateDayHours(key, 'lunchStart', e.target.value)}
                                    className="mt-1 h-8 text-sm"
                                    disabled={isLoading}
                                    placeholder="--:--"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`${key}-lunch-end`} className="text-xs text-muted-foreground">
                                    Comida - Fin (opcional)
                                  </Label>
                                  <Input
                                    id={`${key}-lunch-end`}
                                    type="time"
                                    value={dayHours.lunchEnd || ''}
                                    onChange={(e) => updateDayHours(key, 'lunchEnd', e.target.value)}
                                    className="mt-1 h-8 text-sm"
                                    disabled={isLoading}
                                    placeholder="--:--"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {errors[key] && (
                          <p className="text-sm text-destructive mt-2">{errors[key]}</p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Blocked Times Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Horarios Bloqueados</CardTitle>
                      <CardDescription>Bloquea horarios específicos donde no recibirás citas</CardDescription>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setBlockedTimes(prev => [...prev, { start: '12:00', end: '13:00', recurring: false }])}
                      disabled={isLoading}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Bloqueo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {blockedTimes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay horarios bloqueados. Agrega uno para comenzar.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {blockedTimes.map((blocked, index) => (
                        <Card key={index} className="bg-muted/30">
                          <CardContent className="pt-4 space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="flex-1 space-y-3">
                                {/* Day Selector */}
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={!blocked.recurring}
                                    onCheckedChange={(checked) => {
                                      const updated = [...blockedTimes]
                                      updated[index].recurring = !checked
                                      if (checked) updated[index].day = 'monday'
                                      else delete updated[index].day
                                      setBlockedTimes(updated)
                                    }}
                                  />
                                  <Label className="text-sm">Día específico</Label>
                                  {!blocked.recurring && (
                                    <select
                                      value={blocked.day || 'monday'}
                                      onChange={(e) => {
                                        const updated = [...blockedTimes]
                                        updated[index].day = e.target.value
                                        setBlockedTimes(updated)
                                      }}
                                      className="ml-2 h-8 rounded-md border border-input bg-background px-3 py-1 text-sm"
                                    >
                                      {DAYS.map(({ key, label }) => (
                                        <option key={key} value={key}>{label}</option>
                                      ))}
                                    </select>
                                  )}
                                  {blocked.recurring && (
                                    <span className="ml-2 text-xs text-muted-foreground">(Todos los días)</span>
                                  )}
                                </div>

                                {/* Time Range */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Hora de Inicio</Label>
                                    <Input
                                      type="time"
                                      value={blocked.start}
                                      onChange={(e) => {
                                        const updated = [...blockedTimes]
                                        updated[index].start = e.target.value
                                        setBlockedTimes(updated)
                                      }}
                                      className="mt-1 h-8 text-sm"
                                      disabled={isLoading}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Hora de Fin</Label>
                                    <Input
                                      type="time"
                                      value={blocked.end}
                                      onChange={(e) => {
                                        const updated = [...blockedTimes]
                                        updated[index].end = e.target.value
                                        setBlockedTimes(updated)
                                      }}
                                      className="mt-1 h-8 text-sm"
                                      disabled={isLoading}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Delete Button */}
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setBlockedTimes(prev => prev.filter((_, i) => i !== index))}
                                disabled={isLoading}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

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

              {/* Info Box */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-primary mb-1">¡Casi terminamos!</h4>
                    <p className="text-sm text-muted-foreground">
                      Una vez configurados tus horarios, los clientes podrán agendar citas solamente
                      durante estas horas. Podrás modificar los horarios cuando quieras desde tu panel.
                    </p>
                  </div>
                </div>
              </div>

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
                      Guardando horarios...
                    </>
                  ) : (
                    <>
                      Continuar a Servicios
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
