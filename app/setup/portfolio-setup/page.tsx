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
import { Checkbox } from '@/components/ui/checkbox'
import { Camera, Plus, Trash2, Loader2, AlertCircle, UploadCloud, X } from 'lucide-react'

interface PortfolioItem {
  id: string
  title: string
  description: string
  beforeImage: File | null
  afterImage: File | null
}

export default function PortfolioSetupPage() {
  const { businessProfile, loading: authLoading } = useAuthGuard()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [skipPortfolio, setSkipPortfolio] = useState(false)

  const addPortfolioItem = () => {
    setPortfolioItems(prev => [...prev, { id: crypto.randomUUID(), title: '', description: '', beforeImage: null, afterImage: null }])
  }

  const removePortfolioItem = (id: string) => {
    setPortfolioItems(prev => prev.filter(item => item.id !== id))
  }

  const updateItemField = (id: string, field: keyof PortfolioItem, value: any) => {
    setPortfolioItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const handleImageSelect = (id: string, field: 'beforeImage' | 'afterImage', file: File | null) => {
    if (file && !file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, [`file-${id}`]: 'Archivo inválido.' }))
      return
    }
    updateItemField(id, field, file)
  }

  const uploadImage = async (file: File, businessId: string): Promise<string | null> => {
    const filePath = `${businessId}/${crypto.randomUUID()}-${file.name}`
    const { data, error } = await supabase.storage.from('portfolio-images').upload(filePath, file)
    if (error) {
      console.error('Upload Error:', error)
      return null
    }
    const { data: { publicUrl } } = supabase.storage.from('portfolio-images').getPublicUrl(data.path)
    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessProfile) return
    setIsLoading(true)
    setErrors({})

    if (skipPortfolio) {
      router.push('/setup/launch-confirmation')
      return
    }

    try {
      for (const item of portfolioItems) {
        if (!item.title) continue // Skip empty items

        let beforeImageUrl: string | undefined = undefined
        let afterImageUrl: string | undefined = undefined

        if (item.beforeImage) {
          beforeImageUrl = await uploadImage(item.beforeImage, businessProfile.id) ?? undefined
        }
        if (item.afterImage) {
          afterImageUrl = await uploadImage(item.afterImage, businessProfile.id) ?? undefined
        }

        const { error } = await supabase.from('portfolio_images').insert({
          business_id: businessProfile.id,
          title: item.title,
          description: item.description,
          before_image_url: beforeImageUrl,
          after_image_url: afterImageUrl,
        })
        if (error) throw error
      }
      router.push('/setup/launch-confirmation')
    } catch (error: any) {
      setErrors({ submit: error.message || 'Error al guardar el portafolio.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || !businessProfile) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  const ImageUploader = ({ item, field }: { item: PortfolioItem, field: 'beforeImage' | 'afterImage' }) => {
    const file = item[field]
    return (
      <div className="space-y-2">
        <Label>{field === 'beforeImage' ? 'Foto Antes' : 'Foto Después'}</Label>
        <div className="border-2 border-dashed rounded-lg p-4 text-center h-32 flex items-center justify-center relative">
          {file ? (
            <>
              <img src={URL.createObjectURL(file)} alt="preview" className="h-full w-full object-contain rounded-md" />
              <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => handleImageSelect(item.id, field, null)}><X className="h-4 w-4" /></Button>
            </>
          ) : (
            <label htmlFor={`file-${item.id}-${field}`} className="cursor-pointer space-y-1">
              <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Subir imagen</p>
              <Input id={`file-${item.id}-${field}`} type="file" accept="image/*" className="hidden" onChange={e => handleImageSelect(item.id, field, e.target.files?.[0] || null)} />
            </label>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/50 p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Tu Portafolio</h1>
          <p className="text-muted-foreground">Paso 4: Muestra tus mejores trabajos. ¡Una imagen vale más que mil palabras!</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardContent className="p-4 flex items-center space-x-2">
              <Checkbox id="skip" checked={skipPortfolio} onCheckedChange={(checked) => setSkipPortfolio(Boolean(checked))} />
              <Label htmlFor="skip" className="cursor-pointer">Omitir este paso por ahora</Label>
            </CardContent>
          </Card>

          {!skipPortfolio && (
            <>
              {portfolioItems.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl">Nuevo Trabajo</CardTitle>
                      <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removePortfolioItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`title-${item.id}`}>Título</Label>
                      <Input id={`title-${item.id}`} value={item.title} onChange={e => updateItemField(item.id, 'title', e.target.value)} placeholder="Ej: Corte de verano para Caniche" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`desc-${item.id}`}>Descripción</Label>
                      <Textarea id={`desc-${item.id}`} value={item.description} onChange={e => updateItemField(item.id, 'description', e.target.value)} placeholder="Describe el trabajo realizado..." />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <ImageUploader item={item} field="beforeImage" />
                      <ImageUploader item={item} field="afterImage" />
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button type="button" variant="outline" onClick={addPortfolioItem} className="w-full"><Plus className="mr-2 h-4 w-4" />Agregar Otro Trabajo</Button>
            </>
          )}

          {errors.submit && (
            <div className="p-3 my-2 rounded-md bg-destructive/10 border border-destructive/50 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <p>{errors.submit}</p>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>Atrás</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : 'Guardar y Finalizar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
