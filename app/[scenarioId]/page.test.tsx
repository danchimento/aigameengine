import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScenarioPage from './page';
import { useParams } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('The Room - End to End Test', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ scenarioId: 'the-room' });
  });

  it('completes the-room scenario by finding the key and escaping', async () => {
    const user = userEvent.setup();

    // Mock the opening text fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        opening: 'You wake up in a small room with no memory of how you got here. There is a door, a box, a light switch on the wall, and a chair.',
      }),
    } as Response);

    render(<ScenarioPage />);

    // Wait for opening text to load
    await waitFor(() => {
      expect(screen.getByText(/You wake up in a small room/i)).toBeInTheDocument();
    });

    // Step 1: Open the box
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'You open the box and find a key inside.',
      }),
    } as Response);

    const textarea = screen.getByPlaceholderText(/Enter your command/i);
    const submitButton = screen.getByRole('button', { name: /Submit/i });

    await user.type(textarea, 'open the box');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/You open the box and find a key inside/i)).toBeInTheDocument();
    });

    // Verify the API was called with correct parameters
    expect(mockFetch).toHaveBeenCalledWith('/api/game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'open the box' }],
        scenarioId: 'the-room',
      }),
    });

    // Step 2: Take the key
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'You take the key from the box.',
      }),
    } as Response);

    await user.clear(textarea);
    await user.type(textarea, 'take the key');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/You take the key from the box/i)).toBeInTheDocument();
    });

    // Step 3: Unlock the door
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'You use the key to unlock the door. The lock clicks open.',
      }),
    } as Response);

    await user.clear(textarea);
    await user.type(textarea, 'unlock the door');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/The lock clicks open/i)).toBeInTheDocument();
    });

    // Step 4: Open the door and win
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'You open the door and step through to freedom. Congratulations! You have escaped the room!',
      }),
    } as Response);

    await user.clear(textarea);
    await user.type(textarea, 'open the door');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Congratulations! You have escaped the room!/i)).toBeInTheDocument();
    });

    // Verify we made the correct number of API calls (1 opening + 4 game actions)
    expect(mockFetch).toHaveBeenCalledTimes(5);
  });

  it('handles the conversation history correctly across multiple turns', async () => {
    const user = userEvent.setup();

    // Mock the opening text fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        opening: 'You wake up in a small room with no memory of how you got here.',
      }),
    } as Response);

    render(<ScenarioPage />);

    await waitFor(() => {
      expect(screen.getByText(/You wake up in a small room/i)).toBeInTheDocument();
    });

    // First action
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'You examine the box closely.',
      }),
    } as Response);

    const textarea = screen.getByPlaceholderText(/Enter your command/i);
    const submitButton = screen.getByRole('button', { name: /Submit/i });

    await user.type(textarea, 'examine box');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/You examine the box closely/i)).toBeInTheDocument();
    });

    // Second action - verify conversation history is passed
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'You open it.',
      }),
    } as Response);

    await user.clear(textarea);
    await user.type(textarea, 'open it');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/You open it/i)).toBeInTheDocument();
    });

    // Verify the second call included the conversation history
    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const requestBody = JSON.parse(lastCall[1]?.body as string);

    expect(requestBody.messages).toHaveLength(3); // user1, assistant1, user2
    expect(requestBody.messages[0]).toEqual({ role: 'user', content: 'examine box' });
    expect(requestBody.messages[1]).toEqual({ role: 'assistant', content: 'You examine the box closely.' });
    expect(requestBody.messages[2]).toEqual({ role: 'user', content: 'open it' });
  });

  it('displays error when scenario cannot be loaded', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        error: 'Scenario not found',
      }),
    } as Response);

    render(<ScenarioPage />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Scenario not found/i)).toBeInTheDocument();
    });
  });

  it('disables input while processing', async () => {
    const user = userEvent.setup();

    // Mock the opening text fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        opening: 'You wake up in a small room.',
      }),
    } as Response);

    render(<ScenarioPage />);

    await waitFor(() => {
      expect(screen.getByText(/You wake up in a small room/i)).toBeInTheDocument();
    });

    // Mock a slow API response
    let resolvePromise: (value: any) => void;
    const slowPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValueOnce(slowPromise as any);

    const textarea = screen.getByPlaceholderText(/Enter your command/i);
    const submitButton = screen.getByRole('button', { name: /Submit/i });

    await user.type(textarea, 'test command');
    await user.click(submitButton);

    // While processing, button and textarea should be disabled
    await waitFor(() => {
      expect(submitButton).toHaveTextContent('Processing...');
      expect(submitButton).toBeDisabled();
      expect(textarea).toBeDisabled();
    });

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: async () => ({ message: 'Response' }),
    });

    // After processing, controls should be enabled again and input cleared
    await waitFor(() => {
      expect(submitButton).toHaveTextContent('Submit');
      expect(textarea).not.toBeDisabled();
      expect(textarea).toHaveValue('');
    });

    // Button should still be disabled because input is empty
    expect(submitButton).toBeDisabled();
  });
});
