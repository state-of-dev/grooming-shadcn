// Tipos para el sistema de negocios

export interface BusinessHours {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

export interface DaySchedule {
  open: string | null
  close: string | null
  closed: boolean
}

export interface Amenity {
  name: string
  label: string
}

export interface Certification {
  name: string
  issuer: string
  year: number
}

export interface BusinessProfile {
  id: string
  business_name: string
  slug: string
  description: string
  phone: string | null
  address: string | null
  is_active: boolean
  created_at: string

  // Nuevos campos
  hours: BusinessHours | null
  latitude: number | null
  longitude: number | null
  cover_image: string | null
  amenities: Amenity[]
  about: string | null
  years_experience: number | null
  certifications: Certification[]
}

export interface BusinessImage {
  id: string
  business_id: string
  image_url: string
  caption: string | null
  display_order: number
  is_cover: boolean
  created_at: string
}

export interface Review {
  id: string
  business_id: string
  customer_id: string
  appointment_id: string | null
  rating: number
  comment: string | null
  is_verified: boolean
  is_featured: boolean
  created_at: string
  customer?: {
    name: string
  }
}

export interface BusinessRating {
  business_id: string
  total_reviews: number
  average_rating: number
  five_star_count: number
  four_star_count: number
  three_star_count: number
  two_star_count: number
  one_star_count: number
}

export interface Service {
  id: string
  name: string
  description: string
  duration: number
  price: number
  category: string
  is_active: boolean
}
