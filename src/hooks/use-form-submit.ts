import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/toast';

interface UseFormSubmitOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
}

export function useFormSubmit(options: UseFormSubmitOptions = {}) {
  const {
    successMessage = 'Salvo com sucesso',
    errorMessage = 'Erro ao salvar. Tente novamente.',
    onSuccess,
  } = options;

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<'saved' | 'error' | null>(null);

  const submit = useCallback(
    async (fn: () => Promise<Response>) => {
      setSaving(true);
      setFeedback(null);
      try {
        const res = await fn();
        if (res.ok) {
          setFeedback('saved');
          toast.success(successMessage);
          onSuccess?.();
          return true;
        }
        setFeedback('error');
        toast.error(errorMessage);
        return false;
      } catch {
        setFeedback('error');
        toast.error(errorMessage);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [successMessage, errorMessage, onSuccess],
  );

  return { submit, saving, feedback, setFeedback };
}
