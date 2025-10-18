'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

interface DayHours {
  open: boolean
  start: string
  end: string
}

interface BusinessHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

interface BookingState {
  businessSlug: string
  businessId: string
  businessName: string
  service: {
    id: string
    name: string
    description: string
    duration: number
    price: number
  }
  step: string
  selectedDate?: string
  selectedTime?: string
}

interface TimeSlot {
  time: string
  available: boolean
  reason?: string
}

const DAYS_OF_WEEK = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
]

const DAY_NAMES = [
  'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'
]

export default function BookDatetimePage() {
  const params = useParams()
  const router = useRouter()
  const businessSlug = params.slug as string
  const { user } = useAuth()

  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null)
  const [bookingState, setBookingState] = useState<BookingState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    // Load booking state from localStorage
    const savedState = localStorage.getItem('booking-state')
    if (!savedState) {
      router.push(`/business/${businessSlug}/book`)
      return
    }

    try {
      const state = JSON.parse(savedState) as BookingState
      if (state.businessSlug !== businessSlug || state.step !== 'datetime') {
        router.push(`/business/${businessSlug}/book`)
        return
      }
      setBookingState(state)
      loadBusinessHours(state.businessId)
    } catch (error) {
      router.push(`/business/${businessSlug}/book`)
    }
  }, [businessSlug, router])

  useEffect(() => {
    if (selectedDate && businessHours && bookingState) {
      loadTimeSlots(selectedDate)
    }
  }, [selectedDate, businessHours, bookingState])

  const loadBusinessHours = async (businessId: string) => {
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('business_hours')
        .eq('id', businessId)
        .single()

      if (error || !data) {
        console.error('Error loading business hours:', error)
        setIsLoading(false)
        return
      }

      setBusinessHours(data.business_hours as BusinessHours)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTimeSlots = (date: string) => {
    if (!businessHours || !bookingState) return

    setLoadingSlots(true)
    try {
      const dateObj = new Date(date + 'T00:00:00')
      const dayOfWeek = DAYS_OF_WEEK[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1]
      const dayHours = businessHours[dayOfWeek as keyof BusinessHours]

      if (!dayHours || !dayHours.open) {
        setTimeSlots([])
        return
      }

      // Generate time slots based on business hours
      const slots: TimeSlot[] = []
      const serviceDuration = bookingState.service.duration
      const openTime = dayHours.start
      const closeTime = dayHours.end

      let currentTime = openTime
      while (currentTime < closeTime) {
        const [hours, minutes] = currentTime.split(':').map(Number)
        const slotTime = new Date()
        slotTime.setHours(hours, minutes, 0, 0)

        // Check if there's enough time for the service
        const endTime = new Date(slotTime.getTime() + serviceDuration * 60000)
        const closeDateTime = new Date()
        const [closeHours, closeMinutes] = closeTime.split(':').map(Number)
        closeDateTime.setHours(closeHours, closeMinutes, 0, 0)

        if (endTime <= closeDateTime) {
          // Check if slot is in the past
          const now = new Date()
          const slotDateTime = new Date(date + 'T' + currentTime)
          const isAvailable = slotDateTime > now

          slots.push({
            time: currentTime,
            available: isAvailable,
            reason: !isAvailable ? 'Hora pasada' : undefined
          })
        }

        // Move to next 30-minute slot
        const nextSlot = new Date(slotTime.getTime() + 30 * 60000)
        currentTime = nextSlot.toTimeString().slice(0, 5)
      }

      setTimeSlots(slots)
    } catch (error) {
      console.error('Error generating time slots:', error)
      setTimeSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedTime(null)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
  }

  const handleContinue = async () => {
    if (!selectedDate || !selectedTime || !bookingState) return

    // Update booking state
    const updatedState = {
      ...bookingState,
      selectedDate,
      selectedTime,
      step: user ? 'confirmation' : 'pet-info'
    }

    localStorage.setItem('booking-state', JSON.stringify(updatedState))

    // If user is logged in, they should already have customer data from onboarding
    // Skip pet-info and go directly to confirmation
    if (user) {
      router.push(`/business/${businessSlug}/book/confirmation`)
    } else {
      // Guest users need to fill in their info
      router.push(`/business/${businessSlug}/book/pet-info`)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const currentDate = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return days
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  if (isLoading || !bookingState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando calendario...</p>
        </div>
      </div>
    )
  }

  const daysInMonth = getDaysInMonth(currentMonth)
  const today = new Date()
  const currentMonthNumber = currentMonth.getMonth()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/business/${businessSlug}/book`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cambiar Servicio
            </Button>
            <Badge variant="secondary">Paso 2 de 3</Badge>
          </div>
          <Progress value={67} className="h-2" />
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">{bookingState.businessName}</h1>
          <p className="text-xl text-muted-foreground">
            Elige cuándo quieres tu cita
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar and Time Selection */}
          <div className="lg:col-span-2 space-y-8">
            {/* Calendar */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Seleccionar Fecha
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const prevMonth = new Date(currentMonth)
                        prevMonth.setMonth(prevMonth.getMonth() - 1)
                        setCurrentMonth(prevMonth)
                      }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="text-sm font-medium min-w-[150px] text-center">
                      {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nextMonth = new Date(currentMonth)
                        nextMonth.setMonth(nextMonth.getMonth() + 1)
                        setCurrentMonth(nextMonth)
                      }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {DAY_NAMES.map((day, index) => (
                    <div key={index} className="text-center text-sm font-medium p-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {daysInMonth.map((date, index) => {
                    const dateStr = date.toISOString().split('T')[0]
                    const isCurrentMonth = date.getMonth() === currentMonthNumber
                    const isToday = date.toDateString() === today.toDateString()
                    const isPast = date < today && !isToday
                    const isSelected = selectedDate === dateStr

                    return (
                      <button
                        key={index}
                        onClick={() => !isPast && isCurrentMonth && handleDateSelect(dateStr)}
                        disabled={isPast || !isCurrentMonth}
                        className={`
                          aspect-square p-2 text-sm rounded-md transition-all
                          ${!isCurrentMonth ? 'text-muted-foreground/30' : ''}
                          ${isPast ? 'text-muted-foreground/50 cursor-not-allowed' : ''}
                          ${isSelected ? 'bg-primary text-primary-foreground font-semibold' : ''}
                          ${!isSelected && !isPast && isCurrentMonth ? 'hover:bg-accent cursor-pointer' : ''}
                          ${isToday && !isSelected ? 'border-2 border-primary' : ''}
                        `}
                      >
                        {date.getDate()}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Time Slots */}
            {selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Horarios Disponibles
                  </CardTitle>
                  <CardDescription>
                    {new Date(selectedDate).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSlots ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Cargando horarios...</p>
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No hay horarios disponibles en esta fecha</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => slot.available && handleTimeSelect(slot.time)}
                          disabled={!slot.available}
                          className={`
                            p-3 rounded-md text-sm font-medium transition-all
                            ${slot.available
                              ? selectedTime === slot.time
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-accent hover:bg-primary/10'
                              : 'bg-muted text-muted-foreground cursor-not-allowed'
                            }
                          `}
                        >
                          {formatTime(slot.time)}
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Booking Summary */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Resumen de Cita</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Service */}
                <div className="pb-4 border-b">
                  <div className="text-xs font-medium text-muted-foreground mb-2">SERVICIO</div>
                  <h4 className="font-semibold text-lg mb-2">
                    {bookingState.service.name}
                  </h4>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{bookingState.service.duration} min</span>
                    <span className="font-semibold text-lg">${bookingState.service.price}</span>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="pb-4 border-b">
                  <div className="text-xs font-medium text-muted-foreground mb-2">FECHA Y HORA</div>
                  {selectedDate && selectedTime ? (
                    <div className="space-y-2">
                      <div className="font-semibold">
                        {new Date(selectedDate).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-muted-foreground">
                        {formatTime(selectedTime)}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {!selectedDate ? 'Selecciona una fecha' : 'Selecciona una hora'}
                    </p>
                  )}
                </div>

                {/* Continue Button */}
                <Button
                  className="w-full"
                  disabled={!selectedDate || !selectedTime}
                  onClick={handleContinue}
                >
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
