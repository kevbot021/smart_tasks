import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

async function testAssistantSetup() {
  try {
    console.log('\n🔍 Testing Assistant Setup...');
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in .env.local');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 1. Create a simple assistant
    console.log('\nCreating test assistant...');
    const assistant = await openai.beta.assistants.create({
      name: "Test Assistant",
      instructions: `You are a test assistant. 
        When asked a question, use the generate_response function to respond.
        Keep responses simple and always in JSON format.`,
      model: "gpt-4-1106-preview",
      tools: [{
        type: "function",
        function: {
          name: "generate_response",
          description: "Generate a simple response",
          parameters: {
            type: "object",
            properties: {
              message: {
                type: "string",
                description: "A simple message"
              },
              status: {
                type: "string",
                enum: ["success", "error"],
                description: "Status of the response"
              }
            },
            required: ["message", "status"]
          }
        }
      }]
    });

    console.log('Assistant created:', {
      id: assistant.id,
      name: assistant.name,
      model: assistant.model
    });

    // 2. Create a thread
    console.log('\nCreating test thread...');
    const thread = await openai.beta.threads.create();
    console.log('Thread created:', thread.id);

    // 3. Add a message to the thread
    console.log('\nAdding test message...');
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: "Please provide a test response."
    });

    // 4. Run the assistant
    console.log('\nRunning assistant...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
      instructions: "Use the generate_response function to respond."
    });

    // 5. Wait for completion and handle function calls
    console.log('\nWaiting for response...');
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    while (true) {
      console.log('Status:', runStatus.status);

      if (runStatus.status === 'completed') {
        break;
      }

      if (runStatus.status === 'requires_action') {
        console.log('\nFunction call required...');
        const toolCalls = runStatus.required_action?.submit_tool_outputs.tool_calls;
        
        if (toolCalls) {
          console.log('Tool calls received:', toolCalls);
          
          const toolOutputs = toolCalls.map(toolCall => {
            console.log('Processing tool call:', toolCall.function);
            return {
              tool_call_id: toolCall.id,
              output: JSON.stringify({
                message: "Test response successful",
                status: "success"
              })
            };
          });

          console.log('Submitting tool outputs:', toolOutputs);
          
          try {
            await openai.beta.threads.runs.submitToolOutputs(
              thread.id,
              run.id,
              { tool_outputs: toolOutputs }
            );
            console.log('Tool outputs submitted successfully');
          } catch (error) {
            console.error('Error submitting tool outputs:', error);
            throw error;
          }
        }
      }

      if (runStatus.status === 'failed') {
        throw new Error(`Run failed: ${runStatus.last_error}`);
      }

      // Wait and check status again
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    // 6. Get the final response
    console.log('\nRetrieving final response...');
    const messages = await openai.beta.threads.messages.list(thread.id);
    console.log('Final Response:', JSON.stringify(messages.data[0].content, null, 2));

    // 7. Save assistant ID to .env.local
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
    console.log('\n✅ Assistant setup complete!');
    console.log('Assistant ID saved to .env.local');

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('Full error details:', error);
  }
}

testAssistantSetup();