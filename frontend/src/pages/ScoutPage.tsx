import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Trophy,
  ArrowRightLeft,
  Calendar,
  MapPin,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Home,
  Navigation,
  Flame,
  Search,
  Filter,
  Layers,
  ChevronRight,
  Sparkles,
  Target,
  User,
  Printer,
  Download,
  Loader2,
  Share2,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import AtletaModal from '../components/AtletaModal';
import DossieImpressaoModal from '../components/DossieImpressaoModal';
import GinasioLocalizacaoModal from '../components/GinasioLocalizacaoModal';
import {
  limparNomeGinasio,
  gerarTextoWhatsAppConfronto,
  abrirWhatsApp,
  type WhatsAppConfrontoParams,
} from '../utils/ginasios';
import { useAuth } from '../contexts/AuthContext';
import { scoutService, campeonatosService } from '../services/api';
import { formatarRodada } from '../utils/formatters';
import type {
  ScoutClubeItem,
  PartidaRodadaItem,
  ConfrontoScoutResponse,
  AmeacaArtilheiroItem,
} from '../types';
import toast from 'react-hot-toast';

export default function ScoutPage() {
  const [searchParams] = useSearchParams();
  const { clubeAtivo } = useAuth();
  const [temporada] = useState<number>(2026);
  const [clubes, setClubes] = useState<ScoutClubeItem[]>([]);
  const [partidasRodada, setPartidasRodada] = useState<PartidaRodadaItem[]>([]);
  const [loadingClubes, setLoadingClubes] = useState(true);

  // Seleção
  const [mandante, setMandante] = useState<string>(searchParams.get('mandante') || '');
  const [visitante, setVisitante] = useState<string>(searchParams.get('visitante') || '');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>(
    searchParams.get('categoria') || 'geral'
  ); // 'geral', 'Sub-7', 'Sub-8', 'Sub-9', 'Sub-10'

  // Dados do Dossiê
  const [confronto, setConfronto] = useState<ConfrontoScoutResponse | null>(null);
  const [loadingConfronto, setLoadingConfronto] = useState(false);

  // Modal Ficha do Atleta
  const [atletaModalOpen, setAtletaModalOpen] = useState(false);
  const [atletaModalData, setAtletaModalData] = useState<{
    idJogador?: number;
    idFase?: number;
    nomeAtleta?: string;
    categoria?: string;
  }>({});

  const handleAbrirFichaAtleta = (item: AmeacaArtilheiroItem) => {
    setAtletaModalData({
      idJogador: item.id_jogador,
      idFase: item.id_fase,
      nomeAtleta: item.nome,
      categoria: item.categoria || (categoriaAtiva === 'geral' ? 'Sub-7' : categoriaAtiva),
    });
    setAtletaModalOpen(true);
  };

  // Modal / Dropdown de seleção de partida da rodada
  const [modalPartidasOpen, setModalPartidasOpen] = useState(false);
  const [buscaPartida, setBuscaPartida] = useState('');
  const [filtroApenasAgendadas, setFiltroApenasAgendadas] = useState(true);
  const [filtroMeuClube, setFiltroMeuClube] = useState(false);

  // Modal Dossiê Tático Executivo em PDF
  const [dossieModalOpen, setDossieModalOpen] = useState(false);
  const [baixandoPdfDireto, setBaixandoPdfDireto] = useState(false);

  // Modal de Ginásio & Logística
  const [ginasioModalOpen, setGinasioModalOpen] = useState(false);
  const [ginasioModalData, setGinasioModalData] = useState<{
    nome: string;
    matchParams?: WhatsAppConfrontoParams;
  }>({ nome: '' });

  // Confronto oficial correspondente na rodada (se houver)
  const partidaAtual = partidasRodada.find(
    (p) =>
      (p.mandante.toUpperCase() === mandante.toUpperCase() &&
        p.visitante.toUpperCase() === visitante.toUpperCase()) ||
      (p.mandante.toUpperCase() === visitante.toUpperCase() &&
        p.visitante.toUpperCase() === mandante.toUpperCase())
  );

  const handleBaixarPdfDireto = async () => {
    if (!mandante || !visitante) return;
    try {
      setBaixandoPdfDireto(true);
      toast.loading('Gerando Dossiê Pré-Jogo Oficial em PDF...', { id: 'pdf-direto' });
      await scoutService.baixarPdfConfronto(
        mandante,
        visitante,
        temporada,
        categoriaAtiva,
        partidaAtual
          ? {
              data: partidaAtual.data,
              hora: partidaAtual.hora,
              ginasio: partidaAtual.ginasio,
              rodada: partidaAtual.rodada,
            }
          : undefined
      );
      toast.success('Dossiê em PDF baixado com sucesso!', { id: 'pdf-direto' });
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
      toast.error('Erro ao gerar PDF. Você também pode clicar em Visualizar.', { id: 'pdf-direto' });
    } finally {
      setBaixandoPdfDireto(false);
    }
  };

  // 1. Carregar lista de clubes e partidas da rodada
  useEffect(() => {
    async function carregarDadosIniciais() {
      try {
        setLoadingClubes(true);
        const [resClubes, resPartidas] = await Promise.all([
          scoutService.obterClubes(temporada),
          scoutService.obterPartidasRodada(temporada, 'Sub-7'),
        ]);
        setClubes(resClubes.clubes);
        setPartidasRodada(resPartidas.partidas);

        // Se houver parâmetros na URL, respeita-os
        const paramM = searchParams.get('mandante');
        const paramV = searchParams.get('visitante');
        const paramCat = searchParams.get('categoria');

        if (paramM && paramV) {
          setMandante(paramM);
          setVisitante(paramV);
          if (paramCat) setCategoriaAtiva(paramCat);
        } else if (clubeAtivo) {
          // "Veste a Camisa": Prioriza o PRÓXIMO CONFRONTO REAL do clube (jogo agendado / não encerrado)
          let proxM = '';
          let proxV = '';

          try {
            const resumo = await campeonatosService.obterDashboardResumo(temporada, clubeAtivo);
            if (resumo.meu_clube?.proximo_jogo) {
              proxM = resumo.meu_clube.proximo_jogo.mandante;
              proxV = resumo.meu_clube.proximo_jogo.visitante;
            }
          } catch (e) {
            console.warn('Não foi possível carregar próximo jogo do resumo:', e);
          }

          if (proxM && proxV) {
            setMandante(proxM);
            setVisitante(proxV);
          } else {
            // Fallback: busca na lista de partidas o primeiro confronto agendado do clube
            const proximaPartida = resPartidas.partidas.find(
              (p) =>
                (p.mandante.toUpperCase().includes(clubeAtivo.toUpperCase()) ||
                  p.visitante.toUpperCase().includes(clubeAtivo.toUpperCase()) ||
                  clubeAtivo.toUpperCase().includes(p.mandante.toUpperCase()) ||
                  clubeAtivo.toUpperCase().includes(p.visitante.toUpperCase())) &&
                p.status !== 'Encerrado'
            );

            if (proximaPartida) {
              setMandante(proximaPartida.mandante);
              setVisitante(proximaPartida.visitante);
            } else {
              // Se todos os jogos já foram encerrados, resgata a última partida realizada (mais recente)
              const partidasDoClube = resPartidas.partidas.filter(
                (p) =>
                  p.mandante.toUpperCase().includes(clubeAtivo.toUpperCase()) ||
                  p.visitante.toUpperCase().includes(clubeAtivo.toUpperCase()) ||
                  clubeAtivo.toUpperCase().includes(p.mandante.toUpperCase()) ||
                  clubeAtivo.toUpperCase().includes(p.visitante.toUpperCase())
              );
              const ultima = partidasDoClube[partidasDoClube.length - 1];

              if (ultima) {
                setMandante(ultima.mandante);
                setVisitante(ultima.visitante);
              } else {
                setMandante(clubeAtivo);
                const adversario = resClubes.clubes.find(
                  (c) => c.nome.toUpperCase() !== clubeAtivo.toUpperCase()
                );
                if (adversario) {
                  setVisitante(adversario.nome);
                }
              }
            }
          }
        } else if (!mandante || !visitante) {
          // Se admin geral sem clube simulado, carrega o primeiro jogo agendado da Série A1
          const primeiroAgendado = resPartidas.partidas.find((p) => p.status !== 'Encerrado');
          if (primeiroAgendado) {
            setMandante(primeiroAgendado.mandante);
            setVisitante(primeiroAgendado.visitante);
          } else if (resClubes.clubes.length >= 2) {
            const ordenados = [...resClubes.clubes].sort((a, b) => a.posicao - b.posicao);
            setMandante(ordenados[0].nome);
            setVisitante(ordenados[1].nome);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar clubes para o scout:', err);
        toast.error('Não foi possível carregar os clubes da temporada.');
      } finally {
        setLoadingClubes(false);
      }
    }

    carregarDadosIniciais();
  }, [temporada, searchParams, clubeAtivo]);

  // 2. Carregar confronto quando mandante, visitante ou categoria mudar
  useEffect(() => {
    if (!mandante || !visitante || mandante === visitante) return;

    async function buscarConfronto() {
      try {
        setLoadingConfronto(true);
        const catParam = categoriaAtiva === 'geral' ? undefined : categoriaAtiva;
        const res = await scoutService.obterConfronto(mandante, visitante, temporada, catParam);
        setConfronto(res);
      } catch (err) {
        console.error('Erro ao buscar dossiê de confronto:', err);
        toast.error('Erro ao calcular estatísticas do confronto.');
      } finally {
        setLoadingConfronto(false);
      }
    }

    buscarConfronto();
  }, [mandante, visitante, categoriaAtiva, temporada]);

  // Inverter Mandante x Visitante
  const handleInverterMando = () => {
    const temp = mandante;
    setMandante(visitante);
    setVisitante(temp);
  };

  // Selecionar partida oficial da rodada
  const handleSelecionarPartidaRodada = (p: PartidaRodadaItem) => {
    setMandante(p.mandante);
    setVisitante(p.visitante);
    setModalPartidasOpen(false);
    toast.success(`Confronto carregado: ${p.mandante} x ${p.visitante}`);
  };

  // Obter clube pelo nome
  const getClubeInfo = (nome: string) => clubes.find((c) => c.nome.toUpperCase() === nome.toUpperCase());

  // Badges de Chave
  const getChaveBadge = (chave?: string) => {
    if (chave === 'OURO') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-400/15 text-amber-400 border border-amber-400/30">
          OURO (1º-8º)
        </span>
      );
    }
    if (chave === 'PRATA') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-400/15 text-slate-300 border border-slate-400/30">
          PRATA (9º-16º)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-700/15 text-amber-600 border border-amber-600/30">
        BRONZE (17º-24º)
      </span>
    );
  };

  // Renderizar tag do resultado nos últimos 5 jogos
  const renderResultadoTag = (res: 'V' | 'E' | 'D') => {
    if (res === 'V') {
      return (
        <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
          V
        </span>
      );
    }
    if (res === 'E') {
      return (
        <span className="w-6 h-6 rounded-md bg-slate-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
          E
        </span>
      );
    }
    return (
      <span className="w-6 h-6 rounded-md bg-rose-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
        D
      </span>
    );
  };

  // Renderizar dificuldade do oponente
  const renderNivelOponente = (pos?: number | null, chave?: string) => {
    if (!pos) return <span className="text-slate-500 text-xs">-</span>;

    let cor = 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    let peso = 'Pedreira (Top 8)';

    if (pos > 8 && pos <= 16) {
      cor = 'text-blue-300 bg-blue-500/10 border-blue-500/20';
      peso = 'Intermediário';
    } else if (pos > 16) {
      cor = 'text-slate-400 bg-slate-700/30 border-slate-600/30';
      peso = 'Zona Inferior';
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${cor}`}
        title={`Classificação no Torneio União: ${pos}º (${chave})`}
      >
        <span>{pos}º Colocado</span>
        <span className="text-[9px] opacity-70 font-normal">({peso})</span>
      </span>
    );
  };

  const mandanteInfo = confronto?.mandante.info;
  const visitanteInfo = confronto?.visitante.info;
  const mandanteMando = confronto?.mandante.estatisticas_mando.casa;
  const visitanteMando = confronto?.visitante.estatisticas_mando.fora;

  const partidasFiltradas = partidasRodada
    .filter((p) => {
      if (filtroApenasAgendadas && p.status === 'Encerrado') return false;
      if (filtroMeuClube && clubeAtivo) {
        const c = clubeAtivo.toLowerCase();
        const match =
          p.mandante.toLowerCase().includes(c) ||
          p.visitante.toLowerCase().includes(c) ||
          c.includes(p.mandante.toLowerCase()) ||
          c.includes(p.visitante.toLowerCase());
        if (!match) return false;
      }
      if (!buscaPartida) return true;
      const b = buscaPartida.toLowerCase();
      return (
        p.mandante.toLowerCase().includes(b) ||
        p.visitante.toLowerCase().includes(b) ||
        p.ginasio.toLowerCase().includes(b)
      );
    })
    .sort((a, b) => {
      // Prioriza agendados no topo
      if (a.status !== 'Encerrado' && b.status === 'Encerrado') return -1;
      if (a.status === 'Encerrado' && b.status !== 'Encerrado') return 1;
      // Se houver clube ativo, prioriza partidas do clube
      if (clubeAtivo) {
        const c = clubeAtivo.toLowerCase();
        const aMeu = a.mandante.toLowerCase().includes(c) || a.visitante.toLowerCase().includes(c);
        const bMeu = b.mandante.toLowerCase().includes(c) || b.visitante.toLowerCase().includes(c);
        if (aMeu && !bMeu) return -1;
        if (!aMeu && bMeu) return 1;
      }
      return 0;
    });

  const totalAgendadas = partidasRodada.filter((p) => p.status !== 'Encerrado').length;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <div className="no-print">
        <Sidebar />
      </div>

      <main id="scout-page-main" className="flex-1 flex flex-col min-w-0 overflow-x-hidden no-print">
        <div className="flex-1 p-3 sm:p-5 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* ========================================================================= */}
          {/* HEADER PRINCIPAL & AÇÕES RÁPIDAS */}
          {/* ========================================================================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Dossiê Pré-Jogo
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-xs font-medium">Temporada {temporada}</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Análise Técnica de Confronto
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Raio-X tático e estatístico comparando o mandante em seus domínios contra o visitante fora de casa.
              </p>
            </div>

            {/* Ações Rápidas: Baixar PDF Oficial + Visualizar / Imprimir + Confrontos da Rodada */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleBaixarPdfDireto}
                disabled={!confronto || baixandoPdfDireto}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs sm:text-sm font-black transition shadow-lg shadow-emerald-600/30 active:scale-95 cursor-pointer"
                title="Baixar PDF Oficial de 1 página pronto para prancheta técnica"
              >
                {baixandoPdfDireto ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{baixandoPdfDireto ? 'Gerando PDF...' : 'Baixar Dossiê (PDF)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setDossieModalOpen(true)}
                disabled={!confronto}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 disabled:opacity-50 text-slate-200 text-xs sm:text-sm font-semibold transition shadow-sm active:scale-95 cursor-pointer"
                title="Pré-visualizar folha A4 e imprimir pelo navegador"
              >
                <Printer className="w-4 h-4 text-blue-400" />
                <span>Visualizar Folha</span>
              </button>

              <button
                type="button"
                onClick={() => setModalPartidasOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition shadow-sm active:scale-95 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Confrontos da Rodada</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-blue-600/30 text-blue-300 rounded font-bold">
                  {partidasRodada.length}
                </span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PAINEL DE SELEÇÃO DOS CLUBES */}
          {/* ========================================================================= */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg shadow-black/40">
            <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
              {/* Mandante */}
              <div className="lg:col-span-5 bg-slate-950/60 p-3.5 sm:p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider">
                    <Home className="w-3.5 h-3.5" /> Mandante (Em Casa)
                  </span>
                  {mandanteInfo && getChaveBadge(mandanteInfo.chave)}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center shrink-0">
                    <img
                      src={getClubeInfo(mandante)?.escudo_url || '/fpfs_shield.png'}
                      alt={mandante}
                      className="w-10 h-10 object-contain drop-shadow"
                      onError={(e) => {
                        e.currentTarget.src = '/fpfs_shield.png';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <select
                      value={mandante}
                      onChange={(e) => setMandante(e.target.value)}
                      disabled={loadingClubes}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm sm:text-base font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      {clubes.map((c, idx) => (
                        <option key={`m-${c.nome}-${idx}`} value={c.nome} disabled={c.nome === visitante}>
                          {c.posicao}º - {c.nome}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      {mandanteInfo ? `${mandanteInfo.pontos_total} pts • ${mandanteInfo.jogos_total} jogos no União` : 'Carregando dados...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botão de Inverter */}
              <div className="lg:col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={handleInverterMando}
                  title="Inverter mando de quadra"
                  className="w-11 h-11 rounded-full bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 text-slate-300 hover:text-white flex items-center justify-center transition shadow-md active:scale-90"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Visitante */}
              <div className="lg:col-span-5 bg-slate-950/60 p-3.5 sm:p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <Navigation className="w-3.5 h-3.5" /> Visitante (Fora)
                  </span>
                  {visitanteInfo && getChaveBadge(visitanteInfo.chave)}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center shrink-0">
                    <img
                      src={getClubeInfo(visitante)?.escudo_url || '/fpfs_shield.png'}
                      alt={visitante}
                      className="w-10 h-10 object-contain drop-shadow"
                      onError={(e) => {
                        e.currentTarget.src = '/fpfs_shield.png';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <select
                      value={visitante}
                      onChange={(e) => setVisitante(e.target.value)}
                      disabled={loadingClubes}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm sm:text-base font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 cursor-pointer"
                    >
                      {clubes.map((c, idx) => (
                        <option key={`v-${c.nome}-${idx}`} value={c.nome} disabled={c.nome === mandante}>
                          {c.posicao}º - {c.nome}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      {visitanteInfo ? `${visitanteInfo.pontos_total} pts • ${visitanteInfo.jogos_total} jogos no União` : 'Carregando dados...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SELETOR DE ESCOPO / CATEGORIA */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Escopo da Análise:
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'geral', label: 'Torneio União (Geral)' },
                  { id: 'Sub-7', label: 'Sub-7' },
                  { id: 'Sub-8', label: 'Sub-8' },
                  { id: 'Sub-9', label: 'Sub-9' },
                  { id: 'Sub-10', label: 'Sub-10' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCategoriaAtiva(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      categoriaAtiva === tab.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* INFORMAÇÃO OFICIAL DA PARTIDA & LOGÍSTICA DE DESLOCAMENTO */}
            {partidaAtual && (
              <div className="mt-4 pt-3 border-t border-slate-800/80 bg-slate-950/60 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-3.5 sm:p-4 rounded-b-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-sm">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-extrabold text-white">
                        📅 {partidaAtual.data} {partidaAtual.hora ? `às ${partidaAtual.hora}` : ''}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400 font-semibold">{formatarRodada(partidaAtual.rodada)}</span>
                      {partidaAtual.status !== 'Encerrado' ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-black">
                          Partida Agendada
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-semibold">
                          Encerrada
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate text-slate-300 font-medium">
                        {limparNomeGinasio(partidaAtual.ginasio || 'Ginásio oficial da FPFS')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setGinasioModalData({
                        nome: partidaAtual.ginasio,
                        matchParams: {
                          mandante: partidaAtual.mandante,
                          visitante: partidaAtual.visitante,
                          data: partidaAtual.data,
                          hora: partidaAtual.hora,
                          rodada: formatarRodada(partidaAtual.rodada),
                          categoria: categoriaAtiva,
                          ginasio: partidaAtual.ginasio,
                        },
                      });
                      setGinasioModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-xs font-bold transition cursor-pointer active:scale-95"
                    title="Ver rotas no Google Maps e Waze"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Como Chegar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const texto = gerarTextoWhatsAppConfronto({
                        mandante: partidaAtual.mandante,
                        visitante: partidaAtual.visitante,
                        data: partidaAtual.data,
                        hora: partidaAtual.hora,
                        rodada: formatarRodada(partidaAtual.rodada),
                        categoria: categoriaAtiva,
                        ginasio: partidaAtual.ginasio,
                      });
                      abrirWhatsApp(texto);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition cursor-pointer active:scale-95"
                    title="Compartilhar convocação no WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {loadingConfronto ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
              <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-3" />
              <p className="text-sm font-semibold text-slate-300">
                Compilando dossiê estatístico e tático do confronto...
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Calculando fator mando de quadra, margens e força dos adversários enfrentados
              </p>
            </div>
          ) : !confronto ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">
                Selecione o Mandante e o Visitante para gerar a análise técnica.
              </p>
            </div>
          ) : (
            <>
              {/* ========================================================================= */}
              {/* BLOCO 1: COMPARATIVO GERAL TORNEIO UNIÃO & MARGENS */}
              {/* ========================================================================= */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <h2 className="text-sm sm:text-base font-extrabold text-white">
                        Termômetro no Torneio União (Quadro Geral)
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Classificação unificada das 4 categorias, pontos e margens competitivas
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <Sparkles className="w-3 h-3 text-blue-400" /> Série A1 FPFS
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card Mandante União */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={mandanteInfo?.escudo_url || '/fpfs_shield.png'}
                          alt={mandante}
                          className="w-7 h-7 object-contain"
                        />
                        <p className="font-extrabold text-white text-sm sm:text-base truncate">
                          {mandante}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-blue-400">
                        {mandanteInfo?.posicao}º Colocado
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-900/80 rounded-lg border border-slate-800/60">
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium">Pontos</p>
                        <p className="text-lg font-black text-white">{mandanteInfo?.pontos_total}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium">Jogos</p>
                        <p className="text-lg font-black text-slate-300">{mandanteInfo?.jogos_total}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium">Índice Téc.</p>
                        <p className="text-lg font-black text-blue-400">{mandanteInfo?.indice_tecnico}</p>
                      </div>
                    </div>

                    {/* Margens */}
                    <div className="space-y-1.5 pt-1 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Distância do Líder (1º):
                        </span>
                        <span className="font-bold text-white">
                          {mandanteInfo?.diferenca_lider === 0 ? (
                            <span className="text-amber-400 font-extrabold">É o Líder!</span>
                          ) : (
                            `-${mandanteInfo?.diferenca_lider} pts`
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          {mandanteInfo?.status_rebaixamento === 'Livre' ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                          )}
                          Margem Rebaixamento (22º):
                        </span>
                        <span
                          className={`font-bold ${
                            mandanteInfo?.status_rebaixamento === 'Livre'
                              ? 'text-blue-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {mandanteInfo?.status_rebaixamento === 'Livre'
                            ? `+${mandanteInfo?.margem_rebaixamento} pts acima`
                            : `${mandanteInfo?.margem_rebaixamento} pts para sair da Zona`}
                        </span>
                      </div>

                      {/* Campanha Geral Oficial FPFS */}
                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Campanha Geral FPFS:</span>
                        <span className="font-extrabold text-white">
                          {mandanteInfo?.jogos_total}J • {mandanteInfo?.vitorias_total}V - {mandanteInfo?.empates_total}E - {mandanteInfo?.derrotas_total}D
                          <span className="text-slate-400 font-normal ml-1">
                            (SG: {mandanteInfo?.saldo_gols_total && mandanteInfo.saldo_gols_total > 0 ? `+${mandanteInfo.saldo_gols_total}` : mandanteInfo?.saldo_gols_total})
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Visitante União */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={visitanteInfo?.escudo_url || '/fpfs_shield.png'}
                          alt={visitante}
                          className="w-7 h-7 object-contain"
                        />
                        <p className="font-extrabold text-white text-sm sm:text-base truncate">
                          {visitante}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-amber-400">
                        {visitanteInfo?.posicao}º Colocado
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-900/80 rounded-lg border border-slate-800/60">
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium">Pontos</p>
                        <p className="text-lg font-black text-white">{visitanteInfo?.pontos_total}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium">Jogos</p>
                        <p className="text-lg font-black text-slate-300">{visitanteInfo?.jogos_total}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-amber-400 font-medium">Índice Téc.</p>
                        <p className="text-lg font-black text-amber-400">{visitanteInfo?.indice_tecnico}</p>
                      </div>
                    </div>

                    {/* Margens */}
                    <div className="space-y-1.5 pt-1 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Distância do Líder (1º):
                        </span>
                        <span className="font-bold text-white">
                          {visitanteInfo?.diferenca_lider === 0 ? (
                            <span className="text-amber-400 font-extrabold">É o Líder!</span>
                          ) : (
                            `-${visitanteInfo?.diferenca_lider} pts`
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          {visitanteInfo?.status_rebaixamento === 'Livre' ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                          )}
                          Margem Rebaixamento (22º):
                        </span>
                        <span
                          className={`font-bold ${
                            visitanteInfo?.status_rebaixamento === 'Livre'
                              ? 'text-blue-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {visitanteInfo?.status_rebaixamento === 'Livre'
                            ? `+${visitanteInfo?.margem_rebaixamento} pts acima`
                            : `${visitanteInfo?.margem_rebaixamento} pts para sair da Zona`}
                        </span>
                      </div>

                      {/* Campanha Geral Oficial FPFS */}
                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Campanha Geral FPFS:</span>
                        <span className="font-extrabold text-white">
                          {visitanteInfo?.jogos_total}J • {visitanteInfo?.vitorias_total}V - {visitanteInfo?.empates_total}E - {visitanteInfo?.derrotas_total}D
                          <span className="text-slate-400 font-normal ml-1">
                            (SG: {visitanteInfo?.saldo_gols_total && visitanteInfo.saldo_gols_total > 0 ? `+${visitanteInfo.saldo_gols_total}` : visitanteInfo?.saldo_gols_total})
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* BLOCO 2: RAIO-X POR CATEGORIA (SUB-7 AO SUB-10) */}
              {/* ========================================================================= */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-400 shrink-0" />
                    <div>
                      <h2 className="text-sm sm:text-base font-extrabold text-white">
                        Classificação e Chave por Categoria (Sub-7 a Sub-10)
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Como cada time está pontuando individualmente em cada faixa etária
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {confronto.sub_categorias.map((sc) => {
                    const mCat = sc.mandante;
                    const vCat = sc.visitante;
                    const isSelected = categoriaAtiva === sc.categoria;

                    return (
                      <div
                        key={sc.categoria}
                        onClick={() =>
                          setCategoriaAtiva(isSelected ? 'geral' : sc.categoria)
                        }
                        className={`p-3.5 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
                          <span className="font-extrabold text-sm text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            {sc.categoria}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                              Filtrado
                            </span>
                          )}
                        </div>

                        {/* Mandante Linha */}
                        <div className="flex items-center justify-between text-xs py-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-blue-400 font-black text-xs shrink-0">M:</span>
                            <span className="text-slate-200 font-semibold truncate">
                              {mandante}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-white">
                              {mCat ? `${mCat.posicao}º` : '-'}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">
                              ({mCat?.pontos ?? 0} pts)
                            </span>
                          </div>
                        </div>

                        {/* Visitante Linha */}
                        <div className="flex items-center justify-between text-xs py-1.5 border-t border-slate-800/50">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-amber-400 font-black text-xs shrink-0">V:</span>
                            <span className="text-slate-200 font-semibold truncate">
                              {visitante}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-white">
                              {vCat ? `${vCat.posicao}º` : '-'}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">
                              ({vCat?.pontos ?? 0} pts)
                            </span>
                          </div>
                        </div>

                        {/* Chaves */}
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">
                            {mCat?.chave ? `Chave ${mCat.chave}` : '-'}
                          </span>
                          <span className="text-slate-500">vs</span>
                          <span className="text-slate-400">
                            {vCat?.chave ? `Chave ${vCat.chave}` : '-'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* BLOCO 3: FATOR MANDO DE QUADRA (CASA VS FORA) */}
              {/* ========================================================================= */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-blue-400 shrink-0" />
                    <div>
                      <h2 className="text-sm sm:text-base font-extrabold text-white">
                        Fator Mando de Quadra: Mandante em Casa vs Visitante Fora
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Aproveitamento real de pontos e poderio de ataque e defesa de acordo com o local de jogo
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                    Filtro: {categoriaAtiva === 'geral' ? 'Todas as Categorias' : categoriaAtiva}
                  </span>
                </div>

                {/* Banner Explicativo do Recorte de Mando */}
                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-slate-300 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="text-white">Entenda a Análise de Mando:</strong> Dos{' '}
                    <strong className="text-white">{mandanteInfo?.jogos_total} jogos oficiais totais</strong> disputados na FPFS por cada clube, este bloco filtra exclusivamente o histórico de quando o{' '}
                    <strong className="text-blue-400">{mandante} jogou em Casa ({mandanteMando?.jogos}J)</strong>{' '}
                    contra quando o{' '}
                    <strong className="text-amber-400">{visitante} jogou Fora de Casa ({visitanteMando?.jogos}J)</strong>.
                    A soma de jogos em casa + fora equivale exatamente à campanha geral unificada da Federação.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card Mandante em Casa */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-blue-400" />
                        <span className="font-extrabold text-white text-sm truncate">
                          {mandante} (EM CASA)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base sm:text-lg font-black text-blue-400">
                          {mandanteMando?.aproveitamento ?? 0}%
                        </span>
                        <span className="text-[10px] text-slate-400 block -mt-1 font-medium">
                          Aproveitamento
                        </span>
                      </div>
                    </div>

                    {/* Linha J / V / E / D */}
                    <div className="grid grid-cols-4 gap-2 text-center p-2.5 bg-slate-900/90 rounded-lg border border-slate-800/80">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Jogos Casa</p>
                        <p className="text-base font-extrabold text-white">{mandanteMando?.jogos ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-blue-400 font-bold uppercase">Vitórias</p>
                        <p className="text-base font-extrabold text-blue-400">{mandanteMando?.vitorias ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Empates</p>
                        <p className="text-base font-extrabold text-slate-300">{mandanteMando?.empates ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-rose-400 font-bold uppercase">Derrotas</p>
                        <p className="text-base font-extrabold text-rose-400">{mandanteMando?.derrotas ?? 0}</p>
                      </div>
                    </div>

                    {/* Linha Comparativa Geral FPFS */}
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Total Geral FPFS (Casa + Fora):</span>
                      <span className="font-extrabold text-slate-200">
                        {mandanteInfo?.jogos_total}J • {mandanteInfo?.vitorias_total}V - {mandanteInfo?.empates_total}E - {mandanteInfo?.derrotas_total}D
                      </span>
                    </div>

                    {/* Médias de GP / GC */}
                    <div className="grid grid-cols-3 gap-2 text-center p-2 bg-slate-900/50 rounded-lg text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Média GP/Jogo</span>
                        <span className="font-black text-white text-sm">
                          {mandanteMando?.media_gols_pro ?? 0}
                        </span>
                        <span className="text-[9px] text-slate-500 block">({mandanteMando?.gols_pro} gols)</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Média GC/Jogo</span>
                        <span className="font-black text-white text-sm">
                          {mandanteMando?.media_gols_contra ?? 0}
                        </span>
                        <span className="text-[9px] text-slate-500 block">({mandanteMando?.gols_contra} sofridos)</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Saldo Casa</span>
                        <span
                          className={`font-black text-sm ${
                            (mandanteMando?.saldo_gols ?? 0) >= 0 ? 'text-blue-400' : 'text-rose-400'
                          }`}
                        >
                          {(mandanteMando?.saldo_gols ?? 0) > 0 ? `+${mandanteMando?.saldo_gols}` : mandanteMando?.saldo_gols ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Visitante Fora */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-amber-400" />
                        <span className="font-extrabold text-white text-sm truncate">
                          {visitante} (FORA DE CASA)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base sm:text-lg font-black text-amber-400">
                          {visitanteMando?.aproveitamento ?? 0}%
                        </span>
                        <span className="text-[10px] text-slate-400 block -mt-1 font-medium">
                          Aproveitamento
                        </span>
                      </div>
                    </div>

                    {/* Linha J / V / E / D */}
                    <div className="grid grid-cols-4 gap-2 text-center p-2.5 bg-slate-900/90 rounded-lg border border-slate-800/80">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Jogos Fora</p>
                        <p className="text-base font-extrabold text-white">{visitanteMando?.jogos ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-amber-400 font-bold uppercase">Vitórias</p>
                        <p className="text-base font-extrabold text-amber-400">{visitanteMando?.vitorias ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Empates</p>
                        <p className="text-base font-extrabold text-slate-300">{visitanteMando?.empates ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-rose-400 font-bold uppercase">Derrotas</p>
                        <p className="text-base font-extrabold text-rose-400">{visitanteMando?.derrotas ?? 0}</p>
                      </div>
                    </div>

                    {/* Linha Comparativa Geral FPFS */}
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Total Geral FPFS (Casa + Fora):</span>
                      <span className="font-extrabold text-slate-200">
                        {visitanteInfo?.jogos_total}J • {visitanteInfo?.vitorias_total}V - {visitanteInfo?.empates_total}E - {visitanteInfo?.derrotas_total}D
                      </span>
                    </div>

                    {/* Médias de GP / GC */}
                    <div className="grid grid-cols-3 gap-2 text-center p-2 bg-slate-900/50 rounded-lg text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Média GP/Jogo</span>
                        <span className="font-black text-white text-sm">
                          {visitanteMando?.media_gols_pro ?? 0}
                        </span>
                        <span className="text-[9px] text-slate-500 block">({visitanteMando?.gols_pro} gols)</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Média GC/Jogo</span>
                        <span className="font-black text-white text-sm">
                          {visitanteMando?.media_gols_contra ?? 0}
                        </span>
                        <span className="text-[9px] text-slate-500 block">({visitanteMando?.gols_contra} sofridos)</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Saldo Fora</span>
                        <span
                          className={`font-black text-sm ${
                            (visitanteMando?.saldo_gols ?? 0) >= 0 ? 'text-amber-400' : 'text-rose-400'
                          }`}
                        >
                          {(visitanteMando?.saldo_gols ?? 0) > 0 ? `+${visitanteMando?.saldo_gols}` : visitanteMando?.saldo_gols ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* BLOCO 4: MOMENTO E NÍVEL DE DIFICULDADE DOS ÚLTIMOS 5 JOGOS */}
              {/* ========================================================================= */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-1">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <h2 className="text-sm sm:text-base font-extrabold text-white">
                        Termômetro Recente & Nível dos Adversários Enfrentados
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Últimos 5 jogos com placar, mando e a colocação do oponente enfrentado no Torneio União
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Últimos 5 do Mandante */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={mandanteInfo?.escudo_url || '/fpfs_shield.png'}
                        alt={mandante}
                        className="w-5 h-5 object-contain"
                      />
                      <h3 className="font-extrabold text-white text-sm">
                        Últimos Jogos: {mandante}
                      </h3>
                    </div>

                    {confronto.mandante.ultimos_jogos.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3 bg-slate-950/50 rounded-xl text-center border border-slate-800">
                        Nenhum jogo recente registrado nesta categoria.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {confronto.mandante.ultimos_jogos.map((j, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-slate-700 transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {renderResultadoTag(j.resultado)}
                              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 p-0.5 flex items-center justify-center shrink-0">
                                <img
                                  src={j.adversario_escudo}
                                  alt={j.adversario}
                                  className="w-6 h-6 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.src = '/fpfs_shield.png';
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-200 truncate">
                                  vs {j.adversario}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  <span>{j.categoria}</span>
                                  <span>•</span>
                                  <span>{j.mando === 'Casa' ? 'Em Casa' : 'Fora'}</span>
                                  <span>•</span>
                                  <span>{j.data}</span>
                                </div>
                              </div>
                            </div>

                            {/* Placar e Posição do Oponente */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                              <span className="font-mono font-black text-sm text-white bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                                {j.placar}
                              </span>
                              {renderNivelOponente(j.adversario_posicao, j.adversario_chave)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Últimos 5 do Visitante */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={visitanteInfo?.escudo_url || '/fpfs_shield.png'}
                        alt={visitante}
                        className="w-5 h-5 object-contain"
                      />
                      <h3 className="font-extrabold text-white text-sm">
                        Últimos Jogos: {visitante}
                      </h3>
                    </div>

                    {confronto.visitante.ultimos_jogos.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3 bg-slate-950/50 rounded-xl text-center border border-slate-800">
                        Nenhum jogo recente registrado nesta categoria.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {confronto.visitante.ultimos_jogos.map((j, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-slate-700 transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {renderResultadoTag(j.resultado)}
                              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 p-0.5 flex items-center justify-center shrink-0">
                                <img
                                  src={j.adversario_escudo}
                                  alt={j.adversario}
                                  className="w-6 h-6 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.src = '/fpfs_shield.png';
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-200 truncate">
                                  vs {j.adversario}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  <span>{j.categoria}</span>
                                  <span>•</span>
                                  <span>{j.mando === 'Casa' ? 'Em Casa' : 'Fora'}</span>
                                  <span>•</span>
                                  <span>{j.data}</span>
                                </div>
                              </div>
                            </div>

                            {/* Placar e Posição do Oponente */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                              <span className="font-mono font-black text-sm text-white bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                                {j.placar}
                              </span>
                              {renderNivelOponente(j.adversario_posicao, j.adversario_chave)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* BLOCO 5: PRINCIPAIS AMEAÇAS & ARTILHEIROS DO CONFRONTO */}
              {/* ========================================================================= */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-1">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-rose-400 shrink-0" />
                    <div>
                      <h2 className="text-sm sm:text-base font-extrabold text-white">
                        Principais Ameaças & Artilheiros do Confronto
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Atletas com maior poderio de fogo e alertas de perigo prévio contra as equipes
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs text-slate-400">
                    Toque no atleta para abrir a Ficha Técnica Completa
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Artilheiros do Mandante */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={mandanteInfo?.escudo_url || '/fpfs_shield.png'}
                        alt={mandante}
                        className="w-5 h-5 object-contain"
                      />
                      <h3 className="font-extrabold text-white text-sm">
                        Artilheiros: {mandante}
                      </h3>
                    </div>

                    {!confronto.mandante.principais_artilheiros || confronto.mandante.principais_artilheiros.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 bg-slate-950/50 rounded-xl text-center border border-slate-800">
                        Nenhum artilheiro catalogado nesta categoria.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {confronto.mandante.principais_artilheiros.map((art, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleAbrirFichaAtleta(art)}
                            title="Clique para abrir a Ficha Técnica deste Atleta"
                            className="bg-slate-950/70 hover:bg-blue-950/30 border border-slate-800 hover:border-blue-500/50 rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer transition group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative shrink-0">
                                {art.foto_url ? (
                                  <img
                                    src={art.foto_url}
                                    alt={art.nome}
                                    className="w-10 h-10 rounded-full object-cover border border-slate-700 shadow"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                                    <User className="w-5 h-5" />
                                  </div>
                                )}
                                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-[9px] font-black text-white flex items-center justify-center shadow">
                                  {idx + 1}º
                                </span>
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate group-hover:text-blue-300 transition">
                                  {art.nome}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  {art.categoria && <span>{art.categoria}</span>}
                                  {art.marcou_contra_adversario && (
                                    <span className="text-rose-400 font-bold flex items-center gap-1">
                                      ⚠️ Já marcou {art.gols_contra_adversario} gol(s) no {visitante}!
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-mono font-black text-sm text-white bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                                {art.gols} gols
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Artilheiros do Visitante (Ameaça para o Mandante) */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={visitanteInfo?.escudo_url || '/fpfs_shield.png'}
                        alt={visitante}
                        className="w-5 h-5 object-contain"
                      />
                      <h3 className="font-extrabold text-white text-sm">
                        Ameaças do Adversário: {visitante}
                      </h3>
                    </div>

                    {!confronto.visitante.principais_artilheiros || confronto.visitante.principais_artilheiros.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 bg-slate-950/50 rounded-xl text-center border border-slate-800">
                        Nenhum artilheiro catalogado nesta categoria.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {confronto.visitante.principais_artilheiros.map((art, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleAbrirFichaAtleta(art)}
                            title="Clique para abrir a Ficha Técnica deste Atleta"
                            className={`bg-slate-950/70 hover:bg-amber-950/20 border rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer transition group ${
                              art.marcou_contra_adversario
                                ? 'border-rose-500/50 bg-rose-950/15 ring-1 ring-rose-500/30'
                                : 'border-slate-800 hover:border-amber-500/50'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative shrink-0">
                                {art.foto_url ? (
                                  <img
                                    src={art.foto_url}
                                    alt={art.nome}
                                    className="w-10 h-10 rounded-full object-cover border border-slate-700 shadow"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                                    <User className="w-5 h-5" />
                                  </div>
                                )}
                                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-[9px] font-black text-slate-950 flex items-center justify-center shadow">
                                  {idx + 1}º
                                </span>
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition">
                                  {art.nome}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  {art.categoria && <span>{art.categoria}</span>}
                                  {art.marcou_contra_adversario ? (
                                    <span className="text-rose-400 font-extrabold flex items-center gap-1 bg-rose-500/15 px-1.5 py-0.5 rounded border border-rose-500/20">
                                      ⚠️ Alerta: Marcou {art.gols_contra_adversario} gol(s) no {mandante}!
                                    </span>
                                  ) : (
                                    <span>{art.gols} gols no Paulista</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-mono font-black text-sm text-amber-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                                {art.gols} gols
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* BLOCO 6: HISTÓRICO DE CONFRONTO DIRETO (H2H) */}
              {/* ========================================================================= */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400 shrink-0" />
                    <div>
                      <h2 className="text-sm sm:text-base font-extrabold text-white">
                        Histórico de Confrontos Diretos ({mandante} x {visitante})
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Duelos já realizados ou agendados entre as duas agremiações nesta temporada
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {confronto.confronto_direto.length} duelo(s)
                  </span>
                </div>

                {confronto.confronto_direto.length === 0 ? (
                  <div className="py-6 text-center bg-slate-950/40 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400">
                      Nenhum confronto direto registrado entre {mandante} e {visitante} para o filtro selecionado.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {confronto.confronto_direto.map((c, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-bold text-blue-400">{c.rodada || 'Fase Classificatória'}</span>
                          <span>{c.data} {c.hora ? `• ${c.hora}` : ''}</span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          {/* Mandante */}
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <img
                              src={c.escudo_mandante}
                              alt={c.mandante}
                              className="w-6 h-6 object-contain shrink-0"
                            />
                            <span className="text-xs font-bold text-white truncate">
                              {c.mandante}
                            </span>
                          </div>

                          {/* Placar */}
                          <div className="px-3 py-1 bg-slate-900 rounded-md border border-slate-800 font-mono font-extrabold text-sm text-white shrink-0">
                            {c.placar_mandante !== null ? `${c.placar_mandante} x ${c.placar_visitante}` : 'vs'}
                          </div>

                          {/* Visitante */}
                          <div className="flex items-center justify-end gap-2 min-w-0 flex-1">
                            <span className="text-xs font-bold text-white truncate text-right">
                              {c.visitante}
                            </span>
                            <img
                              src={c.escudo_visitante}
                              alt={c.visitante}
                              className="w-6 h-6 object-contain shrink-0"
                            />
                          </div>
                        </div>

                        {c.ginasio && (
                          <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {c.ginasio}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <Footer />
      </main>

      {/* ========================================================================= */}
      {/* MODAL / SLIDE-OVER: CONFRONTOS DA RODADA OFICIAL */}
      {/* ========================================================================= */}
      {modalPartidasOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Confrontos Oficiais da Rodada
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Clique em um duelo para carregar automaticamente o mandante e visitante no Scout
                </p>
              </div>
              <button
                onClick={() => setModalPartidasOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Busca & Filtros Rápidos */}
            <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950/40 space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={buscaPartida}
                  onChange={(e) => setBuscaPartida(e.target.value)}
                  placeholder="Filtrar por clube ou ginásio..."
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Filtros Rápidos no Modal */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <button
                  type="button"
                  onClick={() => setFiltroApenasAgendadas(!filtroApenasAgendadas)}
                  className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    filtroApenasAgendadas
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${filtroApenasAgendadas ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  <span>Apenas Próximos Jogos ({totalAgendadas})</span>
                </button>

                {clubeAtivo && (
                  <button
                    type="button"
                    onClick={() => setFiltroMeuClube(!filtroMeuClube)}
                    className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                      filtroMeuClube
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <span>🛡️ Jogos do {clubeAtivo}</span>
                  </button>
                )}

                <span className="text-[11px] text-slate-500 ml-auto">
                  {partidasFiltradas.length} {partidasFiltradas.length === 1 ? 'jogo' : 'jogos'}
                </span>
              </div>
            </div>

            {/* Lista de Partidas */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
              {partidasFiltradas.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Nenhuma partida encontrada para os filtros selecionados.
                </div>
              ) : (
                partidasFiltradas.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelecionarPartidaRodada(p)}
                    className="bg-slate-950/70 hover:bg-blue-950/20 border border-slate-800 hover:border-blue-500/50 rounded-xl p-3.5 cursor-pointer transition flex items-center justify-between gap-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1.5 flex-wrap">
                        <span className="font-semibold text-blue-400">{p.data}</span>
                        {p.hora && <span>• {p.hora}</span>}
                        {p.rodada && <span className="hidden sm:inline">• {formatarRodada(p.rodada)}</span>}
                        {p.status !== 'Encerrado' ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold">
                            Próximo Jogo
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700 text-[10px]">
                            Encerrado
                          </span>
                        )}
                      </div>

                      {/* Confronto */}
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white">
                        <img
                          src={p.escudo_mandante}
                          alt={p.mandante}
                          className="w-5 h-5 object-contain shrink-0"
                        />
                        <span className="truncate">{p.mandante}</span>
                        <span className="text-slate-500 font-normal px-1">x</span>
                        <img
                          src={p.escudo_visitante}
                          alt={p.visitante}
                          className="w-5 h-5 object-contain shrink-0"
                        />
                        <span className="truncate">{p.visitante}</span>
                      </div>

                      {p.ginasio && (
                        <p className="text-[10px] text-slate-500 truncate mt-1 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" /> {p.ginasio}
                        </p>
                      )}
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Ficha do Atleta */}
      <AtletaModal
        isOpen={atletaModalOpen}
        onClose={() => setAtletaModalOpen(false)}
        temporada={temporada}
        categoria={atletaModalData.categoria || 'Sub-7'}
        idJogador={atletaModalData.idJogador}
        idFase={atletaModalData.idFase}
        nomeAtleta={atletaModalData.nomeAtleta}
      />

      {/* Modal Dossiê Tático Executivo em PDF / Impressão A4 */}
      <DossieImpressaoModal
        isOpen={dossieModalOpen}
        onClose={() => setDossieModalOpen(false)}
        confronto={confronto}
        mandante={mandante}
        visitante={visitante}
        categoriaAtiva={categoriaAtiva}
        mandanteInfo={mandanteInfo || null}
        visitanteInfo={visitanteInfo || null}
        partidaInfo={partidaAtual || null}
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
