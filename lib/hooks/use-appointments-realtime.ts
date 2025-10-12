'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRealtime } from './use-realtime'

// This interface can be expanded based on your actual data needs
export interface AppointmentWithDetails {
  id: string
  appointment_date: string
  start_time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  service_name: string
  customer_name: string
  pet_name: string
  total_amount: number
  [key: string]: any // Allow other properties
}

export function useAppointmentsRealtime(businessId?: string) {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { isConnected, events } = useRealtime({
    table: 'appointments',
    filter: businessId ? `business_id=eq.${businessId}` : undefined,
    enabled: !!businessId,
  })

  const fetchInitialData = useCallback(async () => {
    if (!businessId) return
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('appointments')
        .select('*, services(name), customers(name), pets(name)')
        .eq('business_id', businessId)
        .order('appointment_date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(100) // Fetch initial 100 appointments

      if (error) throw error

      const processed = (data || []).map(apt => ({
        ...apt,
        service_name: (apt.services as any)?.name || 'N/A',
        customer_name: (apt.customers as any)?.name || 'N/A',
        pet_name: (apt.pets as any)?.name || 'N/A',
      })) as AppointmentWithDetails[]

      setAppointments(processed)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  const loadSingleAppointment = useCallback(async (appointmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, services(name), customers(name), pets(name)')
        .eq('id', appointmentId)
        .single()

      if (error) throw error

      const processed = {
        ...data,
        service_name: (data.services as any)?.name || 'N/A',
        customer_name: (data.customers as any)?.name || 'N/A',
        pet_name: (data.pets as any)?.name || 'N/A',
      } as AppointmentWithDetails

      setAppointments(prev => {
        const existingIndex = prev.findIndex(a => a.id === appointmentId)
        if (existingIndex !== -1) {
          const updated = [...prev]
          updated[existingIndex] = processed
          return updated
        } else {
          return [...prev, processed].sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())
        }
      })
    } catch (err) {
      console.error('Error loading single appointment:', err)
    }
  }, [])

  useEffect(() => {
    if (events.length === 0) return

    const latestEvent = events[0]
    switch (latestEvent.type) {
      case 'INSERT':
        loadSingleAppointment(latestEvent.record.id)
        break
      case 'UPDATE':
        setAppointments(prev =>
          prev.map(apt => (apt.id === latestEvent.record.id ? { ...apt, ...latestEvent.record } : apt))
        )
        break
      case 'DELETE':
        setAppointments(prev => prev.filter(apt => apt.id !== latestEvent.old_record?.id))
        break
    }
  }, [events, loadSingleAppointment])

  return { appointments, isLoading, error, isConnected }
}
