import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function verifyAssistant() {
  try {
    console.log('\n=== Verifying Assistant Setup ===\n');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 1. Check environment variables
    console.log('Checking environment variables:');
    console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Present' : '❌ Missing');
    console.log('OPENAI_ASSISTANT_ID:', process.env.OPENAI_ASSISTANT_ID ? '✅ Present' : '❌ Missing');

    if (!process.env.OPENAI_ASSISTANT_ID) {
      throw new Error('OPENAI_ASSISTANT_ID is missing');
    }

    // 2. Verify assistant exists
    console.log('\nVerifying assistant...');
    const assistant = await openai.beta.assistants.retrieve(
      process.env.OPENAI_ASSISTANT_ID
    );
    
    console.log('Assistant details:');
    console.log('- ID:', assistant.id);
    console.log('- Name:', assistant.name);
    console.log('- Model:', assistant.model);
    console.log('- Tools:', assistant.tools.length);
    console.log('- Instructions:', assistant.instructions);

    // 3. Test basic functionality
    console.log('\nTesting basic functionality...');
    
    // Create thread
    const thread = await openai.beta.threads.create();
    console.log('Created test thread:', thread.id);

    // Add message
    await openai.beta.threads.messages.create(
      thread.id,
      {
        role: "user",
        content: JSON.stringify({
          task: {
            description: "Test task",
            category: "Test",
            status: "in progress"
          },
          subtasks: [
            { description: "Test subtask 1", status: "pending" }
          ],
          request: "Please analyze this task."
        })
      }
    );
    console.log('Added test message');

    // Run assistant
    const run = await openai.beta.threads.runs.create(
      thread.id,
      {
        assistant_id: assistant.id,
        instructions: `
          Please respond with a JSON object in this format:
          {
            "question": "Test question",
            "options": ["option1", "option2", "option3"],
            "assessment": "continuing",
            "confidence_score": 0
          }
        `
      }
    );
    console.log('Created test run:', run.id);

    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    console.log('Initial status:', runStatus.status);

    while (['in_progress', 'queued'].includes(runStatus.status)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log('Status:', runStatus.status);
    }

    if (runStatus.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(thread.id);
      console.log('\nFinal response:', messages.data[0].content[0]);
    } else {
      console.error('\nRun failed:', runStatus.last_error);
    }

    // Clean up
    await openai.beta.threads.del(thread.id);
    console.log('\nTest complete!');

  } catch (error) {
    console.error('\nError:', error);
  }
}

verifyAssistant(); 