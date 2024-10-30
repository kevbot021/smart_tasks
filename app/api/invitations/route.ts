import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendInvitationEmail } from '@/lib/emails/send-invitation';

// Create a Supabase client with the service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key instead
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const { email, teamId, name } = await request.json();
    console.log('Received invitation request:', { email, teamId, name });

    // Get team info
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('name')
      .eq('id', teamId)
      .single();

    if (teamError) {
      console.error('Team fetch error:', teamError);
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Create invitation record using service role
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        team_id: teamId,
        email,
        name,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Invitation creation error:', inviteError);
      if (inviteError.code === '23505') {
        return NextResponse.json(
          { error: 'An invitation for this email already exists' },
          { status: 409 }
        );
      }
      throw inviteError;
    }

    // Generate invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const invitationUrl = `${baseUrl}/invite/accept?token=${invitation.token}`;

    console.log('Sending invitation email to:', email);
    const emailResult = await sendInvitationEmail({
      email,
      teamName: teamData.name,
      invitationUrl,
    });

    if (!emailResult.success) {
      console.error('Email send error:', emailResult.error);
      await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitation.id);

      throw new Error('Failed to send invitation email');
    }

    return NextResponse.json({ success: true, invitation });

  } catch (error) {
    console.error('Invitation creation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create invitation' },
      { status: 500 }
    );
  }
} 