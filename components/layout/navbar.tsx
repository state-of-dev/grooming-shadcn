'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PawPrint, User, LogOut, LayoutDashboard, Store } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { NotificationCenter } from '@/components/notifications/notification-center'

export function Navbar() {
  const { user, profile, loading, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  // Determine dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!profile) return '/dashboard'
    return profile.role === 'groomer' ? '/dashboard/groomer' : '/customer/dashboard'
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-2">
              <PawPrint className="h-6 w-6 text-primary" />
              <span className="font-bold">Paw-Society</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6 text-sm text-muted-foreground">
              <Link href="/marketplace" className="hover:text-primary transition-colors flex items-center gap-1">
                <Store className="h-4 w-4" />
                Marketplace
              </Link>
              {user && (
                <Link href={getDashboardUrl()} className="hover:text-primary transition-colors flex items-center gap-1">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center space-x-2">
            {!loading && !user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Registrarse</Link>
                </Button>
              </>
            ) : user ? (
              <>
                <NotificationCenter />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <User className="h-5 w-5" />
                      <span className="sr-only">Menú de usuario</span>
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.full_name || 'Usuario'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/marketplace" className="cursor-pointer">
                      <Store className="mr-2 h-4 w-4" />
                      Marketplace
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardUrl()} className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
