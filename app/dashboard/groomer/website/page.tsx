'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, ArrowLeft, Save, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function WebsitePage() {
  const { user, profile, businessProfile, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    business_name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    whatsapp: '',
  })

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/login')
      return
    }

    if (profile && profile.role !== 'groomer') {
      router.replace('/customer/dashboard')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (businessProfile) {
      setFormData({
        business_name: businessProfile.business_name || '',
        description: (businessProfile as any).description || '',
        address: (businessProfile as any).address || '',
        phone: (businessProfile as any).phone || '',
        email: (businessProfile as any).email || '',
        whatsapp: (businessProfile as any).whatsapp || '',
      })
    }
  }, [businessProfile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!businessProfile?.id) return

    // Validation
    if (!formData.business_name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del negocio es requerido',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          business_name: formData.business_name,
          description: formData.description,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          whatsapp: formData.whatsapp,
        })
        .eq('id', businessProfile.id)

      if (error) throw error

      toast({
        title: 'Cambios guardados',
        description: 'La información de tu página web ha sido actualizada',
      })
    } catch (error) {
      console.error('Error updating business:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (profile.role !== 'groomer') {
    return null
  }

  const websiteUrl = businessProfile?.slug
    ? `${window.location.origin}/${businessProfile.slug}`
    : null

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/groomer">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Mi Página Web</h1>
              <p className="text-muted-foreground">
                Actualiza la información que se muestra en tu página
              </p>
            </div>
          </div>
          {websiteUrl && (
            <Button variant="outline" asChild>
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver página
              </a>
            </Button>
          )}
        </div>

        {/* Website URL */}
        {websiteUrl && (
          <Card>
            <CardHeader>
              <CardTitle>URL de tu página</CardTitle>
              <CardDescription>
                Comparte este enlace con tus clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={websiteUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(websiteUrl)
                    toast({
                      title: 'Copiado',
                      description: 'URL copiada al portapapeles',
                    })
                  }}
                >
                  Copiar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Información del Negocio</CardTitle>
              <CardDescription>
                Esta información se mostrará en tu página web y en el marketplace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Nombre del Negocio *</Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) =>
                    setFormData({ ...formData, business_name: e.target.value })
                  }
                  placeholder="Ej: Estética Canina Perrify"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe tu negocio, servicios y especialidades..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Esta descripción aparecerá en tu página y en el marketplace
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Ej: Av. Reforma 123, Col. Centro, CDMX"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Ej: 55 1234 5678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) =>
                      setFormData({ ...formData, whatsapp: e.target.value })
                    }
                    placeholder="Ej: 55 1234 5678"
                  />
                  <p className="text-xs text-muted-foreground">
                    Se mostrará un botón de WhatsApp en tu página
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email de contacto</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Ej: contacto@miestetica.com"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/groomer')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}