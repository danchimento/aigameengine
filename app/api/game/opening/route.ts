import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const scenarioPath = path.join(process.cwd(), 'scenario.md');
    const scenario = fs.readFileSync(scenarioPath, 'utf-8');

    // Extract the opening section from the scenario
    const openingMatch = scenario.match(/## Opening\s*\n\s*\n([\s\S]*?)(?=\n\n##|$)/);
    const opening = openingMatch ? openingMatch[1].trim() : 'The game begins...';

    return NextResponse.json({ opening });
  } catch (error) {
    console.error('Error loading opening:', error);
    return NextResponse.json(
      { error: 'Failed to load opening' },
      { status: 500 }
    );
  }
}
