"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TeamMember } from "@/types"
import { createClient } from '@supabase/supabase-js'
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { useState } from "react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface TeamManagementModalProps {
  isOpen: boolean
  onClose: () => void
  teamId: string
  teamMembers: TeamMember[]
  currentUserId: string
}

export function TeamManagementModal({
  isOpen,
  onClose,
  teamId,
  teamMembers,
  currentUserId
}: TeamManagementModalProps) {
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, teamId, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      toast.success('Invitation sent successfully');
      setEmail('');
      setName('');
    } catch (error) {
      console.error('Failed to invite team member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      setIsRemoving(memberId);

      if (memberId === currentUserId) {
        toast.error("You cannot remove yourself");
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({ team_id: null })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Team member removed successfully');
      
    } catch (error) {
      console.error('Failed to remove team member:', error);
      toast.error('Failed to remove team member');
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Team Management</DialogTitle>
        </DialogHeader>
        
        {/* Invite Form */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Invite New Member</h3>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                disabled={isLoading}
                className="w-full px-4 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                disabled={isLoading}
                className="w-full px-4 py-2 border rounded-md"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
            >
              {isLoading ? 'Sending Invitation...' : 'Invite Team Member'}
            </button>
          </form>
        </div>

        {/* Current Team Members */}
        <div>
          <h3 className="text-sm font-medium mb-2">Current Members</h3>
          <div className="space-y-2">
            {teamMembers
              .filter(member => member.id !== currentUserId)
              .map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <span>{member.name}</span>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={isRemoving === member.id}
                    className="text-red-500 hover:text-red-700 p-1 rounded-md transition-colors"
                    title="Remove member"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 