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
    const { 
      taskDescription, 
      taskId, 
      teamId, 
      stage, 
      subtasks: existingSubtasks,
      category: initialCategory
    } = await req.json()

    if (!taskDescription || !taskId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Handle text generation (category and subtasks)
    if (stage === 'text') {
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

      // Update task with category
      await supabase
        .from('tasks')
        .update({ category })
        .eq('id', taskId);

      // Insert subtasks
      const subtaskData = subtasks.map(description => ({
        description,
        task_id: taskId,
        is_complete: false
      }));

      const { data: insertedSubtasks, error: subtaskError } = await supabase
        .from('sub_tasks')
        .insert(subtaskData)
        .select();

      if (subtaskError) throw subtaskError;

      return NextResponse.json({ 
        success: true, 
        category,
        subtasks: insertedSubtasks
      });
    }

    // Handle media generation
    if (stage === 'media') {
      let categoryToUse = initialCategory;

      if (!existingSubtasks || !categoryToUse) {
        // Fetch the task data if category wasn't passed
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('category')
          .eq('id', taskId)
          .single();

        if (taskError) throw taskError;
        if (!taskData) throw new Error('Task not found');

        categoryToUse = taskData.category;
      }

      // Generate image
      const imagePrompt = `Create a simple, cartoon-style image showing three panels: 1. ${existingSubtasks[0]}, 2. ${existingSubtasks[1]}, 3. ${existingSubtasks[2]}. Make it colorful and easy to understand.`;
      
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural"
      });

      const imageUrl = imageResponse.data[0]?.url;
      if (!imageUrl) {
        throw new Error('No image URL received from OpenAI');
      }

      // Download the image and upload to Supabase storage
      const imageRes = await fetch(imageUrl);
      const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
      
      const fileName = `task-${taskId}-${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('task-images')  // Make sure this bucket exists in Supabase
        .upload(fileName, imageBuffer, {
          contentType: 'image/png',
          cacheControl: '3600'
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL for the uploaded image
      const { data: { publicUrl } } = supabase
        .storage
        .from('task-images')
        .getPublicUrl(fileName);

      // Generate audio with the correct category
      const audioSummaryText = `Task: ${taskDescription}. This is a ${categoryToUse} task. It has ${existingSubtasks.length} subtasks: ${existingSubtasks.join('. ')}`;
      
      // Generate audio using OpenAI TTS
      const mp3Response = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: audioSummaryText,
      });

      // Convert the audio to base64
      const buffer = Buffer.from(await mp3Response.arrayBuffer());
      const base64Audio = buffer.toString('base64');

      // Update task with media
      await supabase
        .from('tasks')
        .update({ 
          audio_summary: base64Audio,
          cartoon_slides: publicUrl
        })
        .eq('id', taskId);

      return NextResponse.json({ 
        success: true, 
        audio_summary: base64Audio,
        cartoon_slides: publicUrl
      });
    }

    throw new Error('Invalid stage specified');

  } catch (error) {
    console.error('Error in generate-task-details:', error);
    return NextResponse.json(
      { error: 'Failed to generate task details', details: error }, 
      { status: 500 }
    );
  }
}
