-- ====================================================================
-- MIGRACIÓN: Agregar columna setup_completed a business_profiles
-- ====================================================================
-- Ejecuta este SQL en Supabase SQL Editor
-- Link: https://supabase.com/dashboard/project/tpevasxrlkekdocosxgb/sql

-- 1. Agregar la columna setup_completed
ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false;

-- 2. Actualizar registros existentes que ya tienen servicios
UPDATE business_profiles
SET setup_completed = true
WHERE id IN (
  SELECT DISTINCT business_id
  FROM services
  WHERE is_active = true
);

-- 3. Agregar comentario a la columna
COMMENT ON COLUMN business_profiles.setup_completed
IS 'Indica si el groomer completó el wizard de onboarding (3 pasos: negocio, horarios, servicios)';

-- 4. Verificar que se creó correctamente
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'business_profiles'
  AND column_name = 'setup_completed';

-- Deberías ver:
-- column_name: setup_completed
-- data_type: boolean
-- is_nullable: YES
-- column_default: false
