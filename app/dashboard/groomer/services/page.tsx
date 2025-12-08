'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Edit, Trash2, ArrowLeft, Clock, DollarSign } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type Service = {
  id: string
  name: string
  description: string
  duration: number
  price: number
  created_at: string
}

export default function ServicesPage() {
  const { user, profile, businessProfile, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [services, setServices] = useState<Service[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    price: 0,
  })

  const isPro = businessProfile?.plan === 'pro'
  const canAddMore = isPro || services.length < 1

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/login')
      return
    }

    if (profile && profile.role !== 'groomer') {
      router.replace('/customer/dashboard')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (businessProfile?.id) {
      fetchServices()
    }
  }, [businessProfile?.id])

  const fetchServices = async () => {
    if (!businessProfile?.id) return

    setLoadingServices(true)
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', businessProfile.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching services:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los servicios',
        variant: 'destructive',
      })
    } else {
      setServices(data || [])
    }

    setLoadingServices(false)
  }

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service)
      setFormData({
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
      })
    } else {
      setEditingService(null)
      setFormData({
        name: '',
        description: '',
        duration: 30,
        price: 0,
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingService(null)
    setFormData({
      name: '',
      description: '',
      duration: 30,
      price: 0,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!businessProfile?.id) return

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del servicio es requerido',
        variant: 'destructive',
      })
      return
    }

    if (formData.price <= 0) {
      toast({
        title: 'Error',
        description: 'El precio debe ser mayor a 0',
        variant: 'destructive',
      })
      return
    }

    if (formData.duration <= 0) {
      toast({
        title: 'Error',
        description: 'La duración debe ser mayor a 0',
        variant: 'destructive',
      })
      return
    }

    try {
      if (editingService) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update({
            name: formData.name,
            description: formData.description,
            duration: formData.duration,
            price: formData.price,
          })
          .eq('id', editingService.id)

        if (error) throw error

        toast({
          title: 'Servicio actualizado',
          description: 'El servicio ha sido actualizado exitosamente',
        })
      } else {
        // Create new service
        const { error } = await supabase
          .from('services')
          .insert({
            business_id: businessProfile.id,
            name: formData.name,
            description: formData.description,
            duration: formData.duration,
            price: formData.price,
          })

        if (error) throw error

        toast({
          title: 'Servicio creado',
          description: 'El servicio ha sido creado exitosamente',
        })
      }

      handleCloseDialog()
      fetchServices()
    } catch (error) {
      console.error('Error saving service:', error)
      toast({
        title: 'Error',
        description: 'No se pudo guardar el servicio',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!serviceToDelete) return

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceToDelete)

      if (error) throw error

      toast({
        title: 'Servicio eliminado',
        description: 'El servicio ha sido eliminado exitosamente',
      })

      setDeleteDialogOpen(false)
      setServiceToDelete(null)
      fetchServices()
    } catch (error) {
      console.error('Error deleting service:', error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el servicio',
        variant: 'destructive',
      })
    }
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (profile.role !== 'groomer') {
    return null
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/groomer">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Servicios</h1>
              <p className="text-muted-foreground">
                Gestiona los servicios de tu estética
              </p>
            </div>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            disabled={!canAddMore}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Servicio
          </Button>
        </div>

        {/* Plan limitation warning */}
        {!isPro && services.length >= 1 && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardHeader>
              <CardTitle className="text-yellow-700 dark:text-yellow-300">
                Actualiza a PRO+ para agregar múltiples anuncios.
              </CardTitle>
              {/* <CardDescription className="text-yellow-600 dark:text-yellow-400">
                Actualiza a Pro para agregar servicios ilimitados.
              </CardDescription> */}
            </CardHeader>
          </Card>
        )}

        {/* Services Grid */}
        {loadingServices ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : services.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No tienes servicios creados</p>
              <p className="text-sm text-muted-foreground mb-4">
                Crea al menos un servicio para aparecer en el marketplace
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Crear primer servicio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle>{service.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(service)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setServiceToDelete(service.id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{service.description || 'Sin descripción'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{service.duration} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>${service.price}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </DialogTitle>
              <DialogDescription>
                {editingService
                  ? 'Actualiza la información del servicio'
                  : 'Completa los datos del nuevo servicio'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del servicio *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ej: Baño completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe tu servicio..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duración (minutos) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Precio (MXN) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingService ? 'Actualizar' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El servicio será eliminado permanentemente.
                {services.length === 1 && (
                  <span className="block mt-2 text-yellow-600 dark:text-yellow-400 font-medium">
                    Advertencia: Al eliminar tu último servicio, tu página dejará de estar disponible en el marketplace.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
