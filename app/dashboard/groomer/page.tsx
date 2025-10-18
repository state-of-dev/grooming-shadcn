'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, Users, Settings, CheckCircle, XCircle, Clock, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Appointment = {
  id: string
  appointment_date: string
  start_time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  total_amount: number
  customer: { name: string; phone: string; email: string }[] | null
  pet: { name: string; breed: string }[] | null
  service: { name: string; duration: number }[] | null
}

export default function GroomerDashboardPage() {
  const { user, profile, businessProfile, loading, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  // Cargar appointments del negocio
  const fetchAppointments = async () => {
    if (!businessProfile?.id) return

    setLoadingAppointments(true)
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        status,
        total_amount,
        customer:customers(name, phone, email),
        pet:pets(name, breed),
        service:services(name, duration)
      `)
      .eq('business_id', businessProfile.id)
      .order('appointment_date', { ascending: false })
      .order('start_time', { ascending: false })

    if (error) {
      console.error('Error fetching appointments:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las citas',
        variant: 'destructive',
      })
    } else {
      setAppointments(data || [])
    }

    setLoadingAppointments(false)
  }

  useEffect(() => {
    if (businessProfile?.id) {
      fetchAppointments()
    }
  }, [businessProfile?.id])

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/login')
      return
    }

    if (profile && profile.role !== 'groomer') {
      router.replace('/customer/dashboard')
      return
    }

    // Redirect to setup if no business profile exists
    if (profile && profile.role === 'groomer' && !businessProfile) {
      router.replace('/setup/business')
      return
    }

    // Redirect to setup if business profile exists but setup is not completed
    if (businessProfile && !businessProfile.setup_completed) {
      router.replace('/setup/business')
    }
  }, [user, profile, businessProfile, loading, router])

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  // Funciones para cambiar estado de citas
  const handleConfirmAppointment = async (appointmentId: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('id', appointmentId)

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo confirmar la cita',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Cita confirmada',
        description: 'La cita ha sido confirmada exitosamente',
      })
      fetchAppointments()
    }
  }

  const handleCompleteAppointment = async (appointmentId: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'completed' })
      .eq('id', appointmentId)

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo completar la cita',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Cita completada',
        description: 'La cita ha sido marcada como completada',
      })
      fetchAppointments()
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId)

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la cita',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Cita cancelada',
        description: 'La cita ha sido cancelada',
      })
      fetchAppointments()
    }
  }

  // Filtrar appointments según el tab activo
  const filteredAppointments = appointments.filter((apt) => {
    if (activeTab === 'all') return true
    return apt.status === activeTab
  })

  // Función para obtener el badge según el estado
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

  // Contar por estado
  const counts = {
    all: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
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
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Groomer</h1>
            <p className="text-muted-foreground">
              Bienvenido, {businessProfile?.business_name || profile.full_name}!
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Cerrar Sesión
          </Button>
        </div>


        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <Link href="/dashboard/calendar">
              <CardHeader>
                <Calendar className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Calendario</CardTitle>
                <CardDescription>Ver y gestionar tus citas</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:border-primary transition-colors cursor-pointer">
            <Link href="/dashboard/clients">
              <CardHeader>
                <Users className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Clientes</CardTitle>
                <CardDescription>Ver tus clientes y mascotas</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:border-primary transition-colors cursor-pointer">
            <Link href="/dashboard/settings">
              <CardHeader>
                <Settings className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Configuración</CardTitle>
                <CardDescription>Servicios, horarios y más</CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Citas de Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">No hay citas programadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Citas programadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Clientes Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Clientes registrados</p>
            </CardContent>
          </Card>
        </div>

        {/* Appointments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Citas</CardTitle>
            <CardDescription>Administra todas tus citas pendientes, confirmadas y completadas</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 mb-4">
                <TabsTrigger value="all">
                  Todas ({counts.all})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pendientes ({counts.pending})
                </TabsTrigger>
                <TabsTrigger value="confirmed">
                  Confirmadas ({counts.confirmed})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completadas ({counts.completed})
                </TabsTrigger>
                <TabsTrigger value="cancelled">
                  Canceladas ({counts.cancelled})
                </TabsTrigger>
              </TabsList>

              {loadingAppointments ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay citas {activeTab === 'all' ? '' : `en estado ${activeTab}`}</p>
                  <p className="text-sm mt-2">Las citas aparecerán aquí cuando los clientes reserven</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha/Hora</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Mascota</TableHead>
                        <TableHead>Servicio</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAppointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            <div className="font-medium">
                              {format(new Date(appointment.appointment_date), 'dd MMM yyyy', { locale: es })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {appointment.start_time.slice(0, 5)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{appointment.customer?.[0]?.name || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{appointment.customer?.[0]?.phone || ''}</div>
                          </TableCell>
                          <TableCell>
                            <div>{appointment.pet?.[0]?.name || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{appointment.pet?.[0]?.breed || ''}</div>
                          </TableCell>
                          <TableCell>
                            <div>{appointment.service?.[0]?.name || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">
                              {appointment.service?.[0]?.duration ? `${appointment.service[0].duration} min` : ''}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">${appointment.total_amount}</div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(appointment.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {appointment.status === 'pending' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleConfirmAppointment(appointment.id)}>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Confirmar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleCancelAppointment(appointment.id)}
                                      className="text-red-600"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Cancelar
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {appointment.status === 'confirmed' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleCompleteAppointment(appointment.id)}>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Marcar como completada
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleCancelAppointment(appointment.id)}
                                      className="text-red-600"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Cancelar
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
