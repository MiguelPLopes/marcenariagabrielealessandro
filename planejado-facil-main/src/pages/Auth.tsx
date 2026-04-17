import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import AuthLayout from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Mail, Lock, User, Github } from 'lucide-react';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Login realizado com sucesso!');
      // ❌ NÃO navega aqui
    } catch (error: any) {
      toast.error(error.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    debugger;
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      toast.success('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast.error('Erro ao entrar com Google');
    }
  };

  return (
    <AuthLayout 
      title="Bem-vindo de volta" 
      subtitle="Simplifique a gestão da sua marcenaria profissional"
    >
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 h-11 bg-muted/50 p-1">
          <TabsTrigger value="login" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Login</TabsTrigger>
          <TabsTrigger value="signup" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Cadastro</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-4 animate-in slide-in-from-left-2 duration-300">
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10 h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Button 
                  variant="link" 
                  className="px-0 font-normal h-auto text-xs text-primary hover:text-primary/80"
                  onClick={() => navigate('/forgot-password')}
                  type="button"
                >
                  Esqueci minha senha
                </Button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 font-semibold transition-all hover:scale-[1.01]" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup" className="space-y-4 animate-in slide-in-from-right-2 duration-300">
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Seu nome"
                  className="pl-10 h-11"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10 h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className="pl-10 h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </form>
        </TabsContent>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#121212] px-2 text-muted-foreground">Ou continue com</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Button 
            variant="outline" 
            className="h-11 border-white/10 hover:bg-white/5 bg-transparent"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Google
          </Button>
        </div>
      </Tabs>
    </AuthLayout>
  );
};

export default Auth;
