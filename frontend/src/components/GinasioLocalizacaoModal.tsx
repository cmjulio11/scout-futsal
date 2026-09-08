import { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Navigation,
  Share2,
  Copy,
  Check,
  X,
  ExternalLink,
  Shirt,
  Clock,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Eye,
  Edit3,
} from 'lucide-react';
import {
  resolverInfoGinasio,
  gerarTextoWhatsAppConfronto,
  abrirWhatsApp,
  calcularHorariosApresentacao,
  obterUniformePadrao,
  type WhatsAppConfrontoParams,
  type HorariosApresentacao,
} from '../utils/ginasios';
import toast from 'react-hot-toast';

interface GinasioLocalizacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ginasioNome: string;
  matchParams?: WhatsAppConfrontoParams;
}

export default function GinasioLocalizacaoModal({
  isOpen,
  onClose,
  ginasioNome,
  matchParams,
}: GinasioLocalizacaoModalProps) {
  const [copiadoTexto, setCopiadoTexto] = useState(false);
  const [abaMobile, setAbaMobile] = useState<'editor' | 'preview'>('editor');

  // Dados resolvidos iniciais do ginásio
  const infoOriginal = useMemo(() => resolverInfoGinasio(ginasioNome), [ginasioNome]);

  // Estados dos campos editáveis
  const [localJogo, setLocalJogo] = useState('');
  const [endereco, setEndereco] = useState('');
  const [dataJogo, setDataJogo] = useState('');
  const [horarios, setHorarios] = useState<HorariosApresentacao>({
    sub7: '07:30h',
    sub8: '08:30h',
    sub9: '09:30h',
    sub10: '10:30h',
  });
  const [uniformeLinha, setUniformeLinha] = useState('');
  const [uniformeGoleiro, setUniformeGoleiro] = useState('');
  const [avisos, setAvisos] = useState(
    '✅ Levar todos os uniformes;\n✅ Não esquecer caneleira;\n✅ Não esquecer RG:  Original | Digital Gov | Cópia Autenticada | Carteirinha.'
  );

  // Inicializa ou reseta os campos quando o modal abre ou os dados do jogo mudam
  useEffect(() => {
    if (!isOpen) return;

    const info = resolverInfoGinasio(ginasioNome);
    setLocalJogo(matchParams?.localPersonalizado || info.nomeOficial);
    setEndereco(
      matchParams?.enderecoPersonalizado ||
        `${info.endereco}${info.cidade ? ` - ${info.cidade}` : ''}`
    );
    setDataJogo(matchParams?.data || '13/09');

    // Horários de Apresentação (-1h de cada jogo)
    const horCalculados = calcularHorariosApresentacao(matchParams?.hora);
    setHorarios(matchParams?.horariosApresentacao || horCalculados);

    // Uniformes sugeridos pelo clube
    const uniPadrao = obterUniformePadrao(matchParams?.mandante);
    setUniformeLinha(matchParams?.uniformeLinha || uniPadrao.linha);
    setUniformeGoleiro(matchParams?.uniformeGoleiro || uniPadrao.goleiro);

    setAvisos(
      '✅ Levar todos os uniformes;\n✅ Não esquecer caneleira;\n✅ Não esquecer RG:  Original | Digital Gov | Cópia Autenticada | Carteirinha.'
    );
    setAbaMobile('editor');
  }, [isOpen, ginasioNome, matchParams]);

  if (!isOpen) return null;

  // Recalcula os links de navegação com base nos campos editados pelo usuário
  const queryNavegacao = `${localJogo.trim()}, ${endereco.trim()}`;
  const linkMapsDinamico = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryNavegacao)}`;
  const linkWazeDinamico = `https://waze.com/ul?q=${encodeURIComponent(queryNavegacao)}&navigate=yes`;

  // Gera o texto final para envio no WhatsApp no padrão solicitado
  const textoFinalWhatsApp = gerarTextoWhatsAppConfronto({
    mandante: matchParams?.mandante || 'Pulo Campinas',
    visitante: matchParams?.visitante || 'Taubaté Futsal',
    data: dataJogo,
    rodada: matchParams?.rodada,
    horariosApresentacao: horarios,
    uniformeLinha,
    uniformeGoleiro,
    avisos: avisos.split('\n').filter((l) => l.trim().length > 0),
    localPersonalizado: localJogo,
    enderecoPersonalizado: endereco,
  });

  const handleCompartilharWhatsApp = () => {
    abrirWhatsApp(textoFinalWhatsApp);
  };

  const handleCopiarTextoWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(textoFinalWhatsApp);
      setCopiadoTexto(true);
      toast.success('Informe da rodada copiado com sucesso!');
      setTimeout(() => setCopiadoTexto(false), 2000);
    } catch {
      toast.error('Não foi possível copiar o texto.');
    }
  };

  const handleResetarPadroes = () => {
    setLocalJogo(infoOriginal.nomeOficial);
    setEndereco(`${infoOriginal.endereco}${infoOriginal.cidade ? ` - ${infoOriginal.cidade}` : ''}`);
    const horCalculados = calcularHorariosApresentacao(matchParams?.hora);
    setHorarios(horCalculados);
    const uniPadrao = obterUniformePadrao(matchParams?.mandante);
    setUniformeLinha(uniPadrao.linha);
    setUniformeGoleiro(uniPadrao.goleiro);
    setAvisos(
      '✅ Levar todos os uniformes;\n✅ Não esquecer caneleira;\n✅ Não esquecer RG:  Original | Digital Gov | Cópia Autenticada | Carteirinha.'
    );
    toast.success('Valores padrão restaurados!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Glow de Fundo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header do Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/95 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-sm">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-400">
                  {matchParams?.rodada || 'FPFS SÉRIE A1'}
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Informe & Convocação</span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white truncate leading-tight mt-0.5">
                {matchParams?.mandante || 'Mandante'} 🆚 {matchParams?.visitante || 'Visitante'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetarPadroes}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold transition cursor-pointer"
              title="Restaurar valores padrão do sistema"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Abas no Celular (< lg) */}
        <div className="lg:hidden flex border-b border-slate-800 bg-slate-950/60 px-4">
          <button
            type="button"
            onClick={() => setAbaMobile('editor')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition ${
              abaMobile === 'editor'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar Informações</span>
          </button>
          <button
            type="button"
            onClick={() => setAbaMobile('preview')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition ${
              abaMobile === 'preview'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Prévia WhatsApp</span>
          </button>
        </div>

        {/* 2. Corpo do Modal (2 Colunas no Desktop) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ========================================================================= */}
          {/* COLUNA ESQUERDA: FORMULÁRIO DE EDIÇÃO */}
          {/* ========================================================================= */}
          <div className={`space-y-4 lg:col-span-7 ${abaMobile === 'preview' ? 'hidden lg:block' : 'block'}`}>
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" /> Informações Editáveis da Rodada
              </span>
              <span className="text-[11px] text-slate-400">Edite o que precisar antes de enviar</span>
            </div>

            {/* Linha 1: Data da Partida */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">📅 Data do Jogo:</label>
              <input
                type="text"
                value={dataJogo}
                onChange={(e) => setDataJogo(e.target.value)}
                placeholder="Ex: 13/09"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-sm text-white font-medium focus:outline-none transition"
              />
            </div>

            {/* Linha 2: Local e Endereço do Ginásio */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" /> Ginásio & Localização
                </span>
                <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Rotas atualizam dinamicamente
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">📍 Nome do Ginásio / Local:</label>
                <input
                  type="text"
                  value={localJogo}
                  onChange={(e) => setLocalJogo(e.target.value)}
                  placeholder="Ex: Arena Concórdia (Pulo Futsal Campinas)"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">🏢 Endereço Completo:</label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Ex: Rod. Heitor Penteado, km 3,5 - Campinas - SP"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none transition"
                />
              </div>

              {/* Botões Rápidos de Rota (Com os dados atuais editados) */}
              <div className="pt-1 flex items-center gap-2">
                <a
                  href={linkMapsDinamico}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Testar no Maps</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
                <a
                  href={linkWazeDinamico}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition"
                >
                  <span>🚗</span>
                  <span>Testar no Waze</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </div>

            {/* Linha 3: Horários de Apresentação (-1h de cada Sub) */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Horários de Apresentação
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">1 hora antes de cada início</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SUB-07:</label>
                  <input
                    type="text"
                    value={horarios.sub7}
                    onChange={(e) => setHorarios({ ...horarios, sub7: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-2 py-1.5 text-xs text-white font-bold text-center focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SUB-08:</label>
                  <input
                    type="text"
                    value={horarios.sub8}
                    onChange={(e) => setHorarios({ ...horarios, sub8: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-2 py-1.5 text-xs text-white font-bold text-center focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SUB-09:</label>
                  <input
                    type="text"
                    value={horarios.sub9}
                    onChange={(e) => setHorarios({ ...horarios, sub9: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-2 py-1.5 text-xs text-white font-bold text-center focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SUB-10:</label>
                  <input
                    type="text"
                    value={horarios.sub10}
                    onChange={(e) => setHorarios({ ...horarios, sub10: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-2 py-1.5 text-xs text-white font-bold text-center focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Linha 4: Uniformes de Linha e Goleiro */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-3">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5 text-purple-400" /> Uniformes de Jogo (Editáveis / Mescláveis)
              </span>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-300">⚡ Atletas de Linha:</label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setUniformeLinha('Camisa Amarela, shorts Amarelo, Meião Amarelo')}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 cursor-pointer"
                    >
                      Amarelo
                    </button>
                    <button
                      type="button"
                      onClick={() => setUniformeLinha('Camisa Azul, shorts Azul, Meião Azul')}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 cursor-pointer"
                    >
                      Azul
                    </button>
                    <button
                      type="button"
                      onClick={() => setUniformeLinha('Camisa Branca, shorts Branco, Meião Branco')}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 cursor-pointer"
                    >
                      Branco
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={uniformeLinha}
                  onChange={(e) => setUniformeLinha(e.target.value)}
                  placeholder="Ex: Camisa Amarela, shorts Amarelo, Meião Amarelo"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-300">🧤 Goleiros:</label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setUniformeGoleiro('Camisa Preta, shorts Preto, Meião Preto')}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 cursor-pointer"
                    >
                      Preto
                    </button>
                    <button
                      type="button"
                      onClick={() => setUniformeGoleiro('Camisa Cinza, shorts Preto, Meião Preto')}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600 cursor-pointer"
                    >
                      Cinza
                    </button>
                    <button
                      type="button"
                      onClick={() => setUniformeGoleiro('Camisa Verde, shorts Preto, Meião Preto')}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 cursor-pointer"
                    >
                      Verde
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={uniformeGoleiro}
                  onChange={(e) => setUniformeGoleiro(e.target.value)}
                  placeholder="Ex: Camisa Preta, shorts Preto, Meião Preto"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none"
                />
              </div>
            </div>

            {/* Linha 5: Avisos e Lembretes Importantes */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Avisos & Lembretes Importantes:
              </label>
              <textarea
                rows={3}
                value={avisos}
                onChange={(e) => setAvisos(e.target.value)}
                placeholder="Avisos e documentos obrigatórios"
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl p-2.5 text-xs text-white font-medium focus:outline-none leading-relaxed transition"
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* COLUNA DIREITA: PREVIEW AO VIVO DO WHATSAPP */}
          {/* ========================================================================= */}
          <div className={`space-y-3 lg:col-span-5 flex flex-col ${abaMobile === 'editor' ? 'hidden lg:flex' : 'flex'}`}>
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Pré-Visualização da Mensagem
              </span>
              <button
                type="button"
                onClick={handleCopiarTextoWhatsApp}
                className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiadoTexto ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiadoTexto ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            {/* Balão Autêntico do WhatsApp */}
            <div className="flex-1 bg-[#0b141a] border border-[#202c33] rounded-2xl p-3 sm:p-4 font-sans text-slate-100 shadow-inner overflow-y-auto max-h-[380px] lg:max-h-[460px]">
              <div className="bg-[#1f2c34] border border-[#2a3942] rounded-xl p-3 text-xs leading-relaxed font-mono whitespace-pre-wrap select-all selection:bg-emerald-500/40">
                {textoFinalWhatsApp}
              </div>
            </div>

            {/* Ações Rápidas de Disparo */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleCompartilharWhatsApp}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs sm:text-sm font-black transition shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Abrir e Enviar no WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopiarTextoWhatsApp}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700 cursor-pointer"
              >
                {copiadoTexto ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiadoTexto ? 'Texto Copiado para Área de Transferência!' : 'Copiar Texto Completo'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
