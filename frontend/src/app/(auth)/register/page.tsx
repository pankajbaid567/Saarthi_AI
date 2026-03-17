'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await register({ name, email, password });
      toast.success('Registered successfully');
      router.push('/dashboard');
    } catch {
      toast.error('Unable to register.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Name" />
          <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required placeholder="Email" />
          <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required placeholder="Password" />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create account'}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
