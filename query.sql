DROP POLICY IF EXISTS "Allow insert during registration" ON business_profiles;
CREATE POLICY "Allow insert during registration"
ON business_profiles FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert during registration" ON services;
CREATE POLICY "Allow insert during registration"
ON services FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert during registration" ON appointment_settings;
CREATE POLICY "Allow insert during registration"
ON appointment_settings FOR INSERT
TO anon, authenticated
WITH CHECK (true);
