'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useAuthGuard } from '@/lib/hooks/useAuthGuard'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Store, Phone, MapPin, Loader2, AlertCircle } from 'lucide-react'

export default function BusinessSetupPage() {
  const { user } = useAuthGuard()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    phone: '',
    address: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 50)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Nombre del negocio es requerido'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Teléfono es requerido'
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Dirección es requerida'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || !user) return

    setIsLoading(true)
    setErrors({})

    const slug = generateSlug(formData.businessName)

    try {
      // Check if slug already exists
      const { data: existingBusiness, error: checkError } = await supabase
        .from('business_profiles')
        .select('slug')
        .eq('slug', slug)
        .single()

      if (existingBusiness) {
        setErrors({ businessName: 'Este nombre de negocio ya existe. Por favor, elige otro.' })
        setIsLoading(false)
        return
      }

      // Create new business profile
      const { data, error } = await supabase
        .from('business_profiles')
        .insert({
          owner_id: user.id,
          business_name: formData.businessName,
          slug: slug,
          description: formData.description,
          phone: formData.phone,
          address: formData.address,
          email: user.email, // Use user's email
        })
        .select()
        .single()

      if (error) throw error

      // Redirect to the next step
      router.push('/setup/business-hours')
    } catch (error: any) {
      setErrors({ submit: error.message || 'Ocurrió un error al crear el negocio.' })
      setIsLoading(false)
    }
  }

  if (!user) return null // AuthGuard will handle redirection

  return (
    <div className="min-h-screen bg-muted/50 p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-6 py-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Configura tu negocio</h1>
          <p className="text-muted-foreground">Paso 1: Completa la información básica de tu negocio.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Información del negocio
            </CardTitle>
            <CardDescription>Esta información será visible para tus clientes.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Nombre del negocio *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Ej: Paws & Claws Grooming"
                  disabled={isLoading}
                />
                {errors.businessName && <p className="text-sm text-destructive">{errors.businessName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe tu negocio, tu especialidad y los servicios que ofreces..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="h-4 w-4" />Teléfono *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                    disabled={isLoading}
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2"><MapPin className="h-4 w-4" />Dirección *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Calle 123, Ciudad"
                    disabled={isLoading}
                  />
                  {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                </div>
              </div>

              {errors.submit && (
                <div className="p-3 my-4 rounded-md bg-destructive/10 border border-destructive/50 text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <p>{errors.submit}</p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                  ) : (
                    'Guardar y Continuar'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
