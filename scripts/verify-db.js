// Script para verificar la estructura de la base de datos
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://tpevasxrlkekdocosxgb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZXZhc3hybGtla2RvY29zeGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzM4ODEsImV4cCI6MjA3MjEwOTg4MX0.RXGoQqEjcIYfbYrDpE329SLpl6n1Re220dbuyE-Spyo'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyDatabase() {
  console.log('🔍 Verificando estructura de la base de datos...\n')

  // 1. Verificar tabla appointments
  console.log('📋 Verificando tabla APPOINTMENTS:')
  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('*')
    .limit(1)

  if (appointmentsError) {
    console.log('❌ Error:', appointmentsError.message)
    console.log('ℹ️  La tabla appointments no existe o no es accesible\n')
  } else {
    console.log('✅ Tabla appointments existe')
    console.log('📊 Columnas:', Object.keys(appointments[0] || {}))
    console.log('📈 Total registros:', appointments.length > 0 ? 'Hay datos' : 'Sin datos\n')
  }

  // 2. Verificar tabla services
  console.log('\n📋 Verificando tabla SERVICES:')
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('*')
    .limit(1)

  if (servicesError) {
    console.log('❌ Error:', servicesError.message)
    console.log('ℹ️  La tabla services no existe o no es accesible\n')
  } else {
    console.log('✅ Tabla services existe')
    console.log('📊 Columnas:', Object.keys(services[0] || {}))
    console.log('📈 Total registros:', services.length > 0 ? 'Hay datos' : 'Sin datos\n')
  }

  // 3. Verificar tabla customers
  console.log('\n📋 Verificando tabla CUSTOMERS:')
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('*')
    .limit(1)

  if (customersError) {
    console.log('❌ Error:', customersError.message)
    console.log('ℹ️  La tabla customers no existe o no es accesible\n')
  } else {
    console.log('✅ Tabla customers existe')
    console.log('📊 Columnas:', Object.keys(customers[0] || {}))
    console.log('📈 Total registros:', customers.length > 0 ? 'Hay datos' : 'Sin datos\n')
  }

  // 4. Verificar tabla pets
  console.log('\n📋 Verificando tabla PETS:')
  const { data: pets, error: petsError } = await supabase
    .from('pets')
    .select('*')
    .limit(1)

  if (petsError) {
    console.log('❌ Error:', petsError.message)
    console.log('ℹ️  La tabla pets no existe o no es accesible\n')
  } else {
    console.log('✅ Tabla pets existe')
    console.log('📊 Columnas:', Object.keys(pets[0] || {}))
    console.log('📈 Total registros:', pets.length > 0 ? 'Hay datos' : 'Sin datos\n')
  }

  // 5. Verificar tabla business_profiles (especialmente setup_completed)
  console.log('\n📋 Verificando tabla BUSINESS_PROFILES:')
  const { data: businesses, error: businessError } = await supabase
    .from('business_profiles')
    .select('*')
    .limit(1)

  if (businessError) {
    console.log('❌ Error:', businessError.message)
  } else {
    console.log('✅ Tabla business_profiles existe')
    console.log('📊 Columnas:', Object.keys(businesses[0] || {}))
    if (businesses[0] && 'setup_completed' in businesses[0]) {
      console.log('✅ Columna setup_completed existe')
    } else {
      console.log('⚠️  Columna setup_completed NO existe - necesita migración')
    }
    console.log('📈 Total registros:', businesses.length > 0 ? 'Hay datos' : 'Sin datos\n')
  }

  // 6. Contar registros totales
  console.log('\n📊 RESUMEN DE DATOS:')

  const { count: appointmentsCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
  console.log(`   Appointments: ${appointmentsCount || 0}`)

  const { count: servicesCount } = await supabase
    .from('services')
    .select('*', { count: 'exact', head: true })
  console.log(`   Services: ${servicesCount || 0}`)

  const { count: customersCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
  console.log(`   Customers: ${customersCount || 0}`)

  const { count: petsCount } = await supabase
    .from('pets')
    .select('*', { count: 'exact', head: true })
  console.log(`   Pets: ${petsCount || 0}`)

  const { count: businessCount } = await supabase
    .from('business_profiles')
    .select('*', { count: 'exact', head: true })
  console.log(`   Business Profiles: ${businessCount || 0}`)

  console.log('\n✅ Verificación completa!')
}

verifyDatabase().catch(console.error)
