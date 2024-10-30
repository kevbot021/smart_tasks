import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

async function testTaskAssistant() {
  try {
    console.log('\n🔍 Testing Task Analysis Assistant...');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 1. Create task-specific assistant
    console.log('\nCreating task assistant...');
    const assistant = await openai.beta.assistants.create({
      name: "Task Analysis Assistant",
      instructions: `You are a task analysis assistant that helps users understand their tasks.
        When analyzing a task:
        1. Consider the task description and context
        2. Review all subtasks
        3. Help users break down and understand the task

        Always use the analyze_task function to respond.
        Keep responses focused on the specific task being discussed.`,
      model: "gpt-4-1106-preview",
      tools: [{
        type: "function",
        function: {
          name: "analyze_task",
          description: "Analyze a task and provide guidance",
          parameters: {
            type: "object",
            properties: {
              question: {
                type: "string",
                description: "A question about the task"
              },
              options: {
                type: "array",
                items: { type: "string" },
                description: "Possible responses for the user"
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
      }]
    });

    console.log('Assistant created:', {
      id: assistant.id,
      name: assistant.name
    });

    // 2. Test with a sample task
    const sampleTask = {
      description: "Build a garden shed",
      subtasks: [
        "Purchase building materials",
        "Clear the construction site",
        "Assemble the frame"
      ]
    };

    // 3. Create thread
    console.log('\nCreating test thread...');
    const thread = await openai.beta.threads.create();

    // 4. Send task details
    console.log('\nSending task details...');
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `Please analyze this task:
        Task: ${sampleTask.description}
        Subtasks:
        ${sampleTask.subtasks.map((st, i) => `${i + 1}. ${st}`).join('\n')}`
    });

    // 5. Run the assistant
    console.log('\nRunning assistant...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
      instructions: "Analyze the task and provide guidance using the analyze_task function."
    });

    // 6. Handle the interaction
    console.log('\nWaiting for response...');
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    while (true) {
      console.log('Status:', runStatus.status);

      if (runStatus.status === 'completed') {
        break;
      }

      if (runStatus.status === 'requires_action') {
        console.log('\nProcessing function call...');
        const toolCalls = runStatus.required_action?.submit_tool_outputs.tool_calls;
        
        if (toolCalls) {
          const toolOutputs = toolCalls.map(toolCall => {
            const functionArgs = JSON.parse(toolCall.function.arguments);
            console.log('Function arguments:', functionArgs);
            
            return {
              tool_call_id: toolCall.id,
              output: JSON.stringify(functionArgs)
            };
          });

          await openai.beta.threads.runs.submitToolOutputs(
            thread.id,
            run.id,
            { tool_outputs: toolOutputs }
          );
          console.log('Tool outputs submitted');
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    // 7. Get final response
    const messages = await openai.beta.threads.messages.list(thread.id);
    console.log('\nFinal Response:', JSON.stringify(messages.data[0].content, null, 2));

    // 8. Save assistant ID
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
    console.log('\n✅ Task Assistant setup complete!');

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

testTaskAssistant(); 