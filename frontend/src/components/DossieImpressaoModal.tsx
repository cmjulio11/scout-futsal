import { useState } from 'react';
import type { ConfrontoScoutResponse, ConfrontoClubeInfo, PartidaRodadaItem } from '../types';
import {
  formatarNomeClubeCurto,
  formatarNomeAtletaCurto,
  formatarRodada,
} from '../utils/formatters';
import {
  Printer,
  X,
  Trophy,
  Home,
  Navigation,
  Flame,
  Clock,
  Calendar,
  MapPin,
  FileText,
  AlertTriangle,
  Sparkles,
  Layers,
  Sun,
  Moon,
  Download,
  Loader2,
} from 'lucide-react';
import { scoutService } from '../services/api';
import toast from 'react-hot-toast';

interface DossieImpressaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  confronto: ConfrontoScoutResponse | null;
  mandante: string;
  visitante: string;
  categoriaAtiva: string;
  mandanteInfo: ConfrontoClubeInfo | null;
  visitanteInfo: ConfrontoClubeInfo | null;
  partidaInfo?: PartidaRodadaItem | null;
}

export default function DossieImpressaoModal({
  isOpen,
  onClose,
  confronto,
  mandante,
  visitante,
  categoriaAtiva,
  mandanteInfo,
  visitanteInfo,
  partidaInfo,
}: DossieImpressaoModalProps) {
  // Modo de visualização: 'eco' (Branco/Papel Econômico) ou 'escuro' (Apresentação Digital)
  const [tema, setTema] = useState<'eco' | 'escuro'>('eco');
  const [baixandoPdf, setBaixandoPdf] = useState(false);

  if (!isOpen || !confronto) return null;

  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleBaixarPdfOficial = async () => {
    try {
      setBaixandoPdf(true);
      toast.loading('Gerando Dossiê Pré-Jogo Oficial em PDF...', { id: 'pdf-confronto' });
      await scoutService.baixarPdfConfronto(
        mandante,
        visitante,
        2026,
        categoriaAtiva,
        partidaInfo
          ? {
              data: partidaInfo.data,
              hora: partidaInfo.hora,
              ginasio: partidaInfo.ginasio,
              rodada: partidaInfo.rodada,
            }
          : undefined
      );
      toast.success('Dossiê em PDF baixado com sucesso!', { id: 'pdf-confronto' });
    } catch (err) {
      console.error('Erro ao baixar PDF oficial:', err);
      toast.error('Erro ao gerar PDF oficial. Tente imprimir pelo navegador.', { id: 'pdf-confronto' });
    } finally {
      setBaixandoPdf(false);
    }
  };

  const handlePrint = () => {
    const nomeM = formatarNomeClubeCurto(mandante).replace(/[^a-zA-Z0-9]/g, '_');
    const nomeV = formatarNomeClubeCurto(visitante).replace(/[^a-zA-Z0-9]/g, '_');
    const cat = categoriaAtiva === 'geral' ? 'Torneio_Uniao' : categoriaAtiva.replace(/[^a-zA-Z0-9]/g, '_');
    const originalTitle = document.title;

    // Define o nome de arquivo padrão sugerido ao Salvar como PDF
    document.title = `Dossie_${nomeM}_x_${nomeV}_${cat}_FPFS_2026`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 2500);
  };

  const isEco = tema === 'eco';

  return (
    <div className="print-modal-backdrop fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-md overflow-hidden">
      {/* BARRA DE CONTROLES SUPERIOR (NÃO APARECE NA IMPRESSÃO) */}
      <div className="no-print bg-slate-900 border-b border-slate-800 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <span>Dossiê Tático Pré-Jogo</span>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Formato A4
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {formatarNomeClubeCurto(mandante)} x {formatarNomeClubeCurto(visitante)} •{' '}
              {categoriaAtiva === 'geral' ? 'Torneio União' : categoriaAtiva}
            </p>
          </div>
        </div>

        {/* CONTROLES E AÇÕES */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Seletor de Tema (Econômico vs Escuro) */}
          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setTema('eco')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                isEco
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Fundo branco limpo, otimizado para economizar tinta de impressora"
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Modo Papel (Econômico)</span>
            </button>
            <button
              type="button"
              onClick={() => setTema('escuro')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                !isEco
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Fundo escuro tecnológico, ideal para tablets e apresentações digitais"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Modo Digital (Escuro)</span>
            </button>
          </div>

          {/* Botão Baixar PDF Oficial (1 Página) */}
          <button
            type="button"
            onClick={handleBaixarPdfOficial}
            disabled={baixandoPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs sm:text-sm font-black transition shadow-lg shadow-emerald-600/30 active:scale-95 cursor-pointer"
            title="Baixar arquivo PDF de 1 página gerado diretamente pelo servidor, pronto para prancheta"
          >
            {baixandoPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{baixandoPdf ? 'Gerando PDF...' : 'Baixar PDF Oficial (1 Pág)'}</span>
          </button>

          {/* Botão Imprimir / Salvar PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-black transition shadow-lg shadow-blue-600/30 active:scale-95 cursor-pointer"
            title="Abrir caixa de diálogo de impressão do navegador"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Navegador</span>
          </button>

          {/* Fechar */}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ÁREA DE PRÉ-VISUALIZAÇÃO / FOLHA A4 */}
      <div className="print-scroll-container flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-900/50">
        <div
          className={`print-sheet w-full max-w-[850px] p-6 sm:p-8 rounded-2xl border transition-colors shadow-2xl ${
            isEco
              ? 'bg-white text-slate-900 border-slate-300'
              : 'bg-slate-950 text-slate-100 border-slate-800'
          }`}
        >
          {/* 1. CABEÇALHO OFICIAL DO RELATÓRIO */}
          <div
            className={`border-b pb-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isEco ? 'border-slate-300' : 'border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    isEco
                      ? 'bg-slate-100 text-slate-800 border border-slate-300'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  FPFS • Série A1 Iniciação
                </span>
                <span className={`text-xs ${isEco ? 'text-slate-400' : 'text-slate-500'}`}>•</span>
                <span className={`text-xs font-semibold ${isEco ? 'text-slate-600' : 'text-slate-400'}`}>
                  Temporada {confronto.temporada}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                Dossiê Tático Pré-Jogo
              </h1>
              <p className={`text-xs mt-0.5 ${isEco ? 'text-slate-600' : 'text-slate-400'}`}>
                Escopo de Análise:{' '}
                <strong className={isEco ? 'text-slate-900' : 'text-white'}>
                  {categoriaAtiva === 'geral' ? 'Torneio União (Quadro Geral Unificado)' : categoriaAtiva}
                </strong>
              </p>
            </div>

            <div
              className={`text-right text-[11px] p-2.5 rounded-xl border ${
                isEco
                  ? 'bg-slate-50 border-slate-200 text-slate-600'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400'
              }`}
            >
              <p className="font-bold flex items-center justify-end gap-1">
                <Clock className="w-3 h-3" />
                <span>Emissão: {dataAtual}</span>
              </p>
              {partidaInfo?.rodada && (
                <p className="font-semibold text-blue-600 mt-0.5">
                  {formatarRodada(partidaInfo.rodada)}
                </p>
              )}
              {partidaInfo?.ginasio && (
                <p className="truncate max-w-[220px] flex items-center justify-end gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{partidaInfo.ginasio}</span>
                </p>
              )}
            </div>
          </div>

          {/* 2. CARD PRINCIPAL DO DUELO: MANDANTE X VISITANTE */}
          <div
            className={`avoid-break rounded-2xl p-4 sm:p-5 mb-5 border ${
              isEco
                ? 'bg-slate-50 border-slate-300'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div className="grid grid-cols-11 gap-2 items-center text-center">
              {/* Mandante */}
              <div className="col-span-5 flex flex-col items-center">
                <span
                  className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded mb-1.5 ${
                    isEco
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  Mandante (Em Casa)
                </span>
                <img
                  src={confronto.mandante.info.escudo_url}
                  alt={mandante}
                  className="w-14 h-14 sm:w-16 sm:h-16 object-contain my-1 drop-shadow"
                />
                <h3 className="text-base sm:text-lg font-black leading-tight">
                  {formatarNomeClubeCurto(mandante)}
                </h3>
                <p className={`text-xs mt-0.5 font-semibold ${isEco ? 'text-slate-600' : 'text-slate-400'}`}>
                  {confronto.mandante.info.posicao}º Colocado • {confronto.mandante.info.pontos_total} pts
                </p>
              </div>

              {/* VS */}
              <div className="col-span-1 flex flex-col items-center justify-center">
                <span
                  className={`text-sm sm:text-base font-black px-2 py-1 rounded-full ${
                    isEco
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  VS
                </span>
              </div>

              {/* Visitante */}
              <div className="col-span-5 flex flex-col items-center">
                <span
                  className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded mb-1.5 ${
                    isEco
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  Visitante (Fora)
                </span>
                <img
                  src={confronto.visitante.info.escudo_url}
                  alt={visitante}
                  className="w-14 h-14 sm:w-16 sm:h-16 object-contain my-1 drop-shadow"
                />
                <h3 className="text-base sm:text-lg font-black leading-tight">
                  {formatarNomeClubeCurto(visitante)}
                </h3>
                <p className={`text-xs mt-0.5 font-semibold ${isEco ? 'text-slate-600' : 'text-slate-400'}`}>
                  {confronto.visitante.info.posicao}º Colocado • {confronto.visitante.info.pontos_total} pts
                </p>
              </div>
            </div>
          </div>

          {/* 3. BLOCO 1: TERMÔMETRO DO TORNEIO UNIÃO & MARGENS */}
          <div
            className={`avoid-break rounded-2xl p-4 mb-5 border ${
              isEco
                ? 'bg-white border-slate-300'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-inherit">
              <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                1. Termômetro do Torneio União (Série A1)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Mandante Status */}
              <div
                className={`p-3 rounded-xl border ${
                  isEco ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-blue-500" />
                    <span>{formatarNomeClubeCurto(mandante)}</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      mandanteInfo?.chave === 'OURO'
                        ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                        : mandanteInfo?.chave === 'PRATA'
                        ? 'bg-slate-500/20 text-slate-600 border border-slate-500/30'
                        : 'bg-amber-900/20 text-amber-700 border border-amber-800/30'
                    }`}
                  >
                    Chave {mandanteInfo?.chave || 'OURO'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center py-1.5 mb-2 rounded bg-inherit border border-inherit">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Posição</span>
                    <strong className="text-sm">{confronto.mandante.info.posicao}º</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Pontos</span>
                    <strong className="text-sm text-blue-600">{confronto.mandante.info.pontos_total}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Índice Téc.</span>
                    <strong className="text-sm">{confronto.mandante.info.indice_tecnico}</strong>
                  </div>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Distância do Líder (1º):</span>
                    <strong>
                      {confronto.mandante.info.diferenca_lider === 0
                        ? 'É o Líder!'
                        : `-${confronto.mandante.info.diferenca_lider} pts`}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Margem do Rebaixamento (22º):</span>
                    <strong
                      className={
                        confronto.mandante.info.status_rebaixamento === 'Livre'
                          ? 'text-blue-600'
                          : 'text-rose-600'
                      }
                    >
                      {confronto.mandante.info.status_rebaixamento === 'Livre'
                        ? `+${confronto.mandante.info.margem_rebaixamento} pts acima`
                        : `${confronto.mandante.info.margem_rebaixamento} pts p/ sair`}
                    </strong>
                  </div>
                </div>
                <div className={`mt-2 pt-1.5 border-t text-[10px] flex items-center justify-between ${isEco ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'}`}>
                  <span>Campanha Geral FPFS:</span>
                  <span className="font-bold">
                    {confronto.mandante.info.jogos_total}J • {confronto.mandante.info.vitorias_total}V-{confronto.mandante.info.empates_total}E-{confronto.mandante.info.derrotas_total}D (SG: {confronto.mandante.info.saldo_gols_total > 0 ? `+${confronto.mandante.info.saldo_gols_total}` : confronto.mandante.info.saldo_gols_total})
                  </span>
                </div>
              </div>

              {/* Visitante Status */}
              <div
                className={`p-3 rounded-xl border ${
                  isEco ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-amber-500" />
                    <span>{formatarNomeClubeCurto(visitante)}</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      visitanteInfo?.chave === 'OURO'
                        ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                        : visitanteInfo?.chave === 'PRATA'
                        ? 'bg-slate-500/20 text-slate-600 border border-slate-500/30'
                        : 'bg-amber-900/20 text-amber-700 border border-amber-800/30'
                    }`}
                  >
                    Chave {visitanteInfo?.chave || 'OURO'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center py-1.5 mb-2 rounded bg-inherit border border-inherit">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Posição</span>
                    <strong className="text-sm">{confronto.visitante.info.posicao}º</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Pontos</span>
                    <strong className="text-sm text-amber-600">{confronto.visitante.info.pontos_total}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Índice Téc.</span>
                    <strong className="text-sm">{confronto.visitante.info.indice_tecnico}</strong>
                  </div>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Distância do Líder (1º):</span>
                    <strong>
                      {confronto.visitante.info.diferenca_lider === 0
                        ? 'É o Líder!'
                        : `-${confronto.visitante.info.diferenca_lider} pts`}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Margem do Rebaixamento (22º):</span>
                    <strong
                      className={
                        confronto.visitante.info.status_rebaixamento === 'Livre'
                          ? 'text-blue-600'
                          : 'text-rose-600'
                      }
                    >
                      {confronto.visitante.info.status_rebaixamento === 'Livre'
                        ? `+${confronto.visitante.info.margem_rebaixamento} pts acima`
                        : `${confronto.visitante.info.margem_rebaixamento} pts p/ sair`}
                    </strong>
                  </div>
                </div>
                <div className={`mt-2 pt-1.5 border-t text-[10px] flex items-center justify-between ${isEco ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'}`}>
                  <span>Campanha Geral FPFS:</span>
                  <span className="font-bold">
                    {confronto.visitante.info.jogos_total}J • {confronto.visitante.info.vitorias_total}V-{confronto.visitante.info.empates_total}E-{confronto.visitante.info.derrotas_total}D (SG: {confronto.visitante.info.saldo_gols_total > 0 ? `+${confronto.visitante.info.saldo_gols_total}` : confronto.visitante.info.saldo_gols_total})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. DIVISÃO POR CATEGORIA (SUB-7 AO SUB-10) • RAIO-X DOS JOGOS DO DIA */}
          {confronto.sub_categorias && confronto.sub_categorias.length > 0 && (
            <div
              className={`avoid-break rounded-2xl p-4 mb-5 border ${
                isEco
                  ? 'bg-white border-slate-300'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-inherit">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500 shrink-0" />
                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                    2. Divisão por Categoria (Sub-7 ao Sub-10) • Raio-X dos Jogos do Dia
                  </h4>
                </div>
                <span className={`text-[10px] font-bold ${isEco ? 'text-slate-500' : 'text-slate-400'}`}>
                  4 jogos no mesmo dia entre os clubes
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {confronto.sub_categorias.map((sc) => {
                  const mCat = sc.mandante;
                  const vCat = sc.visitante;
                  return (
                    <div
                      key={sc.categoria}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between text-xs ${
                        isEco ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-inherit">
                          <span className="font-black text-xs text-blue-600">{sc.categoria}</span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase">
                            {mCat?.chave || 'OURO'} vs {vCat?.chave || 'OURO'}
                          </span>
                        </div>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="font-bold truncate max-w-[80px]">M: {formatarNomeClubeCurto(mandante)}</span>
                            <span className="font-black">{mCat ? `${mCat.posicao}º (${mCat.pontos}p)` : '-'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold truncate max-w-[80px]">V: {formatarNomeClubeCurto(visitante)}</span>
                            <span className="font-black">{vCat ? `${vCat.posicao}º (${vCat.pontos}p)` : '-'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-inherit flex items-center justify-between text-[10px] text-slate-500">
                        <span>Saldo Gols:</span>
                        <span className="font-bold">
                          {mCat ? (mCat.saldo_gols > 0 ? `+${mCat.saldo_gols}` : mCat.saldo_gols) : 0} | {vCat ? (vCat.saldo_gols > 0 ? `+${vCat.saldo_gols}` : vCat.saldo_gols) : 0}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. FATOR MANDO DE QUADRA (CASA VS FORA) */}
          <div
            className={`avoid-break rounded-2xl p-4 mb-5 border ${
              isEco
                ? 'bg-white border-slate-300'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-inherit">
              <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                3. Fator Mando de Quadra ({formatarNomeClubeCurto(mandante)} em Casa vs {formatarNomeClubeCurto(visitante)} Fora)
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b ${isEco ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'}`}>
                    <th className="pb-2">Métrica de Desempenho</th>
                    <th className="pb-2 text-center text-blue-600 font-bold">{formatarNomeClubeCurto(mandante)} (Casa)</th>
                    <th className="pb-2 text-center text-amber-600 font-bold">{formatarNomeClubeCurto(visitante)} (Fora)</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isEco ? 'divide-slate-200' : 'divide-slate-800'}`}>
                  {/* Linha 1: Campanha Geral FPFS Oficial */}
                  <tr className={isEco ? 'bg-slate-100/60' : 'bg-slate-900/40'}>
                    <td className="py-2 font-bold">
                      <div>
                        <span>Campanha Geral FPFS (Unificada)</span>
                        <span className={`block text-[10px] font-normal ${isEco ? 'text-slate-500' : 'text-slate-400'}`}>
                          Total acumulado de todas as rodadas (Sub-7 a Sub-10)
                        </span>
                      </div>
                    </td>
                    <td className="py-2 text-center font-bold">
                      {confronto.mandante.info.jogos_total}J • {confronto.mandante.info.vitorias_total}V - {confronto.mandante.info.empates_total}E - {confronto.mandante.info.derrotas_total}D
                      <span className="block text-[10px] text-slate-500 font-medium">
                        SG: {confronto.mandante.info.saldo_gols_total > 0 ? `+${confronto.mandante.info.saldo_gols_total}` : confronto.mandante.info.saldo_gols_total}
                      </span>
                    </td>
                    <td className="py-2 text-center font-bold">
                      {confronto.visitante.info.jogos_total}J • {confronto.visitante.info.vitorias_total}V - {confronto.visitante.info.empates_total}E - {confronto.visitante.info.derrotas_total}D
                      <span className="block text-[10px] text-slate-500 font-medium">
                        SG: {confronto.visitante.info.saldo_gols_total > 0 ? `+${confronto.visitante.info.saldo_gols_total}` : confronto.visitante.info.saldo_gols_total}
                      </span>
                    </td>
                  </tr>

                  {/* Linha 2: Recorte no Mando Analisado */}
                  <tr className={isEco ? 'bg-blue-50/50' : 'bg-blue-950/20'}>
                    <td className="py-2 font-bold">
                      <div>
                        <span className="text-blue-600">Recorte no Mando Deste Duelo</span>
                        <span className={`block text-[10px] font-normal ${isEco ? 'text-slate-500' : 'text-slate-400'}`}>
                          Apenas {formatarNomeClubeCurto(mandante)} em Casa vs {formatarNomeClubeCurto(visitante)} Fora
                        </span>
                      </div>
                    </td>
                    <td className="py-2 text-center">
                      <strong className="text-blue-600 font-black">{confronto.mandante.estatisticas_mando.casa.jogos}J em Casa</strong> •{' '}
                      <strong>{confronto.mandante.estatisticas_mando.casa.vitorias}V</strong> -{' '}
                      {confronto.mandante.estatisticas_mando.casa.empates}E -{' '}
                      {confronto.mandante.estatisticas_mando.casa.derrotas}D
                    </td>
                    <td className="py-2 text-center">
                      <strong className="text-amber-600 font-black">{confronto.visitante.estatisticas_mando.fora.jogos}J Fora</strong> •{' '}
                      <strong>{confronto.visitante.estatisticas_mando.fora.vitorias}V</strong> -{' '}
                      {confronto.visitante.estatisticas_mando.fora.empates}E -{' '}
                      {confronto.visitante.estatisticas_mando.fora.derrotas}D
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 font-medium">Aproveitamento no Mando</td>
                    <td className="py-2 text-center font-black text-sm text-blue-600">
                      {confronto.mandante.estatisticas_mando.casa.aproveitamento}%
                    </td>
                    <td className="py-2 text-center font-black text-sm text-amber-600">
                      {confronto.visitante.estatisticas_mando.fora.aproveitamento}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Média de Gols Pró / Jogo</td>
                    <td className="py-2 text-center font-bold">
                      {confronto.mandante.estatisticas_mando.casa.media_gols_pro} GP/J
                    </td>
                    <td className="py-2 text-center font-bold">
                      {confronto.visitante.estatisticas_mando.fora.media_gols_pro} GP/J
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Média de Gols Sofridos / Jogo</td>
                    <td className="py-2 text-center font-bold">
                      {confronto.mandante.estatisticas_mando.casa.media_gols_contra} GC/J
                    </td>
                    <td className="py-2 text-center font-bold">
                      {confronto.visitante.estatisticas_mando.fora.media_gols_contra} GC/J
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Saldo de Gols no Mando</td>
                    <td className="py-2 text-center font-bold">
                      {confronto.mandante.estatisticas_mando.casa.saldo_gols > 0 ? `+${confronto.mandante.estatisticas_mando.casa.saldo_gols}` : confronto.mandante.estatisticas_mando.casa.saldo_gols}
                    </td>
                    <td className="py-2 text-center font-bold">
                      {confronto.visitante.estatisticas_mando.fora.saldo_gols > 0 ? `+${confronto.visitante.estatisticas_mando.fora.saldo_gols}` : confronto.visitante.estatisticas_mando.fora.saldo_gols}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={`mt-2.5 pt-2 border-t text-[10px] leading-relaxed ${isEco ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'}`}>
              <strong>💡 Entenda os Números de Mando:</strong> Dos {confronto.mandante.info.jogos_total} jogos oficiais da FPFS, {formatarNomeClubeCurto(mandante)} jogou {confronto.mandante.estatisticas_mando.casa.jogos} em Casa ({confronto.mandante.estatisticas_mando.casa.vitorias}V-{confronto.mandante.estatisticas_mando.casa.empates}E-{confronto.mandante.estatisticas_mando.casa.derrotas}D) e {confronto.mandante.estatisticas_mando.fora.jogos} Fora. Já {formatarNomeClubeCurto(visitante)} jogou {confronto.visitante.estatisticas_mando.casa.jogos} em Casa e {confronto.visitante.estatisticas_mando.fora.jogos} Fora ({confronto.visitante.estatisticas_mando.fora.vitorias}V-{confronto.visitante.estatisticas_mando.fora.empates}E-{confronto.visitante.estatisticas_mando.fora.derrotas}D). A tabela isola o desempenho do confronto de hoje.
            </div>
          </div>

          {/* 4. BLOCO 4: ÚLTIMOS 5 JOGOS DO ADVERSÁRIO (VISITANTE) */}
          <div
            className={`avoid-break rounded-2xl p-4 mb-5 border ${
              isEco
                ? 'bg-white border-slate-300'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-inherit">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                  4. Termômetro dos Últimos 5 Jogos do Adversário ({formatarNomeClubeCurto(visitante)})
                </h4>
              </div>
              <span className={`text-[10px] font-bold ${isEco ? 'text-slate-500' : 'text-slate-400'}`}>
                Nível de Dificuldade do Oponente
              </span>
            </div>

            <div className="space-y-2">
              {confronto.visitante.ultimos_jogos.slice(0, 5).map((jogo, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                    isEco ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                        jogo.resultado === 'V'
                          ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30'
                          : jogo.resultado === 'E'
                          ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-600 border border-rose-500/30'
                      }`}
                    >
                      {jogo.resultado}
                    </span>

                    <img
                      src={jogo.adversario_escudo}
                      alt={jogo.adversario}
                      className="w-5 h-5 object-contain shrink-0"
                    />

                    <div className="min-w-0">
                      <p className="font-bold truncate">
                        vs {formatarNomeClubeCurto(jogo.adversario)}
                      </p>
                      <p className={`text-[10px] ${isEco ? 'text-slate-500' : 'text-slate-400'}`}>
                        {jogo.data} • {jogo.mando === 'Casa' ? 'Em Casa' : 'Fora'} • {jogo.categoria}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        jogo.adversario_chave === 'OURO'
                          ? 'bg-amber-500/20 text-amber-700 border border-amber-500/30'
                          : jogo.adversario_chave === 'PRATA'
                          ? 'bg-slate-500/20 text-slate-700 border border-slate-400/30'
                          : 'bg-amber-900/15 text-amber-800 border border-amber-800/30'
                      }`}
                    >
                      {jogo.adversario_posicao ? `${jogo.adversario_posicao}º ` : ''}
                      ({jogo.adversario_chave === 'OURO' ? 'Pedreira' : jogo.adversario_chave === 'PRATA' ? 'Intermediário' : 'Zona Inferior'})
                    </span>

                    <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-inherit border border-inherit">
                      {jogo.placar}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. BLOCO 5: PRINCIPAIS AMEAÇAS OFENSIVAS DO ADVERSÁRIO */}
          <div
            className={`avoid-break rounded-2xl p-4 mb-5 border ${
              isEco
                ? 'bg-white border-slate-300'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-inherit">
              <Flame className="w-4 h-4 text-amber-500 shrink-0" />
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                5. Radar de Ameaças: Artilheiros do Adversário ({formatarNomeClubeCurto(visitante)})
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {confronto.visitante.principais_artilheiros &&
              confronto.visitante.principais_artilheiros.length > 0 ? (
                confronto.visitante.principais_artilheiros.map((art, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex flex-col justify-between text-xs ${
                      isEco ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-500">
                          {idx + 1}º Destaque
                        </span>
                        <span className="text-xs font-black text-amber-500">
                          ⚽ {art.gols} gols
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {art.foto_url ? (
                          <img
                            src={art.foto_url}
                            alt={art.nome}
                            className="w-8 h-8 rounded-full object-cover border border-inherit shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0">
                            {art.nome.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold truncate leading-tight">
                            {formatarNomeAtletaCurto(art.nome)}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {formatarNomeClubeCurto(art.clube)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {art.marcou_contra_adversario && (
                      <div className="mt-2.5 pt-2 border-t border-inherit flex items-center gap-1 text-[10px] font-black text-rose-600">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>Já marcou {art.gols_contra_adversario}x no rival</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 col-span-3">Nenhum artilheiro em destaque registrado.</p>
              )}
            </div>
          </div>

          {/* 7. RODAPÉ EXECUTIVO DO DOSSIÊ */}
          <div
            className={`border-t pt-3 flex items-center justify-between text-[10px] ${
              isEco ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-500'
            }`}
          >
            <span>Intelligent Futsal Scout • Relatório Técnico de Partida</span>
            <span>Documento Confidencial da Comissão Técnica</span>
          </div>
        </div>
      </div>
    </div>
  );
}
