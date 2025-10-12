'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuthGuard } from '@/lib/hooks/useAuthGuard'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft, User, Heart, Calendar, DollarSign, Clock, Save, X, Edit } from 'lucide-react'

// Define a more specific type for the detailed appointment
interface DetailedAppointment {
  id: string;
  appointment_date: string;
  start_time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  total_amount: number;
  groomer_notes: string;
  services: { name: string; duration: number } | null;
  customers: { name: string; email: string; phone: string } | null;
  pets: { name: string; breed: string; age: number; weight: number } | null;
}

const STATUS_OPTIONS: DetailedAppointment['status'][] = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

export default function AppointmentDetailPage({ params }: { params: { id: string } }) {
  useAuthGuard();
  const router = useRouter();
  const [appointment, setAppointment] = useState<DetailedAppointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  const fetchAppointment = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*, services(*), customers(*), pets(*)')
        .eq('id', params.id)
        .single();

      if (error) throw new Error('No se pudo encontrar la cita.');
      
      setAppointment(data as DetailedAppointment);
      setEditedNotes(data.groomer_notes || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  const handleStatusChange = async (newStatus: DetailedAppointment['status']) => {
    if (!appointment) return;
    const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', appointment.id);
    if (error) {
      alert('Error al actualizar el estado.');
    } else {
      setAppointment(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleSaveNotes = async () => {
    if (!appointment) return;
    const { error } = await supabase.from('appointments').update({ groomer_notes: editedNotes }).eq('id', appointment.id);
    if (error) {
      alert('Error al guardar las notas.');
    } else {
      setAppointment(prev => prev ? { ...prev, groomer_notes: editedNotes } : null);
      setIsEditingNotes(false);
    }
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error || !appointment) {
    return <div className="h-screen flex items-center justify-center"><p className="text-destructive">{error || "Cita no encontrada."}</p></div>;
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Cita</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <InfoItem icon={Calendar} label="Fecha" value={format(new Date(appointment.appointment_date), 'PPP', { locale: es })} />
                <InfoItem icon={Clock} label="Hora" value={appointment.start_time} />
                <InfoItem icon={DollarSign} label="Precio" value={`$${appointment.total_amount}`} />
                <div className="space-y-1">
                  <Label>Estado</Label>
                   <Select value={appointment.status} onValueChange={handleStatusChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(opt => <SelectItem key={opt} value={opt} className="capitalize">{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Información del Cliente</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <InfoItem icon={User} label="Cliente" value={appointment.customers?.name} />
                <InfoItem icon={User} label="Email" value={appointment.customers?.email} />
                <InfoItem icon={Heart} label="Mascota" value={`${appointment.pets?.name} (${appointment.pets?.breed})`} />
                <InfoItem icon={User} label="Teléfono" value={appointment.customers?.phone} />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Notas del Groomer</CardTitle>
                {!isEditingNotes && <Button variant="ghost" size="icon" onClick={() => setIsEditingNotes(true)}><Edit className="h-4 w-4" /></Button>}
              </CardHeader>
              <CardContent>
                {isEditingNotes ? (
                  <div className="space-y-2">
                    <Textarea value={editedNotes} onChange={e => setEditedNotes(e.target.value)} rows={5} />
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingNotes(false)}><X className="mr-1 h-4 w-4"/>Cancelar</Button>
                      <Button size="sm" onClick={handleSaveNotes}><Save className="mr-1 h-4 w-4"/>Guardar</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground min-h-[100px]">{appointment.groomer_notes || 'No hay notas.'}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | number | null }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm text-muted-foreground flex items-center"><Icon className="mr-2 h-4 w-4" />{label}</Label>
      <p className="font-medium">{value || 'N/A'}</p>
    </div>
  )
}
