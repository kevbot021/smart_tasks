"use client";

import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from "sonner"

interface InviteTeamMemberProps {
  className?: string
  teamId: string
  onClose: () => void
}

export const InviteTeamMember: React.FC<InviteTeamMemberProps> = ({
  className = '',
  teamId,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, teamId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      toast.success('Invitation sent successfully');
      setEmail('');
      onClose();
    } catch (error) {
      console.error('Failed to invite team member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email address"
        disabled={isLoading}
        className="w-full px-4 py-2 border rounded-md"
        required
      />
      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
      >
        {isLoading ? 'Sending Invitation...' : 'Invite Team Member'}
      </button>
    </form>
  );
};

export default InviteTeamMember;
