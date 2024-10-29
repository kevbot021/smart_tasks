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
      
      // Format the task context in a more structured way
      const formattedContext = {
        mainTask: {
          description: taskContext.description,
          subtasks: taskContext.sub_tasks?.map((st: any) => st.description) || []
        },
        instruction: "Based on this specific task and its subtasks, help the user understand how to approach it. Ask relevant questions about the task's requirements, challenges, and execution. Reference specific aspects of the task in your questions."
      };

      const contextMessage = `
        Please analyze this task and provide responses in JSON format.
        
        Task Context:
        ${JSON.stringify(formattedContext, null, 2)}

        For each response, generate:
        1. A question specifically about this task
        2. 3-4 options that relate to the task details
        3. An assessment of user understanding
        4. A confidence score

        Example format:
        {
          "question": "[Task-specific question here]",
          "options": [
            "[Task-relevant option 1]",
            "[Task-relevant option 2]",
            "[Task-relevant option 3]"
          ],
          "assessment": "continuing",
          "confidence_score": 0
        }
      `;

      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: contextMessage
      });
    } else {
      thread = { id: threadId };
      if (message) {
        // Include task context in follow-up messages
        await openai.beta.threads.messages.create(thread.id, {
          role: "user",
          content: `User selected: "${message}". Continue with task-specific questions and provide response in JSON format.`
        });
      }
    }

    console.log('Running assistant...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
      instructions: `You are a task analysis assistant. Your role is to help users understand their specific task by asking relevant questions.

      Important guidelines:
      1. Always reference specific aspects of the task in your questions
      2. Generate options that are directly related to the task's details
      3. Base your questions on the task description and subtasks
      4. Maintain context throughout the conversation
      5. Always respond in JSON format
      
      Response format:
      {
        "question": "Ask about specific aspects of the task",
        "options": ["task-relevant option 1", "task-relevant option 2", "task-relevant option 3"],
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