import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { taskDescription } = await request.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that generates subtasks for a given task." },
        { role: "user", content: `Generate 3 subtasks for the following task: "${taskDescription}"` }
      ],
      max_tokens: 150,
      n: 1,
      temperature: 0.7,
    });

    const subtasks = completion.choices[0].message.content
      ?.split('\n')
      .filter(Boolean)
      .map(subtask => subtask.replace(/^\d+\.\s*/, '').trim())
      .slice(0, 3);

    return NextResponse.json({ subtasks });
  } catch (error) {
    console.error('Error generating subtasks:', error);
    return NextResponse.json({ error: 'Failed to generate subtasks' }, { status: 500 });
  }
}
