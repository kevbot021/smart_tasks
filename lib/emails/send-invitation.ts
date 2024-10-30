import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvitationEmail({
  email,
  teamName,
  invitationUrl
}: {
  email: string;
  teamName: string;
  invitationUrl: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Smart Tasks <invites@yourdomain.com>',
      to: email,
      subject: `You've been invited to join ${teamName} on Smart Tasks`,
      html: `
        <div>
          <h1>You've been invited!</h1>
          <p>You've been invited to join ${teamName} on Smart Tasks.</p>
          <p>Click the link below to accept the invitation:</p>
          <a href="${invitationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">
            Accept Invitation
          </a>
          <p>This invitation will expire in 7 days.</p>
        </div>
      `
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    return { success: false, error };
  }
} 