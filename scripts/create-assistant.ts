import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function createOrUpdateAssistant() {
  try {
    const assistantId = process.env.OPENAI_ASSISTANT_ID;
    let assistant;

    if (assistantId) {
      console.log('Checking existing assistant...');
      try {
        assistant = await openai.beta.assistants.retrieve(assistantId);
        console.log('Found existing assistant:', assistant.id);
        
        // Update the existing assistant
        assistant = await openai.beta.assistants.update(
          assistantId,
          {
            instructions: `You are a task analysis assistant that helps users understand their tasks.
            
            When analyzing a task:
            1. Consider the task description and context
            2. Review all subtasks
            3. Help users break down and understand the task

            Always respond with a JSON object containing:
            - question: A specific question about the task
            - options: Array of 2-4 relevant response options
            - assessment: "continuing" or "ready"
            - confidence_score: Number between 0 and 100`,
            model: "gpt-4-1106-preview",
            tools: [{
              type: "function",
              function: {
                name: "analyze_task",
                description: "Generate a structured response for task analysis",
                parameters: {
                  type: "object",
                  properties: {
                    question: {
                      type: "string",
                      description: "A specific question about the task"
                    },
                    options: {
                      type: "array",
                      items: { type: "string" },
                      description: "Array of 2-4 task-specific response options"
                    },
                    assessment: {
                      type: "string",
                      enum: ["continuing", "ready"],
                      description: "Whether to continue asking questions"
                    },
                    confidence_score: {
                      type: "number",
                      minimum: 0,
                      maximum: 100,
                      description: "Confidence in user's understanding"
                    }
                  },
                  required: ["question", "options", "assessment", "confidence_score"]
                }
              }
            }],
            response_format: { type: "json_object" }
          }
        );
        console.log('Updated assistant configuration');
      } catch (e) {
        console.log('Existing assistant not found, creating new one...');
      }
    }

    if (!assistant) {
      // Create new assistant with JSON response format
      assistant = await openai.beta.assistants.create({
        name: "Task Analysis Assistant",
        instructions: `You are a task analysis assistant that helps users understand their tasks.
        
        When analyzing a task:
        1. Consider the task description and context
        2. Review all subtasks
        3. Help users break down and understand the task

        Always respond with a JSON object containing:
        - question: A specific question about the task
        - options: Array of 2-4 relevant response options
        - assessment: "continuing" or "ready"
        - confidence_score: Number between 0 and 100`,
        model: "gpt-4-1106-preview",
        tools: [{
          type: "function",
          function: {
            name: "analyze_task",
            description: "Generate a structured response for task analysis",
            parameters: {
              type: "object",
              properties: {
                question: {
                  type: "string",
                  description: "A specific question about the task"
                },
                options: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of 2-4 task-specific response options"
                },
                assessment: {
                  type: "string",
                  enum: ["continuing", "ready"],
                  description: "Whether to continue asking questions"
                },
                confidence_score: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                  description: "Confidence in user's understanding"
                }
              },
              required: ["question", "options", "assessment", "confidence_score"]
            }
          }
        }],
        response_format: { type: "json_object" }
      });

      console.log('Created new assistant:', assistant.id);
    }

    // Save the assistant ID to .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    
    if (envContent.includes('OPENAI_ASSISTANT_ID=')) {
      envContent = envContent.replace(
        /OPENAI_ASSISTANT_ID=.*/,
        `OPENAI_ASSISTANT_ID=${assistant.id}`
      );
    } else {
      envContent += `\nOPENAI_ASSISTANT_ID=${assistant.id}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('Updated .env.local with assistant ID');
    console.log('Assistant is ready to use');

  } catch (error) {
    console.error('Error:', error);
  }
}

createOrUpdateAssistant();