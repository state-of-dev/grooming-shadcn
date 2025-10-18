'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, ArrowLeft, MapPin, Clock, DollarSign, Phone, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { format, isPast, isFuture, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
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

type Appointment = {
  id: string
  appointment_date: string
  start_time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  total_amount: number
  business: {
    business_name: string
    phone: string
    address: string
    city: string
  }[] | null
  pet: { name: string; breed: string }[] | null
  service: { name: string; duration: number }[] | null
}

export default function CustomerAppointmentsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)

  // Fetch appointments del customer
  const fetchAppointments = async () => {
    if (!user?.email) return

    setLoadingAppointments(true)

    // Primero obtener el customer_id
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('email', user.email)
      .single()

    if (customerError || !customerData) {
      console.error('Error fetching customer:', customerError)
      setLoadingAppointments(false)
      return
    }

    // Luego obtener las citas
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        status,
        total_amount,
        business:business_profiles(business_name, phone, address, city),
        pet:pets(name, breed),
        service:services(name, duration)
      `)
      .eq('customer_id', customerData.id)
      .order('appointment_date', { ascending: false })
      .order('start_time', { ascending: false })

    if (error) {
      console.error('Error fetching appointments:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar tus citas',
        variant: 'destructive',
      })
    } else {
      setAppointments(data || [])
    }

    setLoadingAppointments(false)
  }

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/login')
      return
    }

    if (profile && profile.role !== 'customer') {
      router.replace('/dashboard/groomer')
      return
    }

    fetchAppointments()
  }, [user, profile, loading, router])

  // Cancelar cita
  const handleCancelAppointment = async () => {
    if (!selectedAppointmentId) return

    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', selectedAppointmentId)

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la cita',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Cita cancelada',
        description: 'Tu cita ha sido cancelada exitosamente',
      })
      fetchAppointments()
    }

    setCancelDialogOpen(false)
    setSelectedAppointmentId(null)
  }

  const openCancelDialog = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId)
    setCancelDialogOpen(true)
  }

  // Filtrar citas próximas y pasadas
  const upcomingAppointments = appointments.filter((apt) => {
    const aptDate = parseISO(apt.appointment_date)
    return (
      (isFuture(aptDate) || format(aptDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) &&
      apt.status !== 'cancelled' &&
      apt.status !== 'completed'
    )
  })

  const pastAppointments = appointments.filter((apt) => {
    const aptDate = parseISO(apt.appointment_date)
    return (
      isPast(aptDate) &&
      format(aptDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd')
    ) || apt.status === 'completed' || apt.status === 'cancelled'
  })

  // Badge de estado
  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { label: 'Pendiente', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
      confirmed: { label: 'Confirmada', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
      completed: { label: 'Completada', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
      cancelled: { label: 'Cancelada', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
    }
    const variant = variants[status as keyof typeof variants] || variants.pending
    return <Badge className={variant.className}>{variant.label}</Badge>
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/customer/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Mis Citas</h1>
            <p className="text-muted-foreground">
              Gestiona tus citas de grooming
            </p>
          </div>
        </div>

        {/* Tabs de Próximas / Pasadas */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upcoming">
              Próximas ({upcomingAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Pasadas ({pastAppointments.length})
            </TabsTrigger>
          </TabsList>

          {/* Próximas */}
          <TabsContent value="upcoming" className="space-y-4 mt-6">
            {loadingAppointments ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground">No tienes citas próximas</p>
                  <Link href="/marketplace">
                    <Button className="mt-4">
                      Reservar una cita
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              upcomingAppointments.map((appointment) => (
                <Card key={appointment.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">
                          {appointment.business?.[0]?.business_name || 'N/A'}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {appointment.business?.[0]?.city || 'N/A'}
                        </CardDescription>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(parseISO(appointment.appointment_date), 'EEEE, dd MMMM yyyy', { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{appointment.start_time.slice(0, 5)}</span>
                        {appointment.service?.[0]?.duration && (
                          <span className="text-muted-foreground">
                            ({appointment.service[0].duration} min)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Servicio</p>
                        <p className="font-medium">{appointment.service?.[0]?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Mascota</p>
                        <p className="font-medium">
                          {appointment.pet?.[0]?.name || 'N/A'}
                          {appointment.pet?.[0]?.breed && (
                            <span className="text-sm text-muted-foreground ml-1">
                              ({appointment.pet[0].breed})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-bold text-lg">${appointment.total_amount}</span>
                      </div>
                      {appointment.business?.[0]?.phone && (
                        <a href={`tel:${appointment.business[0].phone}`}>
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4 mr-2" />
                            Contactar
                          </Button>
                        </a>
                      )}
                    </div>

                    {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => openCancelDialog(appointment.id)}
                      >
                        Cancelar Cita
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Pasadas */}
          <TabsContent value="past" className="space-y-4 mt-6">
            {loadingAppointments ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pastAppointments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground">No tienes historial de citas</p>
                </CardContent>
              </Card>
            ) : (
              pastAppointments.map((appointment) => (
                <Card key={appointment.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">
                          {appointment.business?.[0]?.business_name || 'N/A'}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {appointment.business?.[0]?.city || 'N/A'}
                        </CardDescription>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(parseISO(appointment.appointment_date), 'dd MMM yyyy', { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{appointment.start_time.slice(0, 5)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Servicio</p>
                        <p className="font-medium">{appointment.service?.[0]?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Mascota</p>
                        <p className="font-medium">{appointment.pet?.[0]?.name || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-bold">${appointment.total_amount}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de confirmación de cancelación */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              ¿Cancelar esta cita?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El negocio será notificado de la cancelación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener cita</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelAppointment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sí, cancelar cita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
