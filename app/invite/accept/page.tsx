"use client"

import { Suspense } from 'react'
import { AcceptInvitationForm } from './AcceptInvitationForm'

export default function AcceptInvitePage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <AcceptInvitationForm />
    </Suspense>
  )
} 