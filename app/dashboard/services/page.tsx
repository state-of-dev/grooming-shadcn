'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useAuthGuard } from '@/lib/hooks/useAuthGuard'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Plus, Loader2, Edit, Trash2, DollarSign, Clock, Save, X } from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string
  duration: number
  price: number
  is_active: boolean
}

export default function ServicesManagementPage() {
  const { businessProfile, loading: authLoading } = useAuthGuard()
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null)

  const loadServices = useCallback(async () => {
    if (!businessProfile) return
    setIsLoading(true)
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', businessProfile.id)
      .order('created_at', { ascending: true })
    if (data) setServices(data)
    setIsLoading(false)
  }, [businessProfile])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  const handleSaveService = async () => {
    if (!editingService || !businessProfile) return

    const serviceData = { ...editingService, business_id: businessProfile.id }

    const { error } = editingService.id
      ? await supabase.from('services').update(serviceData).eq('id', editingService.id)
      : await supabase.from('services').insert(serviceData)

    if (error) {
      alert('Error guardando el servicio.')
    } else {
      setEditingService(null)
      loadServices()
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    const { error } = await supabase.from('services').delete().eq('id', serviceId)
    if (error) {
      alert('Error eliminando el servicio.')
    } else {
      loadServices()
    }
  }

  const handleToggleActive = async (service: Service) => {
    const { error } = await supabase.from('services').update({ is_active: !service.is_active }).eq('id', service.id)
    if (!error) loadServices()
  }

  const ServiceForm = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{editingService?.id ? 'Editar Servicio' : 'Nuevo Servicio'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input value={editingService?.name || ''} onChange={e => setEditingService(s => ({ ...s, name: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Descripción</Label>
          <Textarea value={editingService?.description || ''} onChange={e => setEditingService(s => ({ ...s, description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Precio (USD)</Label>
            <Input type="number" value={editingService?.price || ''} onChange={e => setEditingService(s => ({ ...s, price: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div className="space-y-2">
            <Label>Duración (minutos)</Label>
            <Input type="number" step="15" value={editingService?.duration || ''} onChange={e => setEditingService(s => ({ ...s, duration: parseInt(e.target.value) || 0 }))} />
          </div>
        </div>
        <div className="flex items-center space-x-2">
            <Switch id="is_active" checked={editingService?.is_active ?? true} onCheckedChange={checked => setEditingService(s => ({ ...s, is_active: checked }))} />
            <Label htmlFor="is_active">Activo</Label>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditingService(null)}>Cancelar</Button>
          <Button onClick={handleSaveService}>Guardar</Button>
        </div>
      </CardContent>
    </Card>
  )

  if (authLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestión de Servicios</h1>
          <Button onClick={() => setEditingService({ name: '', description: '', price: 0, duration: 60, is_active: true })}><Plus className="mr-2 h-4 w-4" /> Nuevo Servicio</Button>
        </div>

        {editingService && <ServiceForm />}

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : services.length === 0 ? (
            <p className="text-muted-foreground text-center">No has creado ningún servicio todavía.</p>
          ) : (
            services.map(service => (
              <Card key={service.id} className={!service.is_active ? 'bg-muted/50' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{service.name}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch title={service.is_active ? 'Desactivar' : 'Activar'} checked={service.is_active} onCheckedChange={() => handleToggleActive(service)} />
                      <Button variant="ghost" size="icon" onClick={() => setEditingService(service)}><Edit className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente el servicio.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteService(service.id)}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground"/> ${service.price}</div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground"/> {service.duration} min</div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
