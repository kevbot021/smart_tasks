import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTaskNotificationEmail({
  email,
  taskDescription,
  assignerName,
  teamName,
  taskUrl
}: {
  email: string;
  taskDescription: string;
  assignerName: string;
  teamName: string;
  taskUrl: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Smart Tasks <test@myracetimecalculator.run>',
      to: email,
      subject: `New Task Assigned - ${teamName}`,
      html: `
        <div>
          <h1>New Task Assigned</h1>
          <p>You have been assigned a new task in ${teamName} by ${assignerName}.</p>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
            <h2 style="margin: 0 0 10px 0;">Task Details</h2>
            <p style="margin: 0;">${taskDescription}</p>
          </div>

          <a href="${taskUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">
            View Task
          </a>

          <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
            You're receiving this email because you're a member of ${teamName} on Smart Tasks.
          </p>
        </div>
      `
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send task notification email:', error);
    return { success: false, error };
  }
} 