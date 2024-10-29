import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    // Check if we already have an assistant
    let assistant;
    if (process.env.OPENAI_ASSISTANT_ID) {
      assistant = await openai.beta.assistants.retrieve(
        process.env.OPENAI_ASSISTANT_ID
      );
    } else {
      // Create a new assistant
      assistant = await openai.beta.assistants.create({
        name: "Task Helper",
        instructions: `You are a helpful task assistant that helps users understand their tasks and subtasks. 
        Your goal is to ask targeted questions with multiple choice answers to gauge the user's understanding.
        
        Follow these guidelines:
        1. Ask one question at a time
        2. Provide 2-4 multiple choice options for each question
        3. Base your questions on the task and subtask context provided
        4. Adjust your questions based on user responses
        5. After 3-5 questions, assess if the user is ready to start
        6. If they seem ready, ask if they want to begin the task
        7. Keep responses concise and focused
        
        Always format your responses as JSON:
        {
          "question": "your question here",
          "options": ["option1", "option2", "option3"],
          "assessment": "ready|not_ready|continuing",
          "confidence_score": 0-100
        }`,
        model: "gpt-4-1106-preview",
        tools: [{ type: "code_interpreter" }],
      });

      // In a production environment, you'd want to save this ID securely
      console.log('Created new assistant with ID:', assistant.id);
    }

    return NextResponse.json({ assistantId: assistant.id });
  } catch (error) {
    console.error('Error initializing assistant:', error);
    return NextResponse.json({ error: 'Failed to initialize assistant' }, { status: 500 });
  }
} 