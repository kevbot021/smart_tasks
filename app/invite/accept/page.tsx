"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { toast } from "sonner"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AcceptInvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [isLoading, setIsLoading] = useState(true)
  const [invitation, setInvitation] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function validateInvitation() {
      if (!token) {
        setError('Invalid invitation link')
        setIsLoading(false)
        return
      }

      try {
        // Get invitation details
        const { data: invitation, error: inviteError } = await supabase
          .from('invitations')
          .select('*, teams:team_id(name)')
          .eq('token', token)
          .eq('status', 'pending')
          .single()

        if (inviteError || !invitation) {
          throw new Error('Invalid or expired invitation')
        }

        // Check if invitation has expired
        if (new Date(invitation.expires_at) < new Date()) {
          await supabase
            .from('invitations')
            .update({ status: 'expired' })
            .eq('id', invitation.id)
          throw new Error('This invitation has expired')
        }

        setInvitation(invitation)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to validate invitation')
      } finally {
        setIsLoading(false)
      }
    }

    validateInvitation()
  }, [token])

  const handleAcceptInvitation = async () => {
    try {
      setIsLoading(true)

      // Check if user is already authenticated
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Store invitation token in localStorage and redirect to signup
        localStorage.setItem('pendingInvitation', token!)
        router.push('/signup')
        return
      }

      // Update user's team_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ team_id: invitation.team_id })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Mark invitation as accepted
      const { error: inviteError } = await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id)

      if (inviteError) throw inviteError

      toast.success('Invitation accepted successfully')
      router.push('/todo')

    } catch (error) {
      console.error('Error accepting invitation:', error)
      toast.error('Failed to accept invitation')
    } finally {
      setIsLoading(false)
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
        <h1 className="text-2xl font-bold text-center mb-6">Team Invitation</h1>
        <p className="text-center mb-6">
          You've been invited to join {invitation.teams.name} on Smart Tasks
        </p>
        <button
          onClick={handleAcceptInvitation}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Accept Invitation'}
        </button>
      </div>
    </div>
  )
} 