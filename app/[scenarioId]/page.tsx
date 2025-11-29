'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function ScenarioPage() {
  const params = useParams();
  const scenarioId = params.scenarioId as string;

  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Load the opening text when the page first loads
    const loadOpening = async () => {
      try {
        const response = await fetch(`/api/game/opening?scenarioId=${scenarioId}`);
        const data = await response.json();
        if (data.opening) {
          setOutput(data.opening);
        } else if (data.error) {
          setOutput(`Error: ${data.error}`);
        }
      } catch (error) {
        console.error('Failed to load opening:', error);
        setOutput('Error: Failed to load scenario');
      }
    };

    loadOpening();
    textareaRef.current?.focus();
  }, [scenarioId]);

  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus();
    }
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    setIsLoading(true);

    // Add user message to conversation history
    const userMessage: Message = { role: 'user', content: input };
    const updatedHistory = [...conversationHistory, userMessage];

    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedHistory,
          scenarioId,
        }),
      });

      const data = await response.json();

      if (data.message) {
        // Add assistant message to conversation history
        const assistantMessage: Message = { role: 'assistant', content: data.message };
        setConversationHistory([...updatedHistory, assistantMessage]);

        // Display only the most recent output
        setOutput(data.message);
      } else {
        setOutput('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      setOutput('Error: Failed to communicate with the game engine');
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
          AI Game Engine
        </h1>
        <p className="text-center text-gray-600 mb-4">
          Scenario: {scenarioId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </p>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Output</h2>
          <div className="bg-gray-50 p-4 rounded min-h-[200px] whitespace-pre-wrap">
            {output || 'Your game responses will appear here...'}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Input</h2>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Enter your command (e.g., 'I look around, what do I see?')"
            className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="mt-4 w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Processing...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
