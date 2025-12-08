import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseISO, startOfDay, parse } from 'date-fns';
import { isSlotAvailable, BusinessHours } from '@/lib/availability';

export const runtime = 'nodejs'

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

    result[day] = {
      open: h.start || null,
      close: h.end || null,
      closed: isClosed
    };
  }

  return result;
}

export async function POST(request: NextRequest) {
  let business_id: string | undefined;
  let appointment_date: string | undefined;
  let start_time: string | undefined;
  let service_duration: number | undefined;

  try {
    const body = await request.json();
    ({ business_id, appointment_date, start_time, service_duration } = body);

    // Validar parámetros requeridos
    if (!business_id || !appointment_date || !start_time || !service_duration) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const date = startOfDay(parseISO(appointment_date));
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. Obtener horarios del negocio
    const { data: business, error: businessError } = await supabase
      .from('business_profiles')
      .select('business_hours')
      .eq('id', business_id)
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
      .eq('business_id', business_id)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'Appointment settings not found' },
        { status: 404 }
      );
    }

    // 3. Obtener excepciones del día
    const { data: exceptions, error: exceptionsError } = await supabase
      .from('availability_exceptions')
      .select('*')
      .eq('business_id', business_id)
      .lte('start_date', appointment_date)
      .gte('end_date', appointment_date);

    if (exceptionsError) {
      console.error('Error fetching exceptions:', exceptionsError);
    }

    // 4. Obtener citas existentes del día
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('appointment_date, start_time, end_time, status')
      .eq('business_id', business_id)
      .eq('appointment_date', appointment_date)
      .neq('status', 'cancelled');

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
    }

    // 5. Validar disponibilidad del slot
    const transformedHours = transformBusinessHours(business.business_hours);

    console.log('Validating slot:', {
      date: appointment_date,
      time: start_time,
      transformedHours,
      settings: {
        slot_duration_minutes: settings.slot_duration_minutes,
        buffer_time_minutes: settings.buffer_time_minutes,
        max_appointments_per_slot: settings.max_appointments_per_slot,
        min_booking_notice_hours: settings.min_booking_notice_hours
      }
    });

    const result = isSlotAvailable(
      date,
      start_time,
      transformedHours,
      {
        slot_duration_minutes: settings.slot_duration_minutes,
        buffer_time_minutes: settings.buffer_time_minutes,
        max_appointments_per_slot: settings.max_appointments_per_slot,
        min_booking_notice_hours: settings.min_booking_notice_hours,
        max_booking_advance_days: settings.max_booking_advance_days
      },
      service_duration,
      exceptions || [],
      appointments || []
    );

    console.log('Validation result:', result);

    return NextResponse.json({
      available: result.available,
      reason: result.reason || (result.available ? 'Available' : 'Not available'),
      business_id,
      appointment_date,
      start_time,
      service_duration
    });

  } catch (error) {
    console.error('Error validating slot:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      business_id,
      appointment_date,
      start_time,
      service_duration
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
