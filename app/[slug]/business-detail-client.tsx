'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MapPin,
  Phone,
  Clock,
  DollarSign,
  Calendar,
  ArrowRight,
  Scissors,
  Check,
  Tag,
  Star,
  Award,
  Image as ImageIcon
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import type { BusinessProfile, Service, BusinessImage, Review, BusinessRating } from '@/lib/types/business'
import ImageGallery from '@/components/business/image-gallery'
import BusinessHoursComponent from '@/components/business/business-hours'
import ReviewsSection from '@/components/business/reviews-section'
import LocationMap from '@/components/business/location-map'
import ShareButton from '@/components/business/share-button'

interface Props {
  business: BusinessProfile
  services: Service[]
  images: BusinessImage[]
  reviews: Review[]
  rating: BusinessRating | null
}

// Nombres bonitos para las categorías
const categoryNames: Record<string, string> = {
  'baño': 'Baño y Secado',
  'corte': 'Corte y Peinado',
  'spa': 'Spa Completo',
  'cuidado': 'Uñas y Cuidado',
  'premium': 'Tratamientos Premium',
  'otros': 'Otros Servicios'
}

export default function BusinessDetailClient({ business, services, images, reviews, rating }: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  // Agrupar servicios por categoría
  const servicesByCategory = services.reduce((acc, service) => {
    const category = service.category || 'otros'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  const handleBookService = (service?: Service) => {
    // Si hay un servicio específico, guardarlo
    const serviceToBook = service || selectedService

    if (serviceToBook) {
      // Guardar servicio seleccionado en localStorage para pre-seleccionarlo
      localStorage.setItem('preselected-service', serviceToBook.id)
    }

    // Redirigir a la página de booking
    const bookingUrl = `/business/${business.slug}/book`

    if (!user) {
      // Si no está logueado, redirigir a login con returnTo
      router.push(`/login?returnTo=${encodeURIComponent(bookingUrl)}`)
    } else {
      // Si está logueado, ir directo a booking
      router.push(bookingUrl)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                {business.business_name}
              </h1>
              {business.description && (
                <p className="text-xl text-muted-foreground max-w-2xl">
                  {business.description}
                </p>
              )}
            </div>
            <ShareButton
              url={`/${business.slug}`}
              title={business.business_name}
              description={business.description || undefined}
            />
          </div>

          {/* Rating y contacto */}
          <div className="flex flex-wrap gap-6 text-sm sm:text-base items-center">
            {rating && rating.total_reviews > 0 && (
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{rating.average_rating.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({rating.total_reviews} {rating.total_reviews === 1 ? 'reseña' : 'reseñas'})
                </span>
              </div>
            )}
            {business.address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span>{business.address}</span>
              </div>
            )}
            {business.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                <a href={`tel:${business.phone}`} className="hover:underline">
                  {business.phone}
                </a>
              </div>
            )}
          </div>

          {/* CTA Principal */}
          <div className="mt-8 flex justify-center md:justify-start">
            <Button
              size="lg"
              onClick={() => handleBookService()}
              className="text-lg px-8 py-6"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Agendar mi Cita
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Galería de fotos */}
        {images.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <ImageIcon className="w-7 h-7" />
              Galería
            </h2>
            <ImageGallery images={images} businessName={business.business_name} />
          </section>
        )}

        {/* Sobre Nosotros + Horarios + Mapa en Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Sobre nosotros */}
          {business.about && (
            <Card>
              <CardHeader>
                <CardTitle>Sobre Nosotros</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{business.about}</p>

                {business.years_experience && (
                  <div className="mt-4 flex items-center gap-2 text-primary">
                    <Award className="w-5 h-5" />
                    <span className="font-semibold">
                      {business.years_experience} años de experiencia
                    </span>
                  </div>
                )}

                {business.certifications && business.certifications.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Certificaciones</h4>
                    <div className="space-y-2">
                      {business.certifications.map((cert, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>{cert.name} - {cert.issuer} ({cert.year})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {business.amenities && business.amenities.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Instalaciones y Servicios</h4>
                    <div className="flex flex-wrap gap-2">
                      {business.amenities.map((amenity, index) => (
                        <Badge key={index} variant="secondary">
                          {amenity.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Horarios */}
          <div className="space-y-8">
            <BusinessHoursComponent hours={business.hours} />

            {/* Mapa */}
            <LocationMap
              address={business.address}
              latitude={business.latitude}
              longitude={business.longitude}
              businessName={business.business_name}
            />
          </div>
        </div>

        {/* Servicios */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Nuestros Servicios</h2>
            <p className="text-muted-foreground">
              Selecciona el servicio que más se adapte a las necesidades de tu mascota
            </p>
          </div>

          {services.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Scissors className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Este negocio aún no ha publicado sus servicios
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-12">
              {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                <div key={category}>
                  {/* Título de categoría */}
                  <div className="flex items-center gap-2 mb-6">
                    <Tag className="w-6 h-6 text-primary" />
                    <h3 className="text-2xl font-semibold">
                      {categoryNames[category] || category}
                    </h3>
                  </div>

                  {/* Grid de servicios */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {categoryServices.map((service) => (
                      <Card
                        key={service.id}
                        className="hover:shadow-lg transition-shadow cursor-pointer group"
                        onClick={() => setSelectedService(service)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors">
                                {service.name}
                              </CardTitle>
                              <CardDescription className="text-sm">
                                {service.description}
                              </CardDescription>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Scissors className="w-6 h-6 text-primary" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm">{service.duration} min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-5 h-5" />
                              <span className="text-2xl font-bold">{service.price}</span>
                            </div>
                          </div>
                          <Button
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleBookService(service)
                            }}
                          >
                            Reservar este servicio
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Reviews y calificaciones */}
        <ReviewsSection rating={rating} reviews={reviews} />

        {/* CTA Final */}
        <section className="text-center py-16">
          <h3 className="text-3xl font-bold mb-4">
            ¿Listo para consentir a tu mascota?
          </h3>
          <p className="text-xl text-muted-foreground mb-8">
            Agenda tu cita ahora y dale a tu mascota el cuidado que se merece
          </p>
          <Button
            size="lg"
            onClick={() => handleBookService()}
            className="text-lg px-8 py-6"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Agendar mi Cita Ahora
          </Button>
        </section>
      </div>

      {/* Botón flotante (sticky) para móvil */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t md:hidden z-50">
        <Button
          size="lg"
          onClick={() => handleBookService()}
          className="w-full"
        >
          <Calendar className="w-5 h-5 mr-2" />
          Agendar Cita
        </Button>
      </div>
    </div>
  )
}
