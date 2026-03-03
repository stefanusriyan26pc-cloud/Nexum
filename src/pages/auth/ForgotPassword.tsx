import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const { t } = useTranslation();
  return (
    <AuthLayout>
      <Card className="border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] shadow-[var(--shadow-lg)]">
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-xl font-display font-semibold tracking-tight">{t('auth.forgotPasswordTitle')}</CardTitle>
          <CardDescription>{t('auth.forgotPasswordDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Input id="email" type="email" label={t('auth.email')} placeholder="m@example.com" required />
            </div>
            <Button type="submit" className="w-full mt-6" size="lg">
              {t('auth.sendResetLink')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-[var(--color-border-subtle)] pt-5">
          <Link to="/login" className="flex items-center text-sm font-medium text-[var(--color-accent-primary)] hover:underline">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {t('auth.backToSignIn')}
          </Link>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
