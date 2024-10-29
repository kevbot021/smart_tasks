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

    // Generate subtasks and category using OpenAI with more flexible categorization
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant that generates subtasks and categorizes tasks. For each task, suggest a concise, single-word category that best describes the task's nature. Then provide 3 subtasks to help complete the main task." 
        },
        { 
          role: "user", 
          content: `For this task: "${taskDescription}", first suggest a single-word category that best describes this task, then generate 3 subtasks to help complete it. Format your response exactly as:
          Category: [single word category]
          1. [First subtask]
          2. [Second subtask]
          3. [Third subtask]` 
        }
      ],
      temperature: 0.7,
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No completion content received from OpenAI');
    }

    const response = completion.choices[0].message.content;
    console.log('OpenAI response:', response);

    // Parse the response - looking for Category first
    const lines = response.split('\n').filter(line => line.trim());
    
    // Get the category (first line)
    const categoryLine = lines.shift() || '';
    const category = categoryLine.includes('Category:') 
      ? categoryLine.replace('Category:', '').trim() 
      : 'Uncategorized';

    // Get subtasks (remaining lines)
    const subtasks = lines
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 3);

    console.log('Processed data:', { category, subtasks });

    // Generate audio summary
    const audioSummaryText = `Task: ${taskDescription}. This is a ${category} task. It has ${subtasks.length} subtasks: ${subtasks.join('. ')}`;
    
    // Generate audio using OpenAI TTS
    const mp3Response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: audioSummaryText,
    });

    // Convert the audio to base64
    const buffer = Buffer.from(await mp3Response.arrayBuffer());
    const base64Audio = buffer.toString('base64');

    // Update task with the category and audio summary
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ 
        category,
        audio_summary: base64Audio
      })
      .eq('id', taskId);

    if (updateError) {
      console.error('Error updating task:', updateError);
      throw updateError;
    }

    // Insert subtasks
    const subtaskData = subtasks.map(description => ({
      description,
      task_id: taskId,
      is_complete: false
    }));

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
      subtasks: insertedSubtasks,
      audio_summary: base64Audio
    });

  } catch (error) {
    console.error('Error in generate-task-details:', error);
    return NextResponse.json(
      { error: 'Failed to generate task details', details: error }, 
      { status: 500 }
    );
  }
}
