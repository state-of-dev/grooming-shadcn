import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import BusinessDetailClient from './business-detail-client'
import type { BusinessProfile, Service, BusinessImage, Review, BusinessRating } from '@/lib/types/business'

// Lista de rutas reservadas que NO pueden ser slugs de negocios
const RESERVED_ROUTES = [
  'marketplace',
  'login',
  'signup',
  'register',
  'dashboard',
  'customer',
  'groomer',
  'business',
  'profile',
  'settings',
  'admin',
  'api',
  'about',
  'contact',
  'help',
  'terms',
  'privacy',
  'blog',
  'pricing',
  'features'
]

async function getBusinessBySlug(slug: string) {
  const { data: business, error } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !business) {
    return null
  }

  return business as BusinessProfile
}

async function getBusinessServices(businessId: string) {
  const { data: services, error } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('price', { ascending: true })

  if (error) {
    console.error('Error loading services:', error)
    return []
  }

  return services as Service[]
}

async function getBusinessImages(businessId: string) {
  const { data: images, error } = await supabase
    .from('business_images')
    .select('*')
    .eq('business_id', businessId)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error loading images:', error)
    return []
  }

  return images as BusinessImage[]
}

async function getBusinessReviews(businessId: string) {
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select(`
      *,
      customer:customers(name)
    `)
    .eq('business_id', businessId)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error loading reviews:', error)
    return []
  }

  return reviews as unknown as Review[]
}

async function getBusinessRating(businessId: string) {
  const { data: rating, error } = await supabase
    .from('business_ratings')
    .select('*')
    .eq('business_id', businessId)
    .single()

  // Si no existe rating aún, retorna null sin error
  if (error && error.code === 'PGRST116') {
    return null
  }

  if (error) {
    console.error('Error loading rating:', error)
    return null
  }

  return rating as BusinessRating
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params

  if (RESERVED_ROUTES.includes(slug.toLowerCase())) {
    return {}
  }

  const business = await getBusinessBySlug(slug)

  if (!business) {
    return {}
  }

  const rating = await getBusinessRating(business.id)

  return {
    title: `${business.business_name} - Grooming Profesional`,
    description: business.description || `Servicios de grooming profesional en ${business.business_name}. Agenda tu cita ahora.`,
    openGraph: {
      title: business.business_name,
      description: business.description || '',
      type: 'website',
      locale: 'es_MX',
      images: business.cover_image ? [business.cover_image] : []
    },
    twitter: {
      card: 'summary_large_image',
      title: business.business_name,
      description: business.description || ''
    },
    ...(rating && {
      other: {
        'rating': rating.average_rating.toString(),
        'reviews': rating.total_reviews.toString()
      }
    })
  }
}

export default async function BusinessPublicPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Verificar si es una ruta reservada
  if (RESERVED_ROUTES.includes(slug.toLowerCase())) {
    notFound()
  }

  // Buscar el negocio por slug
  const business = await getBusinessBySlug(slug)

  if (!business) {
    notFound()
  }

  // Cargar todos los datos del negocio en paralelo
  const [services, images, reviews, rating] = await Promise.all([
    getBusinessServices(business.id),
    getBusinessImages(business.id),
    getBusinessReviews(business.id),
    getBusinessRating(business.id)
  ])

  return (
    <BusinessDetailClient
      business={business}
      services={services}
      images={images}
      reviews={reviews}
      rating={rating}
    />
  )
}
