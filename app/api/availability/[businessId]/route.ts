import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addDays, parseISO, startOfDay } from 'date-fns';
import { calculateAvailability, BusinessHours } from '@/lib/availability';

// Función para transformar business_hours al formato esperado
function transformBusinessHours(businessHours: any): Record<string, BusinessHours> {
  if (!businessHours || typeof businessHours !== 'object') {
    return {};
  }

  const result: Record<string, BusinessHours> = {};

  for (const [day, hours] of Object.entries(businessHours)) {
    const h = hours as any;

    // Si open es false o no hay start/end, el día está cerrado
    const isClosed = h.open === false || !h.start || !h.end;

    // Transformar formato { open: boolean, start: string, end: string }
    // a formato { open: string, close: string, closed: boolean }
    result[day] = {
      open: h.start || null,           // "start" -> "open"
      close: h.end || null,             // "end" -> "close"
      closed: isClosed                  // determinar si está cerrado
    };
  }

  return result;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;
    const searchParams = request.nextUrl.searchParams;

    const startDateStr = searchParams.get('start_date');
    const endDateStr = searchParams.get('end_date');
    const serviceDurationStr = searchParams.get('service_duration');

    // Validar parámetros requeridos
    if (!startDateStr || !serviceDurationStr) {
      return NextResponse.json(
        { error: 'Missing required parameters: start_date, service_duration' },
        { status: 400 }
      );
    }

    const serviceDuration = parseInt(serviceDurationStr);
    const startDate = startOfDay(parseISO(startDateStr));
    const endDate = endDateStr
      ? startOfDay(parseISO(endDateStr))
      : addDays(startDate, 30); // Por defecto, 30 días

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. Obtener horarios del negocio
    const { data: business, error: businessError } = await supabase
      .from('business_profiles')
      .select('business_hours')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // 2. Obtener configuración de citas
    const { data: settings, error: settingsError } = await supabase
      .from('appointment_settings')
      .select('*')
      .eq('business_id', businessId)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'Appointment settings not found' },
        { status: 404 }
      );
    }

    // 3. Obtener excepciones (bloqueos, vacaciones)
    const { data: exceptions, error: exceptionsError } = await supabase
      .from('availability_exceptions')
      .select('*')
      .eq('business_id', businessId)
      .or(`and(start_date.lte.${endDate.toISOString()},end_date.gte.${startDate.toISOString()})`);

    if (exceptionsError) {
      console.error('Error fetching exceptions:', exceptionsError);
    }

    // 4. Obtener citas existentes en el rango de fechas
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('appointment_date, start_time, end_time, status')
      .eq('business_id', businessId)
      .gte('appointment_date', startDate.toISOString().split('T')[0])
      .lte('appointment_date', endDate.toISOString().split('T')[0])
      .neq('status', 'cancelled');

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
    }

    // 5. Calcular disponibilidad
    const transformedHours = transformBusinessHours(business.business_hours);

    const availability = calculateAvailability(
      startDate,
      endDate,
      transformedHours,
      {
        slot_duration_minutes: settings.slot_duration_minutes,
        buffer_time_minutes: settings.buffer_time_minutes,
        max_appointments_per_slot: settings.max_appointments_per_slot,
        min_booking_notice_hours: settings.min_booking_notice_hours,
        max_booking_advance_days: settings.max_booking_advance_days
      },
      serviceDuration,
      exceptions || [],
      appointments || []
    );

    return NextResponse.json({
      business_id: businessId,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      service_duration: serviceDuration,
      availability
    });

  } catch (error) {
    console.error('Error calculating availability:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      businessId,
      startDate: startDateStr,
      endDate: endDateStr,
      serviceDuration: serviceDurationStr
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
