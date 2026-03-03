import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { AuthLayout } from '@/layouts/AuthLayout';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName,
            lastName,
            username,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (data.user) {
        // Create profile in profiles table
        await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            first_name: firstName,
            last_name: lastName,
            username: username || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .catch(() => {
            // Profile creation failure should not block signup
          });
      }

      setSuccess(data.user?.identities?.length === 0 ? t('auth.checkEmailConfirm') : 'Account created! Redirecting...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="border-none bg-transparent shadow-none p-0">
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-xl font-display font-semibold tracking-tight">{t('auth.createAccount')}</CardTitle>
          <CardDescription>{t('auth.createAccountDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Input
                id="firstName"
                type="text"
                label={t('auth.firstName')}
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                id="lastName"
                type="text"
                label={t('auth.lastName')}
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                id="username"
                type="text"
                label={t('auth.username')}
                placeholder="yourname"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                label={t('auth.email')}
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                label={t('auth.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-xs text-[var(--color-status-danger)] bg-[var(--color-status-danger-bg)] border border-[var(--color-status-danger)]/30 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs text-[var(--color-status-success)] bg-[var(--color-status-success-bg)] border border-[var(--color-status-success)]/30 rounded-md px-3 py-2">
                {success}
              </p>
            )}
            <Button type="submit" className="w-full mt-6" size="lg" disabled={loading}>
              {t('auth.createAccountBtn')}
            </Button>
          </form>
          
          {/* Social sign-up can be added later if needed */}
        </CardContent>
        <CardFooter className="flex justify-center border-t border-[var(--color-border-subtle)] pt-5">
          <div className="text-sm text-[var(--color-text-muted)]">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" className="font-medium text-[var(--color-accent-primary)] hover:underline underline-offset-2">
              {t('auth.signInLink')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
