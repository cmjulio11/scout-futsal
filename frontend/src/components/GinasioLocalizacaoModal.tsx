import { useState } from 'react';
import {
  MapPin,
  Navigation,
  Share2,
  Copy,
  Check,
  X,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import {
  resolverInfoGinasio,
  obterLinkGoogleMaps,
  obterLinkWaze,
  gerarTextoWhatsAppConfronto,
  abrirWhatsApp,
  type WhatsAppConfrontoParams,
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
  const [copiado, setCopiado] = useState(false);
  const [copiadoTexto, setCopiadoTexto] = useState(false);

  if (!isOpen) return null;

  const info = resolverInfoGinasio(ginasioNome);
  const linkMaps = obterLinkGoogleMaps(ginasioNome);
  const linkWaze = obterLinkWaze(ginasioNome);

  const handleCopiarEndereco = async () => {
    try {
      const texto = `${info.nomeOficial} - ${info.endereco}, ${info.cidade}`;
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      toast.success('Endereço copiado para a área de transferência!');
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error('Não foi possível copiar o endereço.');
    }
  };

  const handleCompartilharWhatsApp = () => {
    if (matchParams) {
      const texto = gerarTextoWhatsAppConfronto({
        ...matchParams,
        ginasio: ginasioNome,
      });
      abrirWhatsApp(texto);
    } else {
      const texto = `📍 *Local do Jogo - FPFS Série A1*\n\n🏟️ *${info.nomeOficial}*\n🏢 ${info.endereco} - ${info.cidade}\n\n🗺️ *Google Maps:* ${linkMaps}\n🚗 *Waze:* ${linkWaze}`;
      abrirWhatsApp(texto);
    }
  };

  const handleCopiarTextoWhatsApp = async () => {
    try {
      const texto = matchParams
        ? gerarTextoWhatsAppConfronto({
            ...matchParams,
            ginasio: ginasioNome,
          })
        : `📍 *Local do Jogo - FPFS Série A1*\n\n🏟️ *${info.nomeOficial}*\n🏢 ${info.endereco} - ${info.cidade}\n\n🗺️ *Google Maps:* ${linkMaps}\n🚗 *Waze:* ${linkWaze}`;

      await navigator.clipboard.writeText(texto);
      setCopiadoTexto(true);
      toast.success('Texto para WhatsApp copiado!');
      setTimeout(() => setCopiadoTexto(false), 2000);
    } catch {
      toast.error('Não foi possível copiar.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-sm">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">
                Logística de Deslocamento • FPFS
              </span>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                {info.nomeOficial}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bloco de Endereço */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Endereço:</p>
              <p className="text-sm font-bold text-white mt-0.5">{info.endereco}</p>
              {info.bairro && <p className="text-xs text-slate-300">{info.bairro}</p>}
              <p className="text-xs text-slate-400 font-medium">{info.cidade}</p>
              {info.referencia && (
                <p className="text-[11px] text-blue-400 mt-1 font-semibold flex items-center gap-1">
                  <span>ℹ️</span> {info.referencia}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleCopiarEndereco}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition shrink-0"
              title="Copiar endereço completo"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Botões de Navegação: Google Maps & Waze */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Navegar até o Ginásio (Rotas em Tempo Real):
          </p>
          <div className="grid grid-cols-2 gap-3">
            <a
              href={linkMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-black transition shadow-lg shadow-blue-600/30 active:scale-95"
            >
              <Navigation className="w-4 h-4 text-white" />
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>

            <a
              href={linkWaze}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-black transition shadow-lg shadow-cyan-600/30 active:scale-95"
            >
              <span className="text-base font-black leading-none">🚗</span>
              <span>Waze</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
        </div>

        {/* Compartilhamento no WhatsApp */}
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
              <MessageCircle className="w-4 h-4 text-emerald-400" /> Convocação & Guia WhatsApp
            </span>
            <button
              type="button"
              onClick={handleCopiarTextoWhatsApp}
              className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1"
            >
              {copiadoTexto ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiadoTexto ? 'Texto copiado!' : 'Copiar texto'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Envie a mensagem pronta com os horários, adversário e os links do Google Maps e Waze para a comissão técnica ou grupo dos pais!
          </p>

          <button
            type="button"
            onClick={handleCompartilharWhatsApp}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-black transition shadow-lg shadow-emerald-600/30 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Abrir e Enviar no WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
