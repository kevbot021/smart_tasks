"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { toast } from "sonner"
import { Invitation } from '@/types'

// Create a service role client
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Regular client for auth
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function AcceptInvitationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')
  const [isLoading, setIsLoading] = useState(true)
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isSigningUp, setIsSigningUp] = useState(false)

  useEffect(() => {
    async function validateInvitation() {
      if (!token) {
        setError('Invalid invitation link')
        setIsLoading(false)
        return
      }

      try {
        const { data: invitation, error: inviteError } = await supabase
          .from('invitations')
          .select('*, teams:team_id(name)')
          .eq('token', token)
          .eq('status', 'pending')
          .single()

        if (inviteError || !invitation) {
          throw new Error('Invalid or expired invitation')
        }

        if (new Date(invitation.expires_at) < new Date()) {
          await supabase
            .from('invitations')
            .update({ status: 'expired' })
            .eq('id', invitation.id)
          throw new Error('This invitation has expired')
        }

        setInvitation(invitation)
        setEmail(invitation.email)
        setName(invitation.name)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to validate invitation')
      } finally {
        setIsLoading(false)
      }
    }

    validateInvitation()
  }, [token])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invitation || !email || !password || !name) return

    try {
      setIsSigningUp(true)

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            team_id: invitation.team_id,
            role: 'user'
          }
        }
      })

      if (signUpError) throw signUpError
      if (!authData.user) throw new Error('Failed to create user')

      const { error: userError } = await serviceClient
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          name: name,
          team_id: invitation.team_id,
          role: 'user'
        })

      if (userError) throw userError

      const { error: inviteError } = await serviceClient
        .from('invitations')
        .update({ 
          status: 'accepted',
          name: name
        })
        .eq('id', invitation.id)

      if (inviteError) throw inviteError

      toast.success('Account created successfully! Please check your email to verify your account.')
      router.push('/login')

    } catch (error) {
      console.error('Error signing up:', error)
      toast.error('Failed to create account')
    } finally {
      setIsSigningUp(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Create Your Account</h1>
        <p className="text-center mb-6">
          Join {invitation?.teams?.name} on Smart Tasks
        </p>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="mt-1 w-full px-4 py-2 border rounded-md bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded-md"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={isSigningUp}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
          >
            {isSigningUp ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}