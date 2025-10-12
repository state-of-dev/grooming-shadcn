'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface RealtimeEvent {
  table: string
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  record: any
  old_record?: any
}

interface UseRealtimeOptions {
  table?: string
  filter?: string
  enabled?: boolean
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { table, filter, enabled = true } = options
  const [isConnected, setIsConnected] = useState(false)
  const [events, setEvents] = useState<RealtimeEvent[]>([])
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!enabled || !table) {
      return
    }

    const channelName = `realtime-${table}-${crypto.randomUUID()}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter,
        },
        (payload) => {
          const event: RealtimeEvent = {
            table: table,
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            record: payload.new,
            old_record: payload.old,
          }
          setEvents(prev => [event, ...prev.slice(0, 99)])
          // Notification logic will be added back later
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [table, filter, enabled])

  return {
    isConnected,
    events,
    clearEvents: () => setEvents([]),
  }
}
