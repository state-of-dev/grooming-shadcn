'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useAuthGuard } from '@/lib/hooks/useAuthGuard'
import { useAppointmentsRealtime } from '@/lib/hooks/use-appointments-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { Loader2, Calendar, DollarSign, Users, CheckCircle } from 'lucide-react'

export default function GroomerDashboardPage() {
  const { user, loading: authLoading } = useAuthGuard()
  const { profile, businessProfile, signOut } = useAuth()
  const router = useRouter()

  // Redirect if the user is a customer
  useEffect(() => {
    if (!authLoading && profile && profile.role === 'customer') {
      router.replace('/customer/dashboard');
    }
  }, [authLoading, profile, router]);

  const { appointments, isLoading: appointmentsLoading, isConnected } = useAppointmentsRealtime(businessProfile?.id)

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  }

  // --- Metrics Calculation ---
  const today = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments.filter(apt => apt.appointment_date === today)
  const thisWeekRevenue = appointments
    .filter(apt => {
      const date = new Date(apt.appointment_date)
      const todayDate = new Date()
      const weekStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() - todayDate.getDay())
      return date >= weekStart && apt.status === 'completed'
    })
    .reduce((sum, apt) => sum + (apt.total_amount || 0), 0)
  const uniqueCustomers = new Set(appointments.map(apt => apt.customer_name)).size
  // --- End of Metrics ---

  // Loading state: wait for auth, then for profile, then if groomer, wait for business profile
  if (authLoading || !profile || (profile.role === 'groomer' && !businessProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }
  
  // If it's a customer, render nothing as redirect is in progress
  if (profile.role === 'customer') {
    return null;
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Bienvenido, {businessProfile.business_name}!</p>
          </div>
          <div className="flex items-center gap-4">
             <Badge variant={isConnected ? 'default' : 'destructive'} className="capitalize">
              {isConnected ? "En vivo" : "Desconectado"}
            </Badge>
            <Button onClick={handleLogout} variant="outline">Cerrar Sesión</Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Citas de Hoy</CardTitle><Calendar className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{todayAppointments.length}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ingresos (Semana)</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">${thisWeekRevenue.toFixed(2)}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{uniqueCustomers}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Citas Totales</CardTitle><CheckCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{appointments.length}</div></CardContent></Card>
        </div>

        {/* Today's Appointments Table */}
        <Card>
          <CardHeader><CardTitle>Citas Programadas para Hoy</CardTitle><CardDescription>Un resumen de las citas para el día de hoy.</CardDescription></CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : todayAppointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><p>No hay citas programadas para hoy.</p></div>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Hora</TableHead><TableHead>Cliente</TableHead><TableHead>Mascota</TableHead><TableHead>Servicio</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                <TableBody>
                  {todayAppointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell className="font-medium">{apt.start_time}</TableCell>
                      <TableCell>{apt.customer_name}</TableCell>
                      <TableCell>{apt.pet_name}</TableCell>
                      <TableCell>{apt.service_name}</TableCell>
                      <TableCell><Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>{apt.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
