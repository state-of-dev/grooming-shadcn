'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthGuard } from '@/lib/hooks/useAuthGuard'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, Users, Plus, User, Phone, Mail, Calendar, DollarSign, Dog } from 'lucide-react'

// Define interfaces for our data
interface Pet {
  id: string;
  name: string;
  breed: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  total_amount: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  pets: Pet[];
  appointments: Appointment[];
}

export default function ClientsPage() {
  const { businessProfile, loading: authLoading } = useAuthGuard();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCustomers = useCallback(async () => {
    if (!businessProfile) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*, pets(*), appointments(*)')
      .eq('business_id', businessProfile.id);

    if (data) {
      setCustomers(data as Customer[]);
    }
    setIsLoading(false);
  }, [businessProfile]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const customerStats = useMemo(() => {
    const total = customers.length;
    const totalSpent = customers.reduce((sum, c) => 
      sum + c.appointments.reduce((apptSum, appt) => apptSum + (appt.total_amount || 0), 0)
    , 0);
    return { total, totalSpent };
  }, [customers]);

  if (authLoading || !businessProfile) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Clientes y Mascotas</h1>
          <Button disabled><Plus className="mr-2 h-4 w-4" /> Nuevo Cliente</Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Clientes" value={customerStats.total} icon={Users} />
          <StatCard title="Ingresos Totales" value={`$${customerStats.totalSpent.toFixed(2)}`} icon={DollarSign} />
        </div>

        {/* Customer List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : customers.length === 0 ? (
            <p className="text-muted-foreground text-center py-16">No se encontraron clientes.</p>
          ) : (
            customers.map(customer => <CustomerCard key={customer.id} customer={customer} />)
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  )
}

function CustomerCard({ customer }: { customer: Customer }) {
  const lastAppointment = customer.appointments.length > 0 
    ? new Date(Math.max(...customer.appointments.map(a => new Date(a.appointment_date).getTime()))).toLocaleDateString()
    : 'N/A';

  return (
    <Card>
      <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
        <Avatar className="w-16 h-16">
          <AvatarFallback className="text-xl">{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{customer.name}</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><Mail className="h-4 w-4" />{customer.email}</span>
                <span className="flex items-center gap-2"><Phone className="h-4 w-4" />{customer.phone}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>Ver Detalle</Button>
          </div>
          <div className="border-t my-3" />
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex-1 min-w-[150px]">
              <p className="font-medium">Mascotas</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {customer.pets.length > 0 ? customer.pets.map(pet => (
                  <Badge key={pet.id} variant="secondary" className="flex items-center gap-1"><Dog className="h-3 w-3"/>{pet.name}</Badge>
                )) : <p className="text-xs text-muted-foreground">Sin mascotas</p>}
              </div>
            </div>
            <div className="flex-1 min-w-[150px]">
              <p className="font-medium">Última Cita</p>
              <p className="text-muted-foreground">{lastAppointment}</p>
            </div>
            <div className="flex-1 min-w-[150px]">
              <p className="font-medium">Citas Totales</p>
              <p className="text-muted-foreground">{customer.appointments.length}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
