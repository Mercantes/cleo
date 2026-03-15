'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { signupSchema, type SignupFormData } from '@/lib/validations/auth';
import { Eye, EyeOff, Mail, Check, X, TrendingUp, PiggyBank, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GoogleIcon } from '@/components/ui/google-icon';

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {met ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <X className="h-3 w-3 text-muted-foreground" />
      )}
      <span className={met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
        {label}
      </span>
    </div>
  );
}

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { acceptTerms: undefined as unknown as true },
  });

  const passwordValue = watch('password', '');

  const passwordChecks = {
    length: passwordValue.length >= 8,
    lowercase: /[a-z]/.test(passwordValue),
    uppercase: /[A-Z]/.test(passwordValue),
    number: /[0-9]/.test(passwordValue),
  };

  async function onSubmit(data: SignupFormData) {
    setError(null);
    const supabase = createClient();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.name,
          cpf: data.cpf.replace(/\D/g, ''),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('Este email ja esta cadastrado. Tente fazer login.');
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
            Enviamos um link de confirmacao para <strong>{emailSent}</strong>. Clique no link para ativar sua conta.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Nao recebeu? Verifique a pasta de spam ou{' '}
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
    <div className="grid gap-0 lg:grid-cols-2">
      {/* Left side - Form */}
      <div className="mx-auto w-full max-w-md py-4 lg:py-0">
        <div className="rounded-xl border bg-card p-6 shadow-lg sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">Criar conta na Cleo</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sua assistente financeira com IA</p>
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

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou crie com email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                Nome completo
              </label>
              <Input
                id="name"
                autoComplete="name"
                placeholder="Como devemos te chamar?"
                aria-describedby={errors.name ? 'name-error' : undefined}
                aria-invalid={!!errors.name}
                {...register('name')}
                disabled={isSubmitting}
              />
              {errors.name && <p id="name-error" role="alert" className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
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
                Necessario para identificacao e seguranca da sua conta
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
                  placeholder="Crie uma senha segura"
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
              {passwordValue.length > 0 && (
                <div id="password-requirements" className="grid grid-cols-2 gap-1 pt-1">
                  <PasswordRequirement met={passwordChecks.length} label="8+ caracteres" />
                  <PasswordRequirement met={passwordChecks.lowercase} label="Letra minuscula" />
                  <PasswordRequirement met={passwordChecks.uppercase} label="Letra maiuscula" />
                  <PasswordRequirement met={passwordChecks.number} label="Um numero" />
                </div>
              )}
              {errors.password && !passwordValue && (
                <p role="alert" className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-input accent-primary"
                  {...register('acceptTerms')}
                  disabled={isSubmitting}
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Li e aceito os{' '}
                  <Link href="/terms" className="text-primary hover:underline" target="_blank">
                    Termos de Uso
                  </Link>{' '}
                  e a{' '}
                  <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                    Politica de Privacidade
                  </Link>
                  {' '}*
                </span>
              </label>
              {errors.acceptTerms && (
                <p role="alert" className="text-sm text-destructive">{errors.acceptTerms.message}</p>
              )}
            </div>

            {error && (
              <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Ja tem conta?{' '}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Marketing */}
      <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:rounded-xl lg:bg-gradient-to-br lg:from-primary/5 lg:to-primary/15 lg:p-10">
        <div className="max-w-sm space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Controle suas financas com inteligencia</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A Cleo usa IA para te ajudar a entender seus gastos e economizar mais.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 rounded-lg border bg-card/80 p-4 backdrop-blur-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Visao completa</p>
                <p className="text-xs text-muted-foreground">
                  Todas as suas contas e cartoes em um so lugar, sincronizados automaticamente.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-lg border bg-card/80 p-4 backdrop-blur-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
                <PiggyBank className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Metas de economia</p>
                <p className="text-xs text-muted-foreground">
                  Defina metas e acompanhe seu progresso com insights personalizados.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-lg border bg-card/80 p-4 backdrop-blur-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950">
                <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Seguro e privado</p>
                <p className="text-xs text-muted-foreground">
                  Seus dados sao criptografados e nunca compartilhados com terceiros.
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Mais de 1.000 usuarios ja confiam na Cleo
          </p>
        </div>
      </div>
    </div>
  );
}
