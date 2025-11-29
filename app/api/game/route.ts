import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, scenarioId } = await request.json();

    // Read the engine rules and scenario files
    const engineRulesPath = path.join(process.cwd(), 'engine-rules.md');

    // Use scenarioId if provided, otherwise fall back to default scenario.md
    let scenarioPath: string;
    if (scenarioId) {
      scenarioPath = path.join(process.cwd(), 'scenarios', `${scenarioId}.md`);
      // Check if scenario file exists
      if (!fs.existsSync(scenarioPath)) {
        return NextResponse.json(
          { error: `Scenario '${scenarioId}' not found` },
          { status: 404 }
        );
      }
    } else {
      scenarioPath = path.join(process.cwd(), 'scenario.md');
    }

    const engineRules = fs.readFileSync(engineRulesPath, 'utf-8');
    const scenario = fs.readFileSync(scenarioPath, 'utf-8');

    // Build the system prompt
    const systemPrompt = `${engineRules}\n\n${scenario}`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    });

    const assistantMessage = completion.choices[0].message.content;

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
