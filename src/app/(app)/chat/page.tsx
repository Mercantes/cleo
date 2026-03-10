import { MessageSquare } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default function ChatPage() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="Chat com IA em breve"
      description="Converse com a Cleo para tirar dúvidas sobre suas finanças, receber dicas personalizadas e planejar seus objetivos."
    />
  );
}
