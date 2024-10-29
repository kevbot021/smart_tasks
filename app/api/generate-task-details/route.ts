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
    console.log('Received task context:', JSON.stringify(taskContext, null, 2));

    if (!process.env.OPENAI_ASSISTANT_ID) {
      console.error('Missing OPENAI_ASSISTANT_ID');
      throw new Error('Assistant ID not configured');
    }

    // Create a new thread if none exists
    let thread;
    if (!threadId) {
      console.log('Creating new thread with context:', taskContext);
      thread = await openai.beta.threads.create();
      
      // Create a detailed analysis of the task for the AI
      const taskAnalysis = `
        Please analyze this task and provide guidance through questions. Here are the task details:

        MAIN TASK:
        - Description: ${taskContext.task.description}
        - Category: ${taskContext.task.category}
        - Current Status: ${taskContext.task.status}
        - Assigned to: ${taskContext.task.assigned_to}
        - Created by: ${taskContext.task.created_by}

        SUBTASKS (${taskContext.metadata.total_subtasks} total):
        ${taskContext.subtasks.map((st: any, index: number) => 
          `${index + 1}. ${st.description} (${st.status})`
        ).join('\n')}

        PROGRESS:
        - Completed subtasks: ${taskContext.metadata.completed_subtasks} of ${taskContext.metadata.total_subtasks}
        - Category: ${taskContext.metadata.category}

        Please provide responses in JSON format that help understand and break down this specific task.
        Focus your questions and options on the actual task content and its subtasks.
        
        Example response format:
        {
          "question": "[Ask about a specific aspect of this task]",
          "options": [
            "[Task-specific option 1]",
            "[Task-specific option 2]",
            "[Task-specific option 3]"
          ],
          "assessment": "continuing",
          "confidence_score": 0
        }
      `;

      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: taskAnalysis
      });
    } else {
      thread = { id: threadId };
      if (message) {
        // Include task context in follow-up
        const followUpMessage = `
          Based on the user's selection: "${message}"
          
          Remember this is about: ${taskContext.task.description}
          With subtasks: ${taskContext.subtasks.map((st: any) => st.description).join(', ')}
          
          Please provide the next question in JSON format, keeping focus on this specific task.
        `;

        await openai.beta.threads.messages.create(thread.id, {
          role: "user",
          content: followUpMessage
        });
      }
    }

    console.log('Running assistant...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
      instructions: `
        You are analyzing this specific task: "${taskContext.task.description}"
        
        Keep your responses focused on this task and its subtasks:
        ${taskContext.subtasks.map((st: any) => `- ${st.description}`).join('\n')}

        Always provide task-specific questions and options that help understand:
        1. The requirements and scope of this particular task
        2. The approach to completing the subtasks
        3. Any potential challenges or considerations specific to this task

        Respond in JSON format with:
        {
          "question": "task-specific question",
          "options": ["relevant option 1", "relevant option 2", "relevant option 3"],
          "assessment": "continuing",
          "confidence_score": 0
        }
      `
    });

    // ... rest of the code remains the same ...

  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json({
      threadId: null,
      message: JSON.stringify(DEFAULT_RESPONSE)
    });
  }
}
