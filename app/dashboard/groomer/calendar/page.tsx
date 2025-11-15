'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar as CalendarIcon,
  Plus,
  Settings,
  Loader2,
  X,
  Clock,
  Ban
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface AvailabilityException {
  id: string;
  exception_type: 'block' | 'vacation' | 'break' | 'custom';
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
  reason: string | null;
  notes: string | null;
}

interface AppointmentSettings {
  id: string;
  slot_duration_minutes: number;
  buffer_time_minutes: number;
  max_appointments_per_slot: number;
  min_booking_notice_hours: number;
  max_booking_advance_days: number;
  cancellation_policy_hours: number;
  allow_same_day_booking: boolean;
}

export default function GroomerCalendarPage() {
  const { businessProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [settings, setSettings] = useState<AppointmentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // Form state for new exception
  const [newException, setNewException] = useState({
    exception_type: 'block' as 'block' | 'vacation' | 'break' | 'custom',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    is_all_day: true,
    reason: '',
    notes: ''
  });

  useEffect(() => {
    if (!authLoading) {
      if (!businessProfile) {
        router.push('/dashboard');
      } else {
        loadData();
      }
    }
  }, [authLoading, businessProfile, router]);

  async function loadData() {
    if (!businessProfile) return;

    setLoading(true);
    try {
      // Load exceptions
      const { data: exceptionsData, error: exceptionsError } = await supabase
        .from('availability_exceptions')
        .select('*')
        .eq('business_id', businessProfile.id)
        .order('start_date', { ascending: false });

      if (exceptionsError) throw exceptionsError;
      setExceptions(exceptionsData || []);

      // Load settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('appointment_settings')
        .select('*')
        .eq('business_id', businessProfile.id)
        .single();

      if (settingsError) throw settingsError;
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateException() {
    if (!businessProfile) return;

    // Validate
    if (!newException.start_date || (!newException.is_all_day && (!newException.start_time || !newException.end_time))) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const { error } = await supabase
        .from('availability_exceptions')
        .insert({
          business_id: businessProfile.id,
          exception_type: newException.exception_type,
          start_date: newException.start_date,
          end_date: newException.end_date || newException.start_date,
          start_time: newException.is_all_day ? null : newException.start_time,
          end_time: newException.is_all_day ? null : newException.end_time,
          is_all_day: newException.is_all_day,
          reason: newException.reason || null,
          notes: newException.notes || null
        });

      if (error) throw error;

      toast.success('Bloqueo creado exitosamente');
      setDialogOpen(false);
      setNewException({
        exception_type: 'block',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        is_all_day: true,
        reason: '',
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Error creating exception:', error);
      toast.error('Error al crear bloqueo');
    }
  }

  async function handleDeleteException(id: string) {
    try {
      const { error } = await supabase
        .from('availability_exceptions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Bloqueo eliminado');
      loadData();
    } catch (error) {
      console.error('Error deleting exception:', error);
      toast.error('Error al eliminar bloqueo');
    }
  }

  async function handleUpdateSettings() {
    if (!businessProfile || !settings) return;

    try {
      const { error } = await supabase
        .from('appointment_settings')
        .update({
          slot_duration_minutes: settings.slot_duration_minutes,
          buffer_time_minutes: settings.buffer_time_minutes,
          max_appointments_per_slot: settings.max_appointments_per_slot,
          min_booking_notice_hours: settings.min_booking_notice_hours,
          max_booking_advance_days: settings.max_booking_advance_days,
          cancellation_policy_hours: settings.cancellation_policy_hours,
          allow_same_day_booking: settings.allow_same_day_booking
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast.success('Configuración actualizada');
      setSettingsDialogOpen(false);
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Error al actualizar configuración');
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getExceptionIcon = (type: string) => {
    switch (type) {
      case 'vacation': return '🏖️';
      case 'break': return '☕';
      case 'block': return '🚫';
      default: return '📅';
    }
  };

  const getExceptionLabel = (type: string) => {
    switch (type) {
      case 'vacation': return 'Vacaciones';
      case 'break': return 'Descanso';
      case 'block': return 'Bloqueo';
      default: return 'Personalizado';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalendarIcon className="w-8 h-8" />
              Gestión de Calendario
            </h1>
            <p className="text-muted-foreground mt-1">
              Administra tus bloqueos de tiempo y configuración de disponibilidad
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Configuración
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Configuración de Citas</DialogTitle>
                  <DialogDescription>
                    Ajusta cómo funcionan las reservas en tu negocio
                  </DialogDescription>
                </DialogHeader>
                {settings && (
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Duración de slot (minutos)</Label>
                        <Input
                          type="number"
                          value={settings.slot_duration_minutes}
                          onChange={(e) => setSettings({ ...settings, slot_duration_minutes: parseInt(e.target.value) })}
                          min={15}
                          max={240}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tiempo de buffer (minutos)</Label>
                        <Input
                          type="number"
                          value={settings.buffer_time_minutes}
                          onChange={(e) => setSettings({ ...settings, buffer_time_minutes: parseInt(e.target.value) })}
                          min={0}
                          max={60}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Citas máximas por slot</Label>
                        <Input
                          type="number"
                          value={settings.max_appointments_per_slot}
                          onChange={(e) => setSettings({ ...settings, max_appointments_per_slot: parseInt(e.target.value) })}
                          min={1}
                          max={10}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Anticipación mínima (horas)</Label>
                        <Input
                          type="number"
                          value={settings.min_booking_notice_hours}
                          onChange={(e) => setSettings({ ...settings, min_booking_notice_hours: parseInt(e.target.value) })}
                          min={0}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Días máximos de anticipación</Label>
                        <Input
                          type="number"
                          value={settings.max_booking_advance_days}
                          onChange={(e) => setSettings({ ...settings, max_booking_advance_days: parseInt(e.target.value) })}
                          min={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Política de cancelación (horas)</Label>
                        <Input
                          type="number"
                          value={settings.cancellation_policy_hours}
                          onChange={(e) => setSettings({ ...settings, cancellation_policy_hours: parseInt(e.target.value) })}
                          min={0}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="same-day"
                        checked={settings.allow_same_day_booking}
                        onCheckedChange={(checked) => setSettings({ ...settings, allow_same_day_booking: checked as boolean })}
                      />
                      <Label htmlFor="same-day">Permitir reservas el mismo día</Label>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleUpdateSettings}>
                        Guardar Cambios
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Bloqueo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Bloqueo de Tiempo</DialogTitle>
                  <DialogDescription>
                    Bloquea fechas u horarios específicos en los que no aceptarás citas
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Tipo de bloqueo</Label>
                    <Select
                      value={newException.exception_type}
                      onValueChange={(value: any) => setNewException({ ...newException, exception_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="block">Bloqueo puntual</SelectItem>
                        <SelectItem value="vacation">Vacaciones</SelectItem>
                        <SelectItem value="break">Descanso</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha de inicio</Label>
                      <Input
                        type="date"
                        value={newException.start_date}
                        onChange={(e) => setNewException({ ...newException, start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de fin (opcional)</Label>
                      <Input
                        type="date"
                        value={newException.end_date}
                        onChange={(e) => setNewException({ ...newException, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-day"
                      checked={newException.is_all_day}
                      onCheckedChange={(checked) => setNewException({ ...newException, is_all_day: checked as boolean })}
                    />
                    <Label htmlFor="all-day">Todo el día</Label>
                  </div>

                  {!newException.is_all_day && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Hora de inicio</Label>
                        <Input
                          type="time"
                          value={newException.start_time}
                          onChange={(e) => setNewException({ ...newException, start_time: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hora de fin</Label>
                        <Input
                          type="time"
                          value={newException.end_time}
                          onChange={(e) => setNewException({ ...newException, end_time: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Motivo (opcional)</Label>
                    <Input
                      placeholder="Ej: Evento personal, capacitación, etc."
                      value={newException.reason}
                      onChange={(e) => setNewException({ ...newException, reason: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Notas (opcional)</Label>
                    <Textarea
                      placeholder="Notas adicionales..."
                      value={newException.notes}
                      onChange={(e) => setNewException({ ...newException, notes: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateException}>
                      Crear Bloqueo
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Current Settings Summary */}
        {settings && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Configuración Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Duración de slot</p>
                  <p className="font-semibold">{settings.slot_duration_minutes} min</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tiempo de buffer</p>
                  <p className="font-semibold">{settings.buffer_time_minutes} min</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Citas por slot</p>
                  <p className="font-semibold">{settings.max_appointments_per_slot}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Anticipación mínima</p>
                  <p className="font-semibold">{settings.min_booking_notice_hours}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exceptions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5" />
              Bloqueos de Tiempo ({exceptions.length})
            </CardTitle>
            <CardDescription>
              Fechas y horarios bloqueados en tu calendario
            </CardDescription>
          </CardHeader>
          <CardContent>
            {exceptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Ban className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tienes bloqueos de tiempo configurados</p>
                <p className="text-sm">Crea uno para bloquear fechas u horarios específicos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {exceptions.map((exception) => (
                  <div
                    key={exception.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-2xl">{getExceptionIcon(exception.exception_type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">{getExceptionLabel(exception.exception_type)}</Badge>
                          {exception.is_all_day && <Badge variant="outline">Todo el día</Badge>}
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {exception.start_date === exception.end_date
                              ? new Date(exception.start_date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                              : `${new Date(exception.start_date).toLocaleDateString('es-ES')} - ${new Date(exception.end_date).toLocaleDateString('es-ES')}`
                            }
                          </p>
                          {!exception.is_all_day && exception.start_time && exception.end_time && (
                            <p className="text-sm text-muted-foreground">
                              {exception.start_time.slice(0, 5)} - {exception.end_time.slice(0, 5)}
                            </p>
                          )}
                          {exception.reason && (
                            <p className="text-sm text-muted-foreground">{exception.reason}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteException(exception.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
