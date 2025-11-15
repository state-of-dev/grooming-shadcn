'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TimeSlot {
  time: string;
  available: boolean;
  conflictsCount: number;
  reason?: string;
}

interface AvailabilityTimePickerProps {
  businessId: string;
  selectedDate: Date;
  serviceDuration: number;
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
}

export function AvailabilityTimePicker({
  businessId,
  selectedDate,
  serviceDuration,
  selectedTime,
  onTimeSelect
}: AvailabilityTimePickerProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailability();
  }, [businessId, selectedDate, serviceDuration]);

  async function loadAvailability() {
    if (!selectedDate) return;

    setLoading(true);
    setError(null);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(
        `/api/availability/${businessId}?start_date=${dateStr}&end_date=${dateStr}&service_duration=${serviceDuration}`
      );

      if (!response.ok) {
        throw new Error('Failed to load availability');
      }

      const data = await response.json();
      const dayAvailability = data.availability[0];

      if (dayAvailability && dayAvailability.slots) {
        setSlots(dayAvailability.slots);
      } else {
        setSlots([]);
      }
    } catch (err) {
      console.error('Error loading availability:', err);
      setError('Error al cargar disponibilidad');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando disponibilidad...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={loadAvailability}>
            Reintentar
          </Button>
        </div>
      </Card>
    );
  }

  if (slots.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Clock className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No hay horarios disponibles para este día
          </p>
        </div>
      </Card>
    );
  }

  const availableSlots = slots.filter(s => s.available);
  const morningSlots = slots.filter(s => {
    const hour = parseInt(s.time.split(':')[0]);
    return hour < 12;
  });
  const afternoonSlots = slots.filter(s => {
    const hour = parseInt(s.time.split(':')[0]);
    return hour >= 12 && hour < 18;
  });
  const eveningSlots = slots.filter(s => {
    const hour = parseInt(s.time.split(':')[0]);
    return hour >= 18;
  });

  function renderSlotGroup(title: string, groupSlots: TimeSlot[]) {
    if (groupSlots.length === 0) return null;

    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {groupSlots.map((slot) => (
            <Button
              key={slot.time}
              variant={selectedTime === slot.time ? 'default' : 'outline'}
              disabled={!slot.available}
              onClick={() => slot.available && onTimeSelect(slot.time)}
              className={cn(
                'relative',
                !slot.available && 'opacity-50 cursor-not-allowed'
              )}
              title={slot.reason || (slot.available ? 'Disponible' : 'No disponible')}
            >
              {slot.time}
              {!slot.available && slot.conflictsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                  {slot.conflictsCount}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Selecciona un horario</h2>
          </div>
          <div className="text-sm text-muted-foreground">
            {availableSlots.length} {availableSlots.length === 1 ? 'horario disponible' : 'horarios disponibles'}
          </div>
        </div>

        <div className="space-y-6">
          {renderSlotGroup('Mañana', morningSlots)}
          {renderSlotGroup('Tarde', afternoonSlots)}
          {renderSlotGroup('Noche', eveningSlots)}
        </div>

        <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Los horarios mostrados ya consideran la duración del servicio ({serviceDuration} min).</p>
            <p>Los horarios no disponibles están bloqueados o ya tienen citas programadas.</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
