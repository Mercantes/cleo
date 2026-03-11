import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ChatInterface } from '@/components/chat/chat-interface';

// jsdom doesn't have scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ChatInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows suggestions when no history', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ messages: [] }),
    });

    render(<ChatInterface />);

    await waitFor(() => {
      expect(screen.getByText(/Sou a Cleo/)).toBeInTheDocument();
      expect(screen.getByText('Quanto gastei esse mês?')).toBeInTheDocument();
    });
  });

  it('renders messages from history', async () => {
    mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          messages: [
            { id: '1', role: 'user', content: 'Oi Cleo', created_at: '2026-03-10T10:00:00Z' },
            { id: '2', role: 'assistant', content: 'Olá! Como posso ajudar?', created_at: '2026-03-10T10:01:00Z' },
          ],
        }),
    });

    render(<ChatInterface />);

    await waitFor(() => {
      expect(screen.getByText('Oi Cleo')).toBeInTheDocument();
      expect(screen.getByText('Olá! Como posso ajudar?')).toBeInTheDocument();
    });
  });

  it('shows send button', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ messages: [] }),
    });

    render(<ChatInterface />);

    await waitFor(() => {
      expect(screen.getByLabelText('Enviar mensagem')).toBeInTheDocument();
    });
  });
});
