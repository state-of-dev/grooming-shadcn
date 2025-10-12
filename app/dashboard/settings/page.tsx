'use client'

import { useState, useEffect } from 'react'
import { useAuthGuard } from '@/lib/hooks/useAuthGuard'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Save, Building, Clock, Globe, Bell, CreditCard, Shield } from 'lucide-react'

// Expanded settings type
interface SettingsData {
  business_name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  allow_online_booking: boolean;
  require_approval_for_bookings: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
}

export default function SettingsPage() {
  const { businessProfile, loading: authLoading, refreshBusinessProfile } = useAuthGuard();
  const [settings, setSettings] = useState<Partial<SettingsData>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (businessProfile) {
      setSettings({
        business_name: businessProfile.business_name || '',
        description: businessProfile.description || '',
        phone: businessProfile.phone || '',
        email: businessProfile.email || '',
        address: businessProfile.address || '',
        allow_online_booking: businessProfile.allow_online_booking ?? true,
        require_approval_for_bookings: businessProfile.require_approval_for_bookings ?? false,
        email_notifications: businessProfile.email_notifications ?? true,
        sms_notifications: businessProfile.sms_notifications ?? false,
      });
    }
  }, [businessProfile]);

  const handleValueChange = (field: keyof SettingsData, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!businessProfile) return;
    setIsSaving(true);
    const { error } = await supabase
      .from('business_profiles')
      .update(settings)
      .eq('id', businessProfile.id);

    if (error) {
      alert('Error al guardar la configuración.');
    } else {
      alert('Configuración guardada con éxito.');
      await refreshBusinessProfile();
    }
    setIsSaving(false);
  };

  if (authLoading || !businessProfile) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">Administra la configuración de tu negocio y perfil.</p>
        </div>

        <Tabs defaultValue="business">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="business"><Building className="mr-2 h-4 w-4"/>Negocio</TabsTrigger>
            <TabsTrigger value="hours" disabled><Clock className="mr-2 h-4 w-4"/>Horarios</TabsTrigger>
            <TabsTrigger value="booking"><Globe className="mr-2 h-4 w-4"/>Reservas</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4"/>Notificaciones</TabsTrigger>
            <TabsTrigger value="payments" disabled><CreditCard className="mr-2 h-4 w-4"/>Pagos</TabsTrigger>
            <TabsTrigger value="security" disabled><Shield className="mr-2 h-4 w-4"/>Seguridad</TabsTrigger>
          </TabsList>

          <TabsContent value="business">
            <Card>
              <CardHeader><CardTitle>Información del Negocio</CardTitle><CardDescription>Actualiza los datos públicos de tu negocio.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Nombre del Negocio</Label><Input value={settings.business_name || ''} onChange={e => handleValueChange('business_name', e.target.value)} /></div>
                <div className="space-y-2"><Label>Descripción</Label><Textarea value={settings.description || ''} onChange={e => handleValueChange('description', e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Teléfono</Label><Input value={settings.phone || ''} onChange={e => handleValueChange('phone', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={settings.email || ''} onChange={e => handleValueChange('email', e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>Dirección</Label><Input value={settings.address || ''} onChange={e => handleValueChange('address', e.target.value)} /></div>
              </CardContent>
              <div className="p-6 pt-0 flex justify-end"><Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Guardar</Button></div>
            </Card>
          </TabsContent>

          <TabsContent value="booking">
            <Card>
              <CardHeader><CardTitle>Configuración de Reservas</CardTitle><CardDescription>Administra cómo los clientes pueden hacer reservas.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div><Label>Permitir reservas online</Label><p className="text-sm text-muted-foreground">Los clientes pueden reservar desde tu página.</p></div>
                  <Switch checked={settings.allow_online_booking} onCheckedChange={c => handleValueChange('allow_online_booking', c)} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div><Label>Requerir aprobación</Label><p className="text-sm text-muted-foreground">Las reservas necesitan tu confirmación.</p></div>
                  <Switch checked={settings.require_approval_for_bookings} onCheckedChange={c => handleValueChange('require_approval_for_bookings', c)} />
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex justify-end"><Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Guardar</Button></div>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader><CardTitle>Configuración de Notificaciones</CardTitle><CardDescription>Administra cómo y cuándo recibir notificaciones.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div><Label>Notificaciones por email</Label><p className="text-sm text-muted-foreground">Recibir emails sobre nuevas citas y cambios.</p></div>
                  <Switch checked={settings.email_notifications} onCheckedChange={c => handleValueChange('email_notifications', c)} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div><Label>Notificaciones por SMS</Label><p className="text-sm text-muted-foreground">Recibir SMS (requiere configuración adicional).</p></div>
                  <Switch checked={settings.sms_notifications} onCheckedChange={c => handleValueChange('sms_notifications', c)} />
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex justify-end"><Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Guardar</Button></div>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}