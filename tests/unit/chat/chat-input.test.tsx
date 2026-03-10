import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from '@/components/chat/chat-input';

describe('ChatInput', () => {
  it('calls onSend on Enter key', () => {
    const onSend = vi.fn();
    render(<ChatInput value="test" onChange={() => {}} onSend={onSend} />);

    const textarea = screen.getByPlaceholderText('Pergunte algo sobre suas finanças...');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(onSend).toHaveBeenCalled();
  });

  it('does not send on Shift+Enter', () => {
    const onSend = vi.fn();
    render(<ChatInput value="test" onChange={() => {}} onSend={onSend} />);

    const textarea = screen.getByPlaceholderText('Pergunte algo sobre suas finanças...');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('disables input and button when disabled', () => {
    render(<ChatInput value="test" onChange={() => {}} onSend={() => {}} disabled />);

    const textarea = screen.getByPlaceholderText('Pergunte algo sobre suas finanças...');
    const button = screen.getByLabelText('Enviar mensagem');

    expect(textarea).toBeDisabled();
    expect(button).toBeDisabled();
  });
});
