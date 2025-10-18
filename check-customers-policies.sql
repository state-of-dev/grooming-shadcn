│ │ ALTER TABLE pets                                                                                                                                     │ │
│ │ ADD COLUMN IF NOT EXISTS species VARCHAR(10) DEFAULT 'dog';                                                                                          │ │
│ │                                                                                                                                                      │ │
│ │ -- Add breed column                                                                                                                                  │ │
│ │ ALTER TABLE pets                                                                                                                                     │ │
│ │ ADD COLUMN IF NOT EXISTS breed VARCHAR(100);                                                                                                         │ │
│ │                                                                                                                                                      │ │
│ │ -- Add weight column                                                                                                                                 │ │
│ │ ALTER TABLE pets                                                                                                                                     │ │
│ │ ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2);                                                                                                        │ │
│ │                                                                                                                                                      │ │
│ │ -- Add notes column                                                                                                                                  │ │
│ │ ALTER TABLE pets                                                                                                                                     │ │
│ │ ADD COLUMN IF NOT EXISTS notes TEXT;                                                                                                                 │ │
│ │                                                                                                                                                      │ │
│ │ -- Add comments for documentation                                                                                                                    │ │
│ │ COMMENT ON COLUMN pets.species IS 'Especie de la mascota (dog o cat)';                                                                               │ │
│ │ COMMENT ON COLUMN pets.breed IS 'Raza de la mascota';                                                                                                │ │
│ │ COMMENT ON COLUMN pets.weight IS 'Peso de la mascota en kilogramos';                                                                                 │ │
│ │ COMMENT ON COLUMN pets.notes IS 'Notas adicionales sobre la mascota (comportamiento, condiciones especiales, alergias, etc.)';                       │ │
│ │                                                                                                                                                      │ │
│ │ -- Show updated table structure                                                                                                                      │ │
│ │ SELECT column_name, data_type, is_nullable                                                                                                           │ │
│ │ FROM information_schema.columns                                                                                                                      │ │
│ │ WHERE table_name = 'pets'                                                                                                                            │ │
│ │ ORDER BY ordinal_position; 