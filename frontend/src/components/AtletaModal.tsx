import { useState, useEffect } from 'react';
import {
  X,
  Flame,
  Home,
  Navigation,
  Calendar,
  MapPin,
  Target,
  Sparkles,
  AlertCircle,
  Activity,
  Printer,
  Download,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { campeonatosService } from '../services/api';
import { formatarRodada } from '../utils/formatters';
import type { FichaAtletaResponse } from '../types';

interface AtletaModalProps {
  isOpen: boolean;
  onClose: () => void;
  temporada?: number;
  categoria?: string;
  idJogador?: number;
  idFase?: number;
  nomeAtleta?: string;
}

export default function AtletaModal({
  isOpen,
  onClose,
  temporada = 2026,
  categoria = 'Sub-7',
  idJogador,
  idFase,
  nomeAtleta,
}: AtletaModalProps) {
  const [ficha, setFicha] = useState<FichaAtletaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [baixandoPdf, setBaixandoPdf] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    async function carregarFicha() {
      try {
        setLoading(true);
        setErro(null);
        const data = await campeonatosService.obterFichaAtleta(
          temporada,
          categoria,
          idJogador,
          idFase,
          nomeAtleta
        );
        setFicha(data);
      } catch (err: any) {
        console.error('Erro ao carregar ficha do atleta:', err);
        setErro('Não foi possível carregar o dossiê deste atleta no momento.');
      } finally {
        setLoading(false);
      }
    }

    carregarFicha();
  }, [isOpen, temporada, categoria, idJogador, idFase, nomeAtleta]);

  if (!isOpen) return null;

  const atleta = ficha?.atleta;
  const stats = ficha?.estatisticas;
  const vitimas = ficha?.maiores_vitimas || [];
  const jogos = ficha?.historico_jogos || [];

  const handlePrintAtleta = () => {
    const prevTitle = document.title;
    const nomeClean = (atleta?.nome || 'Atleta').trim().replace(/\s+/g, '_');
    const clubeClean = (atleta?.clube || 'Clube').trim().replace(/\s+/g, '_');
    document.title = `Ficha_Atleta_${nomeClean}_${clubeClean}_${categoria}_FPFS_${temporada}`;
    document.body.classList.add('printing-atleta-modal');

    const cleanup = () => {
      document.title = prevTitle;
      document.body.classList.remove('printing-atleta-modal');
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    setTimeout(cleanup, 2500);
  };

  const handleDownloadPdfDireto = async () => {
    if (!ficha) return;
    try {
      setBaixandoPdf(true);
      await campeonatosService.baixarPdfAtleta(
        temporada,
        categoria,
        idJogador,
        idFase,
        nomeAtleta || atleta?.nome
      );
      toast.success('Ficha técnica baixada em PDF com sucesso!');
    } catch (err: any) {
      console.error('Erro ao baixar PDF direto:', err);
      toast.error('Não foi possível gerar o PDF pelo servidor no momento.');
    } finally {
      setBaixandoPdf(false);
    }
  };

  return (
    <div className="atleta-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in print:p-0 print:m-0 print:bg-transparent print:backdrop-blur-none print:static print:min-h-0 print:h-auto print:w-full print:block">
      <div className="atleta-modal-sheet bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none print:bg-white print:text-slate-900 print:w-full print:max-w-full print:min-h-0 print:h-auto print:m-0 print:p-0 print:block">
        {/* ========================================================================= */}
        {/* CABEÇALHO OFICIAL EXCLUSIVO PARA IMPRESSÃO / PDF */}
        {/* ========================================================================= */}
        <div className="hidden print:block p-4 mb-3 border-b-2 border-slate-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/fpfs_shield.png" alt="FPFS" className="w-12 h-12 object-contain" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                  FPFS • Série A1 Estadual de Iniciação • Temporada {temporada}
                </span>
                <h1 className="text-xl font-black text-slate-900 leading-tight">
                  Ficha Técnica Individual do Atleta
                </h1>
                <p className="text-xs text-slate-600">
                  {atleta?.clube} • Categoria {categoria} • Dados Oficiais Registrados em Súmula
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

        {/* ========================================================================= */}
        {/* HEADER MODAL NA WEB */}
        {/* ========================================================================= */}
        <div className="no-print p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              Ficha Técnica do Atleta
            </h3>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-slate-400 text-xs font-semibold">{categoria}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão 1: Baixar PDF Oficial Direto (Server-Side) */}
            <button
              type="button"
              onClick={handleDownloadPdfDireto}
              disabled={baixandoPdf || loading || !ficha}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Baixar arquivo PDF oficial gerado diretamente pelo servidor sem depender do navegador"
            >
              {baixandoPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{baixandoPdf ? 'Gerando...' : 'Baixar PDF Direto'}</span>
              <span className="sm:hidden">{baixandoPdf ? '...' : 'PDF'}</span>
            </button>

            {/* Botão 2: Imprimir / Visualizar no Navegador */}
            <button
              type="button"
              onClick={handlePrintAtleta}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700 cursor-pointer active:scale-95"
              title="Imprimir Ficha Técnica do Atleta pelo Navegador (A4)"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BODY COM SCROLL */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 print:overflow-visible print:p-2 print:space-y-4">
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-3" />
              <p className="text-sm font-semibold text-slate-300">
                Compilando dados oficiais da Federação...
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Cruzando histórico de gols, mando de quadra e força dos adversários
              </p>
            </div>
          ) : erro || !ficha ? (
            <div className="py-12 text-center bg-slate-950/40 rounded-xl border border-slate-800 p-6">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-200">{erro || 'Atleta não encontrado'}</p>
              <p className="text-xs text-slate-500 mt-1">
                Os dados de artilharia deste atleta ainda estão sendo catalogados pela Federação.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-lg transition"
              >
                Fechar
              </button>
            </div>
          ) : (
            <>
              {/* ========================================================================= */}
              {/* CARTÃO DE IDENTIDADE DO ATLETA */}
              {/* ========================================================================= */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 print:bg-white print:border-slate-300 avoid-break">
                {/* Foto Oficial */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700 flex items-center justify-center shadow-lg print:bg-slate-100 print:border-slate-300">
                    {atleta?.foto_url ? (
                      <img
                        src={atleta.foto_url}
                        alt={atleta.nome}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/fpfs_shield.png';
                        }}
                      />
                    ) : (
                      <span className="text-2xl font-black text-slate-600">
                        {atleta?.nome?.charAt(0) || 'A'}
                      </span>
                    )}
                  </div>
                  {/* Badge de Posição no Ranking */}
                  <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-950 font-black text-xs px-2 py-0.5 rounded-full shadow border border-amber-300 print:bg-amber-100 print:text-amber-900 print:border-amber-300">
                    {atleta?.posicao_ranking}º Artilheiro
                  </div>
                </div>

                {/* Dados Cadastrais */}
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 print:bg-blue-50 print:text-blue-800 print:border-blue-200">
                      {atleta?.categoria}
                    </span>
                    <span className="text-slate-500 text-xs print:text-slate-400">•</span>
                    <span className="text-xs text-slate-400 font-semibold print:text-slate-600">FPFS Série A1</span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate print:text-slate-900">
                    {atleta?.nome}
                  </h2>

                  {/* Clube com Escudo */}
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                    <img
                      src={atleta?.escudo_url || '/fpfs_shield.png'}
                      alt={atleta?.clube}
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/fpfs_shield.png';
                      }}
                    />
                    <span className="text-sm font-bold text-slate-200 print:text-slate-900">
                      {atleta?.clube}
                    </span>
                    {atleta?.clube_completo && atleta.clube_completo !== atleta.clube && (
                      <span className="hidden md:inline text-xs text-slate-400 print:text-slate-600">
                        ({atleta.clube_completo})
                      </span>
                    )}
                  </div>
                </div>

                {/* Total de Gols em Destaque */}
                <div className="shrink-0 bg-blue-600/15 border border-blue-500/30 px-5 py-3 rounded-2xl text-center print:bg-blue-50 print:border-blue-200">
                  <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider print:text-blue-800">
                    Total de Gols
                  </p>
                  <p className="text-3xl sm:text-4xl font-black text-white leading-none mt-1 print:text-blue-900">
                    {stats?.total_gols}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 print:text-slate-600">na temporada</p>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* GRID DE MÉTRICAS AVANÇADAS */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Presença no Placar */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-center print:bg-slate-50 print:border-slate-200">
                  <div className="flex items-center justify-center gap-1.5 text-blue-400 mb-1 print:text-blue-700">
                    <Activity className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Frequência</span>
                  </div>
                  <p className="text-lg sm:text-xl font-black text-white print:text-slate-900">
                    {stats?.frequencia_gols_pct}%
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 print:text-slate-600">
                    marcou em {stats?.jogos_com_gol} de {stats?.jogos_totais_clube} jogos
                  </p>
                </div>

                {/* 2. Média por Jogo */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-center print:bg-slate-50 print:border-slate-200">
                  <div className="flex items-center justify-center gap-1.5 text-amber-400 mb-1 print:text-amber-700">
                    <Target className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Média</span>
                  </div>
                  <p className="text-lg sm:text-xl font-black text-white print:text-slate-900">
                    {stats?.media_gols_jogo}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 print:text-slate-600">gols / jogo que marcou</p>
                </div>

                {/* 3. Gols em Casa */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-center print:bg-slate-50 print:border-slate-200">
                  <div className="flex items-center justify-center gap-1.5 text-blue-400 mb-1 print:text-blue-700">
                    <Home className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Em Casa</span>
                  </div>
                  <p className="text-lg sm:text-xl font-black text-white print:text-slate-900">
                    {stats?.gols_casa}{' '}
                    <span className="text-xs font-bold text-slate-400 print:text-slate-600">({stats?.pct_gols_casa}%)</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 print:text-slate-600">gols no próprio ginásio</p>
                </div>

                {/* 4. Gols Fora */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-center print:bg-slate-50 print:border-slate-200">
                  <div className="flex items-center justify-center gap-1.5 text-amber-400 mb-1 print:text-amber-700">
                    <Navigation className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Fora de Casa</span>
                  </div>
                  <p className="text-lg sm:text-xl font-black text-white print:text-slate-900">
                    {stats?.gols_fora}{' '}
                    <span className="text-xs font-bold text-slate-400 print:text-slate-600">({stats?.pct_gols_fora}%)</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 print:text-slate-600">gols como visitante</p>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* PERFIL DE FINALIZADOR & PODER DE DECISÃO */}
              {/* ========================================================================= */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 print:bg-white print:border-slate-300 avoid-break">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 print:border-slate-200">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wider print:text-slate-900">
                    <Flame className="w-4 h-4 text-amber-400 print:text-amber-600" /> Perfil de Finalização & Letalidade
                  </span>
                  <span className="text-[11px] text-slate-400 print:text-slate-600">Distribuição dos {stats?.total_gols} gols</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  {/* Dobletes */}
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80 print:bg-slate-50 print:border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold uppercase print:text-slate-600">Dobletes (2 gols)</p>
                    <p className="text-base font-extrabold text-blue-400 mt-0.5 print:text-blue-700">
                      {stats?.dobletes} jogos
                    </p>
                  </div>

                  {/* Hat-tricks */}
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80 print:bg-slate-50 print:border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold uppercase print:text-slate-600">Hat-tricks (3+ gols)</p>
                    <p className="text-base font-extrabold text-amber-400 mt-0.5 print:text-amber-700">
                      {stats?.hat_tricks} jogos
                    </p>
                  </div>

                  {/* Contra Chave Ouro */}
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80 print:bg-slate-50 print:border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold uppercase print:text-slate-600">Gols no Top 8 (Ouro)</p>
                    <p className="text-base font-extrabold text-white mt-0.5 print:text-slate-900">
                      {stats?.gols_chave_ouro} gols
                    </p>
                  </div>

                  {/* Contra Prata/Bronze */}
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80 print:bg-slate-50 print:border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold uppercase print:text-slate-600">Gols Prata/Bronze</p>
                    <p className="text-base font-extrabold text-slate-300 mt-0.5 print:text-slate-700">
                      {(stats?.gols_chave_prata || 0) + (stats?.gols_chave_bronze || 0)} gols
                    </p>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* MAIORES VÍTIMAS */}
              {/* ========================================================================= */}
              {vitimas.length > 0 && (
                <div className="space-y-2.5 avoid-break">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 print:border-slate-200">
                    <span className="text-xs font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wider print:text-slate-900">
                      <Target className="w-4 h-4 text-rose-400 print:text-rose-600" /> Maiores Vítimas (Clubes que mais sofreram gols)
                    </span>
                    <span className="text-[11px] text-slate-400 print:text-slate-600">{vitimas.length} clubes vazados</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {vitimas.slice(0, 6).map((v, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 flex items-center justify-between gap-2 print:bg-slate-50 print:border-slate-200"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={v.escudo_url}
                            alt={v.adversario}
                            className="w-7 h-7 object-contain shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = '/fpfs_shield.png';
                            }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate print:text-slate-900">{v.adversario}</p>
                            <p className="text-[10px] text-slate-400 print:text-slate-600">
                              {v.posicao ? `${v.posicao}º colocado` : ''}{' '}
                              <span className="opacity-70">({v.chave})</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/20 text-xs font-black print:bg-rose-50 print:text-rose-700 print:border-rose-200">
                            {v.gols} {v.gols === 1 ? 'gol' : 'gols'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* LINHA DO TEMPO DOS JOGOS COM GOLS */}
              {/* ========================================================================= */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wider">
                    <Calendar className="w-4 h-4 text-blue-400" /> Histórico de Partidas em que Marcou ({jogos.length})
                  </span>
                  <span className="text-[10px] text-slate-400">Mais recentes primeiro</span>
                </div>

                <div className="space-y-2">
                  {jogos.map((j, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition print:bg-white print:border-slate-300 avoid-break"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rodada & Data */}
                        <div className="text-center shrink-0 w-16 bg-slate-900 p-1 rounded-lg border border-slate-800 print:bg-slate-100 print:border-slate-300">
                          <span className="text-[10px] font-bold text-blue-400 block truncate print:text-blue-700">
                            {formatarRodada(j.rodada)}
                          </span>
                          <span className="text-[11px] font-extrabold text-white block print:text-slate-900">
                            {j.data}
                          </span>
                        </div>

                        {/* Confronto */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white print:text-slate-900">
                            <img
                              src={j.escudo_mandante}
                              alt={j.mandante}
                              className="w-4 h-4 object-contain shrink-0"
                            />
                            <span className="truncate">{j.mandante}</span>
                            <span className="text-slate-500 font-normal px-0.5 print:text-slate-400">x</span>
                            <img
                              src={j.escudo_visitante}
                              alt={j.visitante}
                              className="w-4 h-4 object-contain shrink-0"
                            />
                            <span className="truncate">{j.visitante}</span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 print:text-slate-600">
                            <span className="font-semibold text-slate-300 print:text-slate-700">
                              {j.mando === 'Casa' ? 'Em Casa' : 'Fora de Casa'}
                            </span>
                            {j.ginasio && (
                              <>
                                <span>•</span>
                                <span className="truncate flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5" /> {j.ginasio}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Placar e Gols do Atleta */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 print:border-none">
                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-300 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 print:bg-slate-100 print:text-slate-900 print:border-slate-300 print:shadow-none">
                          {j.placar}
                        </span>

                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black bg-blue-600/20 text-blue-300 border border-blue-500/30 shadow-sm print:bg-blue-50 print:text-blue-900 print:border-blue-200">
                          <span>⚽</span>
                          <span>{j.gols_atleta} {j.gols_atleta === 1 ? 'gol' : 'gols'}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ========================================================================= */}
        {/* FOOTER MODAL */}
        {/* ========================================================================= */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between print:bg-white print:border-slate-200">
          <span className="text-[11px] text-slate-500 flex items-center gap-1 print:text-slate-600">
            <Sparkles className="w-3 h-3 text-blue-400 print:text-blue-600" />
            Dados oficiais registrados na súmula da FPFS
          </span>
          <button
            onClick={onClose}
            className="no-print px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl transition active:scale-95 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
