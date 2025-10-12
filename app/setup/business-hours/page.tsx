'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useAuthGuard } from '@/lib/hooks/useAuthGuard'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, Loader2, AlertCircle } from 'lucide-react'

const DAYS = [
  { key: 'monday', name: 'Lunes' },
  { key: 'tuesday', name: 'Martes' },
  { key: 'wednesday', name: 'Miércoles' },
  { key: 'thursday', name: 'Jueves' },
  { key: 'friday', name: 'Viernes' },
  { key: 'saturday', name: 'Sábado' },
  { key: 'sunday', name: 'Domingo' },
]

const TIME_SLOTS = Array.from({ length: 25 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8
  const minute = i % 2 === 0 ? '00' : '30'
  return `${String(hour).padStart(2, '0')}:${minute}`
})

type BusinessHours = Record<string, { isOpen: boolean; openTime: string; closeTime: string }>

export default function BusinessHoursPage() {
  const { user, businessProfile, loading: authLoading } = useAuthGuard()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null)

  useEffect(() => {
    if (businessProfile?.business_hours) {
      setBusinessHours(businessProfile.business_hours as BusinessHours)
    } else {
      const defaultHours: BusinessHours = {}
      DAYS.forEach((day, index) => {
        if (index < 5) { // Mon-Fri
          defaultHours[day.key] = { isOpen: true, openTime: '09:00', closeTime: '17:00' }
        } else if (index === 5) { // Sat
          defaultHours[day.key] = { isOpen: true, openTime: '09:00', closeTime: '14:00' }
        } else { // Sun
          defaultHours[day.key] = { isOpen: false, openTime: '09:00', closeTime: '17:00' }
        }
      })
      setBusinessHours(defaultHours)
    }
  }, [businessProfile])

  const handleDayToggle = (dayKey: string) => {
    setBusinessHours((prev) => (prev ? { ...prev, [dayKey]: { ...prev[dayKey], isOpen: !prev[dayKey].isOpen } } : null))
  }

  const handleTimeChange = (dayKey: string, type: 'openTime' | 'closeTime', value: string) => {
    setBusinessHours((prev) => (prev ? { ...prev, [dayKey]: { ...prev[dayKey], [type]: value } } : null))
  }

  const validateHours = () => {
    if (!businessHours) return false
    const newErrors: Record<string, string> = {}
    Object.entries(businessHours).forEach(([dayKey, hours]) => {
      if (hours.isOpen && hours.openTime >= hours.closeTime) {
        newErrors[dayKey] = 'La hora de apertura debe ser anterior a la de cierre'
      }
    })
    if (!Object.values(businessHours).some((h) => h.isOpen)) {
      newErrors.general = 'Debes tener al menos un día abierto'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateHours() || !businessProfile) return

    setIsLoading(true)
    setErrors({})

    try {
      const { error } = await supabase
        .from('business_profiles')
        .update({ business_hours: businessHours, updated_at: new Date().toISOString() })
        .eq('id', businessProfile.id)

      if (error) throw error

      router.push('/setup/services-setup')
    } catch (error: any) {
      setErrors({ submit: error.message || 'Error al guardar horarios' })
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || !businessHours) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="min-h-screen bg-muted/50 p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-6 py-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Horarios de Atención</h1>
          <p className="text-muted-foreground">Paso 2: Define cuándo estará abierto tu negocio.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Define tus horas</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {DAYS.map((day) => (
                <div key={day.key} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`switch-${day.key}`} className="text-lg font-medium">{day.name}</Label>
                    <Switch
                      id={`switch-${day.key}`}
                      checked={businessHours[day.key]?.isOpen}
                      onCheckedChange={() => handleDayToggle(day.key)}
                      disabled={isLoading}
                    />
                  </div>
                  {businessHours[day.key]?.isOpen && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Apertura</Label>
                        <Select onValueChange={(value) => handleTimeChange(day.key, 'openTime', value)} defaultValue={businessHours[day.key].openTime}>
                          <SelectTrigger disabled={isLoading}><SelectValue /></SelectTrigger>
                          <SelectContent>{TIME_SLOTS.map(time => <SelectItem key={`open-${time}`} value={time}>{time}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Cierre</Label>
                        <Select onValueChange={(value) => handleTimeChange(day.key, 'closeTime', value)} defaultValue={businessHours[day.key].closeTime}>
                          <SelectTrigger disabled={isLoading}><SelectValue /></SelectTrigger>
                          <SelectContent>{TIME_SLOTS.map(time => <SelectItem key={`close-${time}`} value={time}>{time}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  {errors[day.key] && <p className="text-sm text-destructive mt-2">{errors[day.key]}</p>}
                </div>
              ))}
              {errors.general && (
                 <div className="p-3 my-2 rounded-md bg-destructive/10 border border-destructive/50 text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <p>{errors.general}</p>
                </div>
              )}
              {errors.submit && (
                 <div className="p-3 my-2 rounded-md bg-destructive/10 border border-destructive/50 text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <p>{errors.submit}</p>
                </div>
              )}
              <div className="flex justify-between pt-4">
                 <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>Atrás</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : 'Guardar y Continuar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
