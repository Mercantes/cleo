import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from '@/components/chat/chat-input';

const defaultProps = {
  value: 'test',
  onChange: () => {},
  onSend: vi.fn(),
  attachments: [],
  onAttachmentsChange: () => {},
};

describe('ChatInput', () => {
  it('calls onSend on Enter key', () => {
    const onSend = vi.fn();
    render(<ChatInput {...defaultProps} onSend={onSend} />);

    const textarea = screen.getByPlaceholderText('Pergunte algo sobre suas finanças...');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(onSend).toHaveBeenCalled();
  });

  it('does not send on Shift+Enter', () => {
    const onSend = vi.fn();
    render(<ChatInput {...defaultProps} onSend={onSend} />);

    const textarea = screen.getByPlaceholderText('Pergunte algo sobre suas finanças...');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('disables input and button when disabled', () => {
    render(<ChatInput {...defaultProps} onSend={() => {}} disabled />);

    const textarea = screen.getByPlaceholderText('Aguarde a resposta...');
    const button = screen.getByLabelText('Enviar mensagem');

    expect(textarea).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('shows attach button', () => {
    render(<ChatInput {...defaultProps} />);
    expect(screen.getByLabelText('Anexar arquivo')).toBeInTheDocument();
  });

  it('allows send with only attachments (no text)', () => {
    const onSend = vi.fn();
    render(
      <ChatInput
        {...defaultProps}
        value=""
        onSend={onSend}
        attachments={[{ name: 'test.jpg', type: 'image/jpeg', size: 1000, data: 'abc', mediaType: 'image/jpeg' }]}
      />,
    );

    const button = screen.getByLabelText('Enviar mensagem');
    expect(button).not.toBeDisabled();
  });
});
