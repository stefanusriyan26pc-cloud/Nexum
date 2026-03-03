import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { AuthLayout } from '@/layouts/AuthLayout';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (data.user) {
        const firstName = data.user.user_metadata?.firstName || data.user.email?.split('@')[0] || 'User';
        const lastName = data.user.user_metadata?.lastName || '';

        // Sync profile with Supabase
        await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            first_name: firstName,
            last_name: lastName,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' })
          .catch(() => {
            // Profile sync failure should not block login
          });
      }

      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError('Google sign in is not configured yet.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/' },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign in failed');
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="border-none bg-transparent shadow-none p-0">
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-xl font-display font-semibold tracking-tight">{t('auth.welcomeBack')}</CardTitle>
          <CardDescription>{t('auth.signInDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
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
              <div className="flex items-center justify-between">
                <Input
                  id="password"
                  type="password"
                  label={t('auth.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-high)] transition-colors">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
            </div>
            {error && (
              <p className="text-xs text-[var(--color-status-danger)] bg-[var(--color-status-danger-bg)] border border-[var(--color-status-danger)]/30 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full mt-6" size="lg" disabled={loading}>
              {t('auth.signIn')}
            </Button>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[var(--color-border-subtle)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[var(--color-bg-secondary)] px-2 text-[var(--color-text-muted)]">
                {t('auth.orContinueWith')}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <Button variant="outline" type="button" onClick={handleGoogleSignIn} disabled={loading}>
              Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-[var(--color-border-subtle)] pt-5">
          <div className="text-sm text-[var(--color-text-muted)]">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-medium text-[var(--color-accent-primary)] hover:underline underline-offset-2">
              {t('auth.signUp')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
