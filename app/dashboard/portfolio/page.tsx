'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuthGuard } from '@/lib/hooks/useAuthGuard'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Loader2, Plus, Search, Image as ImageIcon, Eye, Star, Heart, UploadCloud, X, Edit, Trash2 } from 'lucide-react'

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  before_image_url: string | null;
  after_image_url: string | null;
  is_featured: boolean;
  is_public: boolean;
}

const initialUploadState: Partial<PortfolioItem> & { beforeImage?: File | null, afterImage?: File | null } = {
  title: '',
  description: '',
  beforeImage: null,
  afterImage: null,
}

export default function PortfolioManagementPage() {
  const { businessProfile, loading: authLoading } = useAuthGuard();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVisibility, setFilterVisibility] = useState('all');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(initialUploadState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPortfolio = useCallback(async () => {
    if (!businessProfile) return;
    setIsLoading(true);
    const { data } = await supabase.from('portfolio_images').select('*').eq('business_id', businessProfile.id).order('created_at', { ascending: false });
    if (data) setPortfolioItems(data as PortfolioItem[]);
    setIsLoading(false);
  }, [businessProfile]);

  useEffect(() => { if(businessProfile) loadPortfolio(); }, [businessProfile, loadPortfolio]);

  const filteredItems = useMemo(() => {
    return portfolioItems.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesVisibility = filterVisibility === 'all' || (filterVisibility === 'public' && item.is_public) || (filterVisibility === 'private' && !item.is_public) || (filterVisibility === 'featured' && item.is_featured);
      return matchesSearch && matchesVisibility;
    });
  }, [portfolioItems, searchTerm, filterVisibility]);

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!businessProfile || !formData.title) return alert('El título es requerido.');
    setIsSubmitting(true);
    try {
      let { before_image_url, after_image_url } = formData as PortfolioItem;

      const uploadImage = async (file: File): Promise<string> => {
        const filePath = `${businessProfile.id}/${crypto.randomUUID()}`;
        const { data, error } = await supabase.storage.from('portfolio-images').upload(filePath, file);
        if (error) throw error;
        return supabase.storage.from('portfolio-images').getPublicUrl(data.path).data.publicUrl;
      };

      if (formData.beforeImage) before_image_url = await uploadImage(formData.beforeImage);
      if (formData.afterImage) after_image_url = await uploadImage(formData.afterImage);

      const payload = { title: formData.title, description: formData.description, before_image_url, after_image_url, business_id: businessProfile.id };

      const { error } = formData.id
        ? await supabase.from('portfolio_images').update(payload).eq('id', formData.id)
        : await supabase.from('portfolio_images').insert(payload);

      if (error) throw error;
      
      setIsFormOpen(false);
      loadPortfolio();
    } catch (error) { alert('Error al guardar.'); console.error(error); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (item: PortfolioItem) => {
    // Delete from DB
    const { error: dbError } = await supabase.from('portfolio_images').delete().eq('id', item.id);
    if (dbError) return alert('Error al eliminar de la base de datos.');

    // Delete from Storage
    const pathsToRemove: string[] = [];
    if (item.before_image_url) pathsToRemove.push(item.before_image_url.split('/portfolio-images/')[1]);
    if (item.after_image_url) pathsToRemove.push(item.after_image_url.split('/portfolio-images/')[1]);
    if (pathsToRemove.length > 0) {
      await supabase.storage.from('portfolio-images').remove(pathsToRemove);
    }

    loadPortfolio();
  };

  if (authLoading || !businessProfile) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gestión de Portafolio</h1>
          <Button onClick={() => { setFormData(initialUploadState); setIsFormOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Agregar Trabajo</Button>
        </div>

        {/* Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader><DialogTitle>{formData.id ? 'Editar' : 'Agregar'} Trabajo</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>Título</Label><Input value={formData.title} onChange={e => handleFormChange('title', e.target.value)} /></div>
              <div className="space-y-2"><Label>Descripción</Label><Textarea value={formData.description} onChange={e => handleFormChange('description', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <ImageUploader label="Foto Antes" file={formData.beforeImage} imageUrl={formData.before_image_url} onSelect={file => handleFormChange('beforeImage', file)} />
                <ImageUploader label="Foto Después" file={formData.afterImage} imageUrl={formData.after_image_url} onSelect={file => handleFormChange('afterImage', file)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Filters and Grid... */}
        <Card><CardContent className="pt-6 flex gap-4"><Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></CardContent></Card>
        {isLoading ? <div className="flex justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <Card key={item.id}>
                <CardContent className="p-0">
                  <div className="aspect-video bg-muted grid grid-cols-2 gap-px">
                     <div style={{backgroundImage: `url(${item.before_image_url})`}} className="bg-cover bg-center" />
                     <div style={{backgroundImage: `url(${item.after_image_url})`}} className="bg-cover bg-center" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold truncate">{item.title}</h3>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => { setFormData(item); setIsFormOpen(true); }}>Editar</Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="text-destructive hover:text-destructive">Eliminar</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle><AlertDialogDescription>Esta acción es permanente.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(item)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ImageUploader({ label, file, imageUrl, onSelect }: { label: string, file: File | null, imageUrl?: string | null, onSelect: (file: File | null) => void }) {
  const src = file ? URL.createObjectURL(file) : imageUrl;
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="border-2 border-dashed rounded-lg p-4 text-center h-32 flex items-center justify-center relative hover:border-primary transition-colors">
        {src ? (
          <>
            <img src={src} alt="preview" className="h-full w-full object-contain rounded-md" />
            <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 bg-white/50 backdrop-blur-sm" onClick={() => onSelect(null)}><X className="h-4 w-4" /></Button>
          </>
        ) : (
          <label className="cursor-pointer space-y-1">
            <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
            <Input type="file" accept="image/*" className="hidden" onChange={e => onSelect(e.target.files?.[0] || null)} />
          </label>
        )}
      </div>
    </div>
  )
}
