'use client'

import { Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DaySchedule {
  open: string | null
  close: string | null
  closed: boolean
}

interface BusinessHours {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

interface Props {
  hours: BusinessHours | null
}

const dayNames: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
}

export default function BusinessHoursComponent({ hours }: Props) {
  if (!hours) return null

  // Detectar el día actual
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof BusinessHours

  // Verificar si está abierto ahora
  const isOpenNow = () => {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes() // minutos desde medianoche
    const todaySchedule = hours[today]

    if (!todaySchedule || todaySchedule.closed || !todaySchedule.open || !todaySchedule.close) {
      return false
    }

    const [openHour, openMin] = todaySchedule.open.split(':').map(Number)
    const [closeHour, closeMin] = todaySchedule.close.split(':').map(Number)

    const openTime = openHour * 60 + openMin
    const closeTime = closeHour * 60 + closeMin

    return currentTime >= openTime && currentTime < closeTime
  }

  const open = isOpenNow()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horarios de Atención
          </CardTitle>
          <Badge variant={open ? 'default' : 'secondary'} className={open ? 'bg-green-500' : ''}>
            {open ? 'Abierto ahora' : 'Cerrado'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Object.entries(hours).map(([day, schedule]) => {
            const isToday = day === today
            return (
              <div
                key={day}
                className={`flex justify-between items-center py-2 ${
                  isToday ? 'font-semibold text-primary' : 'text-muted-foreground'
                }`}
              >
                <span className="min-w-[100px]">
                  {dayNames[day]}
                  {isToday && ' (Hoy)'}
                </span>
                <span>
                  {schedule.closed ? (
                    <span className="text-destructive">Cerrado</span>
                  ) : schedule.open && schedule.close ? (
                    `${schedule.open} - ${schedule.close}`
                  ) : (
                    <span className="text-muted-foreground">No especificado</span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
