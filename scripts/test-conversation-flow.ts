import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testConversationFlow() {
  try {
    console.log('\n🔍 Testing Conversation Flow...');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Use the existing assistant
    const assistantId = process.env.OPENAI_ASSISTANT_ID;
    if (!assistantId) {
      throw new Error('OPENAI_ASSISTANT_ID not found in .env.local');
    }

    // Sample task
    const task = {
      description: "Build a garden shed",
      subtasks: [
        "Purchase building materials",
        "Clear the construction site",
        "Assemble the frame"
      ]
    };

    // 1. Create thread
    console.log('\nCreating conversation thread...');
    const thread = await openai.beta.threads.create();
    console.log('Thread created:', thread.id);

    // 2. Initial message
    console.log('\nSending initial task...');
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `Task: ${task.description}\nSubtasks:\n${task.subtasks.join('\n')}`
    });

    // Function to run assistant and get response
    async function getAssistantResponse(threadId: string, userMessage?: string) {
      if (userMessage) {
        await openai.beta.threads.messages.create(threadId, {
          role: "user",
          content: userMessage
        });
      }

      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId
      });

      let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      
      while (true) {
        console.log('Status:', runStatus.status);

        if (runStatus.status === 'completed') {
          break;
        }

        if (runStatus.status === 'requires_action') {
          const toolCalls = runStatus.required_action?.submit_tool_outputs.tool_calls;
          
          if (toolCalls) {
            const toolOutputs = toolCalls.map(toolCall => {
              const functionArgs = JSON.parse(toolCall.function.arguments);
              console.log('\nAssistant question:', functionArgs.question);
              console.log('Options:', functionArgs.options);
              
              return {
                tool_call_id: toolCall.id,
                output: JSON.stringify(functionArgs)
              };
            });

            await openai.beta.threads.runs.submitToolOutputs(
              threadId,
              run.id,
              { tool_outputs: toolOutputs }
            );
          }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      }

      const messages = await openai.beta.threads.messages.list(threadId);
      return messages.data[0];
    }

    // 3. Get initial response
    console.log('\n📤 Getting initial response...');
    const initialResponse = await getAssistantResponse(thread.id);
    console.log('\n📥 Initial response received');

    // 4. Simulate user selection
    console.log('\n📤 Selecting option: "Wooden"...');
    const followUp1 = await getAssistantResponse(thread.id, "Wooden");
    console.log('\n📥 Follow-up response received');

    // 5. Another user selection
    console.log('\n📤 Selecting option: "Yes, I have some DIY experience"...');
    const followUp2 = await getAssistantResponse(thread.id, "Yes, I have some DIY experience");
    console.log('\n📥 Second follow-up response received');

    console.log('\n✅ Conversation flow test complete!');

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

testConversationFlow(); 