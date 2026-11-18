'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  Building2,
  Briefcase,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  loginWithCredentials,
  registerAccount,
  resetPassword,
  loginAsDemo,
} from '@/lib/leadflow-auth';
import { cn } from '@/lib/utils';

interface AuthScreenProps {
  mode: 'login' | 'cadastro';
  onAuthenticated?: () => void;
}

const ROLE_OPTIONS = [
  'Diretor Comercial',
  'Gerente de Vendas',
  'Executivo de Contas',
  'Especialista SDR',
  'Founder / CEO',
];

function getPasswordStrength(pw: string): {
  score: number;
  label: string;
} {
  if (!pw) return { score: 0, label: 'Mínimo 6 caracteres' };
  let score = 1;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw) && pw.length >= 10) score += 1;
  const labels = [
    'Mínimo 6 caracteres',
    'Fraca',
    'Razoável',
    'Forte',
    'Excelente',
  ];
  return { score, label: labels[score] ?? 'Forte' };
}

export function AuthScreen({ mode, onAuthenticated }: AuthScreenProps) {
  const router = useRouter();
  const isLogin = mode === 'login';

  // Campos de Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Recuperação de senha inline
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);

  // Campos de Cadastro
  const [regName, setRegName] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regRole, setRegRole] = useState('Diretor Comercial');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [showRegPw, setShowRegPw] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const strength = getPasswordStrength(regPassword);

  const completeAuth = () => {
    if (onAuthenticated) {
      onAuthenticated();
    } else {
      router.push('/');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setSubmitting(true);

    try {
      const res = await loginWithCredentials(loginEmail, loginPassword);
      if (!res.ok) {
        setError(res.error);
        setSubmitting(false);
        return;
      }
      completeAuth();
    } catch {
      setError('Falha ao conectar ao serviço de autenticação.');
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (regPassword !== regConfirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }
    if (!acceptTerms) {
      setError('Aceite os Termos de Uso para concluir seu cadastro.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await registerAccount({
        name: regName,
        company: regCompany,
        role: regRole,
        email: regEmail,
        password: regPassword,
      });

      if (!res.ok) {
        setError(res.error);
        setSubmitting(false);
        return;
      }

      if (res.needsConfirmation) {
        setInfoMessage(
          'Cadastro criado! Confirme seu e-mail pelo link enviado para liberar o acesso.'
        );
        setSubmitting(false);
        return;
      }

      completeAuth();
    } catch {
      setError('Falha ao criar conta. Tente novamente.');
      setSubmitting(false);
    }
  };

  const handleDemoAccess = () => {
    setError('');
    setInfoMessage('');
    loginAsDemo();
    completeAuth();
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await resetPassword(recoveryEmail);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setRecoverySent(true);
  };

  return (
    <div className="relative min-h-screen bg-[#0a0e1a] text-slate-100 flex flex-col">
      {/* Iluminação atmosférica Glacier */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-36 -left-24 h-[520px] w-[520px] rounded-full bg-[#7dd3fc]/[0.09] blur-[140px]" />
        <div className="absolute top-1/4 -right-28 h-[480px] w-[480px] rounded-full bg-[#c8a0f0]/[0.08] blur-[140px]" />
        <div className="absolute -bottom-44 left-1/3 h-[420px] w-[420px] rounded-full bg-[#7dd3fc]/[0.05] blur-[130px]" />
      </div>

      {/* Header minimalista sem botões redundantes */}
      <header className="relative z-10 border-b border-[#7dd3fc]/10 bg-[#0a0e1a]/50 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-3 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#7dd3fc]/30 bg-[#7dd3fc]/10 text-[#7dd3fc] transition-all duration-200 group-hover:border-[#7dd3fc]/60 group-hover:shadow-[0_0_24px_rgba(125,211,252,0.2)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-slate-50">
              LeadFlow
            </span>
          </Link>
        </div>
      </header>

      {/* Área Central Responsiva */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid w-full max-w-5xl grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Coluna Editorial (Desktop) */}
          <section className="hidden lg:flex lg:col-span-5 flex-col justify-between space-y-8 pr-2">
            <div className="space-y-4">
              <p className="text-xs font-medium tracking-wide text-[#7dd3fc]">
                Plataforma Comercial B2B
              </p>
              <h1 className="font-display text-3xl xl:text-4xl font-semibold tracking-tight text-slate-50 text-balance leading-tight">
                {isLogin
                  ? 'Retome o ritmo do seu pipeline comercial.'
                  : 'Estruture seu funil de vendas em minutos.'}
              </h1>
              <p className="text-sm leading-relaxed text-slate-300">
                Centralize leads, negociações em andamento e follow-ups da sua
                equipe em uma interface translúcida pensada para decisões
                rápidas.
              </p>
            </div>

            <div className="divide-y divide-[#7dd3fc]/10 border-t border-b border-[#7dd3fc]/10">
              <div className="py-4">
                <p className="font-display text-sm font-semibold text-slate-100">
                  01. Pipeline Kanban em tempo real
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Movimente negócios entre etapas e acompanhe a previsão
                  ponderada em R$.
                </p>
              </div>
              <div className="py-4">
                <p className="font-display text-sm font-semibold text-slate-100">
                  02. Base segmentada com exportação CSV
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Filtre oportunidades por origem, prioridade e responsável sem
                  planilhas paralelas.
                </p>
              </div>
              <div className="py-4">
                <p className="font-display text-sm font-semibold text-slate-100">
                  03. Agenda de follow-ups integrada
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Registre ligações, reuniões e propostas diretamente na ficha
                  de cada cliente.
                </p>
              </div>
            </div>
          </section>

          {/* Coluna do Card Glassmorphism */}
          <motion.section
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto w-full max-w-md lg:col-span-7 lg:max-w-lg"
          >
            <div className="glass-panel-elevated rounded-2xl p-6 sm:p-8 space-y-6">
              {/* Seletor Login / Cadastro */}
              <div
                role="tablist"
                aria-label="Alternar entre login e cadastro"
                className="grid grid-cols-2 gap-1.5 rounded-xl border border-[#7dd3fc]/12 bg-[#0a0e1a]/60 p-1"
              >
                <Link
                  href="/login"
                  role="tab"
                  aria-selected={isLogin}
                  className={cn(
                    'flex items-center justify-center rounded-lg py-2.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer',
                    isLogin
                      ? 'glass-btn-primary text-[#e0f2fe]'
                      : 'text-slate-400 hover:text-slate-100'
                  )}
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  role="tab"
                  aria-selected={!isLogin}
                  className={cn(
                    'flex items-center justify-center rounded-lg py-2.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer',
                    !isLogin
                      ? 'glass-btn-primary text-[#e0f2fe]'
                      : 'text-slate-400 hover:text-slate-100'
                  )}
                >
                  Criar conta
                </Link>
              </div>

              {/* Título do Card */}
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-slate-50">
                  {isLogin ? 'Acesse sua conta' : 'Crie sua conta no LeadFlow'}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-400">
                  {isLogin
                    ? 'Entre com seu e-mail corporativo para gerenciar seus leads.'
                    : 'Preencha seus dados para começar a operar o pipeline da equipe.'}
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-400/30 bg-rose-500/12 px-4 py-3 text-xs font-medium text-rose-200"
                >
                  {error}
                </div>
              )}

              {infoMessage && (
                <div
                  role="status"
                  className="flex items-start gap-2.5 rounded-xl border border-emerald-400/30 bg-emerald-500/12 px-4 py-3 text-xs font-medium text-emerald-200"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300 mt-0.5" />
                  <span>{infoMessage}</span>
                </div>
              )}

              {isLogin ? (
                /* FORMULÁRIO DE LOGIN */
                <div className="space-y-5">
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <label className="flex flex-col gap-1.5 text-xs text-slate-300">
                      <span>E-mail corporativo</span>
                      <div className="relative">
                        <Mail
                          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                          aria-hidden="true"
                        />
                        <input
                          type="email"
                          required
                          autoComplete="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="voce@suaempresa.com.br"
                          className="glass-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500"
                        />
                      </div>
                    </label>

                    <label className="flex flex-col gap-1.5 text-xs text-slate-300">
                      <span>Senha</span>
                      <div className="relative">
                        <Lock
                          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                          aria-hidden="true"
                        />
                        <input
                          type={showLoginPw ? 'text' : 'password'}
                          required
                          autoComplete="current-password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Sua senha de acesso"
                          className="glass-input w-full rounded-xl py-2.5 pl-10 pr-11 text-sm text-slate-100 placeholder:text-slate-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPw((v) => !v)}
                          aria-label={
                            showLoginPw ? 'Ocultar senha' : 'Mostrar senha'
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#7dd3fc] transition-colors cursor-pointer p-1"
                        >
                          {showLoginPw ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </label>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <label className="inline-flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-4 w-4 rounded border-[#7dd3fc]/30 bg-[#0f1524] accent-[#7dd3fc] cursor-pointer"
                        />
                        <span>Manter conectado</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setShowRecovery((v) => !v);
                          setRecoverySent(false);
                          setRecoveryEmail(loginEmail);
                        }}
                        className="font-medium text-[#7dd3fc] hover:text-[#bae6fd] transition-colors cursor-pointer"
                      >
                        Esqueci minha senha
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="glass-btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold cursor-pointer disabled:opacity-50"
                    >
                      <span>
                        {submitting ? 'Autenticando...' : 'Entrar no LeadFlow'}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>

                  {/* Recuperação de Senha Inline */}
                  {showRecovery && (
                    <div className="rounded-xl border border-[#7dd3fc]/15 bg-[#0a0e1a]/55 p-4 space-y-3">
                      {recoverySent ? (
                        <div className="flex items-start gap-2.5 text-xs text-emerald-200">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300 mt-0.5" />
                          <p>
                            Instruções de redefinição enviadas para{' '}
                            <strong className="font-medium">
                              {recoveryEmail}
                            </strong>
                            . Verifique sua caixa de entrada.
                          </p>
                        </div>
                      ) : (
                        <form
                          onSubmit={handleRecoverySubmit}
                          className="space-y-2.5"
                        >
                          <p className="text-xs font-medium text-slate-200">
                            Recuperar acesso
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="email"
                              value={recoveryEmail}
                              onChange={(e) => setRecoveryEmail(e.target.value)}
                              placeholder="E-mail cadastrado"
                              className="glass-input flex-1 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500"
                            />
                            <button
                              type="submit"
                              className="glass-btn-primary rounded-xl px-3.5 py-2 text-xs font-medium whitespace-nowrap cursor-pointer"
                            >
                              Enviar link
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Acesso Rápido Demonstração */}
                  <div className="space-y-3 border-t border-[#7dd3fc]/10 pt-5">
                    <button
                      type="button"
                      onClick={handleDemoAccess}
                      className="glass-btn-secondary flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium cursor-pointer"
                    >
                      <span>Entrar com conta demonstração (Thiago Mendes)</span>
                    </button>
                    <p className="text-center text-xs text-slate-400">
                      Ainda não tem acesso?{' '}
                      <Link
                        href="/cadastro"
                        className="font-medium text-[#7dd3fc] hover:text-[#bae6fd] transition-colors cursor-pointer"
                      >
                        Criar conta gratuita
                      </Link>
                    </p>
                  </div>
                </div>
              ) : (
                /* FORMULÁRIO DE CADASTRO */
                <div className="space-y-5">
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      <label className="flex flex-col gap-1.5 text-xs text-slate-300 sm:col-span-2">
                        <span>Nome completo *</span>
                        <div className="relative">
                          <User
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            aria-hidden="true"
                          />
                          <input
                            type="text"
                            required
                            autoComplete="name"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            placeholder="Ex.: Carolina Ferreira"
                            className="glass-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500"
                          />
                        </div>
                      </label>

                      <label className="flex flex-col gap-1.5 text-xs text-slate-300">
                        <span>Empresa *</span>
                        <div className="relative">
                          <Building2
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            aria-hidden="true"
                          />
                          <input
                            type="text"
                            required
                            autoComplete="organization"
                            value={regCompany}
                            onChange={(e) => setRegCompany(e.target.value)}
                            placeholder="Nome da empresa"
                            className="glass-input w-full rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500"
                          />
                        </div>
                      </label>

                      <label className="flex flex-col gap-1.5 text-xs text-slate-300">
                        <span>Cargo</span>
                        <div className="relative">
                          <Briefcase
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            aria-hidden="true"
                          />
                          <select
                            value={regRole}
                            onChange={(e) => setRegRole(e.target.value)}
                            className="glass-input w-full rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-100 cursor-pointer"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r} value={r} className="bg-[#0f1524]">
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                      </label>
                    </div>

                    <label className="flex flex-col gap-1.5 text-xs text-slate-300">
                      <span>E-mail corporativo *</span>
                      <div className="relative">
                        <Mail
                          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                          aria-hidden="true"
                        />
                        <input
                          type="email"
                          required
                          autoComplete="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="nome@suaempresa.com.br"
                          className="glass-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500"
                        />
                      </div>
                    </label>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      <label className="flex flex-col gap-1.5 text-xs text-slate-300">
                        <span>Senha *</span>
                        <div className="relative">
                          <Lock
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            aria-hidden="true"
                          />
                          <input
                            type={showRegPw ? 'text' : 'password'}
                            required
                            autoComplete="new-password"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="Mín. 6 caracteres"
                            className="glass-input w-full rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPw((v) => !v)}
                            aria-label={
                              showRegPw ? 'Ocultar senha' : 'Mostrar senha'
                            }
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#7dd3fc] cursor-pointer p-1"
                          >
                            {showRegPw ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </label>

                      <label className="flex flex-col gap-1.5 text-xs text-slate-300">
                        <span>Confirmar senha *</span>
                        <div className="relative">
                          <Lock
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            aria-hidden="true"
                          />
                          <input
                            type={showRegPw ? 'text' : 'password'}
                            required
                            autoComplete="new-password"
                            value={regConfirmPassword}
                            onChange={(e) =>
                              setRegConfirmPassword(e.target.value)
                            }
                            placeholder="Repita a senha"
                            className="glass-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500"
                          />
                        </div>
                      </label>
                    </div>

                    {/* Medidor discreto de força da senha */}
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-4 gap-1.5">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={cn(
                              'h-1 rounded-full transition-colors duration-200',
                              strength.score >= step
                                ? step <= 1
                                  ? 'bg-rose-400/80'
                                  : step === 2
                                    ? 'bg-[#c8a0f0]'
                                    : 'bg-[#7dd3fc]'
                                : 'bg-white/[0.08]'
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Força da senha:{' '}
                        <span className="text-slate-200">{strength.label}</span>
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5 pt-1 text-xs text-slate-300">
                      <input
                        id="accept-terms"
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#7dd3fc]/30 bg-[#0f1524] accent-[#7dd3fc] cursor-pointer"
                      />
                      <label
                        htmlFor="accept-terms"
                        className="leading-relaxed cursor-pointer"
                      >
                        Concordo com os{' '}
                        <button
                          type="button"
                          onClick={() => setShowTermsModal(true)}
                          className="font-medium text-[#7dd3fc] hover:text-[#bae6fd] underline underline-offset-2 cursor-pointer"
                        >
                          Termos de Uso e Privacidade
                        </button>{' '}
                        do LeadFlow.
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="glass-btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold cursor-pointer disabled:opacity-50"
                    >
                      <span>
                        {submitting
                          ? 'Criando conta...'
                          : 'Criar minha conta'}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>

                  <p className="border-t border-[#7dd3fc]/10 pt-4 text-center text-xs text-slate-400">
                    Já possui conta?{' '}
                    <Link
                      href="/login"
                      className="font-medium text-[#7dd3fc] hover:text-[#bae6fd] transition-colors cursor-pointer"
                    >
                      Fazer login
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </motion.section>
        </div>
      </main>

      {/* Modal de Termos de Uso */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowTermsModal(false)}
            aria-hidden="true"
            className="fixed inset-0 bg-[#050811]/75 backdrop-blur-sm cursor-pointer"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-title"
            className="glass-panel-elevated relative z-10 w-full max-w-md rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#7dd3fc]/12 pb-3">
              <h3
                id="terms-title"
                className="font-display text-base font-semibold text-slate-50"
              >
                Termos de Uso e Privacidade
              </h3>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                aria-label="Fechar termos"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-300 hover:border-[#7dd3fc]/35 hover:text-slate-50 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs leading-relaxed text-slate-300">
              <p>
                O <strong>LeadFlow</strong> armazena os dados da sua carteira
                comercial e informações de sessão localmente no seu navegador
                para agilidade operacional.
              </p>
              <p>
                Você pode exportar sua base de leads em formato CSV a qualquer
                momento e encerrar sua sessão com segurança pelo menu lateral.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="glass-btn-primary rounded-xl px-4 py-2 text-xs font-medium cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
