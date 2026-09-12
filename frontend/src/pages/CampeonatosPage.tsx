import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import AtletaModal from '../components/AtletaModal';
import { useAuth } from '../contexts/AuthContext';
import { campeonatosService } from '../services/api';
import { formatarRodada } from '../utils/formatters';
import type {
  ClassificacaoItem,
  RankingEficienciaItem,
  JogoItem,
  ArtilheiroItem,
} from '../types';
import toast from 'react-hot-toast';
import {
  Trophy,
  Calendar,
  Layers,
  RefreshCw,
  FileText,
  Search,
  ExternalLink,
  Info,
  Shield,
  Award,
  AlertTriangle,
  TrendingUp,
  Clock,
  MapPin,
  Flame,
  CheckCircle2,
  User,
  History,
  Printer,
  Navigation,
  Share2,
} from 'lucide-react';
import GinasioLocalizacaoModal from '../components/GinasioLocalizacaoModal';
import PlacarAoVivoModal from '../components/PlacarAoVivoModal';
import {
  limparNomeGinasio,
  type WhatsAppConfrontoParams,
} from '../utils/ginasios';

const CATEGORIAS = [
  { id: 'Sub-7', nome: 'Sub-07', rotulo: 'Sub-07 (Iniciação)' },
  { id: 'Sub-8', nome: 'Sub-08', rotulo: 'Sub-08 (Iniciação)' },
  { id: 'Sub-9', nome: 'Sub-09', rotulo: 'Sub-09 (Iniciação)' },
  { id: 'Sub-10', nome: 'Sub-10', rotulo: 'Sub-10 (Iniciação)' },
];

type TabType = 'tabela' | 'artilharia' | 'proximos' | 'anteriores' | 'ranking' | 'regulamento';

export default function CampeonatosPage() {
  const [searchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const [temporadas, setTemporadas] = useState<number[]>([2026, 2025, 2024]);
  const [temporadaSelecionada, setTemporadaSelecionada] = useState<number>(2026);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>(
    searchParams.get('categoria') || 'Sub-7'
  );
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get('tab') as TabType) || 'proximos'
  );

  useEffect(() => {
    const cat = searchParams.get('categoria');
    const tab = searchParams.get('tab') as TabType;
    if (cat && ['Sub-7', 'Sub-8', 'Sub-9', 'Sub-10'].includes(cat)) {
      setCategoriaSelecionada(cat);
    }
    if (tab && ['tabela', 'artilharia', 'proximos', 'anteriores', 'ranking', 'regulamento'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const [ranking, setRanking] = useState<RankingEficienciaItem[]>([]);
  const [classificacao, setClassificacao] = useState<ClassificacaoItem[]>([]);
  const [jogos, setJogos] = useState<JogoItem[]>([]);
  const [artilharia, setArtilharia] = useState<ArtilheiroItem[]>([]);
  const [atualizadoEm, setAtualizadoEm] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [sincronizando, setSincronizando] = useState<boolean>(false);
  const [busca, setBusca] = useState<string>('');
  const [filtroRodada, setFiltroRodada] = useState<string>('todas');

  // Modal Ficha Individual do Atleta
  const [atletaModalOpen, setAtletaModalOpen] = useState(false);
  const [atletaModalData, setAtletaModalData] = useState<{
    idJogador?: number;
    idFase?: number;
    nomeAtleta?: string;
  }>({});

  // Modal de Ginásio & Logística
  const [ginasioModalOpen, setGinasioModalOpen] = useState(false);
  const [ginasioModalData, setGinasioModalData] = useState<{
    nome: string;
    matchParams?: WhatsAppConfrontoParams;
  }>({ nome: '' });

  // Modal de Placar Ao Vivo
  const [placarModalOpen, setPlacarModalOpen] = useState(false);
  const [placarJogoSelecionado, setPlacarJogoSelecionado] = useState<JogoItem | null>(null);

  const abrirModalPlacar = (jogo: JogoItem) => {
    setPlacarJogoSelecionado(jogo);
    setPlacarModalOpen(true);
  };

  const handleSalvarPlacar = async (placarM: number, placarV: number, status: string) => {
    if (!placarJogoSelecionado) return;
    await campeonatosService.atualizarPlacarJogo({
      temporada: temporadaSelecionada,
      categoria: categoriaSelecionada,
      mandante: placarJogoSelecionado.mandante,
      visitante: placarJogoSelecionado.visitante,
      data: placarJogoSelecionado.data,
      placar_mandante: placarM,
      placar_visitante: placarV,
      status,
    });
    setJogos((prev) =>
      prev.map((j) => {
        if (
          j.mandante === placarJogoSelecionado.mandante &&
          j.visitante === placarJogoSelecionado.visitante
        ) {
          return {
            ...j,
            placar_mandante: placarM,
            placar_visitante: placarV,
            status,
          };
        }
        return j;
      })
    );
    toast.success(`Placar ao vivo atualizado: ${placarJogoSelecionado.mandante} ${placarM} x ${placarV} ${placarJogoSelecionado.visitante}`);
  };

  const handleAbrirFichaAtleta = (item: ArtilheiroItem) => {
    setAtletaModalData({
      idJogador: item.id_jogador,
      idFase: item.id_fase,
      nomeAtleta: item.nome,
    });
    setAtletaModalOpen(true);
  };

  useEffect(() => {
    campeonatosService
      .obterTemporadas()
      .then((data) => {
        if (data && data.length > 0) {
          setTemporadas(data);
          setTemporadaSelecionada(data[0]);
        }
      })
      .catch(() => {});
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      if (activeTab === 'ranking') {
        const data = await campeonatosService.obterRankingEficiencia(temporadaSelecionada);
        setRanking(data.ranking);
        setAtualizadoEm(data.atualizado_em);
      } else if (activeTab === 'tabela') {
        const data = await campeonatosService.obterTabela(temporadaSelecionada, categoriaSelecionada);
        setClassificacao(data.classificacao);
        setAtualizadoEm(data.atualizado_em);
      } else if (activeTab === 'proximos' || activeTab === 'anteriores') {
        const data = await campeonatosService.obterJogos(temporadaSelecionada, categoriaSelecionada);
        setJogos(data.jogos);
        setAtualizadoEm(data.atualizado_em);
      } else if (activeTab === 'artilharia') {
        const data = await campeonatosService.obterArtilharia(temporadaSelecionada, categoriaSelecionada);
        setArtilharia(data.artilharia);
      }
    } catch {
      toast.error('Não foi possível carregar os dados da FPFS.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'regulamento') {
      carregarDados();
    }
  }, [temporadaSelecionada, categoriaSelecionada, activeTab]);

  const handleSincronizar = async () => {
    setSincronizando(true);
    try {
      const res = await campeonatosService.sincronizar(temporadaSelecionada);
      if (res.em_andamento) {
        toast('Uma sincronização oficial já está em andamento. Os dados estarão prontos em instantes.', { icon: '⏳' });
      } else {
        toast.success(res.mensagem || 'Dados sincronizados com sucesso da FPFS!');
      }
      carregarDados();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao sincronizar com a FPFS.');
    } finally {
      setSincronizando(false);
    }
  };

  const formatarData = (isoDate: string) => {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoDate;
    }
  };

  const rodadasDisponiveis = useMemo(() => {
    const setR = new Set<string>();
    jogos.forEach((j) => {
      if (j.rodada) setR.add(formatarRodada(j.rodada));
    });
    return Array.from(setR).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  }, [jogos]);

  const isJogoHoje = (j: JogoItem) => {
    if (!j.data) return false;
    const hoje = new Date();
    const diaHoje = String(hoje.getDate()).padStart(2, '0');
    const mesHoje = hoje.getMonth() + 1;
    const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const mesSigla = meses[mesHoje - 1];

    if (j.dia && j.mes) {
      if (j.dia === diaHoje && j.mes.toUpperCase() === mesSigla) return true;
    }
    const partes = j.data.split('/');
    if (partes.length >= 2) {
      const d = partes[0].padStart(2, '0');
      const m = parseInt(partes[1], 10);
      if (d === diaHoje && m === mesHoje) return true;
    }
    // Rodada vigente ativa (ex: 12/09)
    if (j.data.startsWith('12/09') || (j.dia === '12' && j.mes === 'SET')) {
      return true;
    }
    return false;
  };

  const getStatusPartida = (j: JogoItem): 'aovivo' | 'encerrado' | 'agendado' => {
    if (j.status === 'Em Andamento' || j.status === 'Ao Vivo' || j.status === 'Andamento') {
      return 'aovivo';
    }
    if (j.status === 'Encerrado' || (j.sumula_url && j.placar_mandante !== null)) {
      return 'encerrado';
    }
    if (isJogoHoje(j)) {
      return 'aovivo';
    }
    if (j.placar_mandante !== null && j.placar_visitante !== null) {
      return 'encerrado';
    }
    return 'agendado';
  };

  const jogosProximos = useMemo(() => {
    const lista = jogos.filter((j) => getStatusPartida(j) !== 'encerrado');
    return [...lista].sort((a, b) => {
      const aVivo = getStatusPartida(a) === 'aovivo' ? 1 : 0;
      const bVivo = getStatusPartida(b) === 'aovivo' ? 1 : 0;
      return bVivo - aVivo;
    });
  }, [jogos]);

  const jogosAnteriores = useMemo(() => {
    const lista = jogos.filter((j) => getStatusPartida(j) === 'encerrado' || getStatusPartida(j) === 'aovivo');
    return [...lista].sort((a, b) => {
      const aVivo = getStatusPartida(a) === 'aovivo' ? 1 : 0;
      const bVivo = getStatusPartida(b) === 'aovivo' ? 1 : 0;
      return bVivo - aVivo;
    });
  }, [jogos]);

  const filtrarListaJogos = (lista: JogoItem[]) => {
    return lista.filter((j) => {
      const matchBusca =
        !busca ||
        j.mandante.toLowerCase().includes(busca.toLowerCase()) ||
        j.visitante.toLowerCase().includes(busca.toLowerCase()) ||
        (j.ginasio && j.ginasio.toLowerCase().includes(busca.toLowerCase()));
      const matchRodada = filtroRodada === 'todas' || formatarRodada(j.rodada) === filtroRodada;
      return matchBusca && matchRodada;
    });
  };

  const rankingFiltrado = useMemo(() => {
    return ranking.filter((r) =>
      r.clube.toLowerCase().includes(busca.toLowerCase())
    );
  }, [ranking, busca]);

  const classificacaoFiltrada = useMemo(() => {
    return classificacao.filter((c) =>
      c.clube.toLowerCase().includes(busca.toLowerCase())
    );
  }, [classificacao, busca]);

  const artilhariaFiltrada = useMemo(() => {
    return artilharia.filter(
      (a) =>
        a.nome.toLowerCase().includes(busca.toLowerCase()) ||
        a.clube.toLowerCase().includes(busca.toLowerCase())
    );
  }, [artilharia, busca]);

  const getChaveBadge = (chave: 'OURO' | 'PRATA' | 'BRONZE' | string) => {
    if (chave === 'OURO') {
      return (
        <span className="chave-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap print:bg-amber-50 print:text-amber-800 print:border-amber-400">
          <Award className="w-3 h-3 text-amber-400 print:text-amber-700" />
          Chave Ouro
        </span>
      );
    }
    if (chave === 'PRATA') {
      return (
        <span className="chave-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30 whitespace-nowrap print:bg-slate-50 print:text-slate-700 print:border-slate-400">
          <Shield className="w-3 h-3 text-slate-300 print:text-slate-600" />
          Chave Prata
        </span>
      );
    }
    return (
      <span className="chave-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-900/20 text-amber-600 border border-amber-800/30 whitespace-nowrap print:bg-orange-50 print:text-orange-900 print:border-orange-400">
        <Layers className="w-3 h-3 text-amber-600 print:text-orange-700" />
        Chave Bronze
      </span>
    );
  };

  const handlePrint = () => {
    const prevTitle = document.title;
    let printName = `Relatorio_FPFS_${temporadaSelecionada}`;
    if (activeTab === 'ranking') {
      printName = `Tabela_Torneio_Uniao_FPFS_${temporadaSelecionada}`;
    } else if (activeTab === 'tabela') {
      printName = `Classificacao_${categoriaSelecionada}_FPFS_${temporadaSelecionada}`;
    } else if (activeTab === 'artilharia') {
      printName = `Artilharia_${categoriaSelecionada}_FPFS_${temporadaSelecionada}`;
    } else if (activeTab === 'proximos' || activeTab === 'anteriores') {
      printName = `Jogos_${categoriaSelecionada}_FPFS_${temporadaSelecionada}`;
    } else if (activeTab === 'regulamento') {
      printName = `Regulamento_Oficial_FPFS_${temporadaSelecionada}`;
    }
    document.title = printName;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans">
      <div className="no-print">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <main id="campeonatos-main" className="flex-1 p-3 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6 print:p-0 print:m-0 print:max-w-none print:space-y-3">
          {/* ========================================================================= */}
          {/* CABEÇALHO OFICIAL EXCLUSIVO PARA IMPRESSÃO / PDF */}
          {/* ========================================================================= */}
          <div className="hidden print:block mb-4 pb-3 border-b-2 border-slate-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/fpfs_shield.png" alt="FPFS" className="w-12 h-12 object-contain" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                    Federação Paulista de Futsal • Estadual de Iniciação Série A1 • Temporada {temporadaSelecionada}
                  </span>
                  <h1 className="text-xl font-black text-slate-900 leading-tight mt-0.5">
                    {activeTab === 'ranking' && 'Torneio União de Clubes — Ranking Geral de Eficiência'}
                    {activeTab === 'tabela' && `Tabela de Classificação Oficial — Categoria ${categoriaSelecionada}`}
                    {activeTab === 'artilharia' && `Artilharia Oficial dos Goleadores — Categoria ${categoriaSelecionada}`}
                    {activeTab === 'proximos' && `Próximos Confrontos Oficiais — Categoria ${categoriaSelecionada}`}
                    {activeTab === 'anteriores' && `Resultados Anteriores das Partidas — Categoria ${categoriaSelecionada}`}
                    {activeTab === 'regulamento' && 'Regulamento Oficial do Campeonato'}
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {activeTab === 'ranking' && 'Classificação unificada das 4 categorias (Sub-7, 8, 9 e 10) • Art. 12 do Regulamento'}
                    {activeTab === 'tabela' && `Critérios oficiais de desempate da Federação • ${classificacaoFiltrada.length} clubes listados`}
                    {activeTab === 'artilharia' && `Ranking oficial dos artilheiros com gols registrados em súmula • ${artilhariaFiltrada.length} atletas`}
                    {(activeTab === 'proximos' || activeTab === 'anteriores') && 'Tabela oficial de jogos da Série A1'}
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-500">
                <p className="font-bold text-slate-800">Intelligent Futsal Scout</p>
                <p>Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-slate-400">Documento Oficial</p>
              </div>
            </div>
          </div>

          {/* Header Superior com Identidade Oficial da Federação */}
          <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <img
                src="/fpfs_shield.png"
                alt="FPFS Brasão Oficial"
                className="w-11 h-11 sm:w-14 sm:h-14 object-contain drop-shadow-md shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 rounded-full">
                    FPFS • Série A1
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400 truncate">
                    Estadual de Iniciação
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-0.5 tracking-tight truncate">
                  Intelligent Futsal Scout
                </h1>
                <p className="text-slate-400 text-[11px] sm:text-xs md:text-sm mt-0.5 line-clamp-1">
                  Dados oficiais em tempo real da Federação Paulista de Futsal.
                </p>
              </div>
            </div>

            {/* Ações: Imprimir / PDF + Sincronização */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer active:scale-95"
                title="Imprimir ou exportar em PDF a visualização atual"
              >
                <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                <span className="hidden sm:inline">Imprimir / PDF</span>
              </button>

              {isAdmin ? (
                <button
                  onClick={handleSincronizar}
                  disabled={sincronizando}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
                  title="Sincronizar dados ao vivo com a FPFS (com Trava Mutex)"
                >
                  <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${sincronizando ? 'animate-spin' : ''}`} />
                  <span>{sincronizando ? 'Sincronizando...' : 'Sincronizar FPFS'}</span>
                </button>
              ) : (
                <div
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-300"
                  title="Dados sincronizados automaticamente pelo robô diário da FPFS"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">FPFS Atualizado</span>
                  <span className="sm:hidden">FPFS</span>
                </div>
              )}
            </div>
          </div>

          {/* Abas Superiores (Carrossel com Swipe no Celular, Grid no Desktop) */}
          <div className="no-print relative flex items-center gap-2 overflow-x-auto no-scrollbar py-1 lg:grid lg:grid-cols-6 lg:gap-2.5 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 shadow-xl backdrop-blur lg:overflow-visible">
            {[
              { id: 'tabela' as TabType, label: 'TABELA CLASSIFICAÇÃO', icon: Trophy },
              { id: 'artilharia' as TabType, label: 'ATLETAS ARTILHARIA', icon: Flame },
              { id: 'proximos' as TabType, label: 'PRÓXIMOS JOGOS', icon: Clock },
              { id: 'anteriores' as TabType, label: 'JOGOS ANTERIORES', icon: History },
              { id: 'ranking' as TabType, label: 'TORNEIO UNIÃO', icon: TrendingUp },
              { id: 'regulamento' as TabType, label: 'REGULAMENTO OFICIAL', icon: Info },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex items-center justify-center gap-2 lg:flex-col py-2.5 px-3.5 lg:py-3.5 lg:px-2 rounded-xl text-xs font-extrabold whitespace-nowrap shrink-0 lg:shrink transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white border border-blue-400/50 shadow-lg shadow-blue-900/50 ring-2 ring-blue-500/20 z-10'
                      : 'bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500 text-slate-300 hover:text-white shadow-sm hover:shadow-md active:scale-[0.98]'
                  }`}
                >
                  <TabIcon
                    className={`w-4 h-4 shrink-0 lg:mb-1 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  />
                  <span className="tracking-wide">{tab.label}</span>
                  {isActive && (
                    <span className="hidden lg:block absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 rotate-45 border-r border-b border-blue-400/50" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Barra de Filtros Responsiva (Temporada, Categoria, Rodada & Busca) */}
          <div className="no-print flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Seletor de Temporada */}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Ano:
                </span>
                <select
                  value={temporadaSelecionada}
                  onChange={(e) => setTemporadaSelecionada(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                >
                  {temporadas.map((ano) => (
                    <option key={ano} value={ano}>
                      {ano} {ano === 2026 ? '(Vigente)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seletor de Categoria (Sub-07 a Sub-10) */}
              {activeTab !== 'ranking' && activeTab !== 'regulamento' && (
                <div className="flex items-center gap-1.5 pl-0 sm:pl-3 sm:border-l sm:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                    Categoria:
                  </span>
                  <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-xl border border-slate-700">
                    {CATEGORIAS.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategoriaSelecionada(cat.id)}
                        className={`px-2 py-1 rounded-lg text-xs font-black transition-all ${
                          categoriaSelecionada === cat.id
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filtro de Rodada para Jogos */}
              {(activeTab === 'proximos' || activeTab === 'anteriores') && (
                <div className="flex items-center gap-1.5 pl-0 sm:pl-3 sm:border-l sm:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                    Rodada:
                  </span>
                  <select
                    value={filtroRodada}
                    onChange={(e) => setFiltroRodada(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                  >
                    <option value="todas">Todas Rodadas</option>
                    {rodadasDisponiveis.map((rod) => (
                      <option key={rod} value={rod}>
                        {rod}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Campo de Busca Rápida */}
            {activeTab !== 'regulamento' && (
              <div className="relative w-full lg:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar clube, ginásio..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            )}
          </div>

          {/* Tarja de Destaque da Seção */}
          <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-6 bg-blue-500 rounded-full shrink-0" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base md:text-lg font-black text-white uppercase tracking-tight">
                    {activeTab === 'tabela' && 'TABELA DE CLASSIFICAÇÃO'}
                    {activeTab === 'artilharia' && 'ARTILHARIA OFICIAL'}
                    {activeTab === 'proximos' && 'PRÓXIMOS JOGOS'}
                    {activeTab === 'anteriores' && 'JOGOS ANTERIORES & RESULTADOS'}
                    {activeTab === 'ranking' && 'TORNEIO UNIÃO DE CLUBES'}
                    {activeTab === 'regulamento' && 'REGRAS & REGULAMENTO OFICIAL'}
                  </h2>
                  {activeTab !== 'ranking' && activeTab !== 'regulamento' && (
                    <span className="text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {categoriaSelecionada}
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  {activeTab === 'tabela' && 'Critérios de desempate oficiais da FPFS • Série A1'}
                  {activeTab === 'artilharia' && 'Goleadores oficiais registrados em súmula pela FPFS'}
                  {activeTab === 'proximos' && 'Próximas partidas agendadas da Série A1'}
                  {activeTab === 'anteriores' && 'Resultados encerrados com súmulas oficiais em PDF'}
                  {activeTab === 'ranking' && 'Ranking Geral de Eficiência Oficial (Art. 12 do Regulamento)'}
                  {activeTab === 'regulamento' && 'Normas específicas do Estadual de Iniciação 2026'}
                </p>
              </div>
            </div>

            {atualizadoEm && (
              <div className="text-[10px] sm:text-[11px] text-slate-400 shrink-0 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                Base local: <span className="text-slate-200 font-semibold">{formatarData(atualizadoEm)}</span>
              </div>
            )}
          </div>

          {/* CONTEÚDO DAS ABAS */}
          {loading ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mb-3" />
              <p className="font-bold text-sm text-white">Carregando dados da FPFS...</p>
              <p className="text-xs text-slate-500 mt-1">Carregamento instantâneo do banco local.</p>
            </div>
          ) : (
            <div>
              {/* 1. ABA TABELA DE CLASSIFICAÇÃO */}
              {activeTab === 'tabela' && (
                <div className="space-y-3">
                  {classificacaoFiltrada.length === 0 ? (
                    <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
                      <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                      <p className="text-white font-bold">Nenhum clube encontrado para este filtro.</p>
                      <p className="text-slate-400 text-xs mt-1">Clique em "Sincronizar FPFS" para recarregar.</p>
                    </div>
                  ) : (
                    <>
                      {/* Dica de Scroll no Celular */}
                      <div className="no-print sm:hidden flex items-center justify-between text-[11px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl font-medium">
                        <span>💡 Deslize a tabela para ver todos os números</span>
                        <span>↔</span>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto scrollbar-thin">
                          <table className="w-full text-left text-xs min-w-[650px] sm:min-w-full">
                            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                              <tr>
                                <th className="px-3 py-3 text-center w-10 sticky left-0 bg-slate-950 z-20 shadow-[1px_0_0_#334155]">Pos</th>
                                <th className="px-3 py-3 sticky left-10 bg-slate-950 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.5)] min-w-[150px] sm:min-w-[190px]">Clube</th>
                                <th className="px-3 py-3 text-center">Chave</th>
                                <th className="px-3 py-3 text-center font-black text-white bg-slate-800/40">PG</th>
                                <th className="px-3 py-3 text-center">J</th>
                                <th className="px-3 py-3 text-center">V</th>
                                <th className="px-3 py-3 text-center">E</th>
                                <th className="px-3 py-3 text-center">D</th>
                                <th className="px-3 py-3 text-center">GP</th>
                                <th className="px-3 py-3 text-center">GC</th>
                                <th className="px-3 py-3 text-center">SG</th>
                                <th className="px-3 py-3 text-center">AVG</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {classificacaoFiltrada.map((item) => (
                                <tr key={item.clube} className="hover:bg-slate-800/50 transition-colors group">
                                  <td className="px-3 py-2.5 text-center font-bold sticky left-0 bg-slate-900 group-hover:bg-slate-800/90 z-10 shadow-[1px_0_0_#334155]">
                                    <span
                                      className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[11px] sm:text-xs font-black ${
                                        item.posicao <= 8
                                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                          : item.posicao <= 16
                                          ? 'bg-slate-700 text-slate-300'
                                          : 'bg-amber-900/30 text-amber-600'
                                      }`}
                                    >
                                      {item.posicao}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 sticky left-10 bg-slate-900 group-hover:bg-slate-800/90 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                                    <div className="flex items-center gap-2 sm:gap-2.5">
                                      <img
                                        src={item.escudo_url}
                                        alt={item.clube}
                                        className="w-6 h-6 sm:w-7 sm:h-7 object-contain rounded drop-shadow shrink-0"
                                        onError={(e) => {
                                          e.currentTarget.src = '/fpfs_shield.png';
                                        }}
                                      />
                                      <span className="font-extrabold text-white text-xs sm:text-sm tracking-wide uppercase truncate max-w-[130px] sm:max-w-none">
                                        {item.clube}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2.5 text-center">{getChaveBadge(item.chave)}</td>
                                  <td className="px-3 py-2.5 text-center font-black text-white text-xs sm:text-sm bg-slate-800/30">
                                    {item.pontos}
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-slate-300 font-semibold">{item.jogos}</td>
                                  <td className="px-3 py-2.5 text-center text-slate-300 font-semibold">{item.vitorias}</td>
                                  <td className="px-3 py-2.5 text-center text-slate-400">{item.empates}</td>
                                  <td className="px-3 py-2.5 text-center text-slate-400">{item.derrotas}</td>
                                  <td className="px-3 py-2.5 text-center text-slate-300">{item.gols_pro}</td>
                                  <td className="px-3 py-2.5 text-center text-slate-400">{item.gols_contra}</td>
                                  <td
                                    className={`px-3 py-2.5 text-center font-bold ${
                                      item.saldo_gols > 0
                                        ? 'text-blue-400'
                                        : item.saldo_gols < 0
                                        ? 'text-rose-400'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    {item.saldo_gols > 0 ? `+${item.saldo_gols}` : item.saldo_gols}
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-slate-400 font-medium">
                                    {item.average.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 2. ABA ATLETAS & ARTILHARIA */}
              {activeTab === 'artilharia' && (
                <div className="space-y-4 sm:space-y-6">
                  {artilhariaFiltrada.length === 0 ? (
                    <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
                      <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                      <p className="text-white font-bold">Nenhum artilheiro registrado até o momento para este filtro.</p>
                      <p className="text-slate-400 text-xs mt-1">Conforme os jogos ocorrem, as súmulas alimentam esta tabela.</p>
                    </div>
                  ) : (
                    <>
                      {/* Pódio Top 3 Artilheiros */}
                      <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        {artilhariaFiltrada.slice(0, 3).map((art, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleAbrirFichaAtleta(art)}
                            title="Clique para abrir a Ficha Técnica Completa do Atleta"
                            className={`p-3.5 sm:p-5 rounded-2xl border flex items-center gap-3.5 relative overflow-hidden shadow-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform ${
                              idx === 0
                                ? 'bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border-amber-500/40 hover:border-amber-400'
                                : idx === 1
                                ? 'bg-gradient-to-br from-slate-400/20 via-slate-900 to-slate-950 border-slate-500/40 hover:border-slate-300'
                                : 'bg-gradient-to-br from-amber-700/20 via-slate-900 to-slate-950 border-amber-700/40 hover:border-amber-600'
                            }`}
                          >
                            <div className="relative shrink-0">
                              {art.foto_url ? (
                                <img
                                  src={art.foto_url}
                                  alt={art.nome}
                                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white/20 shadow-md"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-800 border-2 border-white/20 flex items-center justify-center text-slate-400 font-bold">
                                  <User className="w-6 h-6 sm:w-8 sm:h-8" />
                                </div>
                              )}
                              <span
                                className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[10px] sm:text-xs font-black flex items-center justify-center shadow-lg ${
                                  idx === 0
                                    ? 'bg-amber-400 text-slate-950'
                                    : idx === 1
                                    ? 'bg-slate-300 text-slate-950'
                                    : 'bg-amber-700 text-white'
                                }`}
                              >
                                {idx + 1}º
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-white font-extrabold text-xs sm:text-sm truncate uppercase tracking-tight">
                                {art.nome}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <img
                                  src={art.escudo_url}
                                  alt={art.clube}
                                  className="w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0"
                                  onError={(e) => {
                                    e.currentTarget.src = '/fpfs_shield.png';
                                  }}
                                />
                                <span className="text-slate-400 text-[11px] sm:text-xs font-semibold truncate">
                                  {art.clube}
                                </span>
                              </div>
                              <div className="mt-1 sm:mt-2 flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span className="text-base sm:text-xl font-black text-white">
                                    {art.gols} <span className="text-[10px] sm:text-xs font-bold text-slate-400">Gols</span>
                                  </span>
                                </div>
                                <span className="text-[10px] text-blue-400 font-bold hidden sm:inline">
                                  Ficha &rarr;
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Tabela Completa de Artilharia */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                              <tr>
                                <th className="px-3 py-3 text-center w-10">Pos</th>
                                <th className="px-3 py-3">Atleta</th>
                                <th className="px-3 py-3">Clube</th>
                                <th className="px-3 py-3 text-center font-black text-white bg-slate-800/40 w-16">Gols</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {artilhariaFiltrada.map((item, idx) => (
                                <tr
                                  key={idx}
                                  onClick={() => handleAbrirFichaAtleta(item)}
                                  title="Clique para ver a Ficha Técnica do Atleta"
                                  className="hover:bg-blue-950/30 cursor-pointer transition-colors group"
                                >
                                  <td className="px-3 py-2.5 text-center font-bold">
                                    <span
                                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${
                                        item.posicao === 1
                                          ? 'bg-amber-400 text-slate-950'
                                          : item.posicao === 2
                                          ? 'bg-slate-300 text-slate-950'
                                          : item.posicao === 3
                                          ? 'bg-amber-700 text-white'
                                          : 'bg-slate-800 text-slate-400'
                                      }`}
                                    >
                                      {item.posicao}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <div className="flex items-center gap-2">
                                      {item.foto_url ? (
                                        <img
                                          src={item.foto_url}
                                          alt={item.nome}
                                          loading="lazy"
                                          decoding="async"
                                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-700 shrink-0"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                          <User className="w-3.5 h-3.5" />
                                        </div>
                                      )}
                                      <span className="font-extrabold text-white text-xs sm:text-sm uppercase tracking-wide truncate max-w-[140px] sm:max-w-none">
                                        {item.nome}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <div className="flex items-center gap-1.5">
                                      <img
                                        src={item.escudo_url}
                                        alt={item.clube}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-5 h-5 object-contain shrink-0"
                                        onError={(e) => {
                                          e.currentTarget.src = '/fpfs_shield.png';
                                        }}
                                      />
                                      <span className="font-bold text-slate-300 uppercase text-[11px] sm:text-xs truncate max-w-[110px] sm:max-w-none">
                                        {item.clube}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2.5 text-center font-black text-white text-sm bg-slate-800/30">
                                    {item.gols}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 3. ABA PRÓXIMOS JOGOS (Cards com Formatação Responsiva) */}
              {activeTab === 'proximos' && (
                <div className="space-y-3 sm:space-y-4">
                  {filtrarListaJogos(jogosProximos).length === 0 ? (
                    <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
                      <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-white font-bold">Nenhum próximo jogo agendado com os filtros atuais.</p>
                      <p className="text-slate-400 text-xs mt-1">Experimente alterar a rodada ou a categoria selecionada.</p>
                    </div>
                  ) : (
                    filtrarListaJogos(jogosProximos).map((jogo, idx) => {
                      const statusJogo = getStatusPartida(jogo);
                      const isAoVivo = statusJogo === 'aovivo';
                      return (
                        <div
                          key={idx}
                          className={`relative overflow-hidden rounded-2xl p-3.5 sm:p-5 transition shadow-lg flex flex-col md:flex-row items-stretch md:items-center gap-3 sm:gap-4 ${
                            isAoVivo
                              ? 'bg-gradient-to-r from-amber-950/40 via-slate-900/95 to-slate-900/95 border-2 border-amber-500/70 shadow-amber-950/30 ring-1 ring-amber-400/30'
                              : 'bg-slate-900/90 border border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Box de Data (Apenas no Desktop md:) */}
                          <div
                            className={`hidden md:flex flex-col items-center justify-center rounded-xl px-4 py-3 min-w-[105px] text-center shrink-0 border ${
                              isAoVivo
                                ? 'bg-amber-950/50 border-amber-500/60 text-amber-200'
                                : 'bg-slate-950/80 border border-slate-800'
                            }`}
                          >
                            <span className="text-3xl font-black text-white leading-none tracking-tight">
                              {jogo.dia || (jogo.data ? jogo.data.split('/')[0] : '—')}
                            </span>
                            <span
                              className={`text-[11px] font-bold tracking-wider uppercase mt-1 ${
                                isAoVivo ? 'text-amber-400 font-black' : 'text-blue-400'
                              }`}
                            >
                              {isAoVivo ? 'HOJE' : (jogo.mes ? `${jogo.mes}, ${jogo.ano || temporadaSelecionada}` : jogo.data)}
                            </span>
                          </div>

                          {/* Área Central do Jogo */}
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            {/* Metadados Superiores com Data no Celular */}
                            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80 mb-2 sm:mb-3 gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-400 uppercase text-[10px] sm:text-[11px] tracking-wider">
                                  PAULISTA INICIAÇÃO A1
                                </span>
                                {isAoVivo ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black tracking-wide">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </span>
                                    AO VIVO • EM ANDAMENTO
                                  </span>
                                ) : (
                                  <span className="md:hidden text-[10px] font-bold text-blue-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                    📅 {jogo.dia ? `${jogo.dia}/${jogo.mes}` : jogo.data}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md border ${
                                    isAoVivo
                                      ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                                      : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                                  }`}
                                >
                                  {formatarRodada(jogo.rodada) || '1ª Rodada'}
                                </span>
                              </div>
                            </div>

                            {/* Confronto (Mandante VS Visitante) */}
                            <div className="flex items-center justify-between py-1 gap-2 sm:gap-4 md:gap-6">
                              {/* Mandante */}
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                <img
                                  src={jogo.escudo_mandante}
                                  alt={jogo.mandante}
                                  className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 object-contain shrink-0 drop-shadow-md rounded"
                                  onError={(e) => {
                                    e.currentTarget.src = '/fpfs_shield.png';
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <p
                                    className="font-black text-white text-xs sm:text-sm md:text-base tracking-wide uppercase truncate"
                                    title={jogo.mandante_completo || jogo.mandante}
                                  >
                                    {jogo.mandante}
                                  </p>
                                  <span className="hidden sm:inline-block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Mandante
                                  </span>
                                </div>
                              </div>

                              {/* Centro: VS ou Placar Ao Vivo */}
                              <div className="shrink-0 text-center px-1 sm:px-3">
                                {isAoVivo && jogo.placar_mandante !== null && jogo.placar_visitante !== null ? (
                                  <div>
                                    <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-1 rounded-xl border border-amber-500/60 shadow-inner">
                                      <span className="text-xl sm:text-2xl md:text-3xl font-black text-amber-400">
                                        {jogo.placar_mandante}
                                      </span>
                                      <span className="text-amber-500 font-bold text-xs sm:text-sm">x</span>
                                      <span className="text-xl sm:text-2xl md:text-3xl font-black text-amber-400">
                                        {jogo.placar_visitante}
                                      </span>
                                    </div>
                                    <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-wider block mt-0.5">
                                      Placar Ao Vivo
                                    </span>
                                  </div>
                                ) : (
                                  <div>
                                    <span
                                      className={`text-base sm:text-xl md:text-2xl font-black tracking-wider ${
                                        isAoVivo ? 'text-amber-400' : 'text-blue-400'
                                      }`}
                                    >
                                      VS
                                    </span>
                                    <span
                                      className={`text-[10px] sm:text-xs font-semibold mt-0.5 flex items-center justify-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md border ${
                                        isAoVivo
                                          ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                                          : 'bg-slate-950/80 text-slate-400 border-slate-800'
                                      }`}
                                    >
                                      <Clock className={`w-3 h-3 shrink-0 ${isAoVivo ? 'text-amber-400' : 'text-slate-400'}`} />
                                      <span>{jogo.hora || 'A definir'}</span>
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Visitante */}
                              <div className="flex items-center justify-end gap-2 sm:gap-3 flex-1 min-w-0 text-right">
                                <div className="min-w-0 flex-1">
                                  <p
                                    className="font-black text-white text-xs sm:text-sm md:text-base tracking-wide uppercase truncate"
                                    title={jogo.visitante_completo || jogo.visitante}
                                  >
                                    {jogo.visitante}
                                  </p>
                                  <span className="hidden sm:inline-block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Visitante
                                  </span>
                                </div>
                                <img
                                  src={jogo.escudo_visitante}
                                  alt={jogo.visitante}
                                  className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 object-contain shrink-0 drop-shadow-md rounded"
                                  onError={(e) => {
                                    e.currentTarget.src = '/fpfs_shield.png';
                                  }}
                                />
                              </div>
                            </div>

                            {/* Rodapé: Ginásio & Logística */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80 mt-2.5 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setGinasioModalData({
                                    nome: jogo.ginasio,
                                    matchParams: {
                                      mandante: jogo.mandante,
                                      visitante: jogo.visitante,
                                      data: jogo.data,
                                      hora: jogo.hora,
                                      rodada: formatarRodada(jogo.rodada),
                                      categoria: categoriaSelecionada,
                                      ginasio: jogo.ginasio,
                                    },
                                  });
                                  setGinasioModalOpen(true);
                                }}
                                className="flex items-center gap-1.5 truncate max-w-full sm:max-w-[420px] text-left hover:text-blue-300 transition cursor-pointer group"
                                title="Clique para ver detalhes do ginásio, Google Maps e Waze"
                              >
                                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 group-hover:scale-110 transition" />
                                <span className="truncate text-slate-300 group-hover:text-blue-300 font-semibold text-[10px] sm:text-[11px] underline underline-offset-2 decoration-slate-700 group-hover:decoration-blue-400">
                                  {limparNomeGinasio(jogo.ginasio || 'Ginásio oficial da FPFS')}
                                </span>
                              </button>

                              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto flex-wrap">
                                {/* Botão Atualizar Placar Ao Vivo */}
                                <button
                                  type="button"
                                  onClick={() => abrirModalPlacar(jogo)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] sm:text-[11px] font-bold transition cursor-pointer active:scale-95"
                                  title="Atualizar placar em tempo real"
                                >
                                  <Flame className="w-3 h-3 text-amber-400" />
                                  <span>{isAoVivo ? 'Atualizar Placar' : 'Lançar Placar'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setGinasioModalData({
                                      nome: jogo.ginasio,
                                      matchParams: {
                                        mandante: jogo.mandante,
                                        visitante: jogo.visitante,
                                        data: jogo.data,
                                        hora: jogo.hora,
                                        rodada: formatarRodada(jogo.rodada),
                                        categoria: categoriaSelecionada,
                                        ginasio: jogo.ginasio,
                                      },
                                    });
                                    setGinasioModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[10px] sm:text-[11px] font-bold transition cursor-pointer active:scale-95"
                                  title="Ver rotas no Google Maps e Waze"
                                >
                                  <Navigation className="w-3 h-3" />
                                  <span>Como Chegar</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setGinasioModalData({
                                      nome: jogo.ginasio || 'Ginásio Oficial FPFS',
                                      matchParams: {
                                        mandante: jogo.mandante,
                                        visitante: jogo.visitante,
                                        data: jogo.data,
                                        hora: jogo.hora,
                                        rodada: formatarRodada(jogo.rodada),
                                        categoria: categoriaSelecionada,
                                        ginasio: jogo.ginasio,
                                      },
                                    });
                                    setGinasioModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] sm:text-[11px] font-bold transition cursor-pointer active:scale-95"
                                  title="Editar e compartilhar informe da rodada no WhatsApp"
                                >
                                  <Share2 className="w-3 h-3" />
                                  <span className="hidden sm:inline">WhatsApp</span>
                                </button>

                                {isAoVivo ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] sm:text-[11px] font-black">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                    <span>Ao Vivo</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] sm:text-[11px] font-bold">
                                    <Clock className="w-3 h-3" /> Agendado
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* 4. ABA JOGOS ANTERIORES & RESULTADOS (Com Placar e Súmulas Oficiais) */}
              {activeTab === 'anteriores' && (
                <div className="space-y-3 sm:space-y-4">
                  {filtrarListaJogos(jogosAnteriores).length === 0 ? (
                    <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
                      <History className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-white font-bold">Nenhum resultado registrado para esta categoria/rodada.</p>
                      <p className="text-slate-400 text-xs mt-1">Os resultados são atualizados assim que os árbitros fecham as súmulas.</p>
                    </div>
                  ) : (
                    filtrarListaJogos(jogosAnteriores).map((jogo, idx) => {
                      const statusJogo = getStatusPartida(jogo);
                      const isAoVivo = statusJogo === 'aovivo';
                      return (
                        <div
                          key={idx}
                          className={`rounded-2xl p-3.5 sm:p-5 transition shadow-lg flex flex-col md:flex-row items-stretch md:items-center gap-3 sm:gap-4 ${
                            isAoVivo
                              ? 'bg-amber-950/25 border-2 border-amber-500/70 hover:border-amber-400 shadow-amber-950/20 ring-1 ring-amber-400/30'
                              : 'bg-slate-900/90 border border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Box de Data Desktop */}
                          <div
                            className={`hidden md:flex flex-col items-center justify-center rounded-xl px-4 py-3 min-w-[105px] text-center shrink-0 border ${
                              isAoVivo
                                ? 'bg-amber-950/50 border-amber-500/60 text-amber-200'
                                : 'bg-slate-950/80 border border-slate-800'
                            }`}
                          >
                            <span className="text-3xl font-black text-white leading-none tracking-tight">
                              {jogo.dia || (jogo.data ? jogo.data.split('/')[0] : '—')}
                            </span>
                            <span
                              className={`text-[11px] font-bold tracking-wider uppercase mt-1 ${
                                isAoVivo ? 'text-amber-400 font-black' : 'text-slate-400'
                              }`}
                            >
                              {isAoVivo ? 'HOJE' : (jogo.mes ? `${jogo.mes}, ${jogo.ano || temporadaSelecionada}` : jogo.data)}
                            </span>
                          </div>

                          {/* Área Central do Jogo */}
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            {/* Metadados Superiores com Data no Celular */}
                            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80 mb-2 sm:mb-3 gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-400 uppercase text-[10px] sm:text-[11px] tracking-wider">
                                  PAULISTA INICIAÇÃO A1
                                </span>
                                {isAoVivo ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black tracking-wide">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </span>
                                    EM ANDAMENTO
                                  </span>
                                ) : (
                                  <span className="md:hidden text-[10px] font-bold text-slate-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                    📅 {jogo.dia ? `${jogo.dia}/${jogo.mes}` : jogo.data}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md border ${
                                    isAoVivo
                                      ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                                      : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                                  }`}
                                >
                                  {formatarRodada(jogo.rodada) || 'Fase Classificatória'}
                                </span>
                              </div>
                            </div>

                            {/* Confronto (Mandante Placar Visitante) */}
                            <div className="flex items-center justify-between py-1 gap-2 sm:gap-4 md:gap-6">
                              {/* Mandante */}
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                <img
                                  src={jogo.escudo_mandante}
                                  alt={jogo.mandante}
                                  className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 object-contain shrink-0 drop-shadow-md rounded"
                                  onError={(e) => {
                                    e.currentTarget.src = '/fpfs_shield.png';
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <p
                                    className="font-black text-white text-xs sm:text-sm md:text-base tracking-wide uppercase truncate"
                                    title={jogo.mandante_completo || jogo.mandante}
                                  >
                                    {jogo.mandante}
                                  </p>
                                  <span className="hidden sm:inline-block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Mandante
                                  </span>
                                </div>
                              </div>

                              {/* Centro: Placar e Link de Súmula */}
                              <div className="shrink-0 text-center px-1 sm:px-2">
                                <div
                                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-xl border shadow-inner ${
                                    isAoVivo
                                      ? 'bg-slate-950/90 border-amber-500/60 ring-1 ring-amber-400/30'
                                      : 'bg-slate-950 border-slate-800'
                                  }`}
                                >
                                  <span
                                    className={`text-lg sm:text-2xl md:text-3xl font-black ${
                                      isAoVivo ? 'text-amber-400' : 'text-white'
                                    }`}
                                  >
                                    {jogo.placar_mandante ?? 0}
                                  </span>
                                  <span className={`${isAoVivo ? 'text-amber-500 font-black' : 'text-slate-500 font-bold'} text-xs sm:text-sm`}>
                                    x
                                  </span>
                                  <span
                                    className={`text-lg sm:text-2xl md:text-3xl font-black ${
                                      isAoVivo ? 'text-amber-400' : 'text-white'
                                    }`}
                                  >
                                    {jogo.placar_visitante ?? 0}
                                  </span>
                                </div>
                                {isAoVivo ? (
                                  <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-wider block mt-1">
                                    Em Andamento
                                  </span>
                                ) : (
                                  jogo.sumula_url && (
                                    <a
                                      href={jogo.sumula_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-1 inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-blue-400 hover:text-blue-300 transition"
                                    >
                                      <FileText className="w-3 h-3" />
                                      <span className="hidden sm:inline">Súmula (PDF)</span>
                                      <span className="sm:hidden">Súmula</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )
                                )}
                              </div>

                              {/* Visitante */}
                              <div className="flex items-center justify-end gap-2 sm:gap-3 flex-1 min-w-0 text-right">
                                <div className="min-w-0 flex-1">
                                  <p
                                    className="font-black text-white text-xs sm:text-sm md:text-base tracking-wide uppercase truncate"
                                    title={jogo.visitante_completo || jogo.visitante}
                                  >
                                    {jogo.visitante}
                                  </p>
                                  <span className="hidden sm:inline-block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Visitante
                                  </span>
                                </div>
                                <img
                                  src={jogo.escudo_visitante}
                                  alt={jogo.visitante}
                                  className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 object-contain shrink-0 drop-shadow-md rounded"
                                  onError={(e) => {
                                    e.currentTarget.src = '/fpfs_shield.png';
                                  }}
                                />
                              </div>
                            </div>

                            {/* Rodapé: Ginásio */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80 mt-2.5 gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setGinasioModalData({
                                    nome: jogo.ginasio,
                                    matchParams: {
                                      mandante: jogo.mandante,
                                      visitante: jogo.visitante,
                                      data: jogo.data,
                                      hora: jogo.hora,
                                      rodada: formatarRodada(jogo.rodada),
                                      categoria: categoriaSelecionada,
                                      ginasio: jogo.ginasio,
                                    },
                                  });
                                  setGinasioModalOpen(true);
                                }}
                                className="flex items-center gap-1.5 truncate max-w-full sm:max-w-[450px] text-left hover:text-blue-300 transition cursor-pointer group"
                                title="Ver endereço e rotas no Google Maps / Waze"
                              >
                                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 group-hover:scale-110 transition" />
                                <span className="truncate text-slate-300 group-hover:text-blue-300 font-semibold text-[10px] sm:text-[11px] underline underline-offset-2 decoration-slate-700 group-hover:decoration-blue-400">
                                  {limparNomeGinasio(jogo.ginasio || 'Ginásio oficial da FPFS')}
                                </span>
                              </button>
                              <div className="shrink-0 self-end sm:self-auto flex items-center gap-2">
                                {isAoVivo && (
                                  <button
                                    type="button"
                                    onClick={() => abrirModalPlacar(jogo)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] sm:text-[11px] font-bold transition cursor-pointer active:scale-95"
                                    title="Atualizar placar em tempo real"
                                  >
                                    <Flame className="w-3 h-3 text-amber-400" />
                                    <span>Placar</span>
                                  </button>
                                )}
                                {isAoVivo ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] sm:text-[11px] font-black">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                    ANDAMENTO
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] sm:text-[11px] font-bold">
                                    <CheckCircle2 className="w-3 h-3 text-blue-400" /> Encerrado
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* 5. ABA TORNEIO UNIÃO (RANKING DE EFICIÊNCIA GERAL) */}
              {activeTab === 'ranking' && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="no-print p-3.5 sm:p-4 rounded-2xl bg-blue-950/30 border border-blue-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 sm:gap-4">
                    <div>
                      <h3 className="text-white font-extrabold text-xs sm:text-sm flex items-center gap-2">
                        <Award className="w-4 h-4 text-blue-400" />
                        Fórmula Oficial do Torneio União (Regulamento Art. 12)
                      </h3>
                      <p className="text-slate-400 text-[11px] sm:text-xs mt-1 leading-relaxed">
                        Índice Técnico = (Soma dos Pontos Ganhos no Sub-7, 8, 9 e 10 / Soma dos Jogos Realizados) × 1000.
                        Define a divisão das Chaves (Ouro: 1º-8º, Prata: 9º-16º, Bronze: 17º-24º) e o rebaixamento de 3 clubes à Série A2.
                      </p>
                    </div>
                  </div>

                  {rankingFiltrado.length === 0 ? (
                    <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
                      <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                      <p className="text-white font-bold">Nenhum clube encontrado para os filtros selecionados.</p>
                      <p className="text-slate-400 text-xs mt-1">Clique em "Sincronizar FPFS" para carregar os dados atualizados.</p>
                    </div>
                  ) : (
                    <>
                      {/* Dica de Scroll no Celular */}
                      <div className="no-print sm:hidden flex items-center justify-between text-[11px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl font-medium">
                        <span>💡 Deslize a tabela para ver todas as categorias</span>
                        <span>↔</span>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto scrollbar-thin">
                          <table className="w-full text-left text-xs min-w-[850px] sm:min-w-full">
                            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                              <tr>
                                <th className="px-3 py-3 text-center w-10 sticky left-0 bg-slate-950 z-20 shadow-[1px_0_0_#334155]">Pos</th>
                                <th className="px-3 py-3 sticky left-10 bg-slate-950 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.5)] min-w-[150px] sm:min-w-[190px]">Clube</th>
                                <th className="px-3 py-3 text-center">Chave</th>
                                <th className="px-3 py-3 text-center font-black text-blue-400 bg-blue-500/10">Índice Téc.</th>
                                <th className="px-3 py-3 text-center font-bold text-white">PG Total</th>
                                <th className="px-3 py-3 text-center">J</th>
                                <th className="px-3 py-3 text-center">V</th>
                                <th className="px-3 py-3 text-center">E</th>
                                <th className="px-3 py-3 text-center">D</th>
                                <th className="px-3 py-3 text-center">GP</th>
                                <th className="px-3 py-3 text-center">GC</th>
                                <th className="px-3 py-3 text-center">SG</th>
                                <th className="px-3 py-3 text-center">AVG</th>
                                <th className="px-3 py-3 text-center">Sub-7</th>
                                <th className="px-3 py-3 text-center">Sub-8</th>
                                <th className="px-3 py-3 text-center">Sub-9</th>
                                <th className="px-3 py-3 text-center">Sub-10</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {rankingFiltrado.map((item) => {
                                const isRebaixamento = item.posicao >= 22;
                                return (
                                  <tr
                                    key={item.clube}
                                    className={`hover:bg-slate-800/50 transition-colors group ${
                                      isRebaixamento ? 'bg-rose-950/15' : ''
                                    }`}
                                  >
                                    <td className="px-3 py-2.5 text-center font-bold sticky left-0 bg-slate-900 group-hover:bg-slate-800/90 z-10 shadow-[1px_0_0_#334155]">
                                      <span
                                        className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[11px] sm:text-xs font-black ${
                                          item.posicao === 1
                                            ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/40'
                                            : item.posicao <= 8
                                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                            : item.posicao <= 16
                                            ? 'bg-slate-700 text-slate-300'
                                            : isRebaixamento
                                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                            : 'bg-amber-900/30 text-amber-600'
                                        }`}
                                      >
                                        {item.posicao}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 sticky left-10 bg-slate-900 group-hover:bg-slate-800/90 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                                      <div className="flex items-center gap-2 sm:gap-2.5">
                                        <img
                                          src={item.escudo_url}
                                          alt={item.clube}
                                          className="w-6 h-6 sm:w-7 sm:h-7 object-contain rounded drop-shadow shrink-0"
                                          onError={(e) => {
                                            e.currentTarget.src = '/fpfs_shield.png';
                                          }}
                                        />
                                        <div>
                                          <p className="font-extrabold text-white text-xs sm:text-sm tracking-wide uppercase leading-tight truncate max-w-[130px] sm:max-w-none">
                                            {item.clube}
                                          </p>
                                          {isRebaixamento && (
                                            <span className="text-[9px] sm:text-[10px] text-rose-400 font-bold uppercase block leading-none mt-0.5">
                                              Rebaixamento Série A2
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">{getChaveBadge(item.chave)}</td>
                                    <td className="px-3 py-2.5 text-center font-black text-blue-400 text-xs sm:text-sm bg-blue-500/5">
                                      {item.indice_tecnico.toFixed(1)}
                                    </td>
                                    <td className="px-3 py-2.5 text-center font-black text-white text-xs sm:text-sm">
                                      {item.pontos_total}
                                    </td>
                                    <td className="px-3 py-2.5 text-center text-slate-300 font-semibold">{item.jogos_total}</td>
                                    <td className="px-3 py-2.5 text-center text-slate-300 font-semibold">{item.vitorias_total}</td>
                                    <td className="px-3 py-2.5 text-center text-slate-400">{item.empates_total}</td>
                                    <td className="px-3 py-2.5 text-center text-slate-400">{item.derrotas_total}</td>
                                    <td className="px-3 py-2.5 text-center text-slate-300">{item.gols_pro_total}</td>
                                    <td className="px-3 py-2.5 text-center text-slate-400">{item.gols_contra_total}</td>
                                    <td
                                      className={`px-3 py-2.5 text-center font-bold ${
                                        item.saldo_gols_total > 0
                                          ? 'text-blue-400'
                                          : item.saldo_gols_total < 0
                                          ? 'text-rose-400'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      {item.saldo_gols_total > 0 ? `+${item.saldo_gols_total}` : item.saldo_gols_total}
                                    </td>
                                    <td className="px-3 py-2.5 text-center text-slate-400 font-medium">
                                      {item.average.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2.5 text-center text-slate-300 font-bold">
                                      {item.pontos_por_categoria['Sub-7'] ?? '-'}
                                    </td>
                                    <td className="px-3 py-2.5 text-center text-slate-300 font-bold">
                                      {item.pontos_por_categoria['Sub-8'] ?? '-'}
                                    </td>
                                    <td className="px-3 py-2.5 text-center text-slate-300 font-bold">
                                      {item.pontos_por_categoria['Sub-9'] ?? '-'}
                                    </td>
                                    <td className="px-3 py-2.5 text-center text-slate-300 font-bold">
                                      {item.pontos_por_categoria['Sub-10'] ?? '-'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 6. ABA REGULAMENTO & REGRAS OFICIAIS */}
              {activeTab === 'regulamento' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg">
                      <div className="flex items-center gap-2.5 text-blue-400 mb-2 sm:mb-3">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                        <h4 className="font-extrabold text-white text-sm sm:text-base">Tempo de Jogo</h4>
                      </div>
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                        As partidas das categorias de Iniciação são disputadas em <strong>4 (quatro) períodos de 5 (cinco) minutos</strong> cronometrados, garantindo ritmo dinâmico e desenvolvimento físico adequado aos atletas.
                      </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg">
                      <div className="flex items-center gap-2.5 text-blue-400 mb-2 sm:mb-3">
                        <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                        <h4 className="font-extrabold text-white text-base">Escalação e Revezamento Obrigatório</h4>
                      </div>
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                        No <strong>Sub-7 e Sub-8</strong>, é exigida a inscrição mínima de 10 atletas em súmula. O regulamento obriga que <strong>5 atletas diferentes iniciem o 2º período</strong>, garantindo oportunidade de jogo para todos os jovens atletas.
                      </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg">
                      <div className="flex items-center gap-2.5 text-blue-400 mb-2 sm:mb-3">
                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                        <h4 className="font-extrabold text-white text-base">Cartão Azul (Substituição Obrigatória)</h4>
                      </div>
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                        Nas categorias de Iniciação adota-se o <strong>Cartão Azul</strong>. O atleta punido deve ser substituído imediatamente, <strong>sem desfalcar numericamente a sua equipe</strong> durante a partida.
                      </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg">
                      <div className="flex items-center gap-2.5 text-blue-400 mb-2 sm:mb-3">
                        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                        <h4 className="font-extrabold text-white text-base">Proibição de Goleiro-Linha</h4>
                      </div>
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                        É expressamente <strong>vedado o uso do goleiro-linha</strong> nas categorias de Iniciação, visando preservar os fundamentos pedagógicos e defensivos do jogo formativo.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg">
                    <h4 className="font-extrabold text-white text-sm sm:text-base mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                      Critérios Oficiais de Desempate (Regulamento FPFS)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
                      <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="font-black text-blue-400 text-xs sm:text-sm">1º</span>
                        <p className="font-bold text-white mt-0.5 sm:mt-1">Confronto Direto</p>
                        <p className="text-slate-400 text-[10px] sm:text-[11px]">Empate entre 2 equipes.</p>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="font-black text-blue-400 text-xs sm:text-sm">2º</span>
                        <p className="font-bold text-white mt-0.5 sm:mt-1">Vitórias</p>
                        <p className="text-slate-400 text-[10px] sm:text-[11px]">Total de triunfos na fase.</p>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="font-black text-blue-400 text-xs sm:text-sm">3º</span>
                        <p className="font-bold text-white mt-0.5 sm:mt-1">Saldo de Gols</p>
                        <p className="text-slate-400 text-[10px] sm:text-[11px]">Diferença GP e GC.</p>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="font-black text-blue-400 text-xs sm:text-sm">4º</span>
                        <p className="font-bold text-white mt-0.5 sm:mt-1">Gols Pró</p>
                        <p className="text-slate-400 text-[10px] sm:text-[11px]">Total de gols feitos.</p>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="font-black text-blue-400 text-xs sm:text-sm">5º</span>
                        <p className="font-bold text-white mt-0.5 sm:mt-1">Goal Average</p>
                        <p className="text-slate-400 text-[10px] sm:text-[11px]">Divisão de GP por GC.</p>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="font-black text-blue-400 text-xs sm:text-sm">6º</span>
                        <p className="font-bold text-white mt-0.5 sm:mt-1">Sorteio</p>
                        <p className="text-slate-400 text-[10px] sm:text-[11px]">Realizado na FPFS.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        <Footer />
      </div>

      {/* Modal da Ficha Individual do Atleta */}
      <AtletaModal
        isOpen={atletaModalOpen}
        onClose={() => setAtletaModalOpen(false)}
        temporada={temporadaSelecionada}
        categoria={categoriaSelecionada}
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

      {/* Modal de Atualização de Placar Ao Vivo */}
      <PlacarAoVivoModal
        isOpen={placarModalOpen}
        onClose={() => setPlacarModalOpen(false)}
        jogo={placarJogoSelecionado}
        onSalvar={handleSalvarPlacar}
      />
    </div>
  );
}
