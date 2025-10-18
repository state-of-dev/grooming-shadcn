'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Mail, Lock, User, Loader2, Briefcase, Heart, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const { signUp, user, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer' as 'customer' | 'groomer'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    console.log('🔍 Register useEffect - User state:', user ? `User ID: ${user.id}` : 'No user')
    if (user) {
      console.log('⚠️ User already logged in, redirecting to /dashboard')
      router.replace('/dashboard')
    }
  }, [user, router])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.fullName) {
      newErrors.fullName = 'Nombre es requerido'
    }
    if (!formData.email) {
      newErrors.email = 'Email es requerido'
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Email inválido'
    }
    if (!formData.password) {
      newErrors.password = 'Contraseña es requerida'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🚀 Register form submitted')
    if (!validateForm()) {
      console.log('❌ Form validation failed')
      return
    }

    setIsLoading(true)
    setErrors({})

    console.log('📝 Signing up user with role:', formData.role)
    const { error } = await signUp(
      formData.email,
      formData.password,
      formData.fullName,
      formData.role
    )

    if (error) {
      console.log('❌ Signup error:', error.message)
      setErrors({ submit: error.message })
      setIsLoading(false)
    } else {
      console.log('✅ Signup successful!')
      setIsLoading(false)
      // Show success modal for email confirmation
      setShowSuccessModal(true)
    }
  }

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    router.push('/login')
  }

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Crear cuenta</CardTitle>
          <CardDescription>Únete a nuestra plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
            <div className="space-y-3">
              <Label>Tipo de cuenta</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'customer' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.role === 'customer'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  disabled={isLoading}
                >
                  <Heart className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-semibold">Cliente</div>
                  <div className="text-xs text-muted-foreground">Busco servicios</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'groomer' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.role === 'groomer'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  disabled={isLoading}
                >
                  <Briefcase className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-semibold">Negocio</div>
                  <div className="text-xs text-muted-foreground">Ofrezco servicios</div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="pl-10"
                  placeholder="Tu nombre"
                  disabled={isLoading}
                />
              </div>
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10"
                  placeholder="tu@email.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="pl-10 pr-10"
                  placeholder="Mínimo 6 caracteres"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="pl-10"
                  placeholder="Repite tu contraseña"
                  disabled={isLoading}
                />
              </div>
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
            </div>

            {errors.submit && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive">
                <p className="text-sm text-destructive text-center">{errors.submit}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando cuenta...</>
              ) : (
                'Crear cuenta'
              )}
            </Button>

            <div className="text-center text-sm">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Inicia sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Success Modal */}
      <AlertDialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-500" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl">
              ¡Registro Exitoso!
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center space-y-3">
                <p className="text-base">
                  Gracias por registrarte. Te hemos enviado un correo de confirmación a:
                </p>
                <p className="font-semibold text-foreground">
                  {formData.email}
                </p>
                <p className="text-sm">
                  Por favor, revisa tu bandeja de entrada y confirma tu cuenta para poder iniciar sesión.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleCloseSuccessModal} className="w-full">
              Ir a Iniciar Sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
