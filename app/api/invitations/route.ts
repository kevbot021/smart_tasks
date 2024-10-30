import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendInvitationEmail } from '@/lib/emails/send-invitation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { email, teamId } = await request.json();

    // Validate input
    if (!email || !teamId) {
      return NextResponse.json(
        { error: 'Email and teamId are required' },
        { status: 400 }
      );
    }

    // Get team info
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('name')
      .eq('id', teamId)
      .single();

    if (teamError || !teamData) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        team_id: teamId,
        email,
        status: 'pending',
      })
      .select()
      .single();

    if (inviteError) {
      if (inviteError.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'An invitation for this email already exists' },
          { status: 409 }
        );
      }
      throw inviteError;
    }

    // Generate invitation URL
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${invitation.token}`;

    // Send invitation email
    const emailResult = await sendInvitationEmail({
      email,
      teamName: teamData.name,
      invitationUrl,
    });

    if (!emailResult.success) {
      // If email fails, mark invitation as cancelled
      await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitation.id);

      throw new Error('Failed to send invitation email');
    }

    return NextResponse.json({ success: true, invitation });

  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
} 