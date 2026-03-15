'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { signupSchema, type SignupFormData } from '@/lib/validations/auth';
import { Eye, EyeOff, Mail, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
        data: { full_name: data.name },
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

    router.push('/dashboard');
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
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verifique seu email</CardTitle>
          <CardDescription>
            Enviamos um link de confirmação para <strong>{emailSent}</strong>. Clique no link para ativar sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            Não recebeu? Verifique a pasta de spam ou{' '}
            <Link href="/login" className="text-primary hover:underline">
              tente fazer login
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg sm:border">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl">Criar conta na Cleo</CardTitle>
        <CardDescription>Sua assistente financeira com IA</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignup}
          disabled={isGoogleLoading || isSubmitting}
        >
          <GoogleIcon className="mr-2 h-4 w-4" />
          {isGoogleLoading ? 'Conectando...' : 'Continuar com Google'}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou crie com email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
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

          <div className="space-y-2">
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

          <div className="space-y-2">
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
                <PasswordRequirement met={passwordChecks.lowercase} label="Letra minúscula" />
                <PasswordRequirement met={passwordChecks.uppercase} label="Letra maiúscula" />
                <PasswordRequirement met={passwordChecks.number} label="Um número" />
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
                  Política de Privacidade
                </Link>
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

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
