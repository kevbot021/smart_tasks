import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendTaskNotificationEmail } from '@/lib/emails/send-task-notification';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const { taskId, assigneeId, assignerId } = await request.json();

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        *,
        assigner:created_by_user_id(name),
        team:team_id(name)
      `)
      .eq('id', taskId)
      .single();

    if (taskError) throw taskError;

    // Get assignee details
    const { data: assignee, error: assigneeError } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', assigneeId)
      .single();

    if (assigneeError) throw assigneeError;

    // Generate task URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.VERCEL_URL ? 
                   `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000';
    const taskUrl = `${baseUrl}/tasks/${taskId}`;

    // Send notification email
    const emailResult = await sendTaskNotificationEmail({
      email: assignee.email,
      taskDescription: task.description,
      assignerName: task.assigner.name,
      teamName: task.team.name,
      taskUrl
    });

    if (!emailResult.success) {
      throw new Error('Failed to send task notification email');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to send task notification:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send notification' },
      { status: 500 }
    );
  }
} 