import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const scenariosDir = path.join(process.cwd(), 'scenarios');

    // Check if scenarios directory exists
    if (!fs.existsSync(scenariosDir)) {
      return NextResponse.json({ scenarios: [] });
    }

    // Read all .md files from scenarios directory, excluding TEMPLATE.md
    const files = fs.readdirSync(scenariosDir).filter(
      file => file.endsWith('.md') && file !== 'TEMPLATE.md'
    );

    // Parse each scenario file to extract title and description
    const scenarios = files.map(file => {
      const id = file.replace('.md', '');
      const filePath = path.join(scenariosDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Extract title (first # heading)
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : id.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      // Extract opening section as description
      const openingMatch = content.match(/## Opening\s*\n\s*\n([\s\S]*?)(?=\n\n##|$)/);
      const description = openingMatch ? openingMatch[1].trim().substring(0, 200) + '...' : 'An interactive adventure awaits.';

      return {
        id,
        title,
        description,
      };
    });

    return NextResponse.json({ scenarios });
  } catch (error) {
    console.error('Error loading scenarios:', error);
    return NextResponse.json(
      { error: 'Failed to load scenarios' },
      { status: 500 }
    );
  }
}
