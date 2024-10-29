import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    console.log('Starting chat request...');
    const { threadId, taskContext, message } = await req.json();

    if (!process.env.OPENAI_ASSISTANT_ID) {
      console.error('Missing OPENAI_ASSISTANT_ID');
      throw new Error('Assistant ID not configured');
    }

    // Create a new thread if none exists
    let thread;
    if (!threadId) {
      console.log('Creating new thread with context:', taskContext);
      thread = await openai.beta.threads.create();
      
      // Include the word 'json' in the initial message
      const contextMessage = `Please provide your response in JSON format. Here is the task context: ${JSON.stringify({
        task: taskContext.description,
        subtasks: taskContext.sub_tasks || [],
        request: "Please help me understand this task better by asking relevant questions."
      })}`;

      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: contextMessage
      });
    } else {
      thread = { id: threadId };
      if (message) {
        // Include the word 'json' in follow-up messages
        await openai.beta.threads.messages.create(thread.id, {
          role: "user",
          content: `Please provide your response in JSON format. User selected: ${message}`
        });
      }
    }

    console.log('Running assistant...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
      instructions: `You are a helpful task assistant. Analyze the task and respond with questions to help the user understand it better. Always respond in JSON format with the following structure:
      {
        "question": "your question here",
        "options": ["option1", "option2", "option3"],
        "assessment": "continuing",
        "confidence_score": 0
      }`
    });

    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    console.log('Initial run status:', runStatus.status);
    
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts && runStatus.status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log(`Run status attempt ${attempts + 1}:`, runStatus.status);
      attempts++;

      if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
        throw new Error(`Run failed with status: ${runStatus.status}`);
      }
    }

    if (runStatus.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = messages.data[0];
      const messageContent = lastMessage.content[0];

      if ('text' in messageContent) {
        return NextResponse.json({
          threadId: thread.id,
          message: messageContent.text.value
        });
      }
    }

    // Return default response if we couldn't get a proper response
    return NextResponse.json({
      threadId: thread.id,
      message: JSON.stringify(DEFAULT_RESPONSE)
    });

  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json({
      threadId: null,
      message: JSON.stringify(DEFAULT_RESPONSE)
    });
  }
} 