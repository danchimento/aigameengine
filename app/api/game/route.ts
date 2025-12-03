import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

// Tool definitions
const probabilityTool = {
  name: 'random_outcome',
  description: 'Generate a random outcome from a set of possibilities. Use this when the player does something with random outcomes (flipping a coin, rolling dice, drawing a card, etc.) or when the scenario defines a probability for an action.',
  input_schema: {
    type: 'object' as const,
    properties: {
      outcomes: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of possible outcomes. For a coin: ["heads", "tails"]. For a d6: ["1", "2", "3", "4", "5", "6"]. For a weighted check, repeat outcomes to adjust probability, e.g., ["success", "fail", "fail", "fail"] for 25% success.',
      },
      description: {
        type: 'string',
        description: 'Brief description of what is being rolled for, e.g., "coin flip", "d6 roll", "picking the lock"',
      },
    },
    required: ['outcomes', 'description'],
  },
};

function executeRandomOutcome(outcomes: string[]): { outcome: string; index: number } {
  const index = Math.floor(Math.random() * outcomes.length);
  return { outcome: outcomes[index], index };
}

async function callOpenAI(systemPrompt: string, messages: Message[], model: string = 'gpt-4o'): Promise<string> {
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  });
  return completion.choices[0].message.content || '';
}

async function callClaude(systemPrompt: string, messages: Message[], model: string = 'claude-sonnet-4-20250514'): Promise<string> {
  let currentMessages: Anthropic.MessageParam[] = messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  // Loop to handle tool use
  while (true) {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      tools: [probabilityTool],
      messages: currentMessages,
    });

    // Check if the model wants to use a tool
    if (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      if (toolUseBlock && toolUseBlock.name === 'random_outcome') {
        const input = toolUseBlock.input as { outcomes: string[]; description: string };
        console.log('[RANDOM OUTCOME] Input:', input);
        const result = executeRandomOutcome(input.outcomes);
        console.log('[RANDOM OUTCOME] Result:', result);

        // Add the assistant's response (with tool use) and the tool result
        currentMessages = [
          ...currentMessages,
          { role: 'assistant', content: response.content },
          {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: toolUseBlock.id,
                content: JSON.stringify({
                  outcome: result.outcome,
                  index: result.index,
                  totalOutcomes: input.outcomes.length,
                  description: input.description,
                }),
              },
            ],
          },
        ];

        // Continue the loop to get the final response
        continue;
      }
    }

    // No tool use or finished with tools - extract text response
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );
    return textBlock ? textBlock.text : '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages, scenarioId, tone, model } = await request.json();

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

    // Read tone file (default to 'sarcastic' if not specified)
    const toneId = tone || 'sarcastic';
    const tonePath = path.join(process.cwd(), 'tones', `${toneId}.md`);
    let toneContent = '';
    if (fs.existsSync(tonePath)) {
      toneContent = fs.readFileSync(tonePath, 'utf-8');
    }

    const engineRules = fs.readFileSync(engineRulesPath, 'utf-8');
    const scenario = fs.readFileSync(scenarioPath, 'utf-8');

    // Build the system prompt: engine rules + tone + scenario
    const systemPrompt = `${engineRules}\n\n${toneContent}\n\n${scenario}`;

    // Call the appropriate AI model
    const modelId = model || 'sonnet';
    let assistantMessage: string;

    switch (modelId) {
      case 'haiku':
        assistantMessage = await callClaude(systemPrompt, messages, 'claude-3-5-haiku-20241022');
        break;
      case 'gpt4o':
        assistantMessage = await callOpenAI(systemPrompt, messages, 'gpt-4o');
        break;
      case 'gpt4o-mini':
        assistantMessage = await callOpenAI(systemPrompt, messages, 'gpt-4o-mini');
        break;
      case 'sonnet':
      default:
        assistantMessage = await callClaude(systemPrompt, messages, 'claude-sonnet-4-20250514');
        break;
    }

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
