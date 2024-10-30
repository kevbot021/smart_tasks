import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testOpenAIConnection() {
  try {
    console.log('\n🔍 Testing OpenAI Connection...');
    
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in .env.local');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Test basic chat completion
    console.log('\nTesting basic chat completion...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "Say 'OpenAI connection successful'" }],
    });

    console.log('Response:', completion.choices[0].message.content);
    console.log('\n✅ Basic OpenAI connection test passed!\n');

  } catch (error) {
    console.error('\n❌ Error testing OpenAI connection:', error);
  }
}

testOpenAIConnection(); 