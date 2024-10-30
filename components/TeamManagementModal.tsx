"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { InviteTeamMember } from "./InviteTeamMember"
import { TeamMember } from "@/types"

interface TeamManagementModalProps {
  isOpen: boolean
  onClose: () => void
  teamId: string
  teamMembers: TeamMember[]
}

export function TeamManagementModal({
  isOpen,
  onClose,
  teamId,
  teamMembers
}: TeamManagementModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Team Management</DialogTitle>
        </DialogHeader>
        
        {/* Current Team Members */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Current Members</h3>
          <div className="space-y-2">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <span>{member.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Invite Form */}
        <div>
          <h3 className="text-sm font-medium mb-2">Invite New Member</h3>
          <InviteTeamMember 
            teamId={teamId} 
            onClose={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
} 