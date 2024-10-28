"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface InviteTeamMemberProps {
  teamId: string;
  onClose: () => void;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function InviteTeamMember({ teamId, onClose }: InviteTeamMemberProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    fetchTeamMembers();
  }, [teamId]);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('team_id', teamId);

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setError('Failed to fetch team members');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Create a new user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: 'temporaryPassword', // Should be changed on first login
        options: {
          data: { name: name },
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // Add user to the users table
        const { error: userError } = await supabase
          .from('users')
          .insert({ 
            id: authData.user.id, 
            name: name, 
            email: email, 
            role: 'user',
            team_id: teamId
          });

        if (userError) throw userError;

        // Refresh the team members list
        await fetchTeamMembers();

        // Clear the form
        setName('');
        setEmail('');
      }
    } catch (error) {
      console.error('Invitation error:', error);
      setError((error as Error).message);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      // Refresh the team members list
      await fetchTeamMembers();
    } catch (error) {
      console.error('Error deleting team member:', error);
      setError('Failed to delete team member');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button type="submit">
              Invite
            </Button>
          </div>
        </form>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        
        <h3 className="text-lg font-semibold mt-6 mb-2">Current Team Members</h3>
        <ul className="space-y-2">
          {teamMembers.map((member) => (
            <li key={member.id} className="flex justify-between items-center">
              <span>{member.name} ({member.email})</span>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">{member.role}</span>
                <Button
                  onClick={() => handleDeleteMember(member.id)}
                  variant="destructive"
                  size="sm"
                >
                  X
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
