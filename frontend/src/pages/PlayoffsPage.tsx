import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { campeonatosService } from '../services/api';
import type {
  PlayoffsResponse,
  PlayoffChave,
  PlayoffConfronto,
  PlayoffTime,
} from '../types';
import toast from 'react-hot-toast';
import {
  Trophy,
  Swords,
  RotateCcw,
  Sparkles,
  Shield,
  Info,
  Calendar,
  Sliders,
  Flame,
  CheckCircle2,
  Layers,
} from 'lucide-react';

const CATEGORIAS = [
  { id: 'uniao', nome: 'Torneio União (Geral)', rotulo: 'Geral (4 Subs somados)' },
  { id: 'Sub-7', nome: 'Sub-07', rotulo: 'Sub-07 (Iniciação)' },
  { id: 'Sub-8', nome: 'Sub-08', rotulo: 'Sub-08 (Iniciação)' },
  { id: 'Sub-9', nome: 'Sub-09', rotulo: 'Sub-09 (Iniciação)' },
  { id: 'Sub-10', nome: 'Sub-10', rotulo: 'Sub-10 (Iniciação)' },
];

type ChaveTipo = 'ouro' | 'prata' | 'bronze';

interface SimulacaoEstado {
  // chave: confrontoId -> 'mandante' (ganha 12 pts no uniao ou 3 na cat) | 'empate' (4 pts no uniao ou 1 na cat) | 'visitante'
  [confrontoId: string]: 'mandante' | 'empate' | 'visitante';
}

export default function PlayoffsPage() {
  const { clubeAtivo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PlayoffsResponse | null>(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('uniao');
  const [chaveAtiva, setChaveAtiva] = useState<ChaveTipo>('ouro');

  // Estado do simulador da rodada 23
  const [simuladorAberto, setSimuladorAberto] = useState(false);
  const [simulacoes, setSimulacoes] = useState<SimulacaoEstado>({});

  // Escolhas manuais de avanço nas fases do mata-mata (bracket interativo)
  const [vencedoresQuartas, setVencedoresQuartas] = useState<{ [qfId: string]: PlayoffTime }>({});
  const [vencedoresSemis, setVencedoresSemis] = useState<{ [sfId: string]: PlayoffTime }>({});
  const [campeaoChave, setCampeaoChave] = useState<{ [chave: string]: PlayoffTime }>({});

  const carregarDados = async () => {
    try {
      setLoading(true);
      const resp = await campeonatosService.obterPlayoffs(2026);
      setData(resp);
    } catch (err) {
      console.error('Erro ao carregar playoffs:', err);
      toast.error('Não foi possível carregar os dados de chaveamento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Recálculo do ranking dinâmico caso haja simulações ativas
  const { rankingDinamico, chavesDinamicas, totalSimulados } = useMemo(() => {
    if (!data) {
      return { rankingDinamico: [], chavesDinamicas: null, totalSimulados: 0 };
    }

    const totalSim = Object.keys(simulacoes).length;

    // Lista base para o escopo selecionado
    let listaBase: any[] = [];
    if (categoriaAtiva === 'uniao') {
      listaBase = JSON.parse(JSON.stringify(data.torneio_uniao.ranking));
    } else {
      const catData = data.categorias[categoriaAtiva];
      listaBase = catData ? JSON.parse(JSON.stringify(catData.ranking)) : [];
    }

    // Se houver simulações, ajustar pontos e reordenar
    if (totalSim > 0 && data.confrontos_rodada_final) {
      const ptsPorVitoria = categoriaAtiva === 'uniao' ? 12 : 3;
      const ptsPorEmpate = categoriaAtiva === 'uniao' ? 4 : 1;

      data.confrontos_rodada_final.forEach((conf) => {
        const escolha = simulacoes[conf.id];
        if (!escolha) return;

        const mItem = listaBase.find(
          (c) => c.clube.trim().toLowerCase() === conf.mandante.trim().toLowerCase()
        );
        const vItem = listaBase.find(
          (c) => c.clube.trim().toLowerCase() === conf.visitante.trim().toLowerCase()
        );

        if (escolha === 'mandante' && mItem) {
          if ('pontos_total' in mItem) {
            mItem.pontos_total += ptsPorVitoria;
            mItem.vitorias_total += categoriaAtiva === 'uniao' ? 4 : 1;
            mItem.jogos_total += categoriaAtiva === 'uniao' ? 4 : 1;
            mItem.indice_tecnico = +(
              (mItem.pontos_total / mItem.jogos_total) *
              1000
            ).toFixed(1);
          } else {
            mItem.pontos += ptsPorVitoria;
            mItem.vitorias += 1;
            mItem.jogos += 1;
          }
        } else if (escolha === 'visitante' && vItem) {
          if ('pontos_total' in vItem) {
            vItem.pontos_total += ptsPorVitoria;
            vItem.vitorias_total += categoriaAtiva === 'uniao' ? 4 : 1;
            vItem.jogos_total += categoriaAtiva === 'uniao' ? 4 : 1;
            vItem.indice_tecnico = +(
              (vItem.pontos_total / vItem.jogos_total) *
              1000
            ).toFixed(1);
          } else {
            vItem.pontos += ptsPorVitoria;
            vItem.vitorias += 1;
            vItem.jogos += 1;
          }
        } else if (escolha === 'empate') {
          if (mItem) {
            if ('pontos_total' in mItem) {
              mItem.pontos_total += ptsPorEmpate;
              mItem.empates_total += categoriaAtiva === 'uniao' ? 4 : 1;
              mItem.jogos_total += categoriaAtiva === 'uniao' ? 4 : 1;
              mItem.indice_tecnico = +(
                (mItem.pontos_total / mItem.jogos_total) *
                1000
              ).toFixed(1);
            } else {
              mItem.pontos += ptsPorEmpate;
              mItem.empates += 1;
              mItem.jogos += 1;
            }
          }
          if (vItem) {
            if ('pontos_total' in vItem) {
              vItem.pontos_total += ptsPorEmpate;
              vItem.empates_total += categoriaAtiva === 'uniao' ? 4 : 1;
              vItem.jogos_total += categoriaAtiva === 'uniao' ? 4 : 1;
              vItem.indice_tecnico = +(
                (vItem.pontos_total / vItem.jogos_total) *
                1000
              ).toFixed(1);
            } else {
              vItem.pontos += ptsPorEmpate;
              vItem.empates += 1;
              vItem.jogos += 1;
            }
          }
        }
      });

      // Re-ordenar conforme critérios oficiais
      listaBase.sort((a, b) => {
        if ('indice_tecnico' in a && 'indice_tecnico' in b) {
          if (b.indice_tecnico !== a.indice_tecnico) return b.indice_tecnico - a.indice_tecnico;
          if (b.vitorias_total !== a.vitorias_total) return b.vitorias_total - a.vitorias_total;
          if (b.saldo_gols_total !== a.saldo_gols_total) return b.saldo_gols_total - a.saldo_gols_total;
          return (b.pontos_total || 0) - (a.pontos_total || 0);
        } else {
          if ((b.pontos || 0) !== (a.pontos || 0)) return (b.pontos || 0) - (a.pontos || 0);
          if ((b.vitorias || 0) !== (a.vitorias || 0)) return (b.vitorias || 0) - (a.vitorias || 0);
          return (b.saldo_gols || 0) - (a.saldo_gols || 0);
        }
      });

      // Atualizar posição e chave de cada equipe
      listaBase.forEach((item, idx) => {
        item.posicao = idx + 1;
        if (item.posicao <= 8) item.chave = 'OURO';
        else if (item.posicao <= 16) item.chave = 'PRATA';
        else item.chave = 'BRONZE';
      });
    }

    // Montar as chaves com a lista recalculada
    const ouroTimes = listaBase.slice(0, 8);
    const prataTimes = listaBase.slice(8, 16);
    const bronzeTimes = listaBase.slice(16, 24);

    const montarChaveDinamica = (times: PlayoffTime[], nome: string, cor: string): PlayoffChave => {
      const quartas: PlayoffConfronto[] = [];
      if (times.length >= 8) {
        quartas.push(
          {
            id: `${nome.toLowerCase()}_qf1`,
            titulo: 'Quartas 1',
            semifinal_id: 'sf1',
            time_mandante: times[0],
            time_visitante: times[7],
            vantagem: times[0]?.clube,
          },
          {
            id: `${nome.toLowerCase()}_qf2`,
            titulo: 'Quartas 2',
            semifinal_id: 'sf2',
            time_mandante: times[1],
            time_visitante: times[6],
            vantagem: times[1]?.clube,
          },
          {
            id: `${nome.toLowerCase()}_qf3`,
            titulo: 'Quartas 3',
            semifinal_id: 'sf2',
            time_mandante: times[2],
            time_visitante: times[5],
            vantagem: times[2]?.clube,
          },
          {
            id: `${nome.toLowerCase()}_qf4`,
            titulo: 'Quartas 4',
            semifinal_id: 'sf1',
            time_mandante: times[3],
            time_visitante: times[4],
            vantagem: times[3]?.clube,
          }
        );
      }
      return { nome, cor, times, quartas };
    };

    return {
      rankingDinamico: listaBase,
      chavesDinamicas: {
        ouro: montarChaveDinamica(ouroTimes, 'Ouro', 'amber'),
        prata: montarChaveDinamica(prataTimes, 'Prata', 'slate'),
        bronze: montarChaveDinamica(bronzeTimes, 'Bronze', 'orange'),
      },
      totalSimulados: totalSim,
    };
  }, [data, categoriaAtiva, simulacoes]);

  // Identificar situação do "Meu Clube"
  const meuClubeStatus = useMemo(() => {
    if (!clubeAtivo || !rankingDinamico.length) return null;

    const item = rankingDinamico.find(
      (c) =>
        c.clube.trim().toLowerCase() === clubeAtivo.trim().toLowerCase() ||
        c.clube.trim().toLowerCase().includes(clubeAtivo.trim().toLowerCase()) ||
        clubeAtivo.trim().toLowerCase().includes(c.clube.trim().toLowerCase())
    );

    if (!item) return null;

    const chave = (item.chave || 'BRONZE').toLowerCase() as ChaveTipo;
    const chaveObj = chavesDinamicas ? chavesDinamicas[chave] : null;
    let confrontoQF: PlayoffConfronto | null = null;
    let adversario: PlayoffTime | null = null;
    let temVantagem = false;

    if (chaveObj) {
      confrontoQF =
        chaveObj.quartas.find(
          (qf) =>
            qf.time_mandante.clube.toLowerCase() === item.clube.toLowerCase() ||
            qf.time_visitante.clube.toLowerCase() === item.clube.toLowerCase()
        ) || null;

      if (confrontoQF) {
        temVantagem = confrontoQF.time_mandante.clube.toLowerCase() === item.clube.toLowerCase();
        adversario = temVantagem ? confrontoQF.time_visitante : confrontoQF.time_mandante;
      }
    }

    return {
      clube: item.clube,
      escudo_url: item.escudo_url,
      posicao: item.posicao,
      chave: item.chave,
      pontos: item.pontos_total ?? item.pontos ?? 0,
      indice_tecnico: item.indice_tecnico,
      confrontoQF,
      adversario,
      temVantagem,
    };
  }, [clubeAtivo, rankingDinamico, chavesDinamicas]);

  // Identifica se há qualquer simulação de jogo ou escolha de avanço no mata-mata
  const temSimulacaoOuAvanco = useMemo(() => {
    return (
      totalSimulados > 0 ||
      Object.keys(vencedoresQuartas).length > 0 ||
      Object.keys(vencedoresSemis).length > 0 ||
      Object.keys(campeaoChave).length > 0
    );
  }, [totalSimulados, vencedoresQuartas, vencedoresSemis, campeaoChave]);

  // Manipular simulação de jogo
  const handleSimularJogo = (confrontoId: string, resultado: 'mandante' | 'empate' | 'visitante') => {
    setSimulacoes((prev) => {
      const atual = prev[confrontoId];
      if (atual === resultado) {
        // desmarcar
        const copia = { ...prev };
        delete copia[confrontoId];
        return copia;
      }
      return { ...prev, [confrontoId]: resultado };
    });
  };

  const handleResetarSimulacao = () => {
    setSimulacoes({});
    setVencedoresQuartas({});
    setVencedoresSemis({});
    setCampeaoChave({});
    toast.success('Simulação resetada para a classificação oficial!');
  };

  // Manipular avanço no chaveamento interativo
  const handleEscolherVencedorQF = (qfId: string, time: PlayoffTime) => {
    setVencedoresQuartas((prev) => ({ ...prev, [qfId]: time }));
  };

  const handleEscolherVencedorSemi = (sfId: string, time: PlayoffTime) => {
    setVencedoresSemis((prev) => ({ ...prev, [sfId]: time }));
  };

  const handleEscolherCampeao = (chave: string, time: PlayoffTime) => {
    setCampeaoChave((prev) => ({ ...prev, [chave]: time }));
    toast.success(`🏆 ${time.clube} campeão da ${chave.toUpperCase()}!`, {
      icon: '🏆',
      style: { background: '#0f172a', color: '#fbbf24', border: '1px solid #d97706' },
    });
  };

  const chaveAtual = chavesDinamicas ? chavesDinamicas[chaveAtiva] : null;

  // Semifinais derivadas
  const semi1Time1 = vencedoresQuartas[`${chaveAtiva}_qf1`] || chaveAtual?.quartas[0]?.time_mandante;
  const semi1Time2 = vencedoresQuartas[`${chaveAtiva}_qf4`] || chaveAtual?.quartas[3]?.time_mandante;
  const semi2Time1 = vencedoresQuartas[`${chaveAtiva}_qf2`] || chaveAtual?.quartas[1]?.time_mandante;
  const semi2Time2 = vencedoresQuartas[`${chaveAtiva}_qf3`] || chaveAtual?.quartas[2]?.time_mandante;

  const finalTime1 = vencedoresSemis[`${chaveAtiva}_sf1`] || semi1Time1;
  const finalTime2 = vencedoresSemis[`${chaveAtiva}_sf2`] || semi2Time1;

  const campeao = campeaoChave[chaveAtiva] || null;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* ========================================================================= */}
          {/* CABEÇALHO DA PÁGINA */}
          {/* ========================================================================= */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Swords className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  Playoffs & Cruzamentos FPFS
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold">
                  23ª Rodada • Reta Final
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Mata-Mata & Simulador de Chaveamento
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Projeção das Quartas, Semis e Finais das Chaves Ouro, Prata e Bronze com simulador
                em tempo real da rodada final.
              </p>
            </div>

            {/* Ações Rápidas (Simulador e Botão Resetar Sempre Visíveis) */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSimuladorAberto(!simuladorAberto)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition shadow-sm cursor-pointer ${
                  simuladorAberto || totalSimulados > 0
                    ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Simulador da 23ª Rodada</span>
                {totalSimulados > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center">
                    {totalSimulados}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={handleResetarSimulacao}
                disabled={!temSimulacaoOuAvanco}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition shadow-sm ${
                  temSimulacaoOuAvanco
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 cursor-pointer shadow-amber-500/10'
                    : 'bg-slate-900/60 text-slate-500 border-slate-800 cursor-default'
                }`}
                title={
                  temSimulacaoOuAvanco
                    ? 'Resetar simulações e voltar aos dados oficiais da FPFS'
                    : 'Classificação oficial da FPFS (nenhuma simulação ativa)'
                }
              >
                <RotateCcw
                  className={`w-3.5 h-3.5 ${temSimulacaoOuAvanco ? 'text-amber-400' : 'text-slate-600'}`}
                />
                <span>{temSimulacaoOuAvanco ? 'Resetar Simulação' : 'Oficial FPFS'}</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD EM DESTAQUE: "VESTE A CAMISA" / MEU CLUBE NO MATA-MATA */}
          {/* ========================================================================= */}
          {meuClubeStatus && (
            <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-blue-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 p-2 flex items-center justify-center shrink-0 shadow-inner">
                    <img
                      src={meuClubeStatus.escudo_url || '/fpfs_shield.png'}
                      alt={meuClubeStatus.clube}
                      className="w-full h-full object-contain drop-shadow"
                      onError={(e) => {
                        e.currentTarget.src = '/fpfs_shield.png';
                      }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Seu Clube no Chaveamento
                      </span>
                      {totalSimulados > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Cenário Simulado
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                      {meuClubeStatus.clube}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      <span className="text-white font-bold">{meuClubeStatus.posicao}º Lugar</span>{' '}
                      Geral •{' '}
                      <span
                        className={`font-black ${
                          meuClubeStatus.chave === 'OURO'
                            ? 'text-amber-400'
                            : meuClubeStatus.chave === 'PRATA'
                            ? 'text-slate-300'
                            : 'text-orange-400'
                        }`}
                      >
                        Chave {meuClubeStatus.chave}
                      </span>{' '}
                      • {meuClubeStatus.pontos} pontos
                      {meuClubeStatus.indice_tecnico ? ` • IT: ${meuClubeStatus.indice_tecnico}` : ''}
                    </p>
                  </div>
                </div>

                {/* Adversário Projetado nas Quartas */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/90 sm:min-w-[280px]">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                    <span>Confronto nas Quartas:</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        meuClubeStatus.temVantagem
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {meuClubeStatus.temVantagem ? '🛡️ Tem Vantagem' : '✈️ Sem Vantagem'}
                    </span>
                  </p>
                  {meuClubeStatus.adversario ? (
                    <div className="flex items-center gap-2.5 mt-2">
                      <img
                        src={meuClubeStatus.adversario.escudo_url || '/fpfs_shield.png'}
                        alt={meuClubeStatus.adversario.clube}
                        className="w-7 h-7 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = '/fpfs_shield.png';
                        }}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-black text-white truncate">
                          {meuClubeStatus.adversario.clube}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {meuClubeStatus.adversario.posicao}º Lugar •{' '}
                          {meuClubeStatus.adversario.pontos_total ??
                            meuClubeStatus.adversario.pontos ??
                            0}{' '}
                          pts
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic mt-1">Aguardando definição</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SIMULADOR RETRÁTIL DA 23ª RODADA (WHAT-IF) */}
          {/* ========================================================================= */}
          {simuladorAberto && (
            <div className="bg-slate-900 border border-blue-500/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Sliders className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      Simulador de Resultados da 23ª Rodada (Última da 1ª Fase)
                    </h3>
                    <p className="text-slate-400 text-xs">
                      Clique no vencedor ou empate para ver o chaveamento recalculando
                      automaticamente.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">
                    {totalSimulados} de {data?.confrontos_rodada_final?.length || 0} jogos simulados
                  </span>
                  {totalSimulados > 0 && (
                    <button
                      type="button"
                      onClick={handleResetarSimulacao}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[11px] text-amber-300 font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                      <span>Limpar Simulador</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Grid com os Confrontos da Rodada Final */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data?.confrontos_rodada_final?.map((conf) => {
                  const escolha = simulacoes[conf.id];
                  const isMeuClube =
                    clubeAtivo &&
                    (conf.mandante.toLowerCase().includes(clubeAtivo.toLowerCase()) ||
                      conf.visitante.toLowerCase().includes(clubeAtivo.toLowerCase()));

                  return (
                    <div
                      key={conf.id}
                      className={`p-3 rounded-xl border transition ${
                        isMeuClube
                          ? 'bg-blue-950/40 border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Info do Confronto */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                        <span className="flex items-center gap-1 font-semibold text-slate-300">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {conf.data} • {conf.hora}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            conf.status_geral === 'Encerrado'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {conf.status_geral}
                        </span>
                      </div>

                      {/* Mandante x Visitante */}
                      <div className="space-y-1.5 mb-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={conf.mandante_escudo || '/fpfs_shield.png'}
                              alt={conf.mandante}
                              className="w-5 h-5 object-contain shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = '/fpfs_shield.png';
                              }}
                            />
                            <span className="text-xs font-bold text-slate-200 truncate">
                              {conf.mandante}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {conf.mandante_posicao ? `${conf.mandante_posicao}º` : ''} (
                            {conf.mandante_pontos} pts)
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={conf.visitante_escudo || '/fpfs_shield.png'}
                              alt={conf.visitante}
                              className="w-5 h-5 object-contain shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = '/fpfs_shield.png';
                              }}
                            />
                            <span className="text-xs font-bold text-slate-200 truncate">
                              {conf.visitante}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {conf.visitante_posicao ? `${conf.visitante_posicao}º` : ''} (
                            {conf.visitante_pontos} pts)
                          </span>
                        </div>
                      </div>

                      {/* Botões de Simulação: [Vitória Mandante] [Empate] [Vitória Visitante] */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => handleSimularJogo(conf.id, 'mandante')}
                          className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                            escolha === 'mandante'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {escolha === 'mandante' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          <span>Vence 1</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSimularJogo(conf.id, 'empate')}
                          className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                            escolha === 'empate'
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {escolha === 'empate' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          <span>Empate</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSimularJogo(conf.id, 'visitante')}
                          className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                            escolha === 'visitante'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {escolha === 'visitante' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          <span>Vence 2</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SELETOR DE ESCOPO: TORNEIO UNIÃO OU SUB-7 A SUB-10 */}
          {/* ========================================================================= */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIAS.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoriaAtiva(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  categoriaAtiva === cat.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {cat.id === 'uniao' ? <Trophy className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                <span>{cat.nome}</span>
              </button>
            ))}
          </div>

          {/* ========================================================================= */}
          {/* SELETOR DE CHAVES: OURO, PRATA, BRONZE */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            <button
              type="button"
              onClick={() => setChaveAtiva('ouro')}
              className={`p-3 sm:p-4 rounded-2xl border text-left transition relative overflow-hidden cursor-pointer ${
                chaveAtiva === 'ouro'
                  ? 'bg-amber-500/15 border-amber-500/50 shadow-lg ring-1 ring-amber-500/40 text-amber-300'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs sm:text-sm font-black flex items-center gap-1.5 text-white">
                  <span>🥇</span> Chave OURO
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                  1º ao 8º
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                Disputa pelo Título Estadual Principal
              </p>
            </button>

            <button
              type="button"
              onClick={() => setChaveAtiva('prata')}
              className={`p-3 sm:p-4 rounded-2xl border text-left transition relative overflow-hidden cursor-pointer ${
                chaveAtiva === 'prata'
                  ? 'bg-slate-300/15 border-slate-400/50 shadow-lg ring-1 ring-slate-400/40 text-slate-200'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs sm:text-sm font-black flex items-center gap-1.5 text-white">
                  <span>🥈</span> Chave PRATA
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-500/20 text-slate-300">
                  9º ao 16º
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                Disputa pelo Troféu da Chave Prata
              </p>
            </button>

            <button
              type="button"
              onClick={() => setChaveAtiva('bronze')}
              className={`p-3 sm:p-4 rounded-2xl border text-left transition relative overflow-hidden cursor-pointer ${
                chaveAtiva === 'bronze'
                  ? 'bg-orange-600/15 border-orange-500/50 shadow-lg ring-1 ring-orange-500/40 text-orange-300'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs sm:text-sm font-black flex items-center gap-1.5 text-white">
                  <span>🥉</span> Chave BRONZE
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">
                  17º ao 24º
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                Disputa pelo Troféu da Chave Bronze
              </p>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* ÁRVORE DO CHAVEAMENTO (BRACKET MODERNO) */}
          {/* ========================================================================= */}
          {loading ? (
            <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-300">Calculando chaveamento oficial...</p>
            </div>
          ) : !chaveAtual || !chaveAtual.quartas.length ? (
            <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 text-sm">
              Não há dados suficientes para compor esta chave.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Barra de Instrução do Bracket */}
              <div className="flex items-center justify-between bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800 text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span>
                    Toque em uma equipe para simular sua vitória e vê-la avançar para a próxima fase!
                  </span>
                </span>
                <div className="flex items-center gap-3">
                  {(Object.keys(vencedoresQuartas).length > 0 ||
                    Object.keys(vencedoresSemis).length > 0 ||
                    Object.keys(campeaoChave).length > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        setVencedoresQuartas({});
                        setVencedoresSemis({});
                        setCampeaoChave({});
                        toast.success('Escolhas da árvore resetadas!');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[11px] text-amber-300 font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                      <span>Limpar Árvore</span>
                    </button>
                  )}
                  <span className="hidden sm:inline font-bold text-slate-300">
                    Vantagem do empate / mando para melhor campanha
                  </span>
                </div>
              </div>

              {/* Layout da Árvore: 3 Colunas (Quartas -> Semis -> Final) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* ------------------------------------------------------------- */}
                {/* COLUNA 1: QUARTAS DE FINAL (4 CONFRONTOS) */}
                {/* ------------------------------------------------------------- */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-blue-400" />
                      Quartas de Final
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">8 Equipes</span>
                  </div>

                  {chaveAtual.quartas.map((qf) => {
                    const vencedorQF = vencedoresQuartas[qf.id];
                    const isMandanteVencedor =
                      vencedorQF?.clube.toLowerCase() === qf.time_mandante.clube.toLowerCase();
                    const isVisitanteVencedor =
                      vencedorQF?.clube.toLowerCase() === qf.time_visitante.clube.toLowerCase();

                    const isMeuClubeNoJogo =
                      clubeAtivo &&
                      (qf.time_mandante.clube.toLowerCase().includes(clubeAtivo.toLowerCase()) ||
                        qf.time_visitante.clube.toLowerCase().includes(clubeAtivo.toLowerCase()));

                    return (
                      <div
                        key={qf.id}
                        className={`p-3.5 rounded-2xl border transition shadow-sm relative ${
                          isMeuClubeNoJogo
                            ? 'bg-slate-900 border-blue-500/60 ring-1 ring-blue-500/30'
                            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Header do Confronto */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                          <span className="font-bold text-slate-300 uppercase tracking-wider">
                            {qf.titulo}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            Cruza com {qf.semifinal_id === 'sf1' ? 'Semi 1' : 'Semi 2'}
                          </span>
                        </div>

                        {/* Equipe 1 (Mandante / Melhor Campanha) */}
                        <button
                          type="button"
                          onClick={() => handleEscolherVencedorQF(qf.id, qf.time_mandante)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer mb-1.5 ${
                            isMandanteVencedor
                              ? 'bg-blue-600/25 border border-blue-500/40 text-white'
                              : 'bg-slate-950/70 hover:bg-slate-950 text-slate-300 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-slate-800 font-mono font-bold text-[10px] text-slate-400 flex items-center justify-center shrink-0">
                              {qf.time_mandante.posicao}º
                            </span>
                            <img
                              src={qf.time_mandante.escudo_url || '/fpfs_shield.png'}
                              alt={qf.time_mandante.clube}
                              className="w-6 h-6 object-contain shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = '/fpfs_shield.png';
                              }}
                            />
                            <span className="text-xs font-bold truncate">
                              {qf.time_mandante.clube}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-bold text-emerald-400">🛡️ Mando</span>
                            {isMandanteVencedor && (
                              <CheckCircle2 className="w-4 h-4 text-blue-400" />
                            )}
                          </div>
                        </button>

                        {/* Equipe 2 (Visitante) */}
                        <button
                          type="button"
                          onClick={() => handleEscolherVencedorQF(qf.id, qf.time_visitante)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                            isVisitanteVencedor
                              ? 'bg-blue-600/25 border border-blue-500/40 text-white'
                              : 'bg-slate-950/70 hover:bg-slate-950 text-slate-300 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-slate-800 font-mono font-bold text-[10px] text-slate-400 flex items-center justify-center shrink-0">
                              {qf.time_visitante.posicao}º
                            </span>
                            <img
                              src={qf.time_visitante.escudo_url || '/fpfs_shield.png'}
                              alt={qf.time_visitante.clube}
                              className="w-6 h-6 object-contain shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = '/fpfs_shield.png';
                              }}
                            />
                            <span className="text-xs font-bold truncate">
                              {qf.time_visitante.clube}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-slate-500">Visitante</span>
                            {isVisitanteVencedor && (
                              <CheckCircle2 className="w-4 h-4 text-blue-400" />
                            )}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* ------------------------------------------------------------- */}
                {/* COLUNA 2: SEMIFINAIS (2 CONFRONTOS) */}
                {/* ------------------------------------------------------------- */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-400" />
                      Semifinais
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">4 Equipes</span>
                  </div>

                  {/* Semifinal 1 (QF1 x QF4) */}
                  <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold uppercase text-amber-400">Semifinal 1</span>
                      <span>Vencedor QF1 x QF4</span>
                    </div>

                    {semi1Time1 && (
                      <button
                        type="button"
                        onClick={() => handleEscolherVencedorSemi(`${chaveAtiva}_sf1`, semi1Time1)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                          vencedoresSemis[`${chaveAtiva}_sf1`]?.clube === semi1Time1.clube
                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black'
                            : 'bg-slate-950/70 hover:bg-slate-950 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={semi1Time1.escudo_url || '/fpfs_shield.png'}
                            alt={semi1Time1.clube}
                            className="w-6 h-6 object-contain shrink-0"
                          />
                          <span className="text-xs font-bold truncate">{semi1Time1.clube}</span>
                        </div>
                        {vencedoresSemis[`${chaveAtiva}_sf1`]?.clube === semi1Time1.clube && (
                          <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        )}
                      </button>
                    )}

                    {semi1Time2 && (
                      <button
                        type="button"
                        onClick={() => handleEscolherVencedorSemi(`${chaveAtiva}_sf1`, semi1Time2)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                          vencedoresSemis[`${chaveAtiva}_sf1`]?.clube === semi1Time2.clube
                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black'
                            : 'bg-slate-950/70 hover:bg-slate-950 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={semi1Time2.escudo_url || '/fpfs_shield.png'}
                            alt={semi1Time2.clube}
                            className="w-6 h-6 object-contain shrink-0"
                          />
                          <span className="text-xs font-bold truncate">{semi1Time2.clube}</span>
                        </div>
                        {vencedoresSemis[`${chaveAtiva}_sf1`]?.clube === semi1Time2.clube && (
                          <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Semifinal 2 (QF2 x QF3) */}
                  <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold uppercase text-amber-400">Semifinal 2</span>
                      <span>Vencedor QF2 x QF3</span>
                    </div>

                    {semi2Time1 && (
                      <button
                        type="button"
                        onClick={() => handleEscolherVencedorSemi(`${chaveAtiva}_sf2`, semi2Time1)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                          vencedoresSemis[`${chaveAtiva}_sf2`]?.clube === semi2Time1.clube
                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black'
                            : 'bg-slate-950/70 hover:bg-slate-950 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={semi2Time1.escudo_url || '/fpfs_shield.png'}
                            alt={semi2Time1.clube}
                            className="w-6 h-6 object-contain shrink-0"
                          />
                          <span className="text-xs font-bold truncate">{semi2Time1.clube}</span>
                        </div>
                        {vencedoresSemis[`${chaveAtiva}_sf2`]?.clube === semi2Time1.clube && (
                          <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        )}
                      </button>
                    )}

                    {semi2Time2 && (
                      <button
                        type="button"
                        onClick={() => handleEscolherVencedorSemi(`${chaveAtiva}_sf2`, semi2Time2)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                          vencedoresSemis[`${chaveAtiva}_sf2`]?.clube === semi2Time2.clube
                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black'
                            : 'bg-slate-950/70 hover:bg-slate-950 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={semi2Time2.escudo_url || '/fpfs_shield.png'}
                            alt={semi2Time2.clube}
                            className="w-6 h-6 object-contain shrink-0"
                          />
                          <span className="text-xs font-bold truncate">{semi2Time2.clube}</span>
                        </div>
                        {vencedoresSemis[`${chaveAtiva}_sf2`]?.clube === semi2Time2.clube && (
                          <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* COLUNA 3: GRANDE FINAL & CAMPEÃO */}
                {/* ------------------------------------------------------------- */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      Grande Final
                    </span>
                    <span className="text-[10px] font-bold text-amber-400">Decisão</span>
                  </div>

                  {/* Card da Final */}
                  <div className="p-4 rounded-2xl border border-amber-500/40 bg-gradient-to-b from-slate-900 to-slate-950 shadow-xl space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-amber-400 font-black">
                      <span>DECISÃO DO TÍTULO</span>
                      <span>Chave {chaveAtiva.toUpperCase()}</span>
                    </div>

                    {finalTime1 && (
                      <button
                        type="button"
                        onClick={() => handleEscolherCampeao(chaveAtiva, finalTime1)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl transition cursor-pointer ${
                          campeao?.clube === finalTime1.clube
                            ? 'bg-amber-500/25 border border-amber-500 text-amber-300 font-black shadow-lg'
                            : 'bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={finalTime1.escudo_url || '/fpfs_shield.png'}
                            alt={finalTime1.clube}
                            className="w-7 h-7 object-contain shrink-0"
                          />
                          <span className="text-sm font-black truncate">{finalTime1.clube}</span>
                        </div>
                        {campeao?.clube === finalTime1.clube && (
                          <span className="text-sm font-black text-amber-400">🏆 Campeão!</span>
                        )}
                      </button>
                    )}

                    <div className="text-center text-[10px] font-bold text-slate-500">VS</div>

                    {finalTime2 && (
                      <button
                        type="button"
                        onClick={() => handleEscolherCampeao(chaveAtiva, finalTime2)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl transition cursor-pointer ${
                          campeao?.clube === finalTime2.clube
                            ? 'bg-amber-500/25 border border-amber-500 text-amber-300 font-black shadow-lg'
                            : 'bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={finalTime2.escudo_url || '/fpfs_shield.png'}
                            alt={finalTime2.clube}
                            className="w-7 h-7 object-contain shrink-0"
                          />
                          <span className="text-sm font-black truncate">{finalTime2.clube}</span>
                        </div>
                        {campeao?.clube === finalTime2.clube && (
                          <span className="text-sm font-black text-amber-400">🏆 Campeão!</span>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Pódio / Campeão Consagrado */}
                  {campeao && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-500/40 text-center space-y-2 shadow-xl animate-in zoom-in-95 duration-200">
                      <span className="text-2xl">🏆</span>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                        Campeão Projetado • Chave {chaveAtiva.toUpperCase()}
                      </p>
                      <h4 className="text-lg font-black text-white">{campeao.clube}</h4>
                      <p className="text-xs text-slate-400">
                        Classificado em {campeao.posicao}º lugar na 1ª fase
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
}
