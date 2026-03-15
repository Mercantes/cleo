'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { signupSchema, type SignupFormData } from '@/lib/validations/auth';
import { Eye, EyeOff, Mail, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GoogleIcon } from '@/components/ui/google-icon';

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function DashboardPreview() {
  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-muted-foreground">
        Veja todas as suas finanças em um só lugar
      </p>

      {/* Ritmo de Gastos card */}
      <div className="rounded-lg border bg-card/60 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ritmo de Gastos</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold">R$ 1.648,50</span>
          <span className="text-sm font-medium text-green-500">abaixo</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-flex items-center gap-0.5 rounded bg-green-500/10 px-1.5 py-0.5 text-xs font-medium text-green-500">
            <TrendingDown className="h-3 w-3" /> -26,2%
          </span>
          <span className="text-xs text-muted-foreground">vs mês passado no dia 15</span>
        </div>
        {/* Chart mockup */}
        <div className="mt-4 h-24 w-full">
          <svg viewBox="0 0 400 100" className="h-full w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(34,197,94)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(34,197,94)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Last month line (gray) */}
            <path d="M0,80 Q50,75 100,65 T200,45 T300,30 T400,20" fill="none" stroke="rgb(100,116,139)" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.5" />
            {/* This month line (green) */}
            <path d="M0,85 Q50,82 100,75 T200,60 T300,55 T400,50" fill="none" stroke="rgb(34,197,94)" strokeWidth="2" />
            {/* Area fill */}
            <path d="M0,85 Q50,82 100,75 T200,60 T300,55 T400,50 L400,100 L0,100 Z" fill="url(#chartGrad)" />
            {/* Dot at end */}
            <circle cx="400" cy="50" r="4" fill="rgb(34,197,94)" />
          </svg>
        </div>
        <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-0.5 w-3 rounded bg-green-500" /> Este mês</span>
          <span className="flex items-center gap-1"><span className="h-0.5 w-3 rounded bg-slate-500" style={{ borderTop: '1px dashed' }} /> Mês passado</span>
        </div>
      </div>

      {/* Patrimônio Líquido card */}
      <div className="rounded-lg border bg-card/60 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Patrimônio Líquido</p>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="text-2xl font-bold">R$ 125.847,32</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-flex items-center gap-0.5 rounded bg-green-500/10 px-1.5 py-0.5 text-xs font-medium text-green-500">
            <TrendingUp className="h-3 w-3" /> +12,5%
          </span>
          <span className="text-xs text-muted-foreground">este mês</span>
        </div>
        {/* Mini area chart */}
        <div className="mt-4 h-16 w-full">
          <svg viewBox="0 0 400 60" className="h-full w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(34,197,94)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="rgb(34,197,94)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,55 Q40,52 80,48 T160,40 T240,30 T320,18 T400,10" fill="none" stroke="rgb(34,197,94)" strokeWidth="2" />
            <path d="M0,55 Q40,52 80,48 T160,40 T240,30 T320,18 T400,10 L400,60 L0,60 Z" fill="url(#netGrad)" />
          </svg>
        </div>
      </div>

      {/* Categorias card */}
      <div className="rounded-lg border bg-card/60 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Principais Categorias</p>
        <div className="mt-3 space-y-3">
          <CategoryBar icon="🏠" name="Moradia" amount="R$ 1.470" pct={78} change="+2%" changeColor="text-green-500" prev="R$ 1.500,00" />
          <CategoryBar icon="🍔" name="Alimentação" amount="R$ 1.050" pct={56} change="-12%" changeColor="text-green-500" prev="R$ 1.200,00" />
          <CategoryBar icon="🚗" name="Transporte" amount="R$ 630" pct={95} barColor="bg-red-500" change="+14%" changeColor="text-red-400" prev="R$ 550,00" />
        </div>
      </div>
    </div>
  );
}

function CategoryBar({ icon, name, amount, pct, barColor, change, changeColor, prev }: {
  icon: string; name: string; amount: string; pct: number;
  barColor?: string; change: string; changeColor: string; prev: string;
}) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium">
        {icon} {name}
      </span>
      <span className="shrink-0 font-medium">{amount}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted/50">
        <div className={`h-full rounded-full ${barColor || 'bg-green-500'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`shrink-0 text-[10px] font-medium ${changeColor}`}>{change}</span>
      <span className="hidden shrink-0 text-muted-foreground xl:inline">{prev}</span>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { acceptTerms: undefined as unknown as true },
  });

  async function onSubmit(data: SignupFormData) {
    setError(null);
    const supabase = createClient();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          cpf: data.cpf.replace(/\D/g, ''),
          analytics_consent: analyticsConsent,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('Este email já está cadastrado. Tente fazer login.');
      } else {
        setError(signUpError.message);
      }
      return;
    }

    if (signUpData.user && !signUpData.session) {
      setEmailSent(data.email);
      return;
    }

    router.push('/onboarding');
    router.refresh();
  }

  async function handleGoogleSignup() {
    setIsGoogleLoading(true);
    const supabase = createClient();

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (oauthError) {
      setError('Erro ao conectar com Google. Tente novamente.');
      setIsGoogleLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="mx-auto max-w-md rounded-xl border bg-card p-8 shadow-lg">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Verifique seu email</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enviamos um link de confirmação para <strong>{emailSent}</strong>. Clique no link para ativar sua conta.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Não recebeu? Verifique a pasta de spam ou{' '}
            <Link href="/login" className="text-primary hover:underline">
              tente fazer login
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,520px)_1fr]">
      {/* Left side - Form */}
      <div className="rounded-xl border bg-card p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center">
          <Image src="/logo.png" alt="Cleo" width={40} height={40} className="mb-4 rounded-lg" />
          <h1 className="text-2xl font-bold">Crie sua conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre-se para ver seu dinheiro com clareza com a Cleo
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignup}
          disabled={isGoogleLoading || isSubmitting}
        >
          <GoogleIcon className="mr-2 h-4 w-4" />
          {isGoogleLoading ? 'Conectando...' : 'Continuar com Google'}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-3 text-muted-foreground">ou</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-describedby={errors.email ? 'signup-email-error' : undefined}
              aria-invalid={!!errors.email}
              {...register('email')}
              disabled={isSubmitting}
            />
            {errors.email && <p id="signup-email-error" role="alert" className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cpf" className="text-sm font-medium">
              CPF
            </label>
            <Input
              id="cpf"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              aria-describedby={errors.cpf ? 'cpf-error' : 'cpf-hint'}
              aria-invalid={!!errors.cpf}
              {...register('cpf', {
                onChange: (e) => {
                  const formatted = formatCPF(e.target.value);
                  setValue('cpf', formatted, { shouldValidate: false });
                },
              })}
              disabled={isSubmitting}
            />
            <p id="cpf-hint" className="text-xs text-muted-foreground">
              Digite seu CPF com ou sem formatação (ex: 12345678900 ou 123.456.789-00)
            </p>
            {errors.cpf && <p id="cpf-error" role="alert" className="text-sm text-destructive">{errors.cpf.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Senha
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                aria-describedby="password-requirements"
                aria-invalid={!!errors.password}
                {...register('password')}
                disabled={isSubmitting}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p id="password-requirements" className="text-xs text-muted-foreground">
              8-72 caracteres com pelo menos uma letra maiúscula, uma minúscula e um número
            </p>
            {errors.password && (
              <p role="alert" className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded-full border-input accent-primary"
                  {...register('acceptTerms')}
                  disabled={isSubmitting}
                />
              </div>
              <span className="text-xs text-muted-foreground leading-relaxed">
                Li e concordo com os{' '}
                <Link href="/terms" className="text-primary hover:underline" target="_blank">
                  Termos de Serviço
                </Link>{' '}
                e a{' '}
                <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                  Política de Privacidade
                </Link>
                {' '}*
              </span>
            </label>
            {errors.acceptTerms && (
              <p role="alert" className="text-sm text-destructive">{errors.acceptTerms.message}</p>
            )}

            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={analyticsConsent}
                onClick={() => setAnalyticsConsent(!analyticsConsent)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  analyticsConsent ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg transition-transform ${
                    analyticsConsent ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs text-muted-foreground">
                Concordo com o uso de analytics para ajudar a melhorar a Cleo
              </span>
            </label>
          </div>

          {error && (
            <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Criando conta...' : 'Criar conta'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      </div>

      {/* Right side - Dashboard Preview */}
      <div className="hidden lg:block">
        <DashboardPreview />
      </div>
    </div>
  );
}
