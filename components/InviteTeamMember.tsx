"use client";

import React, { useState } from 'react';
import type { FormEvent } from 'react';

interface InviteTeamMemberProps {
  onInvite?: (email: string) => Promise<void>
  className?: string
  teamId: string
  onClose: () => void
}

export const InviteTeamMember: React.FC<InviteTeamMemberProps> = ({
  onInvite,
  className = '',
  teamId,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !onInvite) return;

    try {
      setIsLoading(true);
      await onInvite(email);
      setEmail('');
    } catch (error) {
      console.error('Failed to invite team member:', error);
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
        {isLoading ? 'Inviting...' : 'Invite Team Member'}
      </button>
    </form>
  );
};

export default InviteTeamMember;
