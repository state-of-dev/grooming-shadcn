// Análisis de datos de appointments para decidir el enfoque
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://tpevasxrlkekdocosxgb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZXZhc3hybGtla2RvY29zeGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzM4ODEsImV4cCI6MjA3MjEwOTg4MX0.RXGoQqEjcIYfbYrDpE329SLpl6n1Re220dbuyE-Spyo'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function analyzeData() {
  console.log('🔍 ANÁLISIS DE DATOS DE APPOINTMENTS\n')

  // Total appointments
  const { data: all, count: totalCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact' })

  console.log(`📊 Total appointments: ${totalCount}\n`)

  // Con pet_id
  const { count: withPetId } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .not('pet_id', 'is', null)

  // Sin pet_id
  const { count: withoutPetId } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .is('pet_id', null)

  console.log('🐾 PET_ID:')
  console.log(`   Con pet_id: ${withPetId} (${Math.round(withPetId/totalCount*100)}%)`)
  console.log(`   Sin pet_id: ${withoutPetId} (${Math.round(withoutPetId/totalCount*100)}%)\n`)

  // Con service_id
  const { count: withServiceId } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .not('service_id', 'is', null)

  // Sin service_id
  const { count: withoutServiceId } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .is('service_id', null)

  console.log('💼 SERVICE_ID:')
  console.log(`   Con service_id: ${withServiceId} (${Math.round(withServiceId/totalCount*100)}%)`)
  console.log(`   Sin service_id: ${withoutServiceId} (${Math.round(withoutServiceId/totalCount*100)}%)\n`)

  // Ver ejemplos de appointments CON relaciones
  console.log('─'.repeat(80))
  console.log('\n✅ EJEMPLO DE APPOINTMENT CON RELACIONES (nuevo formato):\n')

  const { data: withRelations } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_date,
      start_time,
      status,
      total_amount,
      pet_id,
      service_id,
      customer:customers(name),
      pet:pets(name, breed),
      service:services(name, duration)
    `)
    .not('pet_id', 'is', null)
    .not('service_id', 'is', null)
    .limit(1)
    .single()

  if (withRelations) {
    console.log(JSON.stringify(withRelations, null, 2))
  } else {
    console.log('⚠️  No hay appointments con pet_id Y service_id')
  }

  // Ver ejemplos de appointments SIN relaciones
  console.log('\n─'.repeat(80))
  console.log('\n❌ EJEMPLO DE APPOINTMENT SIN RELACIONES (formato legacy):\n')

  const { data: withoutRelations } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_date,
      start_time,
      status,
      total_amount,
      pet_id,
      service_id,
      customer_notes,
      internal_notes,
      customer:customers(name)
    `)
    .is('pet_id', null)
    .is('service_id', null)
    .limit(1)
    .single()

  if (withoutRelations) {
    console.log(JSON.stringify(withoutRelations, null, 2))
  }

  console.log('\n─'.repeat(80))
  console.log('\n💡 RECOMENDACIÓN:\n')

  if (withPetId === 0 && withServiceId === 0) {
    console.log('   ❌ TODOS los appointments usan el formato legacy (notes)')
    console.log('   📝 Opción 1: Parsear notes (rápido pero no ideal)')
    console.log('   🔄 Opción 2: Migrar a relaciones (más trabajo pero correcto)')
    console.log('\n   ✅ MEJOR: Migrar datos a relaciones y usar el wizard nuevo')
  } else if (withPetId === totalCount && withServiceId === totalCount) {
    console.log('   ✅ TODOS los appointments usan relaciones correctas')
    console.log('   👍 Perfecto, solo usar pet_id y service_id')
  } else {
    console.log('   ⚠️  HAY MEZCLA de formatos (legacy + nuevo)')
    console.log('   🔀 MEJOR: Enfoque híbrido que soporte ambos')
    console.log('\n   if (pet_id) usar pet, else parsear customer_notes')
  }

  console.log('\n')
}

analyzeData().catch(console.error)
