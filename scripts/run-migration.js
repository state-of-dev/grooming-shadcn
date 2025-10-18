// Script para ejecutar la migración usando SQL directo
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://tpevasxrlkekdocosxgb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZXZhc3hybGtla2RvY29zeGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzM4ODEsImV4cCI6MjA3MjEwOTg4MX0.RXGoQqEjcIYfbYrDpE329SLpl6n1Re220dbuyE-Spyo'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function runMigration() {
  console.log('🚀 Intentando ejecutar migración...\n')

  // Intentar ejecutar SQL usando rpc si existe una función, o directamente
  const sql = `
    ALTER TABLE business_profiles
    ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false;

    UPDATE business_profiles
    SET setup_completed = true
    WHERE id IN (
      SELECT DISTINCT business_id
      FROM services
      WHERE is_active = true
    );
  `

  try {
    // Intentar usando SQL directo (esto probablemente falle con anon key)
    const { data, error } = await supabase.rpc('exec_sql', { query: sql })

    if (error) {
      console.log('❌ No se puede ejecutar con anon key (esperado)')
      console.log('📝 Error:', error.message)
      console.log('\n⚠️  SOLUCIÓN: Debes ejecutar manualmente en Supabase SQL Editor')
      console.log('\n🔗 Abre este link:')
      console.log('   https://supabase.com/dashboard/project/tpevasxrlkekdocosxgb/sql')
      console.log('\n📋 Y ejecuta este SQL:\n')
      console.log('─'.repeat(80))
      console.log(sql)
      console.log('─'.repeat(80))
      return
    }

    console.log('✅ Migración ejecutada exitosamente!')
    console.log('📊 Resultado:', data)
  } catch (err) {
    console.log('❌ Error inesperado:', err.message)
    console.log('\n⚠️  Por favor ejecuta manualmente en Supabase SQL Editor')
  }

  // Verificar si la columna existe ahora
  console.log('\n🔍 Verificando si la columna existe...')
  const { data: business, error: checkError } = await supabase
    .from('business_profiles')
    .select('*')
    .limit(1)
    .single()

  if (business && 'setup_completed' in business) {
    console.log('✅ ¡La columna setup_completed ya existe!')
    console.log('📊 Valor ejemplo:', business.setup_completed)
  } else if (checkError) {
    console.log('❌ Error verificando:', checkError.message)
  } else {
    console.log('⚠️  La columna setup_completed NO existe aún')
    console.log('📝 Debes ejecutar el SQL manualmente en Supabase')
  }
}

runMigration().catch(console.error)
