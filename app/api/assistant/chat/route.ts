import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { threadId, taskContext, message } = await req.json();

    // Create a new thread if none exists
    let thread;
    if (!threadId) {
      thread = await openai.beta.threads.create();
      
      // Add task context to the thread
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: `Task Context: ${JSON.stringify(taskContext)}`,
      });
    } else {
      thread = { id: threadId };
    }

    // Add the user's message if one exists
    if (message) {
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: message,
      });
    }

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID!,
    });

    // Wait for the completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    while (runStatus.status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      
      if (runStatus.status === 'failed') {
        throw new Error('Assistant run failed');
      }
    }

    // Get the latest message
    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data[0];

    return NextResponse.json({
      threadId: thread.id,
      message: lastMessage.content[0].text.value,
    });
  } catch (error) {
    console.error('Error in assistant chat:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
} 