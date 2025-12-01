import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are helping a user create a text-based adventure game scenario. Your job is to ask focused follow-up questions to clarify their scenario idea.

The user has described (or is describing) their scenario. Based on what they've shared, you need to ask about missing critical information.

## Required Questions

You MUST ask these questions in order (skip any that have already been clearly answered):

1. **Core mechanics** (if unclear): What are the key objects/characters and how does the player win?
2. **Suggested hidden information rules** (ALWAYS do this as the FINAL step before completing): Based on everything discussed, YOU generate specific hidden information rules and present them to the user for approval.

## The Hidden Information Rules Step (CRITICAL)

This is the most important step. Before marking complete, you MUST:

1. Analyze everything the user has described
2. Infer what details should stay hidden until discovered
3. Present these as specific rules for the user to approve

Think about:
- What's in the Opening (what player sees immediately) vs what requires examination
- Items inside containers (bags, boxes, drawers) - don't mention until opened
- Details about objects (a door being blocked, a lock being broken) - don't mention until examined
- Items hidden in locations (under beds, behind paintings) - don't mention until searched
- NPC possessions or knowledge - don't reveal until interaction
- Puzzle-critical information that would spoil the game

Format your suggested rules as a clear list the user can approve or modify.

## Response Format

Your response must be valid JSON in this exact format:
{
  "question": "Your question here?",
  "sampleAnswer": "A brief example of what kind of answer you're looking for"
}

Or if the user has approved the hidden information rules:
{
  "complete": true
}

## Examples

For the hidden information rules step (ALWAYS phrase it as suggestions for approval):
{"question": "Based on your scenario, here are the hidden information rules I'll use. The game will NOT mention these details until the player specifically examines/searches for them:\\n\\n• Contents of the bunks (personal items, ID badges) - only revealed when player searches a specific bunk\\n• The door's condition (partially open, blocked by debris) - only revealed when player examines the door\\n• The slicing laser and fuel cartridge - only found when searching crew belongings\\n• The password clue in the Security Officer's belongings - only found when examining that bunk\\n\\nDoes this look right? Reply 'yes' to approve, or tell me what to change.", "sampleAnswer": "Yes, that looks good"}

For mechanics questions:
{"question": "What's inside the locked chest?", "sampleAnswer": "A golden key that unlocks the exit door"}
{"question": "How does the player get past the guard?", "sampleAnswer": "They need to distract him by throwing a rock, or find a disguise in the closet"}

## Important

- NEVER mark complete until you have presented hidden information rules and the user has approved them
- The hidden information rules step must be SPECIFIC to their scenario (not generic)
- Generate rules based on what they've told you - don't ask them to come up with rules
- Keep questions conversational and concise
- Don't ask about edge cases or world physics (the engine handles those)
- Don't re-ask things the user already explained`;

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export async function POST(request: NextRequest) {
  try {
    const { conversation } = await request.json();

    if (!conversation || !Array.isArray(conversation) || conversation.length === 0) {
      return NextResponse.json(
        { error: 'Conversation history is required' },
        { status: 400 }
      );
    }

    const messages: Message[] = conversation.map((msg: Message) => ({
      role: msg.role,
      content: msg.content,
    }));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0].message.content || '{}';

    let parsed: { question?: string; sampleAnswer?: string; complete?: boolean };
    try {
      parsed = JSON.parse(response);
    } catch {
      // Fallback if JSON parsing fails
      parsed = { complete: true };
    }

    const isComplete = parsed.complete === true || !parsed.question;

    return NextResponse.json({
      question: isComplete ? null : parsed.question,
      sampleAnswer: isComplete ? null : parsed.sampleAnswer,
      isComplete,
    });
  } catch (error) {
    console.error('Error generating question:', error);
    return NextResponse.json(
      { error: 'Failed to generate question' },
      { status: 500 }
    );
  }
}
