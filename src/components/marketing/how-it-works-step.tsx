'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface HowItWorksStepProps {
  children: React.ReactNode;
  index: number;
}

export function HowItWorksStep({ children, index }: HowItWorksStepProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isReversed = index % 2 === 1;

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        visible
          ? 'translate-x-0 translate-y-0 opacity-100'
          : isReversed
            ? 'translate-x-8 translate-y-4 opacity-0'
            : '-translate-x-8 translate-y-4 opacity-0',
      )}
    >
      {children}
    </div>
  );
}
