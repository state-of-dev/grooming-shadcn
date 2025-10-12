'use client'

import { useAuth } from '@/lib/auth-context'
import { useAuthGuard } from '@/lib/hooks/useAuthGuard'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function CustomerDashboardPage() {
  const { user, loading } = useAuthGuard();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    // The auth provider will handle redirecting to login
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard del Cliente</h1>
            <p className="text-muted-foreground">
              ¡Bienvenido de vuelta, {profile?.full_name || user.email}!
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">Cerrar Sesión</Button>
        </div>
        <div>
          <p>Aquí verás tus próximas citas.</p>
        </div>
      </div>
    </div>
  );
}
