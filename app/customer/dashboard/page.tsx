'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Calendar, Heart, Search, Clock, MapPin, Trash2, Eye, X, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from 'next/link'

interface Appointment {
  id: string
  appointment_date: string
  start_time: string
  end_time: string
  status: string
  total_amount: number
  business_profiles: {
    business_name: string
    slug: string
  } | null
  services: {
    name: string
  } | null
  pets: {
    name: string
  } | null
}

interface Pet {
  id: string
  name: string
  species: string
  breed: string | null
  weight: number | null
  notes: string | null
}

export default function CustomerDashboardPage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Modal states
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showAddPetModal, setShowAddPetModal] = useState(false)
  const [isCreatingPet, setIsCreatingPet] = useState(false)
  const [newPetData, setNewPetData] = useState({
    name: '',
    species: 'dog' as 'dog' | 'cat',
    breed: '',
    weight: '',
    notes: ''
  })
  const [petFormErrors, setPetFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    console.log('🔍 CustomerDashboard - Auth check', { loading, user: user?.id, role: profile?.role })
    if (loading) return

    if (!user) {
      console.log('⚠️ No user, redirecting to login')
      router.replace('/login')
      return
    }

    if (profile && profile.role !== 'customer') {
      console.log('⚠️ Not a customer, redirecting to groomer dashboard')
      router.replace('/dashboard/groomer')
    }
  }, [user, profile, loading, router])

  // Load appointments and pets
  useEffect(() => {
    const loadData = async () => {
      if (!user || !profile || profile.role !== 'customer') {
        console.log('⏭️ Skipping data load - user not ready')
        return
      }

      console.log('📊 Loading customer data for user:', user.id)
      setLoadingData(true)

      try {
        // Get customer ID (use limit(1) to handle duplicates)
        console.log('Step 1: Getting customer profile...')
        const { data: customers, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (customerError) {
          console.error('❌ Error loading customer:', customerError)
          setLoadingData(false)
          return
        }

        if (!customers || customers.length === 0) {
          console.log('⚠️ No customer profile found, redirecting to onboarding')
          router.replace('/customer/onboarding?returnTo=/customer/dashboard')
          return
        }

        const customer = customers[0]

        // Log warning if duplicates found
        if (customers.length > 1) {
          console.warn('⚠️ Multiple customer profiles found for user, using most recent')
        }

        console.log('✅ Customer found:', customer.id)

        // Load appointments
        console.log('Step 2: Loading appointments...')
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            id,
            appointment_date,
            start_time,
            end_time,
            status,
            total_amount,
            business_profiles:business_id (
              business_name,
              slug
            ),
            services:service_id (
              name
            ),
            pets:pet_id (
              name
            )
          `)
          .eq('customer_id', customer.id)
          .gte('appointment_date', new Date().toISOString().split('T')[0])
          .order('appointment_date', { ascending: true })
          .order('start_time', { ascending: true })

        if (appointmentsError) {
          console.error('❌ Error loading appointments:', appointmentsError)
        } else {
          console.log('✅ Appointments loaded:', appointmentsData?.length || 0)
          console.log('Appointments data:', appointmentsData)
          setAppointments((appointmentsData || []) as unknown as Appointment[])
        }

        // Load pets
        console.log('Step 3: Loading pets...')
        const { data: petsData, error: petsError } = await supabase
          .from('pets')
          .select('id, name, species, breed, weight, notes')
          .eq('customer_id', customer.id)

        if (petsError) {
          console.error('❌ Error loading pets:', petsError)
        } else {
          console.log('✅ Pets loaded:', petsData?.length || 0)
          setPets(petsData || [])
        }

      } catch (error) {
        console.error('❌ Error in loadData:', error)
      } finally {
        setLoadingData(false)
        console.log('✅ Data loading complete')
      }
    }

    loadData()
  }, [user, profile])

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  const handleDeletePet = async () => {
    if (!petToDelete) return

    console.log('🗑️ Deleting pet:', petToDelete.id)
    setIsDeleting(true)

    try {
      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', petToDelete.id)

      if (error) {
        console.error('❌ Error deleting pet:', error)
        alert('Error al eliminar mascota: ' + error.message)
      } else {
        console.log('✅ Pet deleted successfully')
        // Remove from local state
        setPets(pets.filter(p => p.id !== petToDelete.id))
        setPetToDelete(null)
      }
    } catch (error) {
      console.error('❌ Error in handleDeletePet:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const validatePetForm = () => {
    const errors: Record<string, string> = {}
    if (!newPetData.name.trim()) {
      errors.name = 'El nombre es requerido'
    }
    setPetFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddPet = async () => {
    if (!validatePetForm()) return

    console.log('➕ Creating new pet...')
    setIsCreatingPet(true)
    setPetFormErrors({})

    try {
      // Get customer ID
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle()

      if (customerError || !customer) {
        console.error('❌ Error loading customer:', customerError)
        setPetFormErrors({ submit: 'Error al obtener perfil de cliente' })
        setIsCreatingPet(false)
        return
      }

      // Create pet
      const { data: newPet, error: petError } = await supabase
        .from('pets')
        .insert({
          customer_id: customer.id,
          name: newPetData.name,
          species: newPetData.species,
          breed: newPetData.breed || null,
          weight: newPetData.weight ? parseFloat(newPetData.weight) : null,
          notes: newPetData.notes || null
        })
        .select()
        .single()

      if (petError) {
        console.error('❌ Error creating pet:', petError)
        setPetFormErrors({ submit: 'Error al crear mascota: ' + petError.message })
      } else {
        console.log('✅ Pet created successfully:', newPet)
        // Add to local state
        setPets([...pets, newPet])
        // Reset form and close modal
        setNewPetData({
          name: '',
          species: 'dog',
          breed: '',
          weight: '',
          notes: ''
        })
        setShowAddPetModal(false)
      }
    } catch (error: any) {
      console.error('❌ Error in handleAddPet:', error)
      setPetFormErrors({ submit: error?.message || 'Error al crear mascota' })
    } finally {
      setIsCreatingPet(false)
    }
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (profile.role !== 'customer') {
    return null
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Mi Dashboard</h1>
            <p className="text-muted-foreground">Hola, {profile.full_name}!</p>
          </div>
          <Button asChild>
            <Link href="/marketplace">
              <Search className="w-4 h-4 mr-2" />
              Buscar Grooming
            </Link>
          </Button>
        </div>

        {/* Quick Actions - Comentado temporalmente */}
        {/* <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <Link href="/marketplace">
              <CardHeader>
                <Search className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Buscar Grooming</CardTitle>
                <CardDescription>Encuentra el servicio perfecto</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:border-primary transition-colors cursor-pointer">
            <Link href="/customer/appointments">
              <CardHeader>
                <Calendar className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Mis Citas</CardTitle>
                <CardDescription>Ver y gestionar tus citas</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:border-primary transition-colors cursor-pointer">
            <Link href="/customer/pets">
              <CardHeader>
                <Heart className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Mis Mascotas</CardTitle>
                <CardDescription>Administrar tus mascotas</CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div> */}

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Próximas Citas</CardTitle>
            <CardDescription>Tus citas programadas</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground mt-2">Cargando citas...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No tienes citas programadas</p>
                <p className="text-sm mt-2">¡Agenda tu primera cita!</p>
                <Button asChild className="mt-4">
                  <Link href="/marketplace">Buscar servicios</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{appointment.services?.name || 'Servicio'}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          appointment.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                          appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {appointment.status === 'confirmed' ? 'Confirmada' :
                           appointment.status === 'pending' ? 'Pendiente' :
                           appointment.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <MapPin className="inline w-3 h-3 mr-1" />
                        {appointment.business_profiles?.business_name || 'Negocio'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <Calendar className="inline w-3 h-3 mr-1" />
                        {new Date(appointment.appointment_date).toLocaleDateString('es-MX', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <Clock className="inline w-3 h-3 mr-1" />
                        {appointment.start_time} - {appointment.end_time}
                      </p>
                      <p className="text-sm">
                        <Heart className="inline w-3 h-3 mr-1" />
                        Para: <span className="font-medium">{appointment.pets?.name || 'Mascota'}</span>
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-lg font-bold">${appointment.total_amount}</p>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAppointment(appointment)}
                        >
                          Ver detalles
                        </Button>
                        {appointment.business_profiles?.slug && (
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`../${appointment.business_profiles.slug}`}>
                              Ver negocio
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Pets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mis Mascotas</CardTitle>
                <CardDescription>Perfiles de tus mascotas</CardDescription>
              </div>
              <Button onClick={() => setShowAddPetModal(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground mt-2">Cargando mascotas...</p>
              </div>
            ) : pets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No has registrado mascotas</p>
                <p className="text-sm mt-2">Agrega tus mascotas para facilitar las reservas</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/customer/pets">Agregar mascota</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pets.map((pet) => (
                  <div
                    key={pet.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Heart className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{pet.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {pet.species === 'dog' ? 'Perro' : 'Gato'}
                            {pet.breed && ` • ${pet.breed}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedPet(pet)}
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setPetToDelete(pet)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Appointment Detail Modal */}
      <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles de la Cita</DialogTitle>
            <DialogDescription>Información completa de tu cita</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedAppointment.services?.name || 'Servicio'}</h3>
                <span className={`text-xs px-3 py-1 rounded-full ${
                  selectedAppointment.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                  selectedAppointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                }`}>
                  {selectedAppointment.status === 'confirmed' ? 'Confirmada' :
                   selectedAppointment.status === 'pending' ? 'Pendiente' :
                   selectedAppointment.status}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Negocio</p>
                    <p className="text-muted-foreground">{selectedAppointment.business_profiles?.business_name || 'Negocio'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Fecha</p>
                    <p className="text-muted-foreground">
                      {new Date(selectedAppointment.appointment_date).toLocaleDateString('es-MX', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Horario</p>
                    <p className="text-muted-foreground">{selectedAppointment.start_time} - {selectedAppointment.end_time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Heart className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Mascota</p>
                    <p className="text-muted-foreground">{selectedAppointment.pets?.name || 'Mascota'}</p>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total:</span>
                    <span className="text-2xl font-bold">${selectedAppointment.total_amount}</span>
                  </div>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => setSelectedAppointment(null)}
              >
                Cerrar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pet Detail Modal */}
      <Dialog open={!!selectedPet} onOpenChange={(open) => !open && setSelectedPet(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles de la Mascota</DialogTitle>
            <DialogDescription>Información completa de tu mascota</DialogDescription>
          </DialogHeader>
          {selectedPet && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Heart className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl">{selectedPet.name}</h3>
                  <p className="text-muted-foreground">
                    {selectedPet.species === 'dog' ? 'Perro' : 'Gato'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {selectedPet.breed && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Raza</p>
                    <p className="text-base">{selectedPet.breed}</p>
                  </div>
                )}

                {selectedPet.weight && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Peso</p>
                    <p className="text-base">{selectedPet.weight} kg</p>
                  </div>
                )}

                {selectedPet.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notas</p>
                    <p className="text-base">{selectedPet.notes}</p>
                  </div>
                )}

                {!selectedPet.breed && !selectedPet.weight && !selectedPet.notes && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay información adicional registrada
                  </p>
                )}
              </div>

              <Button
                className="w-full"
                onClick={() => setSelectedPet(null)}
              >
                Cerrar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Pet Confirmation */}
      <AlertDialog open={!!petToDelete} onOpenChange={(open) => !open && setPetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar mascota?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar a <strong>{petToDelete?.name}</strong>?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePet}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Pet Modal */}
      <Dialog open={showAddPetModal} onOpenChange={setShowAddPetModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Nueva Mascota</DialogTitle>
            <DialogDescription>Registra una nueva mascota en tu perfil</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="petName">Nombre *</Label>
              <Input
                id="petName"
                value={newPetData.name}
                onChange={(e) => setNewPetData({ ...newPetData, name: e.target.value })}
                placeholder="Firulais"
                disabled={isCreatingPet}
              />
              {petFormErrors.name && (
                <p className="text-sm text-destructive mt-1">{petFormErrors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="species">Especie *</Label>
              <Select
                value={newPetData.species}
                onValueChange={(value: 'dog' | 'cat') => setNewPetData({ ...newPetData, species: value })}
                disabled={isCreatingPet}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="breed">Raza (Opcional)</Label>
                <Input
                  id="breed"
                  value={newPetData.breed}
                  onChange={(e) => setNewPetData({ ...newPetData, breed: e.target.value })}
                  placeholder="Labrador"
                  disabled={isCreatingPet}
                />
              </div>

              <div>
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={newPetData.weight}
                  onChange={(e) => setNewPetData({ ...newPetData, weight: e.target.value })}
                  placeholder="15"
                  disabled={isCreatingPet}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Textarea
                id="notes"
                value={newPetData.notes}
                onChange={(e) => setNewPetData({ ...newPetData, notes: e.target.value })}
                placeholder="Comportamiento, condiciones especiales, alergias, etc."
                rows={3}
                disabled={isCreatingPet}
              />
            </div>

            {petFormErrors.submit && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{petFormErrors.submit}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddPetModal(false)
                  setNewPetData({
                    name: '',
                    species: 'dog',
                    breed: '',
                    weight: '',
                    notes: ''
                  })
                  setPetFormErrors({})
                }}
                disabled={isCreatingPet}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddPet}
                disabled={isCreatingPet}
                className="flex-1"
              >
                {isCreatingPet ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Agregar Mascota'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
