'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PawPrint } from 'lucide-react'

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <PawPrint className="h-6 w-6 text-primary" />
            <span className="font-bold">Tail-Time</span>
          </Link>
        </div>
        <nav className="flex flex-1 items-center space-x-4 text-sm text-muted-foreground">
          <Link href="#features" className="hover:text-primary transition-colors">Características</Link>
          <Link href="#pricing" className="hover:text-primary transition-colors">Precios</Link>
        </nav>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Registrarse</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
