'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  email: string
  full_name: string
  phone?: string
  role: 'groomer' | 'customer' | 'admin'
}

interface BusinessProfile {
  id: string
  owner_id: string
  business_name: string
  slug: string
  setup_completed: boolean
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  businessProfile: BusinessProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: AuthError | null }>
  signUp: (email: string, password: string, fullName: string, role?: 'customer' | 'groomer') => Promise<{ error?: AuthError | null }>
  signOut: () => Promise<{ error?: AuthError | null }>
  refreshBusinessProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string, userEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const role = userEmail.includes('groomer') ? 'groomer' : 'customer'
        const { data: newProfile } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            email: userEmail,
            full_name: user?.user_metadata?.full_name || 'Usuario',
            role: role
          })
          .select()
          .single()

        if (newProfile) {
          setProfile(newProfile)
          if (role === 'groomer') {
            await fetchBusinessProfile(userId)
          }
        }
      } else if (data) {
        setProfile(data)
        if (data.role === 'groomer') {
          await fetchBusinessProfile(userId)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  // Fetch business profile for groomers
  const fetchBusinessProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('owner_id', userId)
        .single()

      if (data) {
        setBusinessProfile(data)
      }
    } catch (error) {
      console.error('Error fetching business profile:', error)
    }
  }

  // Refresh business profile
  const refreshBusinessProfile = async () => {
    if (user?.id && profile?.role === 'groomer') {
      await fetchBusinessProfile(user.id)
    }
  }

  // Initialize auth
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)

          if (session?.user) {
            await fetchUserProfile(session.user.id, session.user.email!)
          }

          setLoading(false)
        }
      } catch (error) {
        console.error('Auth init error:', error)
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)

        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserProfile(session.user.id, session.user.email!)
        } else if (event === 'SIGNED_OUT') {
          setProfile(null)
          setBusinessProfile(null)
        }

        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'customer' | 'groomer' = 'customer'
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role
        }
      }
    })
    return { error }
  }

  const signOut = async () => {
    setProfile(null)
    setBusinessProfile(null)
    setUser(null)
    setSession(null)

    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const value = {
    user,
    profile,
    businessProfile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshBusinessProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
