'use client';

import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, User, ArrowRight, Shield } from 'lucide-react';

const AdminPanel = dynamic(
  () => import('@/components/ecommerce/AdminPanel').then((mod) => mod.AdminPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    ),
  }
);

const TOKEN_KEY = 'diaz-admin-token';

function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión');
        return;
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      onLogin(data.token);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
            <Shield className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Díaz Premium</h1>
          <p className="text-amber-400 font-semibold tracking-wider text-sm uppercase mt-1">Panel de Administración</p>
        </div>

        {/* Login Card */}
        <Card className="border-gray-700 bg-gray-800/50 backdrop-blur">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-white text-center">Iniciar Sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300">Usuario</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-amber-500 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-amber-500 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Iniciar Sesión
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-700">
              <a
                href="/"
                className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-amber-400 transition-colors"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Volver a la Tienda
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminLayout({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Shield className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Díaz Premium</h1>
              <p className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Ver Tienda
              <ArrowRight className="h-4 w-4" />
            </a>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-red-400 hover:bg-gray-800"
              onClick={onLogout}
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Admin Panel Content */}
      <AdminPanel />
    </div>
  );
}

function AdminPageContent() {
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (!savedToken) {
        setChecking(false);
        return;
      }

      try {
        const res = await fetch(`/api/admin/auth/verify?token=${encodeURIComponent(savedToken)}`);
        const data = await res.json();
        if (data.valid) {
          setToken(savedToken);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <AdminLayout onLogout={handleLogout} />;
}

export default function AdminPage() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AdminPageContent />
    </QueryClientProvider>
  );
}
