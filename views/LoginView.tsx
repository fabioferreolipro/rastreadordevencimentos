import React, { useState } from 'react';

interface LoginViewProps {
  onLogin: (identity: string, password: string) => Promise<void> | void;
  onRegister: (email: string, password: string, passwordConfirm: string) => Promise<void> | void;
  onForgotPassword: (email: string) => Promise<void> | void;
}

type AuthMode = 'login' | 'register' | 'forgot_password';

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onRegister, onForgotPassword }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await onLogin(identity.trim(), password);
      } else if (mode === 'register') {
        if (password !== passwordConfirm) {
          throw new Error('As senhas não coincidem.');
        }
        await onRegister(identity.trim(), password, passwordConfirm);
        setSuccess('Conta criada com sucesso! Agora você pode fazer login.');
        setMode('login');
        setPassword('');
        setPasswordConfirm('');
      } else if (mode === 'forgot_password') {
        await onForgotPassword(identity.trim());
        setSuccess('E-mail de recuperação enviado com sucesso!');
        setMode('login');
      }
    } catch (err: any) {
      setError(err?.message || 'Ocorreu um erro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (mode === 'login') return 'Bem-vindo de volta';
    if (mode === 'register') return 'Criar nova conta';
    return 'Recuperar senha';
  };

  const getSubtitle = () => {
    if (mode === 'login') return 'Acesse sua conta para gerenciar seus vencimentos';
    if (mode === 'register') return 'Cadastre-se para começar a controlar suas finanças';
    return 'Informe seu e-mail para receber as instruções';
  };

  const getButtonLabel = () => {
    if (isSubmitting) return mode === 'login' ? 'Entrando...' : mode === 'register' ? 'Criando conta...' : 'Enviando...';
    if (mode === 'login') return 'Entrar';
    if (mode === 'register') return 'Criar conta';
    return 'Enviar link';
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display antialiased min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-solid border-border-dark bg-background-dark/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <div className="size-8 text-primary">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z" fill="currentColor"></path>
                <path clipRule="evenodd" d="M39.998 35.764C39.9944 35.7463 39.9875 35.7155 39.9748 35.6706C39.9436 35.5601 39.8949 35.4259 39.8346 35.2825C39.8168 35.2403 39.7989 35.1993 39.7813 35.1602C38.5103 34.2887 35.9788 33.0607 33.7095 32.5189C30.9875 31.8691 27.6413 31.4783 24 31.4783C20.3587 31.4783 17.0125 31.8691 14.2905 32.5189C12.0012 33.0654 9.44505 34.3104 8.18538 35.1832C8.17384 35.2075 8.16216 35.233 8.15052 35.2592C8.09919 35.3751 8.05721 35.4886 8.02977 35.589C8.00356 35.6848 8.00039 35.7333 8.00004 35.7388C8.00004 35.739 8 35.7393 8.00004 35.7388C8.00004 35.7641 8.0104 36.0767 8.68485 36.6314C9.34546 37.1746 10.4222 37.7531 11.9291 38.2772C14.9242 39.319 19.1919 40 24 40C28.8081 40 33.0758 39.319 36.0709 38.2772C37.5778 37.7531 38.6545 37.1746 39.3151 36.6314C39.9006 36.1499 39.9857 35.8511 39.998 35.764ZM4.95178 32.7688L21.4543 6.30267C22.6288 4.4191 25.3712 4.41909 26.5457 6.30267L43.0534 32.777C43.0709 32.8052 43.0878 32.8338 43.104 32.8629L41.3563 33.8352C43.104 32.8629 43.1038 32.8626 43.104 32.8629L43.1051 32.865L43.1065 32.8675L43.1101 32.8739L43.1199 32.8918C43.1276 32.906 43.1377 32.9246 43.1497 32.9473C43.1738 32.9925 43.2062 33.0545 43.244 33.1299C43.319 33.2792 43.4196 33.489 43.5217 33.7317C43.6901 34.1321 44 34.9311 44 35.7391C44 37.4427 43.003 38.7775 41.8558 39.7209C40.6947 40.6757 39.1354 41.4464 37.385 42.0552C33.8654 43.2794 29.133 44 24 44C18.867 44 14.1346 43.2794 10.615 42.0552C8.86463 41.4464 7.30529 40.6757 6.14419 39.7209C4.99695 38.7775 3.99999 37.4427 3.99999 35.7391C3.99999 34.8725 4.29264 34.0922 4.49321 33.6393C4.60375 33.3898 4.71348 33.1804 4.79687 33.0311C4.83898 32.9556 4.87547 32.8935 4.9035 32.8471C4.91754 32.8238 4.92954 32.8043 4.93916 32.7889L4.94662 32.777L4.95178 32.7688ZM35.9868 29.004L24 9.77997L12.0131 29.004C12.4661 28.8609 12.9179 28.7342 13.3617 28.6282C16.4281 27.8961 20.0901 27.4783 24 27.4783C27.9099 27.4783 31.5719 27.8961 34.6383 28.6282C35.082 28.7342 35.5339 28.8609 35.9868 29.004Z" fill="currentColor" fillRule="evenodd"></path>
              </svg>
            </div>
            <h2 className="text-white text-xl font-extrabold tracking-tight uppercase">Rastreador de Vencimentos</h2>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full"></div>
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-[#343c65]/30 blur-[100px] rounded-full"></div>

        {/* Login Card */}
        <div className="relative w-full max-w-[460px] bg-card-dark/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 md:p-10">
          <div className="flex flex-col items-center mb-8">
            <div className="size-12 mb-4 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined !text-3xl">account_balance_wallet</span>
            </div>
            <h1 className="text-white text-2xl md:text-3xl font-extrabold tracking-tight text-center">{getTitle()}</h1>
            <p className="text-text-muted text-sm mt-2 text-center">{getSubtitle()}</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label className="text-white text-sm font-semibold px-1">E-mail</label>
              <div className="relative">
                <input 
                  type="email" 
                  required
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  className="w-full h-14 bg-[#1a1e32]/80 border border-border-dark rounded-xl px-4 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" 
                  placeholder="seu@email.com" 
                  autoComplete="email"
                />
              </div>
            </div>

            {mode !== 'forgot_password' && (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-white text-sm font-semibold">Senha</label>
                  {mode === 'login' && (
                    <button 
                      type="button"
                      onClick={() => setMode('forgot_password')}
                      className="text-primary text-xs font-semibold hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 bg-[#1a1e32]/80 border border-border-dark rounded-xl px-4 pr-12 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" 
                    placeholder="Digite sua senha" 
                    autoComplete={mode === 'register' ? "new-password" : "current-password"}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-text-muted hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="flex flex-col gap-2">
                <label className="text-white text-sm font-semibold px-1">Confirmar Senha</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="w-full h-14 bg-[#1a1e32]/80 border border-border-dark rounded-xl px-4 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" 
                    placeholder="Confirme sua senha" 
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-danger/15 border border-danger/40 text-danger text-sm font-semibold rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-success/15 border border-success/40 text-success text-sm font-semibold rounded-xl px-4 py-3">
                {success}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-14 bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-4 active:scale-[0.98]"
            >
              <span>{getButtonLabel()}</span>
              {!isSubmitting && <span className="material-symbols-outlined !text-lg">arrow_forward</span>}
            </button>

            {mode !== 'login' && (
              <button 
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-text-muted text-sm font-medium hover:text-white transition-colors mt-2"
              >
                Voltar para o login
              </button>
            )}
        </form>

          <div className="mt-8 text-center">
            {mode === 'login' && (
              <p className="text-text-muted text-sm font-medium">
                Ainda não tem uma conta?
                <button 
                  onClick={() => setMode('register')}
                  className="text-primary hover:underline font-bold ml-1 bg-transparent border-none cursor-pointer"
                >
                  Criar uma conta
                </button>
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
