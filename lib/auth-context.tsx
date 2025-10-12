'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Define the user profile and business profile interfaces as per your existing structure
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
  // Add other fields as necessary
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  businessProfile: BusinessProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: AuthError | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: AuthError | null }>
  signOut: () => Promise<{ error?: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserProfile(session.user.id, session.user)
        }
      } catch (error) {
        console.error('Error fetching session:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserProfile(session.user.id, session.user)
      } else if (event === 'SIGNED_OUT') {
        setProfile(null)
        setBusinessProfile(null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string, user: User) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code === 'PGRST116') { // No profile found, create one
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: user.email!,
          full_name: user.user_metadata.full_name,
          role: user.user_metadata.role || 'customer',
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating profile:', createError)
      } else {
        setProfile(newProfile as UserProfile)
      }
    } else if (data) {
      setProfile(data as UserProfile)
      if ((data as UserProfile).role === 'groomer') {
        await fetchBusinessProfile(userId)
      }
    } else if (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchBusinessProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('owner_id', userId)
      .single()

    if (data) {
      setBusinessProfile(data as BusinessProfile)
    } else if (error && error.code !== 'PGRST116') {
      console.error('Error fetching business profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'customer' // Default role, can be expanded
        }
      }
    })
  }

  const signOut = async () => {
    return supabase.auth.signOut()
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
