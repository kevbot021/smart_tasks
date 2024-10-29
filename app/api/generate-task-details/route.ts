import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import type { TaskContext } from '@/types';

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
    console.log('\n=== Starting new request ===');

    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_ASSISTANT_ID) {
      return NextResponse.json({
        threadId: null,
        message: JSON.stringify(DEFAULT_RESPONSE)
      });
    }

    const { threadId, taskContext, message } = await req.json();
    let thread;

    try {
      if (!threadId) {
        thread = await openai.beta.threads.create();
        console.log('New thread created:', thread.id);

        await openai.beta.threads.messages.create(
          thread.id,
          {
            role: "user",
            content: JSON.stringify({
              task: taskContext.task,
              subtasks: taskContext.subtasks,
              request: "Please analyze this task and provide guidance."
            })
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
              content: message
            }
          );
        }
      }

      const run = await openai.beta.threads.runs.create(
        thread.id,
        {
          assistant_id: process.env.OPENAI_ASSISTANT_ID,
          instructions: `
            You are a task analysis assistant. Analyze the task and provide guidance.
            Always respond with a valid JSON object in this exact format:
            {
              "question": "A clear question about the task",
              "options": ["2-4 specific response options"],
              "assessment": "continuing",
              "confidence_score": 0
            }
            
            Ensure your response is valid JSON and matches this format exactly.
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
              // Validate the response format
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
    console.error('Error in API route:', error);
    return NextResponse.json({
      threadId: null,
      message: JSON.stringify(DEFAULT_RESPONSE)
    });
  }
}
