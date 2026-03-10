'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
      })
      .finally(() => setLoading(false));
  }, [router]);

  const stepNames = ['connect-bank', 'review-categories', 'set-goals'];

  const goToNextStep = async () => {
    const newCompleted = [...completedSteps, currentStep];
    setCompletedSteps(newCompleted);

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
  };

  const skipStep = async () => {
    const newSkipped = [...skippedSteps, stepNames[currentStep]];
    setSkippedSteps(newSkipped);

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
  };

  const handleGoalsComplete = async (goals: { monthlySavingsTarget?: number; retirementAgeTarget?: number }) => {
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
        {currentStep === 0 && (
          <ConnectBankStep onComplete={goToNextStep} onSkip={skipStep} />
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
