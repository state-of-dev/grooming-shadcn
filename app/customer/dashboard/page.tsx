'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Calendar, Heart, Search } from 'lucide-react'
import Link from 'next/link'

export default function CustomerDashboardPage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/login')
      return
    }

    if (profile && profile.role !== 'customer') {
      router.replace('/dashboard/groomer')
    }
  }, [user, profile, loading, router])

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (profile.role !== 'customer') {
    return null
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Mi Dashboard</h1>
            <p className="text-muted-foreground">Hola, {profile.full_name}!</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Cerrar Sesión
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <Link href="/marketplace">
              <CardHeader>
                <Search className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Buscar Grooming</CardTitle>
                <CardDescription>Encuentra el servicio perfecto</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:border-primary transition-colors cursor-pointer">
            <Link href="/customer/appointments">
              <CardHeader>
                <Calendar className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Mis Citas</CardTitle>
                <CardDescription>Ver y gestionar tus citas</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:border-primary transition-colors cursor-pointer">
            <Link href="/customer/pets">
              <CardHeader>
                <Heart className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Mis Mascotas</CardTitle>
                <CardDescription>Administrar tus mascotas</CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Próximas Citas</CardTitle>
            <CardDescription>Tus citas programadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No tienes citas programadas</p>
              <p className="text-sm mt-2">¡Agenda tu primera cita!</p>
              <Button asChild className="mt-4">
                <Link href="/marketplace">Buscar servicios</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* My Pets */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Mascotas</CardTitle>
            <CardDescription>Perfiles de tus mascotas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No has registrado mascotas</p>
              <p className="text-sm mt-2">Agrega tus mascotas para facilitar las reservas</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/customer/pets">Agregar mascota</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
