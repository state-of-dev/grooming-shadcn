'use client'

import { MapPin, Navigation } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Props {
  address: string | null
  latitude: number | null
  longitude: number | null
  businessName: string
}

export default function LocationMap({ address, latitude, longitude, businessName }: Props) {
  if (!address && !latitude && !longitude) return null

  // Generar URL de Google Maps
  const getMapUrl = () => {
    if (latitude && longitude) {
      return `https://www.google.com/maps?q=${latitude},${longitude}`
    }
    if (address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    }
    return null
  }

  // URL para iframe embed
  const getEmbedUrl = () => {
    if (latitude && longitude) {
      return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM8KwMDAnMDAuMCJOIDEyMsKwMDAnMDAuMCJX!5e0!3m2!1ses!2smx!4v1234567890`
    }
    return null
  }

  const mapUrl = getMapUrl()
  const embedUrl = getEmbedUrl()

  const handleGetDirections = () => {
    if (mapUrl) {
      window.open(mapUrl, '_blank')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Ubicación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dirección */}
        {address && (
          <p className="text-muted-foreground">{address}</p>
        )}

        {/* Mapa embed */}
        {embedUrl && (
          <div className="relative w-full h-64 rounded-lg overflow-hidden">
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Mapa de ${businessName}`}
            />
          </div>
        )}

        {/* Botón de direcciones */}
        {mapUrl && (
          <Button
            onClick={handleGetDirections}
            variant="outline"
            className="w-full"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Cómo llegar
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
