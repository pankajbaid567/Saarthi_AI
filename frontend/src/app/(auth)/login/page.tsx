'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const [email, setEmail] = useState('student@example.com');
  const [password, setPassword] = useState('Password@123');

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await login({ email, password });
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch {
      toast.error('Unable to login. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required placeholder="Email" />
          <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required placeholder="Password" />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
          <Link href="/register" className="hover:text-foreground">
            Create account
          </Link>
          <Link href="/forgot-password" className="hover:text-foreground">
            Forgot password?
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
