import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Shield, Lock, Mail, ArrowRight, MessageCircle } from 'lucide-react';

import { AlertOctagon } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bloqueadoMsg, setBloqueadoMsg] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      toast.error('Preencha email e senha');
      return;
    }
    setLoading(true);
    setBloqueadoMsg(null);
    try {
      const data = await authService.login({ email, senha });
      login(data.access_token, data.usuario);
      toast.success(`Bem-vindo, ${data.usuario.nome}!`);
      navigate('/dashboard');
    } catch (err: unknown) {
      const apiErr = err as { response?: { status?: number; data?: { detail?: string } } };
      const status = apiErr.response?.status;
      const msg =
        apiErr.response?.data?.detail ||
        'Credenciais inválidas. Verifique seu e-mail e senha.';

      if (status === 403) {
        setBloqueadoMsg(msg);
        toast.error('Acesso bloqueado por pendência comercial.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col text-slate-100">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:px-6">

        {/* Top Branding com Logo Oficial da Federação */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative mb-3 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-indigo-500/20 to-sky-500/20 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition duration-300"></div>
            <div className="relative bg-slate-900/90 border border-slate-700/80 rounded-2xl px-6 py-3.5 shadow-2xl flex items-center justify-center">
              <img
                src="/fpfs_logo.png"
                alt="Federação Paulista de Futebol de Salão"
                className="h-16 sm:h-20 w-auto object-contain drop-shadow"
              />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2">
            Intelligent <span className="text-blue-400">Futsal Scout</span>
          </h1>
          <p className="text-slate-300 text-sm mt-1.5 max-w-md font-medium">
            Campeonato Paulista de Futsal • Categorias de Iniciação
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Sub-7
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Sub-8
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Sub-9
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Sub-10
            </span>
          </div>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/60">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-white">Acesso à Plataforma</h2>
              <p className="text-xs text-slate-400 mt-1">Entre com seu e-mail e senha cadastrados</p>
            </div>

            {/* Aviso Tático de Bloqueio por Mensalidade Comercial */}
            {bloqueadoMsg && (
              <div className="mb-5 p-4 rounded-2xl bg-rose-950/50 border border-rose-800/80 text-center space-y-2.5 animate-fade-in shadow-lg">
                <div className="flex items-center justify-center gap-1.5 text-rose-400 font-extrabold text-xs uppercase tracking-wider">
                  <AlertOctagon className="w-4 h-4" /> Acesso Comercial Suspenso
                </div>
                <p className="text-xs text-rose-200 leading-relaxed font-medium">
                  {bloqueadoMsg}
                </p>
                <a
                  href="https://wa.me/5519992035026?text=Ol%C3%A1%20J%C3%BAlio,%20meu%20acesso%20ao%20Intelligent%20Futsal%20Scout%20est%C3%A1%20bloqueado.%20Gostaria%20de%20regularizar%20minha%20assinatura."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow active:scale-95"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Regularizar no WhatsApp com Júlio</span>
                </a>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@futsalscout.com"
                    className="w-full bg-slate-800/90 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition placeholder-slate-500"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full bg-slate-800/90 border border-slate-700 text-white pl-10 pr-12 py-3 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition placeholder-slate-500"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-950/40 hover:shadow-blue-800/40"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Acessar Ferramenta</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>

            {/* Direct Admin Contact on Login Page */}
            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <p className="text-slate-400 text-xs mb-2.5">
                Ainda não possui acesso ou esqueceu sua senha?
              </p>
              <a
                href="https://wa.me/5519992035026?text=Ol%C3%A1%20J%C3%BAlio,%20gostaria%20de%20solicitar%20acesso%20ao%20Intelligent%20Futsal%20Scout."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition group shadow"
              >
                <MessageCircle className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                <span>Solicitar Acesso ao Administrador (Júlio Martins)</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
