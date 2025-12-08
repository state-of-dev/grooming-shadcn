// Utilidades para calcular disponibilidad de slots de tiempo

import { format, addMinutes, isBefore, isAfter, parse, parseISO } from 'date-fns';

// Mapa de traducción de días de inglés a español
const DAY_TRANSLATION: Record<string, string> = {
  'monday': 'lunes',
  'tuesday': 'martes',
  'wednesday': 'miércoles',
  'thursday': 'jueves',
  'friday': 'viernes',
  'saturday': 'sábado',
  'sunday': 'domingo'
};

export interface TimeSlot {
  time: string; // HH:mm format
  available: boolean;
  conflictsCount: number;
  reason?: string;
}

export interface DayAvailability {
  date: string; // YYYY-MM-DD format
  isOpen: boolean;
  slots: TimeSlot[];
  totalAvailable: number;
}

export interface BusinessHours {
  open: string | null;
  close: string | null;
  closed: boolean;
}

export interface AppointmentSettings {
  slot_duration_minutes: number;
  buffer_time_minutes: number;
  max_appointments_per_slot: number;
  min_booking_notice_hours: number;
  max_booking_advance_days: number;
}

export interface AvailabilityException {
  exception_type: 'block' | 'vacation' | 'break' | 'custom';
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
}

export interface ExistingAppointment {
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

/**
 * Genera slots de tiempo disponibles para un día específico
 */
export function generateTimeSlots(
  date: Date,
  businessHours: Record<string, BusinessHours>,
  settings: AppointmentSettings,
  serviceDuration: number,
  exceptions: AvailabilityException[] = [],
  existingAppointments: ExistingAppointment[] = []
): TimeSlot[] {
  const dayNameEnglish = format(date, 'EEEE').toLowerCase();
  const dayName = DAY_TRANSLATION[dayNameEnglish] || dayNameEnglish;
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayHours = businessHours[dayName];

  // Si el negocio está cerrado ese día
  if (!dayHours || dayHours.closed || !dayHours.open || !dayHours.close) {
    return [];
  }

  const slots: TimeSlot[] = [];
  const slotDuration = settings.slot_duration_minutes;
  const bufferTime = settings.buffer_time_minutes;
  const maxPerSlot = settings.max_appointments_per_slot;

  // Parsear horarios de apertura y cierre
  const openTime = parse(dayHours.open, 'HH:mm', date);
  const closeTime = parse(dayHours.close, 'HH:mm', date);

  // Tiempo mínimo de anticipación
  const now = new Date();
  const minNoticeTime = addMinutes(now, settings.min_booking_notice_hours * 60);

  let currentSlot = openTime;

  while (isBefore(currentSlot, closeTime)) {
    const slotEndTime = addMinutes(currentSlot, serviceDuration + bufferTime);
    const slotTimeStr = format(currentSlot, 'HH:mm');
    const slotEndTimeStr = format(slotEndTime, 'HH:mm');

    // Verificar que hay tiempo suficiente antes del cierre
    if (isAfter(slotEndTime, closeTime)) {
      break;
    }

    // Verificar tiempo mínimo de anticipación
    const slotDateTime = parse(`${dateStr} ${slotTimeStr}`, 'yyyy-MM-dd HH:mm', new Date());
    if (isBefore(slotDateTime, minNoticeTime)) {
      slots.push({
        time: slotTimeStr,
        available: false,
        conflictsCount: 0,
        reason: 'Too soon to book'
      });
      currentSlot = addMinutes(currentSlot, slotDuration);
      continue;
    }

    // Verificar excepciones (bloqueos, vacaciones)
    const isBlocked = exceptions.some(exception => {
      const exceptionStart = parseISO(exception.start_date);
      const exceptionEnd = parseISO(exception.end_date);

      // Verificar si la fecha está en el rango
      if (!(date >= exceptionStart && date <= exceptionEnd)) {
        return false;
      }

      // Si es todo el día, está bloqueado
      if (exception.is_all_day) {
        return true;
      }

      // Verificar overlap de horario
      if (exception.start_time && exception.end_time) {
        const excStart = parse(exception.start_time, 'HH:mm:ss', date);
        const excEnd = parse(exception.end_time, 'HH:mm:ss', date);

        // Hay overlap si el slot está dentro del bloqueo
        return (
          (currentSlot >= excStart && currentSlot < excEnd) ||
          (slotEndTime > excStart && slotEndTime <= excEnd) ||
          (currentSlot <= excStart && slotEndTime >= excEnd)
        );
      }

      return false;
    });

    if (isBlocked) {
      slots.push({
        time: slotTimeStr,
        available: false,
        conflictsCount: 0,
        reason: 'Time blocked by business'
      });
      currentSlot = addMinutes(currentSlot, slotDuration);
      continue;
    }

    // Contar citas existentes que se solapan
    const conflictsCount = existingAppointments.filter(apt => {
      if (apt.appointment_date !== dateStr || apt.status === 'cancelled') {
        return false;
      }

      const aptStart = parse(apt.start_time, 'HH:mm:ss', date);
      const aptEnd = parse(apt.end_time, 'HH:mm:ss', date);

      // Hay overlap si:
      return (
        (currentSlot >= aptStart && currentSlot < aptEnd) ||
        (slotEndTime > aptStart && slotEndTime <= aptEnd) ||
        (currentSlot <= aptStart && slotEndTime >= aptEnd)
      );
    }).length;

    // Verificar si hay capacidad disponible
    const available = conflictsCount < maxPerSlot;

    slots.push({
      time: slotTimeStr,
      available,
      conflictsCount,
      reason: available ? undefined : 'No availability - time slot full'
    });

    currentSlot = addMinutes(currentSlot, slotDuration);
  }

  return slots;
}

/**
 * Calcula disponibilidad para múltiples días
 */
export function calculateAvailability(
  startDate: Date,
  endDate: Date,
  businessHours: Record<string, BusinessHours>,
  settings: AppointmentSettings,
  serviceDuration: number,
  exceptions: AvailabilityException[] = [],
  existingAppointments: ExistingAppointment[] = []
): DayAvailability[] {
  const days: DayAvailability[] = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    const dayNameEnglish = format(currentDate, 'EEEE').toLowerCase();
    const dayName = DAY_TRANSLATION[dayNameEnglish] || dayNameEnglish;
    const dayHours = businessHours[dayName];
    const isOpen = !!(dayHours && !dayHours.closed && dayHours.open && dayHours.close);

    const slots = isOpen
      ? generateTimeSlots(currentDate, businessHours, settings, serviceDuration, exceptions, existingAppointments)
      : [];

    days.push({
      date: format(currentDate, 'yyyy-MM-dd'),
      isOpen,
      slots,
      totalAvailable: slots.filter(s => s.available).length
    });

    // Siguiente día
    currentDate = addMinutes(currentDate, 24 * 60);
  }

  return days;
}

/**
 * Valida si un slot específico está disponible
 */
export function isSlotAvailable(
  date: Date,
  time: string,
  businessHours: Record<string, BusinessHours>,
  settings: AppointmentSettings,
  serviceDuration: number,
  exceptions: AvailabilityException[] = [],
  existingAppointments: ExistingAppointment[] = []
): { available: boolean; reason?: string } {
  const slots = generateTimeSlots(date, businessHours, settings, serviceDuration, exceptions, existingAppointments);
  const slot = slots.find(s => s.time === time);

  if (!slot) {
    return { available: false, reason: 'Invalid time slot' };
  }

  return { available: slot.available, reason: slot.reason };
}
