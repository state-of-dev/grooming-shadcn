'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Star,
  MapPin,
  Phone,
  Search,
  Scissors,
  Calendar,
  Loader2,
  PawPrint
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BusinessProfile {
  id: string
  business_name: string
  slug: string
  description: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  logo_url: string | null
  cover_image_url: string | null
  is_active: boolean
}

export default function MarketplacePage() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<BusinessProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState('all')

  useEffect(() => {
    loadBusinesses()
  }, [])

  useEffect(() => {
    filterBusinesses()
  }, [businesses, searchTerm, selectedCity])

  const loadBusinesses = async () => {
    try {
      const { data: businesses, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('is_active', true)
        .eq('setup_completed', true)
        .order('business_name')

      if (error) {
        console.error('Error loading businesses:', error)
        return
      }

      setBusinesses(businesses || [])
      setFilteredBusinesses(businesses || [])
    } catch (error) {
      console.error('Error loading businesses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterBusinesses = () => {
    let filtered = businesses

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(business =>
        business.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.city?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // City filter
    if (selectedCity !== 'all') {
      filtered = filtered.filter(business =>
        business.city?.toLowerCase() === selectedCity.toLowerCase()
      )
    }

    setFilteredBusinesses(filtered)
  }

  const getUniqueCities = () => {
    const cities = businesses
      .map(business => business.city)
      .filter(Boolean)
      .filter((city, index, self) => self.indexOf(city) === index)
    return cities.sort()
  }

  const handleBusinessClick = (slug: string) => {
    router.push(`/business/${slug}/book`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando marketplace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/10 to-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Encuentra tu Groomer Perfecto
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Profesionales verificados, cuidado de calidad para tu mascota
            </p>
          </div>
        </div>
      </section>

      {/* Filters & Results Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar with Filters */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Filtros
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Search */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Buscar Groomer
                    </label>
                    <Input
                      placeholder="Nombre o descripción..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* City Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Ciudad
                    </label>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las ciudades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las ciudades</SelectItem>
                        {getUniqueCities().map(city => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Results count */}
                  <div className="pt-4 border-t">
                    <Badge variant="secondary">
                      {filteredBusinesses.length} resultado{filteredBusinesses.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content - Grid of Business Cards */}
            <div className="lg:col-span-3">
              {filteredBusinesses.length === 0 ? (
                <div className="text-center py-16">
                  <PawPrint className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-2xl font-semibold mb-2">
                    No hay groomers disponibles
                  </h3>
                  <p className="text-muted-foreground">
                    Ajusta tus filtros o intenta de nuevo más tarde
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredBusinesses.map((business) => (
                    <Card
                      key={business.id}
                      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                      onClick={() => handleBusinessClick(business.slug)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl line-clamp-1">
                              {business.business_name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {business.city || 'Sin ubicación'}, {business.state || ''}
                              </span>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            <Scissors className="w-3 h-3 mr-1" />
                            Activo
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                          {business.description || 'Profesional dedicado al cuidado de tu mascota'}
                        </CardDescription>

                        {/* Services badges */}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">Baño</Badge>
                          <Badge variant="outline">Corte</Badge>
                          <Badge variant="outline">Spa</Badge>
                        </div>

                        {/* Rating and contact */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className="w-4 h-4 fill-primary text-primary"
                              />
                            ))}
                            <span className="ml-2 text-sm font-medium">(4.9)</span>
                          </div>
                          {business.phone && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(`tel:${business.phone}`, '_self')
                              }}
                            >
                              <Phone className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        {/* CTA Button */}
                        <Button className="w-full">
                          <Calendar className="w-4 h-4 mr-2" />
                          Ver Detalles y Reservar
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
