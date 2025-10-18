// Script para ejecutar la migración de setup_completed
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://tpevasxrlkekdocosxgb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZXZhc3hybGtla2RvY29zeGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzM4ODEsImV4cCI6MjA3MjEwOTg4MX0.RXGoQqEjcIYfbYrDpE329SLpl6n1Re220dbuyE-Spyo'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function runMigration() {
  console.log('🚀 Ejecutando migración: agregar columna setup_completed\n')

  // Note: Esta operación requiere permisos de service_role para ejecutar ALTER TABLE
  // Como solo tenemos anon key, vamos a verificar si la columna ya existe

  console.log('⚠️  NOTA IMPORTANTE:')
  console.log('   La migración ALTER TABLE requiere ejecutarse manualmente en Supabase SQL Editor')
  console.log('   Ya que no tenemos permisos de service_role con la anon key.\n')

  console.log('📋 Ejecuta este SQL en Supabase SQL Editor:\n')
  console.log('─'.repeat(80))
  console.log(`
-- Add setup_completed column to business_profiles table
ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false;

-- Update existing records to true if they have services configured
UPDATE business_profiles
SET setup_completed = true
WHERE id IN (
  SELECT DISTINCT business_id
  FROM services
  WHERE is_active = true
);

-- Add comment to column
COMMENT ON COLUMN business_profiles.setup_completed IS 'Indicates if the groomer has completed the onboarding setup wizard';
`)
  console.log('─'.repeat(80))
  console.log('\n✅ Copia y pega el SQL anterior en https://supabase.com/dashboard/project/[tu-proyecto]/sql')
  console.log('\n🔗 Link directo: https://supabase.com/dashboard/project/tpevasxrlkekdocosxgb/sql\n')
}

runMigration().catch(console.error)
