import OpenAI from 'openai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function createAssistant() {
  try {
    const assistant = await openai.beta.assistants.create({
      name: "Task Helper",
      instructions: `You are a helpful task assistant that helps users understand their tasks and subtasks. 
      Your goal is to ask targeted questions with multiple choice answers to gauge the user's understanding.
      
      You MUST ALWAYS respond with valid JSON in the following format:
      {
        "question": "your question here",
        "options": ["option1", "option2", "option3"],
        "assessment": "ready|not_ready|continuing",
        "confidence_score": 0-100
      }
      
      Follow these guidelines:
      1. Ask one question at a time
      2. Provide 2-4 multiple choice options for each question
      3. Base your questions on the task and subtask context provided
      4. Adjust your questions based on user responses
      5. After 3-5 questions, assess if the user is ready to start
      6. If they seem ready, ask if they want to begin the task
      7. Keep responses concise and focused`,
      model: "gpt-4-1106-preview",
      tools: [{
        type: "function",
        function: {
          name: "generate_question",
          description: "Generate a question with multiple choice options to help user understand the task",
          parameters: {
            type: "object",
            properties: {
              question: {
                type: "string",
                description: "The question to ask the user"
              },
              options: {
                type: "array",
                items: {
                  type: "string"
                },
                description: "Array of possible answers"
              },
              assessment: {
                type: "string",
                enum: ["ready", "not_ready", "continuing"],
                description: "Assessment of user's readiness"
              },
              confidence_score: {
                type: "number",
                minimum: 0,
                maximum: 100,
                description: "Confidence score from 0 to 100"
              }
            },
            required: ["question", "options", "assessment", "confidence_score"]
          }
        }
      }],
      response_format: { type: "json_object" }
    });

    console.log('Assistant created successfully!');
    console.log('Assistant ID:', assistant.id);
    console.log('Add this ID to your .env.local file as OPENAI_ASSISTANT_ID');
  } catch (error) {
    console.error('Error creating assistant:', error);
  }
}

createAssistant(); 