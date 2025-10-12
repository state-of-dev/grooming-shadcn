'use client'

import { useState } from 'react'
import { useAuthGuard } from '@/lib/hooks/useAuthGuard'
import { useAuth } from '@/lib/auth-context'
import { useAppointmentsRealtime, AppointmentWithDetails } from '@/lib/hooks/use-appointments-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

export default function CalendarPage() {
  const { businessProfile, loading: authLoading } = useAuthGuard()
  const { appointments, isLoading: appointmentsLoading } = useAppointmentsRealtime(businessProfile?.id)
  const [currentDate, setCurrentDate] = useState(new Date())

  const weekStartsOn = 1 // Monday
  const week = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn }),
    end: endOfWeek(currentDate, { weekStartsOn }),
  })

  const goToNextWeek = () => setCurrentDate(addDays(currentDate, 7))
  const goToPreviousWeek = () => setCurrentDate(subDays(currentDate, 7))

  const getAppointmentsForDay = (day: Date) => {
    return appointments
      .filter(apt => isSameDay(new Date(apt.appointment_date), day))
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Calendario</h1>
            <p className="text-muted-foreground">Gestiona tu agenda semanal.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="font-semibold text-lg capitalize">
                {format(startOfWeek(currentDate, { weekStartsOn }), 'dd MMM', { locale: es })} - {format(endOfWeek(currentDate, { weekStartsOn }), 'dd MMM, yyyy', { locale: es })}
              </span>
              <Button variant="outline" size="icon" onClick={goToNextWeek}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        {appointmentsLoading ? (
           <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {week.map(day => (
              <div key={day.toString()} className="bg-muted/50 rounded-lg p-2 space-y-2 min-h-[200px]">
                <div className="text-center font-semibold capitalize">{format(day, 'EEE', { locale: es })}</div>
                <div className="text-center text-sm text-muted-foreground">{format(day, 'dd', { locale: es })}</div>
                <div className="space-y-2">
                  {getAppointmentsForDay(day).map(apt => (
                    <Card key={apt.id} className="shadow-sm">
                      <CardContent className="p-2 text-xs">
                        <p className="font-bold">{apt.start_time}</p>
                        <p className="truncate text-muted-foreground">{apt.customer_name}</p>
                        <p className="truncate text-muted-foreground">{apt.service_name}</p>
                        <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'} className="mt-1 capitalize">{apt.status}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
