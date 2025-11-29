import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenarioId = searchParams.get('scenarioId');

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
