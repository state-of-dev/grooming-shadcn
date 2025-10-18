// Script para probar el query de appointments con todos los joins
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://tpevasxrlkekdocosxgb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZXZhc3hybGtla2RvY29zeGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzM4ODEsImV4cCI6MjA3MjEwOTg4MX0.RXGoQqEjcIYfbYrDpE329SLpl6n1Re220dbuyE-Spyo'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAppointmentsQuery() {
  console.log('🔍 Probando query de appointments con joins...\n')

  // Obtener appointments con toda la información relacionada
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      *,
      business:business_profiles (
        id,
        business_name,
        phone,
        address,
        city
      ),
      customer:customers (
        id,
        name,
        email,
        phone
      ),
      pet:pets (
        id,
        name,
        breed,
        size
      ),
      service:services (
        id,
        name,
        duration,
        price,
        category
      )
    `)
    .limit(3)
    .order('created_at', { ascending: false })

  if (error) {
    console.log('❌ Error al obtener appointments:', error.message)
    console.log('📝 Detalles:', error)
    return
  }

  console.log(`✅ Se obtuvieron ${appointments.length} appointments\n`)

  if (appointments.length > 0) {
    console.log('📋 Ejemplo de appointment con joins:\n')
    console.log(JSON.stringify(appointments[0], null, 2))

    console.log('\n📊 Estructura de datos verificada:')
    console.log(`   ✓ Appointment ID: ${appointments[0].id}`)
    console.log(`   ✓ Business: ${appointments[0].business?.business_name}`)
    console.log(`   ✓ Customer: ${appointments[0].customer?.name}`)
    console.log(`   ✓ Pet: ${appointments[0].pet?.name} (${appointments[0].pet?.breed})`)
    console.log(`   ✓ Service: ${appointments[0].service?.name}`)
    console.log(`   ✓ Status: ${appointments[0].status}`)
    console.log(`   ✓ Date: ${appointments[0].appointment_date}`)
    console.log(`   ✓ Time: ${appointments[0].start_time}`)
    console.log(`   ✓ Total: $${appointments[0].total_amount}`)
  }

  // Verificar estados disponibles
  console.log('\n📊 Estados de appointments disponibles:')
  const { data: statuses } = await supabase
    .from('appointments')
    .select('status')

  const uniqueStatuses = [...new Set(statuses.map(s => s.status))]
  console.log('   Estados encontrados:', uniqueStatuses.join(', '))

  // Contar por estado
  console.log('\n📈 Conteo por estado:')
  for (const status of uniqueStatuses) {
    const { count } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)
    console.log(`   ${status}: ${count}`)
  }

  console.log('\n✅ Query verificado exitosamente!')
}

testAppointmentsQuery().catch(console.error)
