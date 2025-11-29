# AI Game Engine

A text-based AI game engine powered by OpenAI's GPT-4 Turbo.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Add your OpenAI API key to `.env.local`:
```
OPENAI_API_KEY=your_api_key_here
```

3. Edit the game configuration files:
   - `engine-rules.md` - Define how the game engine behaves, rules, and constraints
   - `scenario.md` - Define the game scenario, setting, characters, and story

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

- The player enters commands in the input text area
- Commands are sent to GPT-4 Turbo along with:
  - System prompt built from `engine-rules.md` and `scenario.md`
  - Full conversation history for context
- The AI's response is displayed in the output area
- Only the most recent response is shown, but full history is maintained for context

## Example Commands

- "I look around, what do I see?"
- "Pick up the key"
- "Open the door"
- "Talk to the guard"
