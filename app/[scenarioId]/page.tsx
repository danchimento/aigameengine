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
  const [title, setTitle] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Load the opening text when the page first loads
    const loadOpening = async () => {
      try {
        const response = await fetch(`/api/game/opening?scenarioId=${scenarioId}`);
        const data = await response.json();
        if (data.opening) {
          setOutput(data.opening);
          const scenarioTitle = data.title || 'AI Game Engine';
          setTitle(scenarioTitle);
          // Update browser tab title
          document.title = scenarioTitle;
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

        // Display only the most recent output with fade animation
        setOutput(data.message);
        setFadeKey(prev => prev + 1);
      } else {
        setOutput('Error: ' + (data.error || 'Unknown error'));
        setFadeKey(prev => prev + 1);
      }
    } catch (error) {
      setOutput('Error: Failed to communicate with the game engine');
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
      <div className="w-full max-w-[900px] h-[calc(100vh-3rem)] flex flex-col gap-6">
        {/* Output Area */}
        <div
          key={fadeKey}
          className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6 flex-1 flex items-center justify-center animate-fadeIn overflow-y-auto"
        >
          <div className="text-neutral-100 text-base leading-relaxed whitespace-pre-wrap max-w-prose font-mono">
            {output || 'Loading...'}
          </div>
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="space-y-4 flex-shrink-0">
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
            placeholder="What do you do?"
            className="w-full p-4 bg-neutral-900 border border-neutral-800 rounded-lg resize-none focus:outline-none focus:border-neutral-700 text-neutral-100 placeholder-neutral-500 font-mono"
            rows={3}
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-full bg-neutral-100 text-neutral-900 py-3 px-6 rounded-lg font-medium hover:bg-white disabled:bg-neutral-800 disabled:text-neutral-600 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {isLoading ? 'Thinking...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
