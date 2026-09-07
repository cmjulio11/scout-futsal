import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import AtletaModal from '../components/AtletaModal';
import { campeonatosService, scoutService } from '../services/api';
import {
  formatarRodada,
  formatarNomeAtletaCurto,
  formatarNomeClubeCurto,
} from '../utils/formatters';
import type {
  DashboardResumoResponse,
  DashboardArtilheiroGeral,
} from '../types';
import {
  Trophy,
  Users,
  ClipboardList,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Sparkles,
  ChevronRight,
  FileText,
  Target,
  Flame,
  Activity,
  MapPin,
  ShieldAlert,
  ArrowRight,
  User,
  Award,
  Building2,
  Swords,
  Download,
  Loader2,
  Navigation,
  Share2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import GinasioLocalizacaoModal from '../components/GinasioLocalizacaoModal';
import {
  limparNomeGinasio,
  gerarTextoWhatsAppConfronto,
  abrirWhatsApp,
  type WhatsAppConfrontoParams,
} from '../utils/ginasios';

export default function DashboardPage() {
  const { usuario, isAdmin, clubeAtivo, roleLabel } = useAuth();
  const navigate = useNavigate();

  const [temporada] = useState<number>(2026);
  const [resumo, setResumo] = useState<DashboardResumoResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal Ficha do Atleta
  const [atletaModalOpen, setAtletaModalOpen] = useState(false);
  const [atletaModalData, setAtletaModalData] = useState<{
    idJogador?: number;
    idFase?: number;
    nomeAtleta?: string;
    categoria?: string;
  }>({});

  // Modal de Ginásio & Logística
  const [ginasioModalOpen, setGinasioModalOpen] = useState(false);
  const [ginasioModalData, setGinasioModalData] = useState<{
    nome: string;
    matchParams?: WhatsAppConfrontoParams;
  }>({ nome: '' });

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const primeiroNome = usuario?.nome?.split(' ')[0] || 'Comissão Técnica';

  useEffect(() => {
    async function carregarResumo() {
      try {
        setLoading(true);
        const data = await campeonatosService.obterDashboardResumo(temporada, clubeAtivo);
        setResumo(data);
      } catch (err) {
        console.error('Erro ao carregar resumo do dashboard:', err);
        toast.error('Não foi possível carregar as métricas do dashboard.');
      } finally {
        setLoading(false);
      }
    }

    carregarResumo();
  }, [temporada, clubeAtivo]);

  const handleAbrirFichaAtleta = (item: DashboardArtilheiroGeral) => {
    setAtletaModalData({
      idJogador: item.id_jogador,
      idFase: item.id_fase,
      nomeAtleta: item.nome,
      categoria: item.categoria || 'Sub-7',
    });
    setAtletaModalOpen(true);
  };

  const [baixandoPdfProximo, setBaixandoPdfProximo] = useState(false);

  const handleAnalisarConfronto = (mandante: string, visitante: string) => {
    navigate(`/scout?mandante=${encodeURIComponent(mandante)}&visitante=${encodeURIComponent(visitante)}`);
  };

  const handleBaixarPdfProximoJogo = async () => {
    if (!resumo?.meu_clube?.proximo_jogo) return;
    const pj = resumo.meu_clube.proximo_jogo;
    try {
      setBaixandoPdfProximo(true);
      toast.loading('Gerando Dossiê Pré-Jogo Oficial em PDF...', { id: 'pdf-dashboard' });
      await scoutService.baixarPdfConfronto(
        pj.mandante,
        pj.visitante,
        temporada,
        undefined,
        {
          data: pj.data,
          hora: pj.hora,
        }
      );
      toast.success('Dossiê em PDF baixado com sucesso!', { id: 'pdf-dashboard' });
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
      toast.error('Erro ao gerar Dossiê em PDF. Tente novamente.', { id: 'pdf-dashboard' });
    } finally {
      setBaixandoPdfProximo(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100">
      <div className="no-print">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <main id="dashboard-main" className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto space-y-6 sm:space-y-8">
          {/* ========================================================================= */}
          {/* 1. HEADER EXECUTIVO & BOAS-VINDAS */}
          {/* ========================================================================= */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {greeting}, {primeiroNome}! 👋
                </h1>
                {clubeAtivo && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/40 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    {clubeAtivo}
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 flex items-center gap-1.5 flex-wrap">
                <span>Centro de Inteligência & Scout Tático</span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="text-slate-300">Federação Paulista de Futsal (FPFS)</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Status Sincronização FPFS */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                <span>FPFS Série A1 • Temporada 2026</span>
              </div>

              {/* Badge Perfil */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  isAdmin
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {roleLabel || (isAdmin ? 'Administrador Geral' : 'Comissão Técnica')}
              </span>

              {/* Botão de Atalho Rápido para o Scout */}
              <Link
                to="/scout"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-blue-950/50 transition shrink-0 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Novo Scout de Duelo</span>
              </Link>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 1.5. PAINEL EXCLUSIVO: VESTE A CAMISA DO SEU CLUBE */}
          {/* ========================================================================= */}
          {resumo?.meu_clube && (
            <div className="bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-950 border-2 border-blue-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 relative overflow-hidden animate-fade-in">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

              {/* Top Header do Clube */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 relative z-10">
                <div className="flex items-center gap-3.5">
                  <img
                    src={resumo.meu_clube.escudo_url}
                    alt={resumo.meu_clube.clube}
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-lg shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = '/fpfs_shield.png';
                    }}
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                        Meu Clube Oficial • Série A1
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        Função: <strong className="text-white">{roleLabel}</strong>
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-0.5">
                      {resumo.meu_clube.clube}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border ${
                      resumo.meu_clube.chave === 'OURO'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : resumo.meu_clube.chave === 'PRATA'
                        ? 'bg-slate-700/60 text-slate-200 border-slate-600'
                        : 'bg-amber-900/30 text-amber-600 border-amber-800/40'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    {resumo.meu_clube.posicao}º Lugar • Chave {resumo.meu_clube.chave}
                  </span>
                </div>
              </div>

              {/* Grid em 2 Colunas: Desempenho no Torneio União & Próximo Confronto */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
                {/* Coluna 1: Situação no Torneio União (7 Colunas) */}
                <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-blue-400" /> Situação no Torneio União
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Índice Técnico: <strong className="text-blue-400">{resumo.meu_clube.indice_tecnico.toFixed(1)}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Pontos Totais</p>
                      <p className="text-lg sm:text-xl font-black text-white mt-0.5">{resumo.meu_clube.pontos_total}</p>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Distância do Líder</p>
                      <p className="text-lg sm:text-xl font-black text-amber-400 mt-0.5">
                        {resumo.meu_clube.diferenca_lider === 0 ? '👑 Líder!' : `-${resumo.meu_clube.diferenca_lider} pts`}
                      </p>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Margem Degola</p>
                      <p className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5">
                        {resumo.meu_clube.margem_rebaixamento > 0 ? `+${resumo.meu_clube.margem_rebaixamento} pts` : '⚠️ Na Zona'}
                      </p>
                    </div>
                  </div>

                  {/* Distribuição por Categoria */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Pontuação das 4 Categorias:
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {['Sub-7', 'Sub-8', 'Sub-9', 'Sub-10'].map((cat) => (
                        <div key={cat} className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 text-center">
                          <span className="text-[10px] font-bold text-blue-400 block">{cat}</span>
                          <span className="text-sm font-black text-white">
                            {resumo.meu_clube?.pontos_por_categoria[cat] ?? 0} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    to="/playoffs"
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-blue-500/15 to-amber-500/15 hover:from-amber-500/25 hover:to-blue-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition shadow-sm"
                  >
                    <Swords className="w-4 h-4 text-amber-400" />
                    <span>Ver Chaveamento & Simular Mata-Mata</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>

                {/* Coluna 2: Próximo Desafio & Confronto (5 Colunas) */}
                <div className="lg:col-span-5 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" /> Próximo Desafio
                      </span>
                      {resumo.meu_clube.proximo_jogo && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                          {resumo.meu_clube.proximo_jogo.mando === 'Casa' ? '🏠 Jogando em Casa' : '✈️ Jogando Fora'}
                        </span>
                      )}
                    </div>

                    {resumo.meu_clube.proximo_jogo ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={resumo.meu_clube.proximo_jogo.adversario_escudo}
                              alt={resumo.meu_clube.proximo_jogo.adversario}
                              className="w-10 h-10 object-contain drop-shadow shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = '/fpfs_shield.png';
                              }}
                            />
                            <div className="min-w-0">
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Adversário:</p>
                              <p className="text-sm font-black text-white truncate">
                                {resumo.meu_clube.proximo_jogo.adversario}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {resumo.meu_clube.proximo_jogo.adversario_posicao
                                  ? `${resumo.meu_clube.proximo_jogo.adversario_posicao}º Lugar`
                                  : 'Classificação FPFS'} • Chave {resumo.meu_clube.proximo_jogo.adversario_chave}
                              </p>
                            </div>
                          </div>

                          <div className="text-right text-[10px] text-slate-400 shrink-0">
                            <p className="font-bold text-slate-200">📅 {resumo.meu_clube.proximo_jogo.data || 'A definir'}</p>
                            <p>⏰ {resumo.meu_clube.proximo_jogo.hora || 'Horário FPFS'}</p>
                          </div>
                        </div>

                        {/* Linha do Ginásio & Logística com Ações Rápidas */}
                        <div className="flex items-center justify-between gap-2 bg-slate-900/70 px-3 py-2 rounded-xl border border-slate-800/80 text-xs">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="text-slate-300 font-semibold text-[11px] truncate" title={resumo.meu_clube.proximo_jogo.ginasio}>
                              {limparNomeGinasio(resumo.meu_clube.proximo_jogo.ginasio || 'Ginásio Oficial FPFS')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setGinasioModalData({
                                  nome: resumo.meu_clube!.proximo_jogo!.ginasio,
                                  matchParams: {
                                    mandante: resumo.meu_clube!.proximo_jogo!.mandante,
                                    visitante: resumo.meu_clube!.proximo_jogo!.visitante,
                                    data: resumo.meu_clube!.proximo_jogo!.data,
                                    hora: resumo.meu_clube!.proximo_jogo!.hora,
                                    rodada: resumo.meu_clube!.proximo_jogo!.rodada,
                                    ginasio: resumo.meu_clube!.proximo_jogo!.ginasio,
                                  },
                                });
                                setGinasioModalOpen(true);
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-[10px] font-bold transition cursor-pointer active:scale-95"
                              title="Ver rotas no Google Maps e Waze"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>Como Chegar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const texto = gerarTextoWhatsAppConfronto({
                                  mandante: resumo.meu_clube!.proximo_jogo!.mandante,
                                  visitante: resumo.meu_clube!.proximo_jogo!.visitante,
                                  data: resumo.meu_clube!.proximo_jogo!.data,
                                  hora: resumo.meu_clube!.proximo_jogo!.hora,
                                  rodada: resumo.meu_clube!.proximo_jogo!.rodada,
                                  ginasio: resumo.meu_clube!.proximo_jogo!.ginasio,
                                });
                                abrirWhatsApp(texto);
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition cursor-pointer active:scale-95"
                              title="Compartilhar Guia da Partida no WhatsApp"
                            >
                              <Share2 className="w-3 h-3" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </button>
                          </div>
                        </div>

                        {/* Ameaças Ofensivas do Adversário */}
                        {resumo.meu_clube.principais_ameacas.length > 0 && (
                          <div className="bg-slate-900/40 p-2 sm:p-2.5 rounded-xl border border-slate-800/80">
                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Flame className="w-3 h-3" /> Atenção na Marcação (Top Goleadores):
                              </span>
                              <span className="text-[9px] text-slate-500 font-normal lowercase hidden sm:inline">toque p/ ficha</span>
                            </p>
                            <div className="flex items-center gap-2">
                              {resumo.meu_clube.principais_ameacas.map((am, idx) => (
                                <div
                                  key={idx}
                                  onClick={() =>
                                    handleAbrirFichaAtleta({
                                      nome: am.nome,
                                      gols: am.gols,
                                      categoria: am.categoria,
                                      id_jogador: am.id_jogador,
                                      id_fase: am.id_fase,
                                      clube: resumo.meu_clube!.proximo_jogo!.adversario,
                                      escudo_url: resumo.meu_clube!.proximo_jogo!.adversario_escudo,
                                      foto_url: am.foto_url,
                                    })
                                  }
                                  className="flex-1 bg-slate-950/90 hover:bg-slate-900 p-2 rounded-xl border border-slate-800 hover:border-blue-500/50 text-center transition cursor-pointer active:scale-95 group shadow-sm flex flex-col items-center justify-between"
                                  title={`Ver ficha técnica de ${am.nome} (${am.categoria})`}
                                >
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30 group-hover:bg-blue-500/25 group-hover:border-blue-400/50 transition mb-1">
                                    {am.categoria}
                                  </span>
                                  <p className="text-[11px] font-bold text-white truncate max-w-full group-hover:text-blue-300 transition">
                                    {am.nome.split(' ')[0]}
                                  </p>
                                  <p className="text-[10px] font-black text-amber-400 mt-0.5">
                                    {am.gols} gols
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Nenhum próximo jogo agendado na tabela oficial.</p>
                    )}
                  </div>

                  {resumo.meu_clube.proximo_jogo && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleAnalisarConfronto(
                            resumo.meu_clube!.proximo_jogo!.mandante,
                            resumo.meu_clube!.proximo_jogo!.visitante
                          )
                        }
                        className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-black py-2.5 px-3 rounded-xl shadow-lg shadow-blue-950/40 transition cursor-pointer"
                      >
                        <Target className="w-4 h-4 text-amber-300 shrink-0" />
                        <span className="truncate">Analisar no Scout</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={handleBaixarPdfProximoJogo}
                        disabled={baixandoPdfProximo}
                        className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 active:scale-95 text-white text-xs font-black py-2.5 px-3 rounded-xl shadow-lg shadow-emerald-950/40 transition cursor-pointer"
                        title="Baixar Dossiê Pré-Jogo Oficial em PDF (1 página) para prancheta técnica"
                      >
                        {baixandoPdfProximo ? (
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        ) : (
                          <Download className="w-4 h-4 shrink-0" />
                        )}
                        <span className="truncate">{baixandoPdfProximo ? 'Gerando...' : 'Dossiê PDF (1 Pág)'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. BARRA DE KPIS EXECUTIVOS (4 CARDS NUMÉRICOS) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* KPI 1: Clubes Oficiais */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-blue-500/40 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-semibold">Clubes Monitorados</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Trophy className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {loading ? '...' : resumo?.kpis.total_clubes || 24}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span className="text-blue-400 font-bold">Série A1</span> • Torneio União
              </p>
            </div>

            {/* KPI 2: Categorias Ativas */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-blue-500/40 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-semibold">Categorias Ativas</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {loading ? '...' : resumo?.kpis.total_categorias || 4}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Sub-7, Sub-8, Sub-9 e Sub-10
              </p>
            </div>

            {/* KPI 3: Atletas Oficiais */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-blue-500/40 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-semibold">Atletas Oficiais</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {loading ? '...' : resumo?.kpis.total_atletas?.toLocaleString('pt-BR') || '994'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Fotos, gols e ficha individual
              </p>
            </div>

            {/* KPI 4: Súmulas Digitais */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-blue-500/40 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-semibold">Súmulas Oficiais FPFS</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {loading ? '...' : resumo?.kpis.total_sumulas?.toLocaleString('pt-BR') || '1.048'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Súmulas digitais auditadas
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. HERO BANNER PRINCIPAL: SCOUT PRÉ-JOGO (DESTAQUE DA PLATAFORMA) */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/60 border border-slate-800 hover:border-blue-500/50 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl transition group">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative">
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-blue-950/40">
                  <ClipboardList className="w-8 h-8 text-blue-400 group-hover:scale-110 transition" />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Módulo Tático Principal
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Scout de Duelos Mandante x Adversário</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Análise Técnica de Confronto & Radar de Ameaças
                  </h2>

                  <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
                    Compare instantaneamente mandante e visitante: aproveitamento real em casa e fora,
                    raio-x das 4 categorias que jogam no mesmo dia, histórico de confrontos diretos
                    e detecção inteligente dos principais artilheiros adversários.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0 w-full lg:w-auto">
                <Link
                  to="/scout"
                  className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-xl shadow-lg shadow-blue-950/50 transition active:scale-95"
                >
                  <Target className="w-4 h-4 text-amber-300" />
                  <span>Abrir Scout de Duelos</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/campeonatos?tab=proximos"
                  className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold px-4 py-3 rounded-xl transition"
                >
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Confrontos da Rodada</span>
                </Link>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. RAIO-X DAS 4 CATEGORIAS (SUB-7 AO SUB-10 COM LÍDER & ARTILHEIRO) */}
          {/* ========================================================================= */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white">
                    Raio-X das Categorias Oficiais (Sub-7 ao Sub-10)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Líderes atuais e artilheiros em destaque em cada faixa etária da Iniciação
                  </p>
                </div>
              </div>

              <Link
                to="/campeonatos"
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
              >
                <span>Ver Todas as Tabelas</span> &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {resumo?.categorias?.map((cat) => (
                <div
                  key={cat.categoria}
                  className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition group shadow-md"
                >
                  <div>
                    {/* Header Categoria */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white group-hover:text-blue-400 transition-colors">
                          {cat.categoria}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40">
                          Iniciação
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {cat.total_jogos} jogos
                      </span>
                    </div>

                    {/* Líder Atual */}
                    <div className="mt-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Líder Atual</span>
                        </div>
                        {cat.lider && (
                          <span className="text-xs font-black text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/40 shrink-0">
                            {cat.lider.pontos} pts
                          </span>
                        )}
                      </div>
                      {cat.lider ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <img
                              src={cat.lider.escudo_url}
                              alt={cat.lider.clube}
                              className="w-6 h-6 object-contain shrink-0"
                            />
                            <span className="text-xs sm:text-sm font-bold text-white leading-tight">
                              {formatarNomeClubeCurto(cat.lider.clube)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pl-8">
                            <span>{cat.lider.vitorias} vitórias</span>
                            <span>•</span>
                            <span>SG {cat.lider.saldo_gols > 0 ? `+${cat.lider.saldo_gols}` : cat.lider.saldo_gols}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">Sem dados</p>
                      )}
                    </div>

                    {/* Artilheiro Destaque */}
                    <div className="mt-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Artilheiro</span>
                        </div>
                        {cat.artilheiro && (
                          <span className="text-xs font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shrink-0 inline-flex items-center gap-1">
                            <span>⚽</span>
                            <span>{cat.artilheiro.gols}</span>
                          </span>
                        )}
                      </div>
                      {cat.artilheiro ? (
                        <div
                          onClick={() =>
                            cat.artilheiro &&
                            handleAbrirFichaAtleta({
                              nome: cat.artilheiro.nome,
                              foto_url: cat.artilheiro.foto_url,
                              clube: cat.artilheiro.clube,
                              escudo_url: cat.artilheiro.escudo_url,
                              gols: cat.artilheiro.gols,
                              id_jogador: cat.artilheiro.id_jogador || undefined,
                              id_fase: cat.artilheiro.id_fase || undefined,
                              categoria: cat.categoria,
                            })
                          }
                          className="flex items-center gap-2 cursor-pointer hover:bg-slate-900/90 p-1 rounded-lg transition"
                          title="Clique para abrir a ficha individual do atleta"
                        >
                          {cat.artilheiro.foto_url ? (
                            <img
                              src={cat.artilheiro.foto_url}
                              alt={cat.artilheiro.nome}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-bold text-slate-100 leading-tight">
                              {formatarNomeAtletaCurto(cat.artilheiro.nome)}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                              {formatarNomeClubeCurto(cat.artilheiro.clube)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">Sem dados</p>
                      )}
                    </div>
                  </div>

                  {/* Ação: Ver Categoria */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <Link
                      to={`/campeonatos?categoria=${cat.categoria}&tab=tabela`}
                      className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-blue-400 transition"
                    >
                      <span>Ver Tabela & Jogos {cat.categoria}</span>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. GRID 2 COLUNAS: TORNEIO UNIÃO G-4 + RADAR DE ARTILHARIA GERAL */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* COLUNA ESQUERDA (7 cols): TORNEIO UNIÃO (CLASSIFICAÇÃO GERAL) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <h3 className="text-base font-extrabold text-white">
                        Torneio União de Clubes (Série A1)
                      </h3>
                      <p className="text-xs text-slate-400">
                        Top 4 da classificação geral unificada (Sub-7 a Sub-10)
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/campeonatos?tab=ranking"
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
                  >
                    <span>Ranking Completo</span> &rarr;
                  </Link>
                </div>

                {/* Lista G-4 */}
                <div className="space-y-2.5">
                  {resumo?.g4_torneio_uniao?.map((clube, idx) => (
                    <div
                      key={clube.clube}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-blue-500/40 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                            idx === 0
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {clube.posicao || idx + 1}º
                        </span>

                        <img
                          src={clube.escudo_url}
                          alt={clube.clube}
                          className="w-7 h-7 object-contain shrink-0"
                        />

                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {formatarNomeClubeCurto(clube.clube)}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {clube.jogos_total} jogos • {clube.vitorias_total} vitórias
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          Chave Ouro
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-black text-blue-400 block">
                            {clube.pontos_total} pts
                          </span>
                          <span className="text-[10px] text-slate-500">
                            IT: {clube.indice_tecnico}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Margem do Rebaixamento Indicator */}
                <div className="mt-4 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Linha de Rebaixamento (22º ao 24º):</span>
                  </span>
                  <span className="font-bold text-rose-400 text-left sm:text-right">
                    {resumo?.zona_rebaixamento && resumo.zona_rebaixamento.length > 0
                      ? resumo.zona_rebaixamento
                          .map((c) => `${formatarNomeClubeCurto(c.clube)} (${c.posicao}º)`)
                          .join(' • ')
                      : 'Olé Brasil (22º) • Hortolândia (23º) • Tabuca Jrs (24º)'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <Link
                  to="/campeonatos?tab=ranking"
                  className="w-full py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <span>Acessar Tabela do Torneio União (24 Clubes)</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                </Link>
              </div>
            </div>

            {/* COLUNA DIREITA (5 cols): RADAR DE ARTILHARIA GERAL */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <Flame className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <h3 className="text-base font-extrabold text-white">
                        Top Artilheiros Gerais
                      </h3>
                      <p className="text-xs text-slate-400">
                        Clique no atleta para abrir a Ficha Técnica
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/campeonatos?tab=artilharia"
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
                  >
                    <span>Artilharia</span> &rarr;
                  </Link>
                </div>

                {/* Lista Top 4 Artilheiros */}
                <div className="space-y-2.5">
                  {resumo?.top_artilheiros_geral?.map((art, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleAbrirFichaAtleta(art)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-blue-950/20 border border-slate-800/80 hover:border-blue-500/50 cursor-pointer transition group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Foto do Atleta */}
                        <div className="relative shrink-0">
                          {art.foto_url ? (
                            <img
                              src={art.foto_url}
                              alt={art.nome}
                              className="w-10 h-10 rounded-full object-cover border border-slate-700 group-hover:border-blue-500 transition"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-black text-white flex items-center justify-center">
                            {idx + 1}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-300 transition truncate">
                            {formatarNomeAtletaCurto(art.nome)}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <span className="truncate">{formatarNomeClubeCurto(art.clube)}</span>
                            <span>•</span>
                            <span className="text-blue-400 font-semibold">{art.categoria}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-amber-300 block">
                          ⚽ {art.gols}
                        </span>
                        <span className="text-[10px] text-slate-500 group-hover:text-blue-400 transition flex items-center gap-0.5 justify-end">
                          <span>Ver ficha</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <Link
                  to="/campeonatos?tab=artilharia"
                  className="w-full py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <span>Ver Artilharia Completa por Categoria</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                </Link>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 6. PRÓXIMOS CONFRONTOS DA RODADA COM BOTÃO ANALISAR NO SCOUT */}
          {/* ========================================================================= */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Confrontos Oficiais da Rodada FPFS
                  </h3>
                  <p className="text-xs text-slate-400">
                    Clique em qualquer confronto para abrir imediatamente o dossiê no Scout
                  </p>
                </div>
              </div>

              <Link
                to="/campeonatos?tab=proximos"
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
              >
                <span>Ver Todos os Jogos</span> &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {resumo?.jogos_destaque?.map((jogo, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/70 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 flex flex-col justify-between transition group shadow-sm"
                >
                  <div>
                    {/* Header Jogo */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 pb-2 border-b border-slate-800/80">
                      <span className="font-bold text-blue-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {jogo.data} {jogo.hora ? `• ${jogo.hora}` : ''}
                      </span>
                      {jogo.rodada && (
                        <span className="text-slate-400 font-medium">
                          {formatarRodada(jogo.rodada)}
                        </span>
                      )}
                    </div>

                    {/* Duelo */}
                    <div className="space-y-2 mb-3">
                      {/* Mandante */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={jogo.escudo_mandante}
                            alt={jogo.mandante}
                            className="w-5 h-5 object-contain shrink-0"
                          />
                          <span className="text-xs font-bold text-white truncate">
                            {jogo.mandante}
                          </span>
                        </div>
                        {jogo.placar_mandante !== null && jogo.placar_mandante !== undefined && (
                          <span className="text-xs font-black text-white font-mono bg-slate-900 px-2 py-0.5 rounded">
                            {jogo.placar_mandante}
                          </span>
                        )}
                      </div>

                      {/* Visitante */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={jogo.escudo_visitante}
                            alt={jogo.visitante}
                            className="w-5 h-5 object-contain shrink-0"
                          />
                          <span className="text-xs font-bold text-white truncate">
                            {jogo.visitante}
                          </span>
                        </div>
                        {jogo.placar_visitante !== null && jogo.placar_visitante !== undefined && (
                          <span className="text-xs font-black text-white font-mono bg-slate-900 px-2 py-0.5 rounded">
                            {jogo.placar_visitante}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ginásio */}
                    {jogo.ginasio && (
                      <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mb-3">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{jogo.ginasio}</span>
                      </p>
                    )}
                  </div>

                  {/* Ação: Carregar no Scout */}
                  <button
                    onClick={() => handleAnalisarConfronto(jogo.mandante, jogo.visitante)}
                    className="w-full py-2 px-3 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 hover:border-blue-500 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Analisar no Scout</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 7. MÓDULOS OFICIAIS DA PLATAFORMA (CARDS EXECUTIVOS ATIVOS) */}
          {/* ========================================================================= */}
          <div>
            <h3 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Módulos Ativos do Sistema
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {/* Card 1: Scout Pré-Jogo */}
              <div className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Ativo • Tático
                    </span>
                  </div>
                  <h4 className="text-white font-bold text-base mb-1">
                    Scout de Confrontos & Duelos
                  </h4>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4">
                    Dossiê pré-jogo de mandante x visitante com histórico direto,
                    fatores casa/fora e detecção de ameaças ofensivas.
                  </p>
                </div>
                <Link
                  to="/scout"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition"
                >
                  <span>Abrir Scout de Duelos</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Card 2: Campeonato Paulista FPFS */}
              <div className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Ativo • FPFS
                    </span>
                  </div>
                  <h4 className="text-white font-bold text-base mb-1">
                    Campeonato Paulista FPFS
                  </h4>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4">
                    Tabelas ao vivo, 24 clubes oficiais, 1.048 súmulas oficiais em PDF
                    e Ranking de Eficiência do Torneio União.
                  </p>
                </div>
                <Link
                  to="/campeonatos"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition"
                >
                  <span>Acessar Tabelas & Jogos</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Card 3: Gestão de Usuários */}
              <div className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Ativo • Segurança
                    </span>
                  </div>
                  <h4 className="text-white font-bold text-base mb-1">
                    Gestão de Usuários & Perfis
                  </h4>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4">
                    Controle de acessos segregados por perfis: Administrador e Comissão Técnica.
                  </p>
                </div>
                {isAdmin ? (
                  <Link
                    to="/usuarios"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition"
                  >
                    <span>Gerenciar Acessos</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="text-xs text-slate-500">
                    Acesso restrito ao Administrador
                  </span>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>

      {/* Modal Ficha Técnica do Atleta */}
      <AtletaModal
        isOpen={atletaModalOpen}
        onClose={() => setAtletaModalOpen(false)}
        temporada={temporada}
        categoria={atletaModalData.categoria || 'Sub-7'}
        idJogador={atletaModalData.idJogador}
        idFase={atletaModalData.idFase}
        nomeAtleta={atletaModalData.nomeAtleta}
      />

      {/* Modal de Localização & Rotas do Ginásio */}
      <GinasioLocalizacaoModal
        isOpen={ginasioModalOpen}
        onClose={() => setGinasioModalOpen(false)}
        ginasioNome={ginasioModalData.nome}
        matchParams={ginasioModalData.matchParams}
      />
    </div>
  );
}
