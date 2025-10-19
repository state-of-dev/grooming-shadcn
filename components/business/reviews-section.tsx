'use client'

import { Star, StarHalf, Quote } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface Review {
  id: string
  rating: number
  comment: string | null
  is_verified: boolean
  is_featured: boolean
  created_at: string
  customer?: {
    name: string
  }
}

interface BusinessRating {
  total_reviews: number
  average_rating: number
  five_star_count: number
  four_star_count: number
  three_star_count: number
  two_star_count: number
  one_star_count: number
}

interface Props {
  rating: BusinessRating | null
  reviews: Review[]
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'
  const stars = []

  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      // Estrella completa
      stars.push(
        <Star key={i} className={`${sizeClass} fill-yellow-400 text-yellow-400`} />
      )
    } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
      // Media estrella
      stars.push(
        <StarHalf key={i} className={`${sizeClass} fill-yellow-400 text-yellow-400`} />
      )
    } else {
      // Estrella vacía
      stars.push(
        <Star key={i} className={`${sizeClass} text-gray-300`} />
      )
    }
  }

  return <div className="flex gap-1">{stars}</div>
}

export default function ReviewsSection({ rating, reviews }: Props) {
  if (!rating || rating.total_reviews === 0) {
    return null
  }

  const ratingDistribution = [
    { stars: 5, count: rating.five_star_count },
    { stars: 4, count: rating.four_star_count },
    { stars: 3, count: rating.three_star_count },
    { stars: 2, count: rating.two_star_count },
    { stars: 1, count: rating.one_star_count }
  ]

  // Mostrar solo reviews destacadas o las primeras 6
  const displayReviews = reviews.filter(r => r.is_featured).slice(0, 6)
  const hasReviews = displayReviews.length > 0

  return (
    <div className="space-y-8">
      {/* Resumen de calificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Calificaciones y Reseñas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Rating promedio */}
            <div className="text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div>
                  <div className="text-5xl font-bold mb-2">{rating.average_rating.toFixed(1)}</div>
                  <StarRating rating={rating.average_rating} size="lg" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Basado en {rating.total_reviews} {rating.total_reviews === 1 ? 'reseña' : 'reseñas'}
                  </p>
                </div>
              </div>
            </div>

            {/* Distribución de estrellas */}
            <div className="space-y-2">
              {ratingDistribution.map(({ stars, count }) => (
                <div key={stars} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-12">{stars} ⭐</span>
                  <Progress
                    value={(count / rating.total_reviews) * 100}
                    className="flex-1 h-2"
                  />
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reseñas destacadas */}
      {hasReviews && (
        <div>
          <h3 className="text-2xl font-bold mb-6">Reseñas Destacadas</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayReviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <StarRating rating={review.rating} />
                    {review.is_verified && (
                      <Badge variant="secondary" className="text-xs">
                        Verificada
                      </Badge>
                    )}
                  </div>

                  {review.comment && (
                    <div className="relative mb-4">
                      <Quote className="absolute -top-1 -left-1 w-4 h-4 text-primary/20" />
                      <p className="text-sm text-muted-foreground pl-4 italic">
                        {review.comment}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {review.customer?.name || 'Cliente anónimo'}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString('es-MX', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
