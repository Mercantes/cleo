'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { StepIndicator } from '@/components/onboarding/step-indicator';
import { ConnectBankStep } from '@/components/onboarding/steps/connect-bank-step';
import { ReviewCategoriesStep } from '@/components/onboarding/steps/review-categories-step';
import { SetGoalsStep } from '@/components/onboarding/steps/set-goals-step';
import { OnboardingComplete } from '@/components/onboarding/onboarding-complete';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [skippedSteps, setSkippedSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [userName, setUserName] = useState<string | undefined>();

  useEffect(() => {
    fetch('/api/onboarding')
      .then((r) => r.json())
      .then((data) => {
        if (data.completed) {
          router.push('/dashboard');
          return;
        }
        setCurrentStep(data.step || 0);
        setSkippedSteps(data.skippedSteps || []);
        if (data.userName) setUserName(data.userName);
      })
      .catch(() => {
        // On error, start from step 0
      })
      .finally(() => setLoading(false));
  }, [router]);

  const stepNames = ['connect-bank', 'review-categories', 'set-goals'];

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToNextStep = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const newCompleted = [...completedSteps, currentStep];
    setCompletedSteps(newCompleted);

    try {
      if (currentStep >= 2) {
        setIsComplete(true);
        await fetch('/api/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        return;
      }

      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: nextStep }),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const skipStep = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const newSkipped = [...skippedSteps, stepNames[currentStep]];
    setSkippedSteps(newSkipped);

    try {
      if (currentStep >= 2) {
        setIsComplete(true);
        await fetch('/api/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skippedSteps: newSkipped }),
        });
        return;
      }

      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: nextStep, skippedSteps: newSkipped }),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoalsComplete = async (goals: { monthlySavingsTarget?: number; retirementAgeTarget?: number }) => {
    if (isSaving) return;
    setIsSaving(true);
    setIsComplete(true);
    setCompletedSteps([...completedSteps, currentStep]);
    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goals),
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (isComplete) {
    return <OnboardingComplete />;
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 py-8">
      <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />

      <div className="rounded-xl border p-6 sm:p-8">
        {currentStep > 0 && (
          <button
            onClick={goToPreviousStep}
            aria-label="Voltar para etapa anterior"
            className="mb-4 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Voltar
          </button>
        )}
        {currentStep === 0 && (
          <ConnectBankStep onComplete={goToNextStep} onSkip={skipStep} userName={userName} />
        )}
        {currentStep === 1 && (
          <ReviewCategoriesStep onComplete={goToNextStep} onSkip={skipStep} />
        )}
        {currentStep === 2 && (
          <SetGoalsStep onComplete={handleGoalsComplete} onSkip={skipStep} />
        )}
      </div>
    </div>
  );
}
