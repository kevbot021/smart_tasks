import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { TaskContext } from '@/types'

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

const DEFAULT_RESPONSE = {
  question: "How would you like to break down this task?",
  options: [
    "Let's understand the main goal first",
    "Break it into smaller steps",
    "What resources do I need?"
  ],
  assessment: "continuing",
  confidence_score: 0
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Handle AI chat request
    if (body.threadId || body.taskContext) {
      return handleAIChatRequest(body);
    }
    
    // Handle task details generation
    const { taskDescription, taskId } = body;

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

// AI Chat request handler (separate function)
async function handleAIChatRequest(body: any) {
  try {
    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_ASSISTANT_ID) {
      return NextResponse.json({
        threadId: null,
        message: JSON.stringify(DEFAULT_RESPONSE)
      });
    }

    let thread;

    try {
      if (!body.threadId) {
        thread = await openai.beta.threads.create();
        console.log('New thread created:', thread.id);

        await openai.beta.threads.messages.create(
          thread.id,
          {
            role: "user",
            content: JSON.stringify({
              task: body.taskContext.task,
              subtasks: body.taskContext.subtasks,
              request: "Please help me analyze and break down this task."
            })
          }
        );
        console.log('Initial message added');
      } else {
        thread = { id: body.threadId };
        if (body.message) {
          await openai.beta.threads.messages.create(
            thread.id,
            {
              role: "user",
              content: `User selected: ${body.message}. Please continue analyzing the task based on this choice.`
            }
          );
        }
      }

      const run = await openai.beta.threads.runs.create(
        thread.id,
        {
          assistant_id: process.env.OPENAI_ASSISTANT_ID,
          instructions: `
            You are a task analysis assistant helping users break down their tasks.
            
            For the initial message:
            1. Understand the task context
            2. Ask a relevant question to help break down the task
            3. Provide 2-4 specific response options
            
            For follow-up messages:
            1. Consider the user's previous selection
            2. Ask a more specific follow-up question
            3. Provide new, relevant options based on their choice
            
            Always respond with a valid JSON object in this exact format:
            {
              "question": "Your specific question about the task",
              "options": ["2-4 contextual response options"],
              "assessment": "continuing",
              "confidence_score": 0
            }

            Make each question and set of options unique and relevant to the conversation flow.
            When appropriate, set assessment to "complete" to end the conversation.
          `
        }
      );

      let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        console.log(`Run status (attempt ${attempts + 1}/${maxAttempts}):`, runStatus.status);

        if (runStatus.status === 'completed') {
          const messages = await openai.beta.threads.messages.list(thread.id);
          const lastMessage = messages.data[0];

          if (lastMessage.content[0].type === 'text') {
            try {
              const responseText = lastMessage.content[0].text.value;
              const parsedResponse = JSON.parse(responseText);
              
              if (!parsedResponse.question || !Array.isArray(parsedResponse.options)) {
                throw new Error('Invalid response format from AI');
              }

              return NextResponse.json({
                threadId: thread.id,
                message: responseText
              });
            } catch (error) {
              console.error('Invalid response format:', error);
              return NextResponse.json({
                threadId: thread.id,
                message: JSON.stringify(DEFAULT_RESPONSE)
              });
            }
          }
        }

        if (runStatus.status === 'requires_action') {
          const toolCalls = runStatus.required_action?.submit_tool_outputs.tool_calls;
          if (toolCalls) {
            const toolOutputs = toolCalls.map(toolCall => ({
              tool_call_id: toolCall.id,
              output: JSON.stringify({})
            }));

            await openai.beta.threads.runs.submitToolOutputs(
              thread.id,
              run.id,
              { tool_outputs: toolOutputs }
            );
          }
        }

        if (runStatus.status === 'failed') {
          console.error('Run failed:', runStatus.last_error);
          return NextResponse.json({
            threadId: thread.id,
            message: JSON.stringify(DEFAULT_RESPONSE)
          });
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      }

      return NextResponse.json({
        threadId: thread.id,
        message: JSON.stringify(DEFAULT_RESPONSE)
      });

    } catch (error) {
      console.error('OpenAI API error:', error);
      return NextResponse.json({
        threadId: null,
        message: JSON.stringify(DEFAULT_RESPONSE)
      });
    }
  } catch (error) {
    console.error('Error in AI chat request:', error);
    return NextResponse.json({
      threadId: null,
      message: JSON.stringify(DEFAULT_RESPONSE)
    });
  }
}
