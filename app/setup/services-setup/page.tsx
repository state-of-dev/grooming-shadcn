'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useAuthGuard } from '@/lib/hooks/useAuthGuard'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Scissors, Plus, Trash2, Loader2, AlertCircle, DollarSign, Clock } from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string
  duration: number // in minutes
  price: number
  category: string
}

const SERVICE_CATEGORIES = ['Corte', 'Baño', 'Cuidado de Uñas', 'Especial', 'Paquete']

const DEFAULT_SERVICES: Omit<Service, 'id'>[] = [
  { name: 'Baño Básico', description: 'Baño completo con champú y secado.', duration: 60, price: 25, category: 'Baño' },
  { name: 'Corte y Baño', description: 'Corte de pelo profesional más baño completo.', duration: 90, price: 45, category: 'Corte' },
  { name: 'Corte de Uñas', description: 'Corte y limado profesional de uñas.', duration: 30, price: 15, category: 'Cuidado de Uñas' },
]

export default function ServicesSetupPage() {
  const { businessProfile, loading: authLoading } = useAuthGuard()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [services, setServices] = useState<Service[]>([])

  useEffect(() => {
    // For now, we start with default services. Later, we can fetch existing ones.
    setServices(DEFAULT_SERVICES.map(s => ({ ...s, id: crypto.randomUUID() })))
  }, [])

  const addService = () => {
    setServices(prev => [...prev, { id: crypto.randomUUID(), name: '', description: '', duration: 60, price: 0, category: 'Corte' }])
  }

  const removeService = (id: string) => {
    setServices(prev => prev.filter(service => service.id !== id))
  }

  const updateService = (id: string, field: keyof Service, value: string | number) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const validateServices = () => {
    const newErrors: Record<string, string> = {}
    if (services.length === 0) {
      newErrors.general = 'Debes agregar al menos un servicio.'
    } else {
      services.forEach((service, index) => {
        if (!service.name.trim()) newErrors[`name-${index}`] = 'El nombre es requerido.'
        if (service.price <= 0) newErrors[`price-${index}`] = 'El precio debe ser positivo.'
        if (service.duration < 15) newErrors[`duration-${index}`] = 'La duración debe ser de al menos 15 min.'
      })
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateServices() || !businessProfile) return

    setIsLoading(true)
    setErrors({})

    try {
      // Per the source file's logic, we delete existing and insert new ones.
      const { error: deleteError } = await supabase.from('services').delete().eq('business_id', businessProfile.id)
      if (deleteError) throw deleteError

      const servicesToInsert = services.map(({ id, ...service }) => ({
        ...service,
        business_id: businessProfile.id,
      }))

      const { error: insertError } = await supabase.from('services').insert(servicesToInsert)
      if (insertError) throw insertError

      router.push('/setup/portfolio-setup')
    } catch (error: any) {
      setErrors({ submit: error.message || 'Error al guardar los servicios.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || !businessProfile) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="min-h-screen bg-muted/50 p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Tus Servicios</h1>
          <p className="text-muted-foreground">Paso 3: Define los servicios que ofrecerás a tus clientes.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {services.map((service, index) => (
              <Card key={service.id}>
                <CardContent className="p-4">
                  <div className="flex justify-end mb-2">
                    {services.length > 1 && <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeService(service.id)}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`name-${index}`}>Nombre del Servicio</Label>
                      <Input id={`name-${index}`} value={service.name} onChange={e => updateService(service.id, 'name', e.target.value)} placeholder="Ej: Baño Completo" />
                      {errors[`name-${index}`] && <p className="text-sm text-destructive">{errors[`name-${index}`]}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`price-${index}`}>Precio (USD)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input id={`price-${index}`} type="number" value={service.price} onChange={e => updateService(service.id, 'price', parseFloat(e.target.value) || 0)} placeholder="25.00" className="pl-9" />
                      </div>
                      {errors[`price-${index}`] && <p className="text-sm text-destructive">{errors[`price-${index}`]}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`duration-${index}`}>Duración (minutos)</Label>
                       <div className="relative">
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input id={`duration-${index}`} type="number" step="15" value={service.duration} onChange={e => updateService(service.id, 'duration', parseInt(e.target.value) || 0)} placeholder="60" className="pl-9" />
                      </div>
                      {errors[`duration-${index}`] && <p className="text-sm text-destructive">{errors[`duration-${index}`]}</p>}
                    </div>
                     <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`description-${index}`}>Descripción</Label>
                      <Textarea id={`description-${index}`} value={service.description} onChange={e => updateService(service.id, 'description', e.target.value)} placeholder="Describe qué incluye este servicio..." />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button type="button" variant="outline" onClick={addService} className="w-full"><Plus className="mr-2 h-4 w-4" />Agregar Servicio</Button>
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
      </div>
    </div>
  )
}
