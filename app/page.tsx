'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

type Scenario = {
  id: string;
  title: string;
  description: string;
};

export default function Home() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadScenarios = async () => {
      try {
        const response = await fetch('/api/scenarios');
        const data = await response.json();
        if (data.scenarios) {
          setScenarios(data.scenarios);
        }
      } catch (error) {
        console.error('Failed to load scenarios:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadScenarios();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-center text-gray-800">
          AI Game Engine
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Choose a scenario to begin your adventure
        </p>

        {isLoading ? (
          <div className="text-center text-gray-600">Loading scenarios...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {scenarios.map((scenario) => (
              <Link
                key={scenario.id}
                href={`/${scenario.id}`}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                  {scenario.title}
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {scenario.description}
                </p>
                <div className="mt-4 text-blue-600 font-semibold">
                  Start Adventure →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
