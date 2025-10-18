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
