import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import type { TaskContext, AIResponse } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SubtaskType {
  description: string;
  status: string;
}

const DEFAULT_RESPONSE: AIResponse = {
  question: "How would you like to break down this task?",
  options: [
    "Let's understand the main goal first",
    "Break it into smaller steps",
    "What resources do I need?"
  ],
  assessment: "continuing",
  confidence_score: 0
};

async function getRunStatus(threadId: string, runId: string) {
  try {
    const runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
    return runStatus;
  } catch (error) {
    console.error('Error getting run status:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    console.log('Starting API request');

    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_ASSISTANT_ID) {
      throw new Error('Missing required environment variables');
    }

    const { threadId, taskContext, message } = await req.json();
    console.log('Request payload:', { 
      hasThreadId: !!threadId, 
      hasMessage: !!message,
      taskDescription: taskContext?.task?.description 
    });

    let thread;
    try {
      if (!threadId) {
        thread = await openai.beta.threads.create();
        console.log('New thread created:', thread.id);

        const taskMessage = `
          Task Analysis Request:
          Description: ${taskContext.task.description}
          Category: ${taskContext.task.category}
          Status: ${taskContext.task.status}
          
          Subtasks:
          ${taskContext.subtasks.map((st: SubtaskType, i: number) => 
            `${i + 1}. ${st.description} (${st.status})`
          ).join('\n')}

          Please analyze this task and provide guidance.
          Respond with a JSON object containing:
          - A specific question about this task
          - 2-4 relevant options
          - An assessment status (continuing/ready)
          - A confidence score (0-100)
        `;

        await openai.beta.threads.messages.create(
          thread.id,
          {
            role: "user",
            content: taskMessage
          }
        );
        console.log('Initial message added');
      } else {
        thread = { id: threadId };
        
        if (message) {
          await openai.beta.threads.messages.create(
            thread.id,
            {
              role: "user",
              content: `User selected: "${message}". Continue analyzing the task.`
            }
          );
          console.log('Follow-up message added');
        }
      }

      console.log('Creating run');
      const run = await openai.beta.threads.runs.create(
        thread.id,
        {
          assistant_id: process.env.OPENAI_ASSISTANT_ID,
          instructions: `
            You are analyzing: "${taskContext.task.description}"
            Respond with a JSON object containing:
            - question: A specific question about this task
            - options: Array of 2-4 relevant options
            - assessment: "continuing" or "ready"
            - confidence_score: Number between 0-100
          `
        }
      );

      let runStatus = await getRunStatus(thread.id, run.id);
      let attempts = 0;
      const maxAttempts = 30;
      const pollInterval = 1000; // 1 second

      while (attempts < maxAttempts) {
        console.log(`Run status (attempt ${attempts + 1}/${maxAttempts}):`, runStatus.status);

        if (runStatus.status === 'completed') {
          const messages = await openai.beta.threads.messages.list(thread.id);
          const lastMessage = messages.data[0];

          if (lastMessage.content[0].type === 'text') {
            return NextResponse.json({
              threadId: thread.id,
              message: lastMessage.content[0].text.value
            });
          }
          break;
        }

        if (runStatus.status === 'failed') {
          console.error('Run failed:', runStatus.last_error);
          throw new Error(`Run failed: ${runStatus.last_error?.message || 'Unknown error'}`);
        }

        if (runStatus.status === 'requires_action') {
          console.log('Run requires action - not expected with JSON response format');
          throw new Error('Unexpected run status: requires_action');
        }

        if (['cancelled', 'expired', 'failed'].includes(runStatus.status)) {
          throw new Error(`Run ended with status: ${runStatus.status}`);
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
        attempts++;
        runStatus = await getRunStatus(thread.id, run.id);
      }

      throw new Error('Run timed out');

    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      message: JSON.stringify(DEFAULT_RESPONSE)
    }, { status: 500 });
  }
}
