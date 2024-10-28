import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Type safety for environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SubTask {
  task_id: string;
  description: string;
  is_complete: boolean;
}

export async function POST(req: Request) {
  if (req.method === 'POST') {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      const { taskDescription, taskId, teamId } = await req.json();
      console.log('Processing task:', { taskDescription, taskId, teamId });

      // 1. Generate category using OpenAI
      const categoryCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "You are a task categorizer. Respond with a single word category from this list: Work, Personal, Shopping, Health, Finance, Home, Education, Social, Travel, Other" 
          },
          { 
            role: "user", 
            content: `Categorize this task: "${taskDescription}"` 
          }
        ],
        max_tokens: 50,
        n: 1,
        temperature: 0.3,
      });

      const category = categoryCompletion.choices[0].message.content?.trim() || 'Other';
      console.log('Generated category:', category);

      // 2. Generate subtasks using OpenAI
      const subtaskCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "You are a helpful assistant that generates subtasks for a given task. Generate clear, actionable subtasks." 
          },
          { 
            role: "user", 
            content: `Generate 3 subtasks for the following task: "${taskDescription}"` 
          }
        ],
        max_tokens: 150,
        n: 1,
        temperature: 0.7,
      });

      const generatedSubtasks = subtaskCompletion.choices[0].message.content
        ?.split('\n')
        .filter(Boolean)
        .map(subtask => subtask.replace(/^\d+\.\s*/, '').trim())
        .slice(0, 3);

      if (!generatedSubtasks) {
        throw new Error('Failed to generate subtasks');
      }

      // 3. Generate audio summary
      const audioSummary = `Task: ${taskDescription}. Category: ${category}. Subtasks: ${generatedSubtasks.join(', ')}.`;
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: audioSummary,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      const base64Audio = buffer.toString('base64');

      // 4. Insert subtasks into Supabase
      const subtasks: SubTask[] = generatedSubtasks.map(description => ({
        task_id: taskId,
        description,
        is_complete: false
      }));

      const { data, error } = await supabase
        .from('sub_tasks')
        .insert(subtasks)
        .select();

      if (error) {
        console.error('Failed to insert subtasks:', error);
        return NextResponse.json({ 
          error: 'Error inserting subtasks into database',
          details: error
        }, { status: 500 });
      }

      // 5. Update task with audio summary and category
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          audio_summary: base64Audio,
          category: category
        })
        .eq('id', taskId);

      if (updateError) {
        console.error('Failed to update task:', updateError);
      }

      console.log('Successfully processed task:', {
        category,
        subtasksCount: subtasks.length,
        hasAudio: !!base64Audio
      });

      return NextResponse.json({ 
        success: true,
        category,
        subtasks: subtasks.map(s => s.description),
        insertedData: data,
        audioSummary: base64Audio
      });
    } catch (error) {
      console.error('Error in POST handler:', error);
      return NextResponse.json({ 
        error: 'Error processing your request',
        details: error
      }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
