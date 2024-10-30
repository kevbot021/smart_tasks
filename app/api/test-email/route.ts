import { NextResponse } from 'next/server';
import { sendInvitationEmail } from '@/lib/emails/send-invitation';

export async function GET() {
  try {
    const result = await sendInvitationEmail({
      email: "kdunbar93@gmail.com", // This is the recipient email
      teamName: "Test Team",
      invitationUrl: "http://localhost:3000/test-invite"
    });

    if (!result.success) {
      throw new Error('Failed to send email');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully',
      data: result.data 
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send test email' 
    }, { status: 500 });
  }
} 