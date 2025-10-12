# MVP Funcionalidades y Pantallas - Grooming Platform

## ✅ COMPLETADAS

### Configuración Base
- [x] Next.js 15 + App Router
- [x] Tailwind CSS + shadcn/ui
- [x] Supabase client configurado
- [x] Estructura de carpetas básica

### Componentes UI Base
- [x] Button
- [x] Card
- [x] Input
- [x] Label
- [x] Table
- [x] Badge
- [x] Alert Dialog
- [x] Dialog
- [x] Tabs

### Layout
- [x] Navbar básico
- [x] Footer básico
- [x] Layout principal

## 🚧 EN PROGRESO

### Autenticación
- [x] Auth Context simplificado
- [x] Login page funcional con redirección por rol
- [x] Register page funcional con selector de rol
- [x] Logout funcional
- [x] Protección de rutas básica (redirect en dashboards)

### Dashboards
- [x] Dashboard redirect (redirige según rol)
- [x] Dashboard groomer básico
- [x] Dashboard customer básico

## 📋 PENDIENTES

### Pantallas Públicas
- [x] Landing page (ya existe)
- [x] Login (/login)
- [x] Register (/register)

### Pantallas Groomer
- [x] Dashboard groomer (/dashboard/groomer)
  - Vista general
  - Links a secciones principales
  - Botón logout

- [ ] Calendario (/dashboard/calendar)
  - Ver citas del día/semana
  - Cambiar estado de citas

- [ ] Servicios (/dashboard/services)
  - Listar servicios
  - Crear/editar servicios

- [ ] Clientes (/dashboard/clients)
  - Listar clientes y sus mascotas

- [ ] Portfolio (/dashboard/portfolio)
  - Galería de trabajos

- [ ] Settings (/dashboard/settings)
  - Datos del negocio
  - Horarios

### Pantallas Customer
- [x] Dashboard cliente (/customer/dashboard)
  - Links a secciones principales
  - Botón logout
  - Estados vacíos

- [ ] Reservar cita
  - Seleccionar servicio
  - Seleccionar fecha/hora
  - Confirmar reserva

### Setup/Onboarding
- [ ] Business setup (/setup/business) - Groomer
- [ ] Services setup (/setup/services-setup) - Groomer
- [ ] Business hours (/setup/business-hours) - Groomer
- [ ] Portfolio setup (/setup/portfolio-setup) - Groomer
- [ ] Launch confirmation (/setup/launch-confirmation) - Groomer

### Funcionalidades Core

#### Autenticación ✅
- [x] Login con email/password
- [x] Register como groomer o customer
- [x] Logout
- [x] Verificación de sesión
- [x] Redirección según rol

#### Groomers
- [ ] Ver agenda de citas
- [ ] Cambiar estado de cita (confirmar/completar/cancelar)
- [ ] CRUD servicios básico
- [ ] Ver clientes
- [ ] Configurar horario de negocio
- [ ] Upload imágenes portfolio

#### Customers
- [ ] Ver mis citas
- [ ] Reservar nueva cita
- [ ] Registrar mascota
- [ ] Ver historial

#### Base de Datos (Supabase)
- [ ] Tabla: user_profiles
- [ ] Tabla: business_profiles
- [ ] Tabla: services
- [ ] Tabla: appointments
- [ ] Tabla: customers
- [ ] Tabla: pets

## 🎯 PRIORIDAD INMEDIATA (Siguiente Sprint)

1. **Auth Context Simplificado**
   - SignIn, SignUp, SignOut
   - User + Profile básico
   - BusinessProfile para groomers
   - Loading states

2. **Páginas de Auth**
   - Login funcional
   - Register funcional (con selector de rol)
   - Redirección después de login

3. **Dashboard Groomer Básico**
   - Vista de citas del día
   - Lista simple de appointments

4. **Dashboard Customer Básico**
   - Ver mis citas
   - Botón "Nueva cita"

## 📦 Componentes UI Faltantes Necesarios

- [ ] Select
- [ ] Textarea
- [ ] Calendar/DatePicker (opcional, puede ser input date)
- [ ] Avatar
- [ ] Dropdown Menu
- [ ] Switch
- [ ] Checkbox

## 🔧 Hooks Necesarios

- [ ] useAuth (ya viene del context)
- [ ] useUser (wrapper simple)
- [ ] Protección de rutas (middleware o componente)

## 📝 Notas

- Mantener todo simple, sin over-engineering
- No agregar funcionalidades "por si acaso"
- Cada feature debe ser funcional antes de agregar la siguiente
- UI limpia con shadcn/ui, sin estilos custom innecesarios
