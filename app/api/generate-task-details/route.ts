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
              request: "Please help me analyze and break down this task."
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
              content: `User selected: ${message}. Please continue analyzing the task based on this choice.`
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
    console.error('Error in API route:', error);
    return NextResponse.json({
      threadId: null,
      message: JSON.stringify(DEFAULT_RESPONSE)
    });
  }
}
