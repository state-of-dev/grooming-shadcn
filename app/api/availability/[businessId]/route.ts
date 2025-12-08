import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addDays, parseISO, startOfDay } from 'date-fns';
import { calculateAvailability, BusinessHours } from '@/lib/availability';

export const runtime = 'nodejs'

// Función para transformar business_hours al formato esperado
function transformBusinessHours(businessHours: any): Record<string, BusinessHours> {
  if (!businessHours || typeof businessHours !== 'object') {
    return {};
  }

  const result: Record<string, BusinessHours> = {};

  for (const [day, hours] of Object.entries(businessHours)) {
    const h = hours as any;

    const isClosed = h.open === false || !h.start || !h.end;

    result[day] = {
      open: h.start || null,
      close: h.end || null,
      closed: isClosed
    };
  }

  return result;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    // 👇 Nuevo: Next.js 15 ahora trata params como Promise
    const { businessId } = await context.params;

    const searchParams = request.nextUrl.searchParams;

    const startDateStr = searchParams.get('start_date');
    const endDateStr = searchParams.get('end_date');
    const serviceDurationStr = searchParams.get('service_duration');

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
      : addDays(startDate, 30);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. Horarios del negocio
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

    // 2. Configuración de citas
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

    // 3. Excepciones
    const { data: exceptions, error: exceptionsError } = await supabase
      .from('availability_exceptions')
      .select('*')
      .eq('business_id', businessId)
      .or(`and(start_date.lte.${endDate.toISOString()},end_date.gte.${startDate.toISOString()})`);

    if (exceptionsError) {
      console.error('Error fetching exceptions:', exceptionsError);
    }

    // 4. Citas existentes
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}