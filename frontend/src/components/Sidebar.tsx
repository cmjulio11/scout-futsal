import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { scoutService, campeonatosService } from '../services/api';
import type { ScoutClubeItem, SyncStatusResponse } from '../types';
import toast from 'react-hot-toast';
import { formatarDataHoraSync, formatarProximoSync } from '../utils/formatters';
import {
  LayoutDashboard,
  Users,
  Trophy,
  ClipboardList,
  LogOut,
  Shield,
  MessageSquare,
  Menu,
  X,
  Sparkles,
  Building2,
  RefreshCw,
  Swords,
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', perfil: 'todos' },
  { icon: Swords, label: 'Mata-Mata & Simulador', path: '/playoffs', perfil: 'todos', badge: 'Playoffs' },
  { icon: ClipboardList, label: 'Scout de Jogos', path: '/scout', perfil: 'todos', badge: 'Tático' },
  { icon: Trophy, label: 'Campeonato Paulista', path: '/campeonatos', perfil: 'todos', badge: 'FPFS' },
  { icon: Users, label: 'Gestão de Usuários', path: '/usuarios', perfil: 'administrador' },
];

export default function Sidebar() {
  const { usuario, logout, isAdmin, clubeAtivo, setClubeAtivo } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clubes, setClubes] = useState<ScoutClubeItem[]>([]);
  const [syncInfo, setSyncInfo] = useState<SyncStatusResponse | null>(null);
  const [disparandoSync, setDisparandoSync] = useState(false);

  const carregarSyncStatus = async () => {
    try {
      const data = await campeonatosService.obterSyncStatus();
      setSyncInfo(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    async function carregarClubes() {
      try {
        const resp = await scoutService.obterClubes(2026);
        setClubes(resp.clubes || []);
      } catch (err) {
        console.error('Erro ao carregar clubes na Sidebar:', err);
      }
    }
    carregarClubes();
    carregarSyncStatus();

    const interval = setInterval(carregarSyncStatus, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncManual = async () => {
    if (disparandoSync || syncInfo?.is_syncing) return;
    setDisparandoSync(true);
    toast.loading('Iniciando sincronização com a FPFS...', { id: 'sync-toast' });
    try {
      const res = await campeonatosService.sincronizar(2026);
      if (res.em_andamento) {
        toast('Sincronização já em andamento por outro processo.', { id: 'sync-toast', icon: '⏳' });
      } else {
        toast.success(res.mensagem || 'Dados da FPFS sincronizados com sucesso!', { id: 'sync-toast' });
      }
      carregarSyncStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao sincronizar com a FPFS.', { id: 'sync-toast' });
    } finally {
      setDisparandoSync(false);
    }
  };

  const clubeInfo = clubes.find(
    (c) => c.nome.trim().toLowerCase() === (clubeAtivo || '').trim().toLowerCase()
  );

  const getPerfilBadge = (perfil?: string) => {
    if (perfil === 'administrador') {
      return { label: 'Administrador', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    }
    return { label: 'Comissão Técnica', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
  };

  const badgeInfo = getPerfilBadge(usuario?.perfil);

  const visibleItems = menuItems.filter(
    (item) => item.perfil === 'todos' || (item.perfil === 'administrador' && isAdmin)
  );

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. HEADER MOBILE SUPERIOR (Aparece apenas em celulares < md) */}
      {/* ========================================================================= */}
      <header className="md:hidden sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src={clubeInfo?.escudo_url || usuario?.clube_escudo_url || '/fpfs_shield.png'}
              alt="Brasão"
              className="w-8 h-8 object-contain drop-shadow"
              onError={(e) => {
                e.currentTarget.src = '/fpfs_shield.png';
              }}
            />
            {clubeInfo && (
              <img
                src="/fpfs_shield.png"
                alt="FPFS"
                className="w-3.5 h-3.5 object-contain absolute -bottom-1 -right-1 drop-shadow"
              />
            )}
          </div>
          <div>
            <p className="text-white font-extrabold text-sm tracking-tight leading-none truncate max-w-[170px]">
              {clubeInfo?.nome || 'Futsal Scout'}
            </p>
            <p className="text-blue-400 text-[10px] font-bold tracking-wider uppercase mt-0.5">
              {clubeInfo ? 'Série A1 • Iniciação' : 'FPFS • Série A1'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white active:scale-95 transition"
          aria-label="Abrir menu de navegação"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* ========================================================================= */}
      {/* 2. DRAWER MOBILE LATERAL (Aberto pelo botão hambúrguer no celular) */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Fundo escurecido */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Conteúdo do Menu Lateral Deslizante */}
          <div className="relative w-4/5 max-w-xs bg-slate-900 border-r border-slate-800 h-full flex flex-col z-10 shadow-2xl p-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <img
                  src={clubeInfo?.escudo_url || usuario?.clube_escudo_url || '/fpfs_shield.png'}
                  alt="Brasão"
                  className="w-9 h-9 object-contain"
                />
                <div>
                  <p className="text-white font-black text-sm truncate max-w-[150px]">
                    {clubeInfo?.nome || 'Futsal Scout'}
                  </p>
                  <p className="text-blue-400 text-[10px] font-bold">FPFS Iniciação</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Seletor Comercial para Admin no Celular */}
            {isAdmin && (
              <div className="mt-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1 text-amber-400">
                    <Sparkles className="w-3 h-3" /> Simular Clube
                  </span>
                  {clubeAtivo && (
                    <button
                      onClick={() => setClubeAtivo(null)}
                      className="text-slate-400 hover:text-rose-400 text-[10px] underline"
                    >
                      Resetar
                    </button>
                  )}
                </div>
                <select
                  value={clubeAtivo || ''}
                  onChange={(e) => setClubeAtivo(e.target.value || null)}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Visão Geral (Todos)</option>
                  {clubes.map((c) => (
                    <option key={c.nome} value={c.nome}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Links do Menu */}
            <nav className="flex-1 py-4 space-y-1.5">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/40'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Robô FPFS no Celular */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 mb-2.5">
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${syncInfo?.is_syncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                  Robô FPFS
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                  syncInfo?.is_syncing
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {syncInfo?.is_syncing ? 'Atualizando...' : 'Ativo'}
                </span>
              </div>

              {/* Card com Data e Hora da Última Sincronização */}
              <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 mb-1.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Última Sincronização:
                </p>
                <p className="text-xs font-black text-slate-100 mt-0.5 flex items-center gap-1">
                  <span>📅</span>
                  <span>{formatarDataHoraSync(syncInfo?.ultimo_sync)}</span>
                </p>
              </div>

              <p className="text-[10px] text-slate-400 flex items-center justify-between leading-tight px-0.5">
                <span>Próximo agendado:</span>
                <span className="text-slate-300 font-semibold">{formatarProximoSync(syncInfo?.proximo_sync_agendado)}</span>
              </p>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleSyncManual}
                  disabled={syncInfo?.is_syncing || disparandoSync}
                  className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${syncInfo?.is_syncing || disparandoSync ? 'animate-spin' : ''}`} />
                  <span>{syncInfo?.is_syncing || disparandoSync ? 'Sincronizando...' : 'Sincronizar Manual'}</span>
                </button>
              )}
            </div>

            {/* Suporte Técnico com Júlio Martins */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <p className="text-xs font-bold text-white">Suporte Comercial</p>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">Júlio Martins • Suporte Oficial</p>
              <a
                href="https://wa.me/5519992035026"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 font-bold inline-flex items-center gap-1"
              >
                <span>Falar no WhatsApp</span> &rarr;
              </a>
            </div>

            {/* Perfil & Logout */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                  {usuario?.nome?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-xs font-bold truncate">{usuario?.nome}</p>
                  <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border mt-0.5 ${badgeInfo.color}`}>
                    {badgeInfo.label}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-950/20 border border-rose-900/30 active:scale-95 transition"
              >
                <LogOut className="w-4 h-4" />
                Encerrar Sessão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BARRA INFERIOR MOBILE FIXA (Bottom Navigation Bar) */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around px-2 py-2 shadow-2xl">
        <Link
          to="/campeonatos"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
            location.pathname === '/campeonatos'
              ? 'text-blue-400 font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Paulista</span>
        </Link>

        <Link
          to="/dashboard"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
            location.pathname === '/dashboard'
              ? 'text-blue-400 font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Dashboard</span>
        </Link>

        <Link
          to="/scout"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
            location.pathname === '/scout'
              ? 'text-blue-400 font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardList className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Scout</span>
        </Link>

        {isAdmin && (
          <Link
            to="/usuarios"
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
              location.pathname === '/usuarios'
                ? 'text-blue-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Usuários</span>
          </Link>
        )}
      </nav>

      {/* ========================================================================= */}
      {/* 4. SIDEBAR DESKTOP TRADICIONAL (Aparece a partir de md:) */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex w-64 min-h-screen bg-slate-900 border-r border-slate-800 flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={clubeInfo?.escudo_url || usuario?.clube_escudo_url || '/fpfs_shield.png'}
                alt="Brasão"
                className="w-10 h-10 object-contain drop-shadow"
                onError={(e) => {
                  e.currentTarget.src = '/fpfs_shield.png';
                }}
              />
              {clubeInfo && (
                <img
                  src="/fpfs_shield.png"
                  alt="FPFS"
                  className="w-4 h-4 object-contain absolute -bottom-1 -right-1 drop-shadow"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-sm tracking-tight leading-tight truncate">
                {clubeInfo?.nome || 'Futsal Scout'}
              </p>
              <p className="text-blue-400 text-xs font-semibold truncate">
                {clubeInfo ? 'Série A1 • Iniciação' : 'FPFS • Iniciação'}
              </p>
            </div>
          </div>

          {/* Badge de Clube Vinculado do Usuário */}
          {usuario?.clube && (
            <div className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/40 border border-blue-800/40 text-[11px] text-blue-300">
              <Building2 className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="font-semibold truncate">Clube: {usuario.clube}</span>
            </div>
          )}
        </div>

        {/* Simulador Comercial para Administrador (Demonstração para Clientes) */}
        {isAdmin && (
          <div className="px-3 pt-3">
            <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1 text-amber-400">
                  <Sparkles className="w-3 h-3" /> Simular Clube
                </span>
                {clubeAtivo && (
                  <button
                    onClick={() => setClubeAtivo(null)}
                    className="text-slate-400 hover:text-rose-400 text-[10px] underline cursor-pointer"
                    title="Voltar à visão neutra / geral"
                  >
                    Resetar
                  </button>
                )}
              </div>
              <select
                value={clubeAtivo || ''}
                onChange={(e) => setClubeAtivo(e.target.value || null)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                title="Selecione um clube para visualizar o sistema como ele veria"
              >
                <option value="">Visão Geral (Todos os Clubes)</option>
                {clubes.map((c) => (
                  <option key={c.nome} value={c.nome}>
                    {c.nome}
                  </option>
                ))}
              </select>
              {clubeAtivo && (
                <p className="text-[10px] text-amber-400/90 font-medium leading-tight">
                  👁️ Visualizando como <strong>{clubeAtivo}</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/40 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? 'bg-blue-700/60 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Robô FPFS & Sincronização Agendada */}
        <div className="p-3 mx-3 mb-2 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${syncInfo?.is_syncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
              Robô FPFS
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
              syncInfo?.is_syncing
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              {syncInfo?.is_syncing ? 'Atualizando...' : 'Ativo'}
            </span>
          </div>

          {/* Card com Data e Hora da Última Sincronização */}
          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 mb-1.5">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Última Sincronização:
            </p>
            <p className="text-xs font-black text-slate-100 mt-0.5 flex items-center gap-1">
              <span>📅</span>
              <span>{formatarDataHoraSync(syncInfo?.ultimo_sync)}</span>
            </p>
          </div>

          <p className="text-[10px] text-slate-400 flex items-center justify-between leading-tight px-0.5">
            <span>Próximo agendado:</span>
            <span className="text-slate-300 font-semibold">{formatarProximoSync(syncInfo?.proximo_sync_agendado)}</span>
          </p>

          {/* Botão Exclusivo do Administrador com Trava Anti-Concorrência */}
          {isAdmin && (
            <button
              type="button"
              onClick={handleSyncManual}
              disabled={syncInfo?.is_syncing || disparandoSync}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-bold transition disabled:opacity-50 cursor-pointer active:scale-95"
              title="Disparar varredura controlada com trava anti-concorrência"
            >
              <RefreshCw className={`w-3 h-3 ${syncInfo?.is_syncing || disparandoSync ? 'animate-spin' : ''}`} />
              <span>{syncInfo?.is_syncing || disparandoSync ? 'Sincronizando...' : 'Sincronizar Manual'}</span>
            </button>
          )}
        </div>

        {/* Support Box */}
        <div className="p-3 mx-3 mb-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1.5">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <p className="text-xs font-semibold text-slate-200">Suporte Comercial</p>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">Júlio Martins • Gestão e Acessos.</p>
          <a
            href="https://wa.me/5519992035026"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
          >
            <span>Abrir WhatsApp</span> &rarr;
          </a>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="mb-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-sm shrink-0">
              {usuario?.nome?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{usuario?.nome}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeInfo.color}`}
                >
                  {usuario?.perfil === 'administrador' ? <Shield className="w-2.5 h-2.5" /> : null}
                  {badgeInfo.label}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-rose-900/30 transition-colors cursor-pointer active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            Encerrar Sessão
          </button>
        </div>
      </aside>
    </>
  );
}
