'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function ScenarioPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const scenarioId = params.scenarioId as string;
  const tone = searchParams.get('t') || 'sarcastic';
  const model = searchParams.get('m') || 'sonnet';

  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [lastUserInput, setLastUserInput] = useState('');
  const [title, setTitle] = useState('');
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
    setLastUserInput(input);
    setInput('');

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
          tone,
          model,
        }),
      });

      const data = await response.json();

      if (data.message) {
        // Add assistant message to conversation history
        const assistantMessage: Message = { role: 'assistant', content: data.message };
        setConversationHistory([...updatedHistory, assistantMessage]);

        // Display only the most recent output with fade animation
        setOutput(data.message);
      } else {
        setOutput('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      setOutput('Error: Failed to communicate with the game engine');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      {/* Output Area - fills available space, grows if needed */}
      <div className="flex-1 flex flex-col p-4 md:p-6 pb-0">
        <div className="max-w-[900px] mx-auto w-full flex-1 flex flex-col min-h-0">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 md:p-6 flex-1 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="max-w-prose w-full"
                >
                  <div className="text-neutral-500 text-base font-mono text-center">
                    ...
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="max-w-prose w-full"
                >
                  {lastUserInput && (
                    <div className="text-neutral-500 text-sm font-mono mb-4">
                      &gt; {lastUserInput}
                    </div>
                  )}
                  <div className="text-neutral-100 text-base leading-relaxed whitespace-pre-wrap font-mono">
                    {output || 'Loading...'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-neutral-950 border-t border-neutral-800 p-3 md:p-4">
        <form onSubmit={handleSubmit} className="max-w-[900px] mx-auto">
          <div className="relative flex items-end bg-neutral-900 border border-neutral-800 rounded-lg focus-within:border-neutral-700 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-resize textarea
                e.target.style.height = 'auto';
                const lineHeight = 24;
                const maxHeight = lineHeight * 4;
                e.target.style.height = Math.min(e.target.scrollHeight, maxHeight) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="What do you want to do?"
              className="flex-1 py-3 pl-4 pr-2 bg-transparent resize-none focus:outline-none text-neutral-100 placeholder-neutral-500 font-mono text-base leading-6 max-h-24 overflow-y-auto align-middle"
              rows={1}
              disabled={isLoading}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="m-2 bg-neutral-100 text-neutral-900 p-2 rounded-md font-medium hover:bg-white disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors duration-150 flex-shrink-0"
              aria-label={isLoading ? 'Thinking...' : 'Continue'}
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
