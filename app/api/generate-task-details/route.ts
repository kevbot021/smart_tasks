import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Make sure OPENAI_API_KEY is set in your .env.local file
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { taskDescription, taskId, teamId } = await req.json()

    if (!taskDescription || !taskId) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Generate subtasks and category using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant that generates subtasks and categorizes tasks. Respond with exactly 3 numbered subtasks followed by a category line. Use only these categories: Development, Design, Marketing, or Planning." 
        },
        { 
          role: "user", 
          content: `For this task: "${taskDescription}", generate 3 subtasks and suggest one of these categories: Development, Design, Marketing, or Planning. Format your response as:
          1. [First subtask]
          2. [Second subtask]
          3. [Third subtask]
          Category: [category]` 
        }
      ],
      temperature: 0.7,
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No completion content received from OpenAI');
    }

    const response = completion.choices[0].message.content;
    console.log('OpenAI response:', response);

    // Parse the response
    const lines = response.split('\n').filter(line => line.trim());
    
    // Get the category (last line)
    const categoryLine = lines.pop() || '';
    const category = categoryLine.includes('Category:') 
      ? categoryLine.replace('Category:', '').trim() 
      : 'Uncategorized';

    // Get subtasks (remaining lines)
    const subtasks = lines
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 3);

    console.log('Processed data:', { category, subtasks });

    // Update task with the category
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ category })
      .eq('id', taskId);

    if (updateError) {
      console.error('Error updating task category:', updateError);
      throw updateError;
    }

    // Insert subtasks - Let Supabase handle all timestamps
    const subtaskData = subtasks.map(description => ({
      description,
      task_id: taskId,
      is_complete: false
    }));

    // Using RPC call to insert subtasks
    const { data: insertedSubtasks, error: subtaskError } = await supabase
      .from('sub_tasks')
      .insert(subtaskData)
      .select(`
        id,
        description,
        task_id,
        is_complete
      `);

    if (subtaskError) {
      console.error('Error inserting subtasks:', subtaskError);
      throw subtaskError;
    }

    return NextResponse.json({ 
      success: true, 
      category,
      subtasks: insertedSubtasks
    });

  } catch (error) {
    console.error('Error in generate-task-details:', error);
    return NextResponse.json(
      { error: 'Failed to generate task details', details: error }, 
      { status: 500 }
    );
  }
}
